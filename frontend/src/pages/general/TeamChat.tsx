import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Paperclip, Smile, Bell, Settings, Users, Hash } from "lucide-react";
import { chatService } from "@/services/chatService";
import { ChatRoom, ChatMessage, DirectMessage, ChatMessageEvent } from "@/types/chat";
import type { Subscription } from "@rails/actioncable";
import { useAuth } from "@/contexts/AuthContext";

// JSX宣言を追加
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// メッセージの型定義
interface MessageWithUser extends Omit<ChatMessage, 'user'> {
  user: {
    id: string;
    name: string;
  };
}

// TeamChatコンポーネント
const TeamChatView: React.FC = () => {
  const { user } = useAuth();
  
  // 状態管理
  const [channels, setChannels] = useState<ChatRoom[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [message, setMessage] = useState("");
  const [currentTab, setCurrentTab] = useState("channels");
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentDmUserId, setCurrentDmUserId] = useState<string | null>(null);
  const [currentChatRoomId, setCurrentChatRoomId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const chatSubscriptionRef = useRef<Subscription | null>(null);
  
  // チャットルーム一覧の取得
  const fetchChatRooms = async () => {
    console.log("fetchChatRooms called");
    try {
      console.log("Calling chatService.getChatRooms()");
      const response = await chatService.getChatRooms();
      console.log("getChatRooms response:", response);
      
      if (response.success && response.data) {
        const responseData = response.data;
        const responseObj = responseData as unknown as {
          channels: ChatRoom[];
          direct_messages: DirectMessage[];
        };
        const channelsData = responseObj.channels || [];
        const directMessagesData = responseObj.direct_messages || [];
        
        console.log("Setting channels:", channelsData);
        console.log("Setting direct messages:", directMessagesData);
        
        setChannels(channelsData);
        setDirectMessages(directMessagesData);
        
        // 最初のチャンネルを選択
        if (channelsData.length > 0 && !currentChannelId) {
          console.log("Setting initial channel ID:", channelsData[0].id);
          setCurrentChannelId(channelsData[0].id);
        }
      }
    } catch (error) {
      console.error("チャットルーム一覧の取得に失敗しました", error);
    }
  };
  
  // チャットルームIDの更新
  useEffect(() => {
    if (currentTab === "channels" && currentChannelId) {
      setCurrentChatRoomId(currentChannelId);
    } else if (currentTab === "direct" && currentDmUserId) {
      // DMの場合は、選択されたユーザーIDに対応するチャットルームIDを探す
      const selectedDm = directMessages.find((dm: DirectMessage) => 
        dm.users?.some((chatUser: any) => chatUser.id === currentDmUserId)
      );
      
      if (selectedDm) {
        setCurrentChatRoomId(selectedDm.id);
      }
    } else {
      setCurrentChatRoomId(null);
    }
  }, [currentTab, currentChannelId, currentDmUserId, directMessages]);
  
  // メッセージ履歴の取得
  const fetchMessages = async () => {
    if (!currentChatRoomId) return;
    
    try {
      const response = await chatService.getMessages(currentChatRoomId);
      
      if (response.success && response.data) {
        // メッセージを日付の新しい順に並べ替え
        const messagesData = response.data.messages || [];
        const formattedMessages = messagesData.map((msg) => {
          // ユーザー情報を整形
          return {
            ...msg,
            user: {
              id: msg.user_id,
              name: msg.user_name || "Unknown User"
            }
          } as MessageWithUser;
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("メッセージ履歴の取得に失敗しました", error);
    }
  };
  
  // 初期データの取得
  useEffect(() => {
    fetchChatRooms();
  }, []);
  
  // チャットルームが変更されたときにメッセージを取得
  useEffect(() => {
    if (currentChatRoomId) {
      fetchMessages();
      
      // すべてのメッセージを既読にする
      chatService.readAllMessages(currentChatRoomId).catch(error => {
        console.error("メッセージの既読処理に失敗しました", error);
      });
    }
  }, [currentChatRoomId]);
  
  // Action Cable接続の管理
  useEffect(() => {
    if (!currentChatRoomId) return;
    
    // 既存の接続を解除
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe();
      chatSubscriptionRef.current = null;
    }
    
    console.log("Attempting to connect to chat room:", currentChatRoomId);
    
    // 新しい接続を作成（非同期処理）
    const setupSubscription = async () => {
      try {
        const newSubscription = await chatService.subscribeToChatRoom(
          currentChatRoomId,
          {
            onReceived: (data: ChatMessageEvent) => {
              console.log("Received message event:", data);
              
              // 新しいメッセージ
              if (data.message) {
                const newMessage = {
                  ...data.message,
                  user: {
                    id: data.message.user_id,
                    name: data.message.user_name || "Unknown User"
                  }
                } as MessageWithUser;
                
                setMessages((prev: MessageWithUser[]) => [newMessage, ...prev]);
              }
              // メッセージ更新
              else if (data.message_updated) {
                const updatedMessage = {
                  ...data.message_updated,
                  user: {
                    id: data.message_updated.user_id,
                    name: data.message_updated.user_name || "Unknown User"
                  }
                } as MessageWithUser;
                
                setMessages((prev: MessageWithUser[]) => 
                  prev.map((msg: MessageWithUser) => msg.id === updatedMessage.id ? updatedMessage : msg)
                );
              }
              // メッセージ削除
              else if (data.message_deleted) {
                setMessages((prev: MessageWithUser[]) => 
                  prev.filter((msg: MessageWithUser) => msg.id !== data.message_deleted?.id)
                );
              }
              // 入力中ステータス
              else if (data.typing) {
                setTypingUsers((prev: string[]) => {
                  // 既に含まれている場合は追加しない
                  if (prev.includes(data.typing?.user_name || "")) {
                    return prev;
                  }
                  return [...prev, data.typing?.user_name || ""];
                });
                
                // 3秒後に入力中ステータスを削除
                setTimeout(() => {
                  setTypingUsers((prev: string[]) => 
                    prev.filter((name: string) => name !== data.typing?.user_name)
                  );
                }, 3000);
              }
            },
            onConnected: () => {
              console.log("チャットルームに接続しました:", currentChatRoomId);
            },
            onDisconnected: () => {
              console.log("チャットルームから切断されました:", currentChatRoomId);
            }
          }
        );
        
        chatSubscriptionRef.current = newSubscription;
        console.log("Subscription created successfully");
      } catch (error) {
        console.error("Failed to create chat subscription:", error);
      }
    };
    
    setupSubscription();
    
    // クリーンアップ
    return () => {
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
    };
  }, [currentChatRoomId]);
  
  // メッセージの送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentChatRoomId || (message.trim() === "" && !attachment)) return;
    
    try {
      const response = await chatService.sendMessage(
        currentChatRoomId,
        message,
        attachment || undefined
      );
      
      if (response.success) {
        setMessage("");
        setAttachment(null);
      }
    } catch (error) {
      console.error("メッセージの送信に失敗しました", error);
    }
  };
  
  // 入力中ステータスの送信
  const handleTyping = () => {
    if (!chatSubscriptionRef.current) return;
    
    chatSubscriptionRef.current.perform('typing');
    
    // タイピング状態のタイムアウト設定
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      // タイピング状態をクリア
    }, 3000);
  };
  
  // ファイル選択ハンドラ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };
  
  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  // ユーザー名からイニシャルを取得
  const getInitials = (name: string) => {
    if (!name) return "?";
    
    const parts = name.split(" ");
    if (parts.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };
  
  // タイムスタンプのフォーマット
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ja-JP', { 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return timestamp;
    }
  };
  
  // 現在のチャットルームのメッセージを取得
  const getActiveMessages = () => messages;
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 bg-background border-r flex flex-col">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels">チャンネル</TabsTrigger>
              <TabsTrigger value="direct">ダイレクト</TabsTrigger>
            </TabsList>
            
            <TabsContent value="channels" className="flex-1 overflow-y-auto p-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">チャンネル</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {channels.map((channel: ChatRoom) => (
                <div
                  key={channel.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer ${
                    currentChannelId === channel.id ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                  onClick={() => setCurrentChannelId(channel.id)}
                >
                  <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{channel.name}</span>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="direct" className="flex-1 overflow-y-auto p-2">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">ダイレクトメッセージ</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
              
              {directMessages.map((dm: DirectMessage) => {
                // 自分以外のユーザーを表示
                const otherUser = dm.users?.find((dmUser: any) => 
                  dmUser.id !== user?.id // 現在のユーザーIDを使用
                );
                
                return (
                  <div
                    key={dm.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      currentDmUserId === otherUser?.id ? "bg-accent" : "hover:bg-accent/50"
                    }`}
                    onClick={() => otherUser && setCurrentDmUserId(otherUser.id)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{otherUser ? getInitials(otherUser.name) : "?"}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{otherUser?.name || "Unknown"}</span>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* チャットヘッダー */}
          {currentChatRoomId && (
            <div className="border-b p-4 flex justify-between items-center">
              <div className="flex items-center">
                {currentTab === "channels" ? (
                  <>
                    <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
                    <h2 className="font-semibold">
                      {channels.find((c: ChatRoom) => c.id === currentChannelId)?.name || "チャンネル"}
                    </h2>
                  </>
                ) : (
                  <>
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>
                        {getInitials(
                          directMessages.find((dm: DirectMessage) => 
                            dm.users?.some((u: any) => u.id === currentDmUserId)
                          )?.users?.find((u: any) => u.id === currentDmUserId)?.name || ""
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="font-semibold">
                      {directMessages.find((dm: DirectMessage) => 
                        dm.users?.some((u: any) => u.id === currentDmUserId)
                      )?.users?.find((u: any) => u.id === currentDmUserId)?.name || "ユーザー"}
                    </h2>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
          
          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
            {getActiveMessages().map((msg: MessageWithUser) => (
              <Card key={msg.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback>{getInitials(msg.user.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold">{msg.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(msg.created_at)}
                        </div>
                      </div>
                      
                      <div className="text-sm">{msg.content}</div>
                      
                      {msg.attachment_url && (
                        <div className="mt-2">
                          <a 
                            href={msg.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            添付ファイルを表示
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 入力中表示 */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-1 text-sm text-muted-foreground">
              {typingUsers.join(", ")}が入力中...
            </div>
          )}
          
          {/* メッセージ入力エリア */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={openFileDialog}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                onKeyDown={handleTyping}
                placeholder="メッセージを入力..."
                className="flex-1"
              />
              {attachment && (
                <div className="text-sm text-muted-foreground">
                  {attachment.name.length > 15 
                    ? `${attachment.name.substring(0, 15)}...` 
                    : attachment.name}
                </div>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="rounded-full"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon" className="rounded-full">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChatView;                                          
