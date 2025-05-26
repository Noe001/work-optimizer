import React, { useState, useEffect, useRef } from "react";
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
const TeamChatView = () => {
  const { user } = useAuth() as { user: any };
  
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const chatSubscriptionRef = useRef<Subscription | null>(null);
  
  // チャットルーム一覧の取得
  const fetchChatRooms = async () => {
    try {
      console.log("Fetching chat rooms...");
      const response = await chatService.getChatRooms();
      
      console.log("Response data structure:", JSON.stringify(response, null, 2));
      
      if (response.success && response.data) {
        const responseData = response.data.data || response.data;
        const channels = responseData.channels || [];
        const directMessages = responseData.direct_messages || [];
        
        console.log("Setting channels:", channels);
        console.log("Setting direct messages:", directMessages);
        
        setChannels(channels);
        setDirectMessages(directMessages);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    }
  };
  
  // 初期化時にチャットルーム一覧を取得
  useEffect(() => {
    fetchChatRooms();
  }, []);
  
  // チャットルーム選択時の処理
  useEffect(() => {
    if (currentTab === "channels" && currentChannelId) {
      setCurrentChatRoomId(currentChannelId);
      setCurrentDmUserId(null);
    } else if (currentTab === "direct_messages" && currentDmUserId) {
      // DMの場合、ユーザーIDからチャットルームIDを取得
      const selectedDm = directMessages.find(dm => 
        dm.users && dm.users.some(u => u.id === currentDmUserId)
      );
      
      if (selectedDm) {
        setCurrentChatRoomId(selectedDm.id);
      } else {
        setCurrentChatRoomId(null);
      }
    }
  }, [currentTab, currentChannelId, currentDmUserId, directMessages]);
  
  // メッセージ履歴の取得
  const fetchMessages = async () => {
    if (!currentChatRoomId) return;
    
    try {
      const response = await chatService.getMessages(currentChatRoomId);
      
      if (response.success && response.data) {
        // メッセージを新しい順に並べ替え
        const messages = response.data.messages || [];
        const formattedMessages = messages.map((msg: ChatMessage) => ({
          ...msg,
          user: msg.user || {
            id: msg.user_id,
            name: msg.user_name || "Unknown User"
          }
        }));
        
        setMessages(formattedMessages);
        
        // スクロールを一番下に移動
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  
  // チャットルーム変更時にメッセージを取得
  useEffect(() => {
    if (currentChatRoomId) {
      fetchMessages();
      setupSubscription();
    } else {
      // チャットルームが選択されていない場合はメッセージをクリア
      setMessages([]);
      
      // 既存のサブスクリプションを解除
      if (chatSubscriptionRef.current) {
        chatSubscriptionRef.current.unsubscribe();
        chatSubscriptionRef.current = null;
      }
    }
  }, [currentChatRoomId]);
  
  // Action Cableサブスクリプションのセットアップ
  const setupSubscription = () => {
    // 既存のサブスクリプションを解除
    if (chatSubscriptionRef.current) {
      chatSubscriptionRef.current.unsubscribe();
    }
    
    if (!currentChatRoomId) return;
    
    try {
      const newSubscription = chatService.subscribeToChatRoom(currentChatRoomId, {
        onReceived: (data: ChatMessageEvent) => {
          console.log("Received message event:", data);
          
          // 新しいメッセージを受信した場合
          if (data.message) {
            const newMessage = {
              ...data.message,
              user: data.message.user || {
                id: data.message.user_id,
                name: "Unknown User"
              }
            };
            
            setMessages(prev => [newMessage, ...prev]);
          }
          
          // メッセージが更新された場合
          if (data.message_updated) {
            const updatedMessage = {
              ...data.message_updated,
              user: data.message_updated.user || {
                id: data.message_updated.user_id,
                name: "Unknown User"
              }
            };
            
            setMessages(prev => 
              prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
            );
          }
          
          // メッセージが削除された場合
          if (data.message_deleted) {
            setMessages(prev => 
              prev.filter(msg => msg.id !== data.message_deleted?.id)
            );
          }
          
          // 入力中ステータスを受信した場合
          if (data.typing && data.typing.user_id !== user?.id) {
            setTypingUsers(prev => {
              if (!prev.includes(data.typing!.user_name)) {
                return [...prev, data.typing!.user_name];
              }
              return prev;
            });
            
            // 5秒後に入力中ステータスを削除
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(name => name !== data.typing!.user_name));
            }, 5000);
          }
        }
      });
      
      chatSubscriptionRef.current = newSubscription as unknown as Subscription;
    } catch (error) {
      console.error("Error setting up subscription:", error);
    }
  };
  
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
        
        // メッセージ一覧を更新
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // 入力中ステータスの送信
  const handleTyping = () => {
    if (!currentChatRoomId) return;
    
    // 既存のタイムアウトをクリア
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    
    // 入力中ステータスを送信
    if (chatSubscriptionRef.current && chatSubscriptionRef.current.typing) {
      chatSubscriptionRef.current.typing({ chat_room_id: currentChatRoomId });
    }
    
    // 3秒後に再度送信できるようにする
    typingTimeoutRef.current = window.setTimeout(() => {
      typingTimeoutRef.current = null;
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
  
  // ユーザー名のイニシャルを取得
  const getInitials = (name: string) => {
    if (!name) return "?";
    
    const parts = name.split(" ");
    if (parts.length === 1) {
      return name.substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // タイムスタンプのフォーマット
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="sticky top-0 z-50 w-full border-b bg-white shadow-md p-4">
        <h1 className="text-xl font-bold">Team Chat</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 border-r bg-background p-4 flex flex-col">
          <Tabs defaultValue="channels" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="direct_messages">Direct</TabsTrigger>
            </TabsList>
            
            <TabsContent value="channels" className="mt-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <Hash className="h-4 w-4 mr-1" /> Channels
              </h3>
              
              <div className="space-y-1">
                {channels.map(channel => (
                  <Button
                    key={channel.id}
                    variant={currentChannelId === channel.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setCurrentChannelId(channel.id)}
                  >
                    # {channel.name}
                  </Button>
                ))}
                
                {channels.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2">
                    No channels available
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="direct_messages" className="mt-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <Users className="h-4 w-4 mr-1" /> Direct Messages
              </h3>
              
              <div className="space-y-1">
                {directMessages.map(dm => {
                  // 自分以外のユーザーを表示
                  const otherUser = dm.users?.find(u => u.id !== user?.id);
                  
                  return (
                    <Button
                      key={dm.id}
                      variant={currentDmUserId === otherUser?.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => otherUser && setCurrentDmUserId(otherUser.id)}
                    >
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback>
                            {getInitials(otherUser?.name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{otherUser?.name || "Unknown"}</span>
                      </div>
                    </Button>
                  );
                })}
                
                {directMessages.length === 0 && (
                  <div className="text-sm text-muted-foreground p-2">
                    No direct messages available
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* チャットヘッダー */}
          <div className="border-b p-4 flex justify-between items-center">
            <div className="flex items-center">
              {currentTab === "channels" && currentChannelId && (
                <div className="flex items-center">
                  <Hash className="h-5 w-5 mr-2" />
                  <h2 className="font-semibold">
                    {channels.find(c => c.id === currentChannelId)?.name || "Channel"}
                  </h2>
                </div>
              )}
              
              {currentTab === "direct_messages" && currentDmUserId && (
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>
                      {getInitials(
                        directMessages.find(
                          dm => dm.users?.some(u => u.id === currentDmUserId)
                        )?.users?.find(u => u.id === currentDmUserId)?.name || ""
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="font-semibold">
                    {directMessages.find(
                      dm => dm.users?.some(u => u.id === currentDmUserId)
                    )?.users?.find(u => u.id === currentDmUserId)?.name || "User"}
                  </h2>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="ghost">
                <Bell className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <Card key={msg.id} className={`${msg.user.id === user?.id ? 'ml-12' : 'mr-12'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      {msg.user.id !== user?.id && (
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback>{getInitials(msg.user.name)}</AvatarFallback>
                        </Avatar>
                      )}
                      
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
                              className="text-blue-500 hover:underline text-sm"
                            >
                              Attachment
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground p-4">
                {currentChatRoomId 
                  ? "No messages yet. Start the conversation!" 
                  : "Select a channel or direct message to start chatting"}
              </div>
            )}
            
            {/* 入力中インジケーター */}
            {typingUsers.length > 0 && (
              <div className="text-sm text-muted-foreground italic">
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
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
