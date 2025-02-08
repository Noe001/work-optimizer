"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  Home,
  FilePlus,
  BookOpen,
  MessageSquare,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  BarChart3,
  Calendar,
  FileText,
  Timer,
  Book,
  Users,
  Edit,
  Trash2,
  Filter,
  Plus,
  Tag,
  Clock,
} from "lucide-react"

// Header Component
const Header: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <img src="/images/w-o_logo.png" alt="logo" className="h-7 w-7" />
          <span className="hidden md:inline">Work-Optimizer</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 mx-6">
          {[
            { icon: Home, label: "ホーム" },
            { icon: FilePlus, label: "新規作成" },
            { icon: BookOpen, label: "ドキュメント" },
            { icon: MessageSquare, label: "チャット" },
          ].map(({ icon: Icon, label }) => (
            <Button key={label} variant="ghost" className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>
        <div className="flex-1 mx-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input type="text" placeholder="検索..." className="pl-8" />
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-black text-white text-xs rounded-full">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>通知</DropdownMenuLabel>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">会議リマインド</span>
                  <span className="text-sm text-muted-foreground">14:00 プロジェクトMTG</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">タスク期限</span>
                  <span className="text-sm text-muted-foreground">マニュアル作成 本日期限</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <img src="/api/placeholder/32/32" alt="ユーザーアバター" className="w-8 h-8 rounded-full" />
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
  )
}

// DashboardTab Component
const DashboardTab: React.FC = () => {
  const tasks = [
    { id: 1, title: "業務マニュアル作成", progress: 75 },
    { id: 2, title: "週次MTG", progress: 100 },
    { id: 3, title: "ナレッジベース更新", progress: 30 },
  ]

  const meetings = [
    { id: 1, title: "朝会", time: "09:00", duration: "30分" },
    { id: 2, title: "プロジェクトMTG", time: "14:00", duration: "60分" },
  ]

  return (
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
            {tasks.map((task) => (
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
            {meetings.map((meeting) => (
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
              { icon: FileText, label: "マニュアル作成" },
              { icon: Timer, label: "会議開始" },
              { icon: Book, label: "ナレッジ登録" },
              { icon: Users, label: "チーム管理" },
            ].map(({ icon: Icon, label }, index) => (
              <Button key={index} variant="outline" className="h-auto flex-col gap-2 py-4">
                <Icon className="h-6 w-6" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ManualsTab Component
const ManualsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<ManualTemplate | null>(null)

  const manualTemplates: ManualTemplate[] = [
    {
      id: 1,
      title: "新入社員オリエンテーション",
      description: "新しい社員向けの基本的な業務ガイドライン",
      sections: ["会社概要", "組織構造", "基本的な業務プロセス", "行動規範", "福利厚生"],
    },
    {
      id: 2,
      title: "営業活動マニュアル",
      description: "営業チーム向けの標準的な営業プロセス",
      sections: ["見込み客リサーチ", "初回アプローチ", "提案資料作成", "価格交渉", "クロージング"],
    },
    {
      id: 3,
      title: "クレーム対応マニュアル",
      description: "顧客からのクレーム対応の標準手順",
      sections: ["初期対応", "事実確認", "謝罪と解決策提示", "フォローアップ", "再発防止策"],
    },
  ]

  const filteredManuals = manualTemplates.filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>業務マニュアル</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="マニュアルを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button>
              <FilePlus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredManuals.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{template.title}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedTemplate?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
                <div className="space-y-2">
                  <h3 className="font-medium text-muted-foreground">マニュアル構成</h3>
                  {selectedTemplate?.sections.map((section, index) => (
                    <div key={index} className="flex items-center rounded-md bg-muted p-2 text-sm">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      {section}
                    </div>
                  ))}
                </div>
                <Button className="w-full">マニュアル作成</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// KnowledgeTab Component
const KnowledgeTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null)

  const knowledgeCategories: KnowledgeCategory[] = [
    { id: 1, name: "業務プロセス" },
    { id: 2, name: "顧客対応" },
    { id: 3, name: "システム操作" },
    { id: 4, name: "技術情報" },
  ]

  const knowledgeItems: KnowledgeItem[] = [
    {
      id: 1,
      title: "新規顧客対応マニュアル",
      category: "顧客対応",
      description: "初回面談から契約までの標準的な顧客対応プロセス",
      tags: ["営業", "顧客", "接客"],
    },
    {
      id: 2,
      title: "CRMシステム利用ガイド",
      category: "システム操作",
      description: "社内CRMシステムの基本操作と効率的な活用方法",
      tags: ["システム", "CRM", "トレーニング"],
    },
    {
      id: 3,
      title: "新プロジェクト立ち上げ手順",
      category: "業務プロセス",
      description: "新規プロジェクトの計画から実行までの標準フロー",
      tags: ["プロジェクト管理", "業務"],
    },
  ]

  const filteredKnowledge = knowledgeItems.filter(
    (item) =>
      (selectedCategory ? item.category === selectedCategory : true) &&
      (searchTerm
        ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        : true),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>ナレッジベース</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ナレッジを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </div>

          <div className="flex space-x-2 overflow-x-auto">
            {knowledgeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </Button>
            ))}
            <Button variant={selectedCategory === "" ? "default" : "outline"} onClick={() => setSelectedCategory("")}>
              すべて
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredKnowledge.map((knowledge) => (
              <Card key={knowledge.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{knowledge.title}</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{knowledge.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {knowledge.tags.map((tag, index) => (
                      <span key={index} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedKnowledge} onOpenChange={() => setSelectedKnowledge(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedKnowledge?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedKnowledge?.category}</span>
                </div>
                <p className="text-sm">{selectedKnowledge?.description}</p>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">タグ</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedKnowledge?.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Button className="w-full">詳細表示</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}

// MeetingsTab Component
const MeetingsTab: React.FC = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [activeTimer, setActiveTimer] = useState<Meeting | null>(null)
  const [meetingMinutes, setMeetingMinutes] = useState({
    participants: "",
    discussion: "",
    decisions: "",
    nextActions: "",
  })

  const meetings: Meeting[] = [
    {
      id: 1,
      title: "朝会",
      scheduledTime: "2025-02-08T09:00:00",
      participants: 5,
      agenda: [
        { topic: "進捗報告", duration: 15 },
        { topic: "問題点の共有", duration: 10 },
        { topic: "今日のタスク確認", duration: 5 },
      ],
    },
    {
      id: 2,
      title: "プロジェクトMTG",
      scheduledTime: "2025-02-08T14:00:00",
      participants: 8,
      agenda: [
        { topic: "プロジェクト概要", duration: 10 },
        { topic: "タイムライン確認", duration: 20 },
        { topic: "リスク分析", duration: 15 },
        { topic: "次のステップ", duration: 15 },
      ],
    },
  ]

  const MeetingTimerModal: React.FC<{ meeting: Meeting; onClose: () => void }> = ({ meeting, onClose }) => {
    const [currentAgendaIndex, setCurrentAgendaIndex] = useState(0)
    const [remainingTime, setRemainingTime] = useState(meeting.agenda[0].duration * 60)
    const [isRunning, setIsRunning] = useState(false)

    useEffect(() => {
      let interval: NodeJS.Timeout
      if (isRunning && remainingTime > 0) {
        interval = setInterval(() => {
          setRemainingTime((prev) => prev - 1)
        }, 1000)
      } else if (remainingTime === 0 && currentAgendaIndex < meeting.agenda.length - 1) {
        setCurrentAgendaIndex((prev) => prev + 1)
        setRemainingTime(meeting.agenda[currentAgendaIndex + 1].duration * 60)
      }
      return () => clearInterval(interval)
    }, [isRunning, remainingTime, currentAgendaIndex, meeting.agenda])

    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
    }

    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meeting.title} - タイマー</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{meeting.agenda[currentAgendaIndex].topic}</h3>
            <p className="text-4xl font-bold">{formatTime(remainingTime)}</p>
          </div>
          <div className="flex justify-center space-x-2">
            <Button onClick={() => setIsRunning(!isRunning)}>{isRunning ? "一時停止" : "スタート"}</Button>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentAgendaIndex(0)
                setRemainingTime(meeting.agenda[0].duration * 60)
                setIsRunning(false)
              }}
            >
              リセット
            </Button>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">アジェンダ</h4>
            {meeting.agenda.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.topic}</span>
                <span>{item.duration}分</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    )
  }

  const MeetingMinutesModal: React.FC<{ meeting: Meeting; onClose: () => void }> = ({ meeting, onClose }) => {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meeting.title} - 議事録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label htmlFor="participants" className="block text-sm font-medium text-gray-700">
              参加者
            </label>
            <Input
              id="participants"
              value={meetingMinutes.participants}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, participants: e.target.value })}
              placeholder="参加者名（カンマ区切り）"
            />
          </div>
          <div>
            <label htmlFor="discussion" className="block text-sm font-medium text-gray-700">
              議論内容
            </label>
            <Textarea
              id="discussion"
              value={meetingMinutes.discussion}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, discussion: e.target.value })}
              placeholder="主な議論内容を記入"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="decisions" className="block text-sm font-medium text-gray-700">
              決定事項
            </label>
            <Textarea
              id="decisions"
              value={meetingMinutes.decisions}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, decisions: e.target.value })}
              placeholder="決定事項を記入"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="nextActions" className="block text-sm font-medium text-gray-700">
              次のアクション
            </label>
            <Textarea
              id="nextActions"
              value={meetingMinutes.nextActions}
              onChange={(e) => setMeetingMinutes({ ...meetingMinutes, nextActions: e.target.value })}
              placeholder="次のアクションを記入"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose}>キャンセル</Button>
            <Button
              onClick={() => {
                // Here you would typically save the meeting minutes
                console.log("Meeting minutes:", meetingMinutes)
                onClose()
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>会議管理</span>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{meeting.title}</span>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedMeeting(meeting)}>
                      <Timer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setActiveTimer(meeting)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(meeting.scheduledTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{meeting.participants}名</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedMeeting && (
          <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
            <MeetingTimerModal meeting={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
          </Dialog>
        )}

        {activeTimer && (
          <Dialog open={!!activeTimer} onOpenChange={() => setActiveTimer(null)}>
            <MeetingMinutesModal meeting={activeTimer} onClose={() => setActiveTimer(null)} />
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

// Main DashboardView Component
const DashboardView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard")

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="manuals">業務マニュアル</TabsTrigger>
            <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
            <TabsTrigger value="meetings">会議管理</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="manuals">
            <ManualsTab />
          </TabsContent>
          <TabsContent value="knowledge">
            <KnowledgeTab />
          </TabsContent>
          <TabsContent value="meetings">
            <MeetingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Types
interface ManualTemplate {
  id: number
  title: string
  description: string
  sections: string[]
}

interface KnowledgeCategory {
  id: number
  name: string
}

interface KnowledgeItem {
  id: number
  title: string
  category: string
  description: string
  tags: string[]
}

interface Meeting {
  id: number
  title: string
  scheduledTime: string
  participants: number
  agenda: { topic: string; duration: number }[]
}

export default DashboardView

