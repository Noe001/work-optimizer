"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FilePlus,
  BookOpen,
  Search,
  BarChart3,
  Calendar,
  FileText,
  Timer,
  Book,
  Users,
  Edit,
  Trash2,
  Filter,
  Tag,
  Clock,
  Heart,
  CheckSquare,
  MessageSquare,
} from "lucide-react"
import Header from "@/components/Header"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { taskService, meetingService, workLifeBalanceService } from '@/services'
import { useApi } from '@/hooks'
import { Task } from '@/types/api'
import type { Meeting as ApiMeeting, WorkLifeBalance } from '@/types/api'
import { ApiError, LoadingIndicator } from '@/components/ui'

// Meeting型定義
interface LocalMeeting {
  id: number
  title: string
  scheduledTime: string
  participants: number
  agenda: { topic: string; duration: number }[]
}

// DashboardTab Component
const DashboardTab: React.FC = () => {
  // タスク用のAPIフック
  const tasksApi = useApi<Task[]>();
  
  // ミーティング用のAPIフック
  const meetingsApi = useApi<ApiMeeting[]>();

  // ワークライフバランス用のAPIフック
  const workLifeBalanceApi = useApi<WorkLifeBalance>();

  // チームアクティビティ
  const teamActivities = [
    { user: "佐藤太郎", activity: "タスク「プレゼン資料作成」を完了しました", time: "1時間前" },
    { user: "鈴木花子", activity: "新しいナレッジ「効率的な会議の進め方」を追加しました", time: "3時間前" },
    { user: "田中誠", activity: "チームチャットで新しい投稿をしました", time: "昨日" },
  ]

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    // 自分のタスクを取得
    tasksApi.execute(
      () => taskService.getMyTasks()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'タスクの取得に失敗しました');
        })
    );
    
    // 自分の参加するミーティングを取得
    meetingsApi.execute(
      () => meetingService.getMyMeetings()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'ミーティングの取得に失敗しました');
        })
    );

    // ワークライフバランスデータを取得
    workLifeBalanceApi.execute(
      () => workLifeBalanceService.getWorkLifeBalance()
        .then(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'ワークライフバランスデータの取得に失敗しました');
        })
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* ようこそメッセージ */}
      <div className="bg-gradient-to-r from-gray-200 to-cyan-500/30 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2">おはようございます、田中さん</h2>
        <p className="opacity-90">今日も素晴らしい一日になりますように。今週のタスク完了率は85%です。</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30" asChild>
            <Link to="/tasks">
              <FileText className="h-4 w-4 mr-2" />
              タスク
            </Link>
          </Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30" asChild>
            <Link to="/work_life_balance">
              <Calendar className="h-4 w-4 mr-2" />
              健康管理
            </Link>
          </Button>
          <Button variant="secondary" className="bg-white/20 hover:bg-white/30" asChild>
            <Link to="/team_chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              メッセージ
            </Link>
          </Button>
        </div>
      </div>

      {/* クイックアクセスとステータス */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              業務進捗
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksApi.loading && (
              <LoadingIndicator text="タスクを読込中..." size="sm" />
            )}
            
            {tasksApi.error && (
              <ApiError 
                error={tasksApi.error}
                onRetry={() => tasksApi.execute(() => taskService.getMyTasks().then(res => res.success ? res.data : []))}
              />
            )}
            
            {!tasksApi.loading && !tasksApi.error && tasksApi.data && (
              <div className="space-y-4">
                {tasksApi.data.length > 0 ? (
                  tasksApi.data.slice(0, 3).map((task) => (
                    <div key={task.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span>{task.title}</span>
                        <span>
                          {task.status === 'completed' ? '100' : 
                           task.status === 'in_progress' ? '50' : '0'}%
                        </span>
                      </div>
                      <Progress 
                        value={
                          task.status === 'completed' ? 100 : 
                          task.status === 'in_progress' ? 50 : 0
                        } 
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">タスクがありません</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/tasks">タスク一覧</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              本日の会議
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetingsApi.loading && (
              <LoadingIndicator text="会議を読込中..." size="sm" />
            )}
            
            {meetingsApi.error && (
              <ApiError 
                error={meetingsApi.error}
                onRetry={() => meetingsApi.execute(() => meetingService.getMyMeetings().then(res => res.success ? res.data : []))}
              />
            )}
            
            {!meetingsApi.loading && !meetingsApi.error && meetingsApi.data && (
              <div className="space-y-4">
                {meetingsApi.data.length > 0 ? (
                  meetingsApi.data.slice(0, 3).map((meeting) => {
                    // 日付と時間を変換
                    const meetingDate = new Date(meeting.scheduledTime);
                    const timeString = meetingDate.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    // 会議時間（仮の実装）
                    const duration = meeting.agenda && meeting.agenda.length > 0
                      ? meeting.agenda.reduce((total, item) => total + item.duration, 0)
                      : 30; // デフォルト30分
                      
                    return (
                      <div key={meeting.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-muted-foreground">{timeString}</div>
                        </div>
                        <div className="text-sm">{duration}分</div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground">今日の会議はありません</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/meeting">会議スケジュール</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              ワークライフバランス
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {workLifeBalanceApi.loading && (
              <LoadingIndicator text="データを読込中..." size="sm" />
            )}
            
            {workLifeBalanceApi.error && (
              <ApiError 
                error={workLifeBalanceApi.error}
                onRetry={() => workLifeBalanceApi.execute(() => 
                  workLifeBalanceService.getWorkLifeBalance()
                    .then(res => res.success ? res.data : null)
                )}
              />
            )}
            
            {!workLifeBalanceApi.loading && !workLifeBalanceApi.error && workLifeBalanceApi.data && (
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-muted-foreground/20"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className={
                        workLifeBalanceApi.data.status === 'good' 
                          ? "text-green-500" 
                          : workLifeBalanceApi.data.status === 'warning' 
                            ? "text-amber-500" 
                            : "text-red-500"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${(workLifeBalanceApi.data.score / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${
                      workLifeBalanceApi.data.status === 'good' 
                        ? "text-green-500" 
                        : workLifeBalanceApi.data.status === 'warning' 
                          ? "text-amber-500" 
                          : "text-red-500"
                    }`}>
                      {workLifeBalanceApi.data.score}
                    </span>
                  </div>
                </div>
                <Badge 
                  className={
                    workLifeBalanceApi.data.status === 'good' 
                      ? "bg-green-100 text-green-800" 
                      : workLifeBalanceApi.data.status === 'warning' 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-red-100 text-red-800"
                  }
                >
                  {workLifeBalanceApi.data.status === 'good' ? '良好' : 
                   workLifeBalanceApi.data.status === 'warning' ? '要注意' : '改善が必要'}
                </Badge>
                <Button size="sm" variant="outline" className="w-full mt-2" asChild>
                  <Link to="/work_life_balance">詳細を見る</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              チームアクティビティ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[150px] overflow-y-auto">
              {teamActivities.map((activity, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-muted-foreground">{activity.activity}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to="/team_chat">チームチャットへ</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2 lg:col-span-4 bg-muted/40">
          <CardHeader>
            <CardTitle>クイックアクセス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: FileText, label: "マニュアル作成", path: "/manual" },
                { icon: Timer, label: "会議作成", path: "/meeting" },
                { icon: Book, label: "ナレッジ作成", path: "/knowledge_base" },
                { icon: Users, label: "チャット", path: "/team_chat" },
                { icon: CheckSquare, label: "タスク管理", path: "/tasks" },
                { icon: Heart, label: "健康管理", path: "/work_life_balance" },
              ].map(({ icon: Icon, label, path }, index) => (
                <Button key={index} variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
                  <Link to={path}>
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ManualsTab Component
const ManualsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<ManualTemplate | null>(null)
  const [sortOrder, setSortOrder] = useState<string>("title")

  const manualTemplates: ManualTemplate[] = [
    {
      id: 1,
      title: "新入社員オリエンテーション",
      description: "新しい社員向けの基本的な業務ガイドライン",
      sections: ["会社概要", "組織構造", "基本的な業務プロセス", "行動規範", "福利厚生"],
      createdAt: "2023-05-10",
    },
    {
      id: 2,
      title: "営業活動マニュアル",
      description: "営業チーム向けの標準的な営業プロセス",
      sections: ["見込み客リサーチ", "初回アプローチ", "提案資料作成", "価格交渉", "クロージング"],
      createdAt: "2023-06-15",
    },
    {
      id: 3,
      title: "クレーム対応マニュアル",
      description: "顧客からのクレーム対応の標準手順",
      sections: ["初期対応", "事実確認", "謝罪と解決策提示", "フォローアップ", "再発防止策"],
      createdAt: "2023-07-20",
    },
  ]

  const sortedManuals = [...manualTemplates].filter(
    (template) =>
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()),
  ).sort((a, b) => {
    switch (sortOrder) {
      case "title":
        return a.title.localeCompare(b.title);
      case "titleDesc":
        return b.title.localeCompare(a.title);
      case "createdAt":
        return a.createdAt.localeCompare(b.createdAt);
      case "createdAtDesc":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return 0;
    }
  });

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <Label>ソート</Label>
                  <Select defaultValue="title" value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="ソート順" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">タイトル (昇順)</SelectItem>
                      <SelectItem value="titleDesc">タイトル (降順)</SelectItem>
                      <SelectItem value="createdAt">作成日 (昇順)</SelectItem>
                      <SelectItem value="createdAtDesc">作成日 (降順)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild>
              <Link to="/manual">
                <FilePlus className="mr-2 h-4 w-4" />
                新規作成
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedManuals.map((template) => (
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
  const [sortOrder, setSortOrder] = useState<string>("title")

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
      createdAt: "2023-05-15",
    },
    {
      id: 2,
      title: "CRMシステム利用ガイド",
      category: "システム操作",
      description: "社内CRMシステムの基本操作と効率的な活用方法",
      tags: ["システム", "CRM", "トレーニング"],
      createdAt: "2023-06-20",
    },
    {
      id: 3,
      title: "新プロジェクト立ち上げ手順",
      category: "業務プロセス",
      description: "新規プロジェクトの計画から実行までの標準フロー",
      tags: ["プロジェクト管理", "業務"],
      createdAt: "2023-07-25",
    },
  ]

  const filteredAndSortedKnowledge = knowledgeItems
    .filter(
      (item) =>
        (selectedCategory ? item.category === selectedCategory : true) &&
        (searchTerm
          ? item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          : true),
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case "title":
          return a.title.localeCompare(b.title);
        case "titleDesc":
          return b.title.localeCompare(a.title);
        case "category":
          return a.category.localeCompare(b.category);
        case "categoryDesc":
          return b.category.localeCompare(a.category);
        case "createdAt":
          return a.createdAt.localeCompare(b.createdAt);
        case "createdAtDesc":
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return 0;
      }
    });

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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <Label>ソート</Label>
                  <Select defaultValue="title" value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="ソート順" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">タイトル (昇順)</SelectItem>
                      <SelectItem value="titleDesc">タイトル (降順)</SelectItem>
                      <SelectItem value="category">カテゴリ (昇順)</SelectItem>
                      <SelectItem value="categoryDesc">カテゴリ (降順)</SelectItem>
                      <SelectItem value="createdAt">作成日 (昇順)</SelectItem>
                      <SelectItem value="createdAtDesc">作成日 (降順)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild>
              <Link to="/knowledge_base">
                <FilePlus className="mr-2 h-4 w-4" />
                新規作成
              </Link>
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
            {filteredAndSortedKnowledge.map((knowledge) => (
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
  const [selectedMeeting, setSelectedMeeting] = useState<LocalMeeting | null>(null)
  const [activeTimer, setActiveTimer] = useState<LocalMeeting | null>(null)
  const [meetingMinutes, setMeetingMinutes] = useState({
    participants: "",
    discussion: "",
    decisions: "",
    nextActions: "",
  })

  const meetingsLocal: LocalMeeting[] = [
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

  const MeetingTimerModal: React.FC<{ meeting: LocalMeeting; onClose: () => void }> = ({ meeting }) => {
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
            {meeting.agenda.map((item: { topic: string; duration: number }, index: number) => (
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

  const MeetingMinutesModal: React.FC<{ meeting: LocalMeeting; onClose: () => void }> = ({ meeting, onClose }) => {
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
          <Button asChild>
            <Link to="/meeting">
              <FilePlus className="mr-2 h-4 w-4" />
              新規作成
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetingsLocal.map((meeting) => (
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="dashboard">ダッシュボード</TabsTrigger>
            <TabsTrigger value="manuals">業務マニュアル</TabsTrigger>
            <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
            <TabsTrigger value="meetings">会議管理</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="pt-4">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="manuals" className="pt-4">
            <ManualsTab />
          </TabsContent>
          <TabsContent value="knowledge" className="pt-4">
            <KnowledgeTab />
          </TabsContent>
          <TabsContent value="meetings" className="pt-4">
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
  createdAt: string
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
  createdAt: string
}

export default DashboardView
