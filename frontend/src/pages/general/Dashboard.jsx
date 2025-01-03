import React, { useState } from 'react';
import { BarChart3, Bell, Book, BookOpen, Calendar, FileText, FilePlus, Home, LogOut, Menu, MessageSquare, Search, Settings, Timer, User, Users } from 'lucide-react';

const DashboardView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-14 items-center px-4">
          {/* Mobile menu button */}
          <button className="md:hidden p-2">
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" />
            <span className="hidden md:inline">Work-Optimizer</span>
          </div>

          {/* Main navigation */}
          <nav className="hidden md:flex items-center gap-6 mx-6">
            {['ホーム', '新規作成', 'ドキュメント', 'チャット'].map((item, index) => (
              <button key={item} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                {index === 0 && <Home className="h-4 w-4" />}
                {index === 1 && <FilePlus className="h-4 w-4" />}
                {index === 2 && <BookOpen className="h-4 w-4" />}
                {index === 3 && <MessageSquare className="h-4 w-4" />}
                {item}
              </button>
            ))}
          </nav>

          {/* Search bar */}
          <div className="flex-1 mx-4 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="検索..."
              className="w-full pl-8 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Notification icon */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-black text-white text-xs rounded-full">
                  3
                </span>
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 font-semibold border-b">通知</div>
                  <div className="py-2 px-4">
                    <div className="text-sm font-medium">会議リマインド</div>
                    <div className="text-xs text-gray-500">14:00 プロジェクトMTG</div>
                  </div>
                  <div className="py-2 px-4">
                    <div className="text-sm font-medium">タスク期限</div>
                    <div className="text-xs text-gray-500">マニュアル作成 本日期限</div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="rounded-full overflow-hidden"
              >
                <img
                  src="/api/placeholder/32/32"
                  alt="ユーザーアバター"
                  className="w-8 h-8 rounded-full"
                />
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 font-semibold border-b">田中 太郎</div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    設定
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 container mx-auto p-4">
        <div className="space-y-4">
          {/* タブ */}
          <div className="flex space-x-1 rounded-lg bg-muted p-1" role="tablist">
            {['ダッシュボード', '業務マニュアル', 'ナレッジベース', '会議管理'].map((tab, index) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === ['dashboard', 'manuals', 'knowledge', 'meetings'][index]}
                onClick={() => setActiveTab(['dashboard', 'manuals', 'knowledge', 'meetings'][index])}
                className={`flex-1 justify-center inline-flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  activeTab === ['dashboard', 'manuals', 'knowledge', 'meetings'][index]
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 業務進捗カード */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    業務進捗
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{task.title}</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 本日の会議カード */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    本日の会議
                  </h3>
                </div>
                <div className="p-6 pt-0">
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
                </div>
              </div>

              {/* クイックアクセスカード */}
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="text-lg font-semibold leading-none tracking-tight">クイックアクセス</h3>
                </div>
                <div className="p-6 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: FileText, label: 'マニュアル作成' },
                      { icon: Timer, label: '会議開始' },
                      { icon: Book, label: 'ナレッジ登録' },
                      { icon: Users, label: 'チーム管理' },
                    ].map(({ icon: Icon, label }, index) => (
                      <button key={index} className="flex flex-col items-center justify-center p-4 border rounded hover:bg-accent hover:text-accent-foreground">
                        <Icon className="h-6 w-6 mb-2" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manuals' && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">業務マニュアル</h3>
              </div>
              <div className="p-6 pt-0">
                <div className="text-center p-8 text-muted-foreground">
                  業務マニュアルの一覧とテンプレート機能が表示されます
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">ナレッジベース</h3>
              </div>
              <div className="p-6 pt-0">
                <div className="text-center p-8 text-muted-foreground">
                  ナレッジベースの検索と管理機能が表示されます
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">会議管理</h3>
              </div>
              <div className="p-6 pt-0">
                <div className="text-center p-8 text-muted-foreground">
                  会議のタイマーと議事録テンプレート機能が表示されます
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardView;