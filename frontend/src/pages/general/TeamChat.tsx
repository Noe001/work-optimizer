import React, { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, Smile, Bell, Settings, Users, Hash } from "lucide-react";
import chatService from "@/services/chatService";
import { ChatRoom, ChatMessage, DirectMessage, ChatMessageEvent } from "@/types/chat";
import type { Subscription } from "@rails/actioncable";
import { User } from "@/types/api";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// メッセージの型定義
interface MessageWithUser extends Omit<ChatMessage, 'user'> {
  user: {
    id: string;
    name: string;
    avatar?: string;
    initials: string;
  };
}

const TeamChatView: React.FC = () => {
  const [currentTab, setCurrentTab] = useState("channels");
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [currentDmUserId, setCurrentDmUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<ChatRoom[]>([]);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [currentChatRoomId, setCurrentChatRoomId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // チャットルーム一覧の取得
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        setLoading(true);
        const response = await chatService.getChatRooms();
        
        if (response.success && response.data) {
          setChannels(response.data.channels);
          setDirectMessages(response.data.direct_messages);
          
          // 最初のチャンネルを選択
          if (response.data.channels.length > 0 && !currentChannelId) {
            setCurrentChannelId(response.data.channels[0].id);
          }
        } else {
          console.error("チャットルーム一覧の取得に失敗しました", response.message);
        }
      } catch (error) {
        console.error("チャットルーム一覧の取得中にエラーが発生しました", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatRooms();
  }, []);

  // 現在のチャットルームIDを設定
  useEffect(() => {
    if (currentTab === "channels" && currentChannelId) {
      setCurrentChatRoomId(currentChannelId);
    } else if (currentTab === "direct" && currentDmUserId) {
      // DMの場合は、選択されたユーザーIDに対応するチャットルームIDを探す
      const selectedDm = directMessages.find((dm: DirectMessage) => 
        dm.users?.some(user => user.id === currentDmUserId)
      );
      
      if (selectedDm) {
        setCurrentChatRoomId(selectedDm.id);
      }
    } else {
      setCurrentChatRoomId(null);
    }
  }, [currentTab, currentChannelId, currentDmUserId, directMessages]);

  // メッセージ履歴の取得
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChatRoomId) return;
      
      try {
        setLoading(true);
        const response = await chatService.getMessages(currentChatRoomId);
        
        if (response.success && response.data) {
          // メッセージを日付の新しい順に並べ替え
          const formattedMessages = response.data.messages.map((msg: ChatMessage) => {
            // ユーザー情報を整形
            return {
              ...msg,
              user: {
                id: msg.user?.id || msg.user_id,
                name: msg.user?.name || msg.user_name || "不明なユーザー",
                initials: msg.user?.name ? getInitials(msg.user.name) : "??"
              }
            } as MessageWithUser;
          });
          
          setMessages(formattedMessages);
          
          // すべてのメッセージを既読にする
          await chatService.readAllMessages(currentChatRoomId);
        } else {
          console.error("メッセージ履歴の取得に失敗しました", response.message);
        }
      } catch (error) {
        console.error("メッセージ履歴の取得中にエラーが発生しました", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [currentChatRoomId]);

  // Action Cable接続の設定
  useEffect(() => {
    if (!currentChatRoomId) return;
    
    // 既存の接続を解除
    if (subscription) {
      subscription.unsubscribe();
    }
    
    // 新しい接続を作成
    const newSubscription = chatService.subscribeToChatRoom(
      currentChatRoomId,
      {
        onReceived: (data: ChatMessageEvent) => {
          // 新しいメッセージを受信
          if (data.message) {
            const newMessage = {
              ...data.message,
              user: {
                id: data.message.user?.id || data.message.user_id,
                name: data.message.user?.name || data.message.user_name || "不明なユーザー",
                initials: data.message.user?.name ? getInitials(data.message.user.name) : "??"
              }
            } as MessageWithUser;
            
            setMessages((prev: MessageWithUser[]) => [newMessage, ...prev]);
          }
          // メッセージ更新
          else if (data.message_updated) {
            const updatedMessage = {
              ...data.message_updated,
              user: {
                id: data.message_updated.user?.id || data.message_updated.user_id,
                name: data.message_updated.user?.name || data.message_updated.user_name || "不明なユーザー",
                initials: data.message_updated.user?.name ? getInitials(data.message_updated.user.name) : "??"
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
          console.log(`Connected to chat room: ${currentChatRoomId}`);
        },
        onDisconnected: () => {
          console.log(`Disconnected from chat room: ${currentChatRoomId}`);
        }
      }
    );
    
    setSubscription(newSubscription);
    
    // クリーンアップ関数
    return () => {
      if (newSubscription) {
        newSubscription.unsubscribe();
      }
    };
  }, [currentChatRoomId]);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // メッセージを送信
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
        // 入力フィールドとファイル選択をクリア
        setMessage("");
        setAttachment(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        console.error("メッセージの送信に失敗しました", response.message);
      }
    } catch (error) {
      console.error("メッセージの送信中にエラーが発生しました", error);
    }
  };

  // 入力中ステータスの送信
  const handleTyping = () => {
    if (subscription) {
      (subscription as any).typing();
    }
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

  // イニシャルを取得
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // タイムスタンプをフォーマット
  const formatTimestamp = (timestamp: string): string => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: ja });
    } catch (error) {
      return timestamp;
    }
  };

  // 選択されているチャネルまたはDMのメッセージを取得
  const getActiveMessages = () => {
    return messages;
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-64 bg-background border-r flex flex-col">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <div className="p-4">
              <TabsList className="w-full">
                <TabsTrigger value="channels" className="flex-1">チャンネル</TabsTrigger>
                <TabsTrigger value="direct" className="flex-1">ダイレクト</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="channels" className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    className={`w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left ${
                      currentChannelId === channel.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setCurrentChannelId(channel.id)}
                  >
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-2" />
                      <span>{channel.name}</span>
                    </div>
                  </button>
                ))}
                <button className="w-full flex items-center p-2 text-muted-foreground text-sm hover:text-foreground">
                  <span className="mr-1">+</span> チャンネルを追加
                </button>
              </div>
            </TabsContent>

            <TabsContent value="direct" className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {directMessages.map((dm) => (
                  <button
                    key={dm.id}
                    className={`w-full flex items-center justify-between p-2 rounded hover:bg-accent text-left ${
                      currentChatRoomId === dm.id ? "bg-accent" : ""
                    }`}
                    onClick={() => {
                      // 相手のユーザーIDを取得
                      const otherUser = dm.users?.find(user => 
                        // 自分以外のユーザーを探す（実際の実装では現在のユーザーIDと比較）
                        user.id !== "current_user_id"
                      );
                      
                      if (otherUser) {
                        setCurrentDmUserId(otherUser.id);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <Avatar className="h-6 w-6">
                          {dm.users && dm.users.length > 0 && (
                            <AvatarFallback>
                              {getInitials(dm.users[0].name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </div>
                      <span>
                        {dm.users && dm.users.length > 0 ? dm.users[0].name : "不明なユーザー"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col">
          {/* チャンネルヘッダー */}
          <div className="border-b p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium flex items-center">
                {currentTab === "channels" ? (
                  <>
                    <Hash className="h-5 w-5 mr-2" />
                    {channels.find((c) => c.id === currentChannelId)?.name || "チャンネルを選択"}
                  </>
                ) : (
                  <>
                    {directMessages.find((d) => d.id === currentChatRoomId)?.users?.[0]?.name || "メッセージを選択"}
                  </>
                )}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-muted-foreground hover:text-foreground">
                <Users className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* メッセージエリア */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <p>読み込み中...</p>
              </div>
            ) : getActiveMessages().length === 0 ? (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                <p>メッセージはありません</p>
              </div>
            ) : (
              getActiveMessages().map((msg) => (
                <div key={msg.id} className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarFallback>{msg.user.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-baseline">
                      <span className="font-medium mr-2">{msg.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(msg.created_at)}
                      </span>
                    </div>
                    <p className="mt-1">{msg.content}</p>
                    {msg.attachment_url && (
                      <div className="mt-2">
                        <Card className="p-2 bg-accent hover:bg-accent/80 cursor-pointer">
                          <CardContent className="p-0 flex items-center">
                            <Paperclip className="h-4 w-4 mr-2" />
                            <a 
                              href={msg.attachment_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm"
                            >
                              添付ファイル
                            </a>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {typingUsers.length > 0 && (
              <div className="text-sm text-muted-foreground italic">
                {typingUsers.join(', ')}が入力中...
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
                placeholder="メッセージを入力..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={() => handleTyping()}
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
