import React, { useState, useEffect } from 'react';
import { BarChart3, Bell, Book, BookOpen, Calendar, FileText, FilePlus, Home, LogOut, Menu, MessageSquare, Search, Settings, Timer, User, Users, Edit, Trash2, X, Filter, Plus, Tag, Clock, Check } from 'lucide-react';

const DashboardView = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [meetingMinutes, setMeetingMinutes] = useState({
    participants: '',
    discussion: '',
    decisions: '',
    nextActions: ''
  });

  const tasks = [
    { id: 1, title: "業務マニュアル作成", progress: 75 },
    { id: 2, title: "週次MTG", progress: 100 },
    { id: 3, title: "ナレッジベース更新", progress: 30 }
  ];
  
  const meetings = [
    { id: 1, title: "朝会", time: "09:00", duration: "30分" },
    { id: 2, title: "プロジェクトMTG", time: "14:00", duration: "60分" }
  ];

  const manualTemplates = [
    { 
      id: 1, 
      title: '新入社員オリエンテーション', 
      description: '新しい社員向けの基本的な業務ガイドライン',
      sections: [
        '会社概要',
        '組織構造',
        '基本的な業務プロセス',
        '行動規範',
        '福利厚生'
      ]
    },
    { 
      id: 2, 
      title: '営業活動マニュアル', 
      description: '営業チーム向けの標準的な営業プロセス',
      sections: [
        '見込み客リサーチ',
        '初回アプローチ',
        '提案資料作成',
        '価格交渉',
        'クロージング'
      ]
    },
    { 
      id: 3, 
      title: 'クレーム対応マニュアル', 
      description: '顧客からのクレーム対応の標準手順',
      sections: [
        '初期対応',
        '事実確認',
        '謝罪と解決策提示',
        'フォローアップ',
        '再発防止策'
      ]
    }
  ];
  
  const filteredManuals = manualTemplates.filter(template => 
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const knowledgeCategories = [
    { id: 1, name: '業務プロセス' },
    { id: 2, name: '顧客対応' },
    { id: 3, name: 'システム操作' },
    { id: 4, name: '技術情報' }
  ];

  const knowledgeItems = [
    { 
      id: 1, 
      title: '新規顧客対応マニュアル', 
      category: '顧客対応',
      description: '初回面談から契約までの標準的な顧客対応プロセス',
      tags: ['営業', '顧客', '接客']
    },
    { 
      id: 2, 
      title: 'CRMシステム利用ガイド', 
      category: 'システム操作',
      description: '社内CRMシステムの基本操作と効率的な活用方法',
      tags: ['システム', 'CRM', 'トレーニング']
    },
    { 
      id: 3, 
      title: '新プロジェクト立ち上げ手順', 
      category: '業務プロセス',
      description: '新規プロジェクトの計画から実行までの標準フロー',
      tags: ['プロジェクト管理', '業務']
    }
  ];
  
  const filteredKnowledge = knowledgeItems.filter(item => 
    (selectedCategory ? item.category === selectedCategory : true) &&
    (searchTerm ? 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    : true)
  );
  
  const TemplateDetailModal = ({ template, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border bg-white p-6 shadow-lg">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </button>
        
        <h2 className="mb-2 text-lg font-semibold">{template.title}</h2>
        <p className="mb-4 text-sm text-slate-500">{template.description}</p>
        
        <div className="space-y-2">
          <h3 className="font-medium text-slate-600">マニュアル構成</h3>
          {template.sections.map((section, index) => (
            <div 
              key={index} 
              className="flex items-center rounded-md bg-slate-100 p-2 text-sm"
            >
              <FileText className="mr-2 h-4 w-4 text-slate-500" />
              {section}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex space-x-2">
          <button className="flex-1 rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600">
            マニュアル作成
          </button>
        </div>
      </div>
    </div>
  );

  const KnowledgeDetailModal = ({ knowledge, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg border bg-white p-6 shadow-lg">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </button>

        <h2 className="mb-2 text-lg font-semibold">{knowledge.title}</h2>
        <div className="mb-4 flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span className="text-sm text-slate-500">{knowledge.category}</span>
        </div>
        <p className="mb-4 text-sm text-slate-600">{knowledge.description}</p>

        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium text-slate-600">タグ</h3>
          <div className="flex flex-wrap gap-2">
            {knowledge.tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="flex-1 rounded-md bg-blue-500 py-2 text-white hover:bg-blue-600">
            詳細表示
          </button>
        </div>
      </div>
    </div>
  );

  const MeetingTimerModal = ({ meeting, onClose }) => {
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0);
    const [remainingTime, setRemainingTime] = useState(meeting.agenda[0].duration * 60);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
      let interval;
      if (isRunning && remainingTime > 0) {
        interval = setInterval(() => {
          setRemainingTime(prev => prev - 1);
        }, 1000);
      } else if (remainingTime === 0 && currentAgendaIndex < meeting.agenda.length - 1) {
        setCurrentAgendaIndex(prev => prev + 1);
        setRemainingTime(meeting.agenda[currentAgendaIndex + 1].duration * 60);
      }
      return () => clearInterval(interval);
    }, [isRunning, remainingTime, currentAgendaIndex, meeting.agenda]);

    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        {/* ... rest of the MeetingTimerModal component ... */}
      </div>
    );
  };

  const MeetingMinutesModal = ({ meeting, onClose }) => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        {/* ... rest of the MeetingMinutesModal component ... */}
      </div>
    );
  };

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
            <img src="/images/w-o_logo.png" alt="logo" className="h-7 w-7" />
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="マニュアルを検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
                      <FilePlus className="mr-2 h-4 w-4" />新規作成
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredManuals.map((template) => (
                      <div 
                        key={template.id} 
                        className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="mb-2 flex justify-between">
                          <h3 className="text-lg font-semibold">{template.title}</h3>
                          <div className="flex space-x-2">
                            <button 
                              className="text-slate-500 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-slate-500 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500">{template.description}</p>
                      </div>
                    ))}
                  </div>

                  {selectedTemplate && (
                    <TemplateDetailModal 
                      template={selectedTemplate} 
                      onClose={() => setSelectedTemplate(null)} 
                    />
                  )}
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ナレッジを検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-slate-200 py-2 pl-8 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="relative">
                      <button className="rounded-md border border-slate-200 p-2 hover:bg-slate-100">
                        <Filter className="h-4 w-4 text-slate-500" />
                      </button>
                    </div>
                    <button className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
                      <Plus className="mr-2 h-4 w-4" />新規作成
                    </button>
                  </div>

                  <div className="mb-4 flex space-x-2 overflow-x-auto">
                    {knowledgeCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`rounded-md px-3 py-1 text-sm ${
                          selectedCategory === category.name
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                    <button 
                      onClick={() => setSelectedCategory('')}
                      className="rounded-md px-3 py-1 text-sm bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      すべて
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredKnowledge.map((knowledge) => (
                      <div 
                        key={knowledge.id} 
                        className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                        onClick={() => setSelectedKnowledge(knowledge)}
                      >
                        <div className="mb-2 flex justify-between">
                          <h3 className="text-lg font-semibold">{knowledge.title}</h3>
                          <div className="flex space-x-2">
                            <button 
                              className="text-slate-500 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              className="text-slate-500 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mb-2 text-sm text-slate-500">{knowledge.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {knowledge.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index} 
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedKnowledge && (
                    <KnowledgeDetailModal 
                      knowledge={selectedKnowledge} 
                      onClose={() => setSelectedKnowledge(null)} 
                    />
                  )}
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">会議管理</h2>
                    <button className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800">
                      <Plus className="mr-2 h-4 w-4" />新規作成
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.map((meeting) => (
                      <div 
                        key={meeting.id} 
                        className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold">{meeting.title}</h3>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setSelectedMeeting(meeting)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Timer className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setActiveTimer(meeting)}
                              className="text-green-500 hover:text-green-700"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(meeting.scheduledTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-500">
                          <Users className="h-4 w-4" />
                          <span>{meeting.participants}名</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMeeting && (
                    <MeetingTimerModal 
                      meeting={selectedMeeting} 
                      onClose={() => setSelectedMeeting(null)} 
                    />
                  )}

                  {activeTimer && (
                    <MeetingMinutesModal 
                      meeting={activeTimer} 
                      onClose={() => setActiveTimer(null)} 
                    />
                  )}
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
