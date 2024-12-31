import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Timer, FileText, Book, Users, Calendar, BarChart3, Bell, Settings, LogOut, User, Search, Menu, Home, FilePlus, BookOpen, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Task {
  id: number;
  title: string;
  progress: number;
}

interface Meeting {
  id: number;
  title: string;
  time: string;
  duration: string;
}

const DashboardView: React.FC = () => {
  const tasks: Task[] = [
    { id: 1, title: "業務マニュアル作成", progress: 75 },
    { id: 2, title: "週次MTG", progress: 100 },
    { id: 3, title: "ナレッジベース更新", progress: 30 }
  ];

  const meetings: Meeting[] = [
    { id: 1, title: "朝会", time: "09:00", duration: "30分" },
    { id: 2, title: "プロジェクトMTG", time: "14:00", duration: "60分" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* メインヘッダー */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* ハンバーガーメニュー（モバイル用） */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>

          {/* ロゴ */}
          <div className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            <span className="hidden md:inline">WorkFlowOptimizer</span>
          </div>

          {/* メインナビゲーション */}
          <nav className="hidden md:flex items-center gap-6 mx-6">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              ホーム
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              新規作成
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              ドキュメント
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              チャット
            </Button>
          </nav>

          {/* 検索バー */}
          <div className="flex-1 mx-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="検索..." className="pl-8" />
            </div>
          </div>

          {/* 右側のアイコン群 */}
          <div className="flex items-center gap-4">
            {/* 通知アイコン */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>通知</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <div className="flex flex-col">
                    <span className="font-medium">会議リマインド</span>
                    <span className="text-sm text-gray-500">14:00 プロジェクトMTG</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex flex-col">
                    <span className="font-medium">タスク期限</span>
                    <span className="text-sm text-gray-500">マニュアル作成 本日期限</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ユーザーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <img
                    src="/api/placeholder/32/32"
                    alt="ユーザーアバター"
                    className="rounded-full"
                  />
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
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 container mx-auto p-4">
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="manuals">業務マニュアル</TabsTrigger>
            <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
            <TabsTrigger value="meetings">会議管理</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 業務進捗カード */}
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

              {/* 本日の会議カード */}
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
                          <div className="text-sm text-gray-500">{meeting.time}</div>
                        </div>
                        <div className="text-sm">{meeting.duration}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* クイックアクセスカード */}
              <Card>
                <CardHeader>
                  <CardTitle>クイックアクセス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                      <FileText className="h-6 w-6 mb-2" />
                      マニュアル作成
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                      <Timer className="h-6 w-6 mb-2" />
                      会議開始
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                      <Book className="h-6 w-6 mb-2" />
                      ナレッジ登録
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 border rounded hover:bg-gray-50">
                      <Users className="h-6 w-6 mb-2" />
                      チーム管理
                    </button>
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
                <div className="text-center p-8 text-gray-500">
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
                <div className="text-center p-8 text-gray-500">
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
                <div className="text-center p-8 text-gray-500">
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

