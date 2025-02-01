import React, { useState } from 'react';
import { BarChart3, Bell, Book, BookOpen, Calendar, FileText, FilePlus, Home, LogOut, Menu, MessageSquare, Search, Settings, Timer, User, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardView = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const tasks = [
    { id: 1, title: "業務マニュアル作成", progress: 75 },
    { id: 2, title: "週次MTG", progress: 100 },
    { id: 3, title: "ナレッジベース更新", progress: 30 }
  ];

  const meetings = [
    { id: 1, title: "朝会", time: "09:00", duration: "30分" },
    { id: 2, title: "プロジェクトMTG", time: "14:00", duration: "60分" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 font-semibold">
            <img src="/images/w-o_logo.png" alt="logo" className="h-7 w-7" />
            <span className="hidden md:inline">WorkOptimizer</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 mx-6">
            {[
              { label: 'ホーム', icon: Home },
              { label: '新規作成', icon: FilePlus },
              { label: 'ドキュメント', icon: BookOpen },
              { label: 'チャット', icon: MessageSquare }
            ].map(({ label, icon: Icon }) => (
              <Button key={label} variant="ghost" className="gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </nav>

          <div className="flex-1 mx-4 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="検索..."
              className="w-full pl-8"
            />
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>通知</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex flex-col">
                    <span className="font-medium">会議リマインド</span>
                    <span className="text-xs text-muted-foreground">14:00 プロジェクトMTG</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col">
                    <span className="font-medium">タスク期限</span>
                    <span className="text-xs text-muted-foreground">マニュアル作成 本日期限</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar>
                    <AvatarImage src="/api/placeholder/32/32" alt="ユーザーアバター" />
                    <AvatarFallback>TA</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>田中 太郎</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  プロフィール
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="manuals">業務マニュアル</TabsTrigger>
            <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
            <TabsTrigger value="meetings">会議管理</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    業務進捗
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{task.title}</span>
                          <span>{task.progress}%</span>
                        </div>
                        <Progress value={task.progress} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    本日の会議
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meetings.map(meeting => (
                      <div key={meeting.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-muted-foreground">{meeting.time}</div>
                        </div>
                        <div className="text-sm">{meeting.duration}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>クイックアクセス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: FileText, label: 'マニュアル作成' },
                      { icon: Timer, label: '会議開始' },
                      { icon: Book, label: 'ナレッジ登録' },
                      { icon: Users, label: 'チーム管理' },
                    ].map(({ icon: Icon, label }, index) => (
                      <Button key={index} variant="outline" className="flex flex-col items-center justify-center h-24 gap-2">
                        <Icon className="h-6 w-6" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="manuals">
            <Card>
              <CardHeader>
                <CardTitle>業務マニュアル</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  業務マニュアルの一覧とテンプレート機能が表示されます
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>ナレッジベース</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  ナレッジベースの検索と管理機能が表示されます
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>会議管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 text-muted-foreground">
                  会議のタイマーと議事録テンプレート機能が表示されます
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default DashboardView;
