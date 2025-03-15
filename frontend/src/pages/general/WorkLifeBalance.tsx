"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/Header"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Activity,
  Timer,
  SunMoon,
  Coffee,
  FileText,
  Users,
  AlertTriangle,
  LucideIcon,
  Heart,
  Sparkles
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

// サンプルデータ
const workHoursData = [
  { date: "月", 労働時間: 8.5, 標準労働時間: 8, 残業時間: 0.5 },
  { date: "火", 労働時間: 9.2, 標準労働時間: 8, 残業時間: 1.2 },
  { date: "水", 労働時間: 7.8, 標準労働時間: 8, 残業時間: 0 },
  { date: "木", 労働時間: 8.0, 標準労働時間: 8, 残業時間: 0 },
  { date: "金", 労働時間: 10.5, 標準労働時間: 8, 残業時間: 2.5 },
  { date: "土", 労働時間: 4.0, 標準労働時間: 0, 残業時間: 4.0 },
  { date: "日", 労働時間: 0, 標準労働時間: 0, 残業時間: 0 },
]

const monthlyWorkData = [
  { month: "1月", 労働時間: 168, 標準労働時間: 160, 残業時間: 8 },
  { month: "2月", 労働時間: 155, 標準労働時間: 150, 残業時間: 5 },
  { month: "3月", 労働時間: 175, 標準労働時間: 168, 残業時間: 7 },
  { month: "4月", 労働時間: 182, 標準労働時間: 160, 残業時間: 22 },
  { month: "5月", 労働時間: 161, 標準労働時間: 160, 残業時間: 1 },
  { month: "6月", 労働時間: 148, 標準労働時間: 152, 残業時間: 0 },
]

const activityBreakdown = [
  { name: "会議", value: 15, color: "#3498db" },
  { name: "開発作業", value: 35, color: "#2ecc71" },
  { name: "ドキュメント作成", value: 20, color: "#9b59b6" },
  { name: "レビュー", value: 10, color: "#e74c3c" },
  { name: "研修", value: 5, color: "#f1c40f" },
  { name: "その他", value: 15, color: "#95a5a6" },
]

const wellnessIndicators = [
  { name: "運動", icon: Activity, value: 60, target: 100 },
  { name: "睡眠", icon: SunMoon, value: 85, target: 100 },
  { name: "休息", icon: Coffee, value: 70, target: 100 },
  { name: "精神的健康", icon: Heart, value: 75, target: 100 },
]

const stressFactors = [
  { factor: "長時間労働", level: "高", recommendations: ["定時退社を心がける", "タスクの優先順位付け"] },
  { factor: "締め切りプレッシャー", level: "中", recommendations: ["計画的なスケジュール管理", "上司との率直な対話"] },
  { factor: "会議の多さ", level: "中", recommendations: ["不要な会議の削減", "効率的な会議運営"] },
  { factor: "マルチタスク", level: "低", recommendations: ["タスクの集中時間の確保", "割り込み作業の管理"] },
]

interface Recommendation {
  id: number
  title: string
  description: string
  impact: "高" | "中" | "低"
  icon: LucideIcon
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: "勤務時間の最適化",
    description: "金曜日の残業が多いため、タスクを他の日に分散させることをお勧めします。",
    impact: "高",
    icon: Clock
  },
  {
    id: 2,
    title: "定期的な休憩",
    description: "2時間ごとに短い休憩を挟むことで、集中力と生産性を向上させましょう。",
    impact: "中",
    icon: Coffee
  },
  {
    id: 3,
    title: "運動習慣の向上",
    description: "ウェルネススコアを見ると運動が不足しています。週に3回、30分の軽い運動を取り入れましょう。",
    impact: "高",
    icon: Activity
  },
  {
    id: 4,
    title: "会議時間の短縮",
    description: "活動内訳を見ると会議の割合が高めです。会議時間を15%削減するアクションを検討しましょう。",
    impact: "中",
    icon: Users
  },
]

const WorkLifeBalanceView: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [viewMode, setViewMode] = useState<"日次" | "週次" | "月次">("週次")
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [goalCategory, setGoalCategory] = useState("")
  const [goalValue, setGoalValue] = useState("")
  const [goalDeadline, setGoalDeadline] = useState<Date | undefined>(new Date())

  // ワークライフバランススコア（単純化した計算）
  const calculateWorkLifeBalanceScore = () => {
    // 労働時間の適切さ（0-40）
    const workHoursScore = Math.max(0, 40 - (workHoursData
      .reduce((acc, day) => acc + day.残業時間, 0) / workHoursData.length) * 20)
    
    // ウェルネス指標の平均（0-30）
    const wellnessScore = wellnessIndicators
      .reduce((acc, indicator) => acc + (indicator.value / indicator.target) * 30, 0) / wellnessIndicators.length
    
    // 活動バランス（0-30）
    // 理想的なバランスからの偏差を計算（単純化）
    const idealBalance = 100 / activityBreakdown.length // 均等配分が理想的と仮定
    const balanceDeviation = activityBreakdown
      .reduce((acc, activity) => acc + Math.abs(activity.value - idealBalance), 0) / 100
    const balanceScore = 30 * (1 - balanceDeviation)
    
    return Math.round(workHoursScore + wellnessScore + balanceScore)
  }

  const score = calculateWorkLifeBalanceScore()
  let scoreLevel: "良好" | "要注意" | "改善が必要"
  let scoreColor: string

  if (score >= 70) {
    scoreLevel = "良好"
    scoreColor = "text-green-500"
  } else if (score >= 50) {
    scoreLevel = "要注意"
    scoreColor = "text-amber-500"
  } else {
    scoreLevel = "改善が必要"
    scoreColor = "text-red-500"
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-6 flex-1">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">ワークライフバランス管理</h1>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'yyyy年MM月dd日', { locale: ja }) : "日付を選択"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                  />
                </PopoverContent>
              </Popover>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="表示期間" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="日次">日次</SelectItem>
                  <SelectItem value="週次">週次</SelectItem>
                  <SelectItem value="月次">月次</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 総合スコアカード */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">ワークライフバランススコア</CardTitle>
                <CardDescription>あなたの総合的なバランス状態</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative flex items-center justify-center w-40 h-40">
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
                        className={score >= 70 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500"}
                        strokeWidth="8"
                        strokeDasharray={`${(score / 100) * 251.2} 251.2`}
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
                      <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge 
                      className={
                        score >= 70 
                          ? "bg-green-100 text-green-800" 
                          : score >= 50 
                          ? "bg-amber-100 text-amber-800" 
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {scoreLevel}
                    </Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {score >= 70 
                        ? "バランスが取れています。この状態を維持しましょう。" 
                        : score >= 50 
                        ? "やや不均衡な状態です。以下の改善点に注意しましょう。" 
                        : "バランスが崩れています。早急な対策が必要です。"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">今週の労働時間</CardTitle>
                <CardDescription>累計: {workHoursData.reduce((acc, day) => acc + day.労働時間, 0)}時間</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="標準労働時間" fill="#4b5563" />
                    <Bar dataKey="残業時間" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">活動内訳</CardTitle>
                <CardDescription>時間配分の割合</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={activityBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {activityBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ウェルネス指標 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ウェルネス指標</CardTitle>
              <CardDescription>健康とウェルビーイングの状態</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {wellnessIndicators.map((indicator, index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <indicator.icon className="h-5 w-5" />
                      <span className="font-medium">{indicator.name}</span>
                    </div>
                    <Progress
                      value={indicator.value}
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>現在: {indicator.value}%</span>
                      <span>目標: {indicator.target}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 詳細分析タブ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">詳細分析</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="trends">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="trends">月次トレンド</TabsTrigger>
                  <TabsTrigger value="stress">ストレス要因</TabsTrigger>
                  <TabsTrigger value="recommendations">改善提案</TabsTrigger>
                  <TabsTrigger value="goals">目標設定</TabsTrigger>
                </TabsList>
                <TabsContent value="trends">
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyWorkData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="労働時間"
                          stroke="#3b82f6"
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="標準労働時間"
                          stroke="#9ca3af"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="stress">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      ストレス要因を特定し、改善策を提案します。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stressFactors.map((factor, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{factor.factor}</CardTitle>
                              <Badge
                                className={
                                  factor.level === "高"
                                    ? "bg-red-100 text-red-800"
                                    : factor.level === "中"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {factor.level}レベル
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">改善提案:</h4>
                              <ul className="list-disc pl-5 text-sm">
                                {factor.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="recommendations">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      あなたのワークライフバランスを改善するための提案です。
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((recommendation) => (
                        <Card key={recommendation.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center space-x-2">
                              <recommendation.icon className="h-5 w-5" />
                              <CardTitle className="text-base">{recommendation.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm mb-3">{recommendation.description}</p>
                            <div className="flex items-center justify-between">
                              <Badge
                                className={
                                  recommendation.impact === "高"
                                    ? "bg-green-100 text-green-800"
                                    : recommendation.impact === "中"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-800"
                                }
                              >
                                影響度: {recommendation.impact}
                              </Badge>
                              <Button variant="outline" size="sm">
                                実施する
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="goals">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                        ワークライフバランスの目標を設定し、進捗を追跡しましょう。
                      </p>
                      <Button onClick={() => setIsGoalDialogOpen(true)}>
                        新しい目標を追加
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-2">
                            <Timer className="h-5 w-5" />
                            <CardTitle className="text-base">残業時間の削減</CardTitle>
                          </div>
                          <CardDescription>期限: 2023年7月31日</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>目標: 月20時間以下</span>
                              <span>現在: 35時間</span>
                            </div>
                            <Progress value={43} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                              57%の削減が必要です。週ごとに5時間ずつ削減しましょう。
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5" />
                            <CardTitle className="text-base">週3回の運動習慣</CardTitle>
                          </div>
                          <CardDescription>期限: 継続目標</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>目標: 週3回</span>
                              <span>現在: 週1回</span>
                            </div>
                            <Progress value={33} className="h-2" />
                            <p className="text-sm text-muted-foreground">
                              あと2回/週の運動が必要です。朝か昼休みの時間を活用しましょう。
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 今週のハイライト */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">今週のハイライト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center p-3 border rounded-lg bg-green-50">
                  <div className="mr-3 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">水曜日の効率性</p>
                    <p className="text-sm text-muted-foreground">標準時間内で全てのタスクを完了しました。</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border rounded-lg bg-amber-50">
                  <div className="mr-3 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">金曜日の残業</p>
                    <p className="text-sm text-muted-foreground">2.5時間の残業があり、週平均を上回っています。</p>
                  </div>
                </div>
                <div className="flex items-center p-3 border rounded-lg bg-blue-50">
                  <div className="mr-3 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">ドキュメント作成時間</p>
                    <p className="text-sm text-muted-foreground">先週比20%削減に成功しました。</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 目標追加ダイアログ */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新しい目標を追加</DialogTitle>
            <DialogDescription>
              ワークライフバランスを改善するための具体的な目標を設定しましょう。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalCategory" className="text-right">
                カテゴリ
              </Label>
              <Select
                value={goalCategory}
                onValueChange={setGoalCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="カテゴリを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">労働時間</SelectItem>
                  <SelectItem value="exercise">運動</SelectItem>
                  <SelectItem value="sleep">睡眠</SelectItem>
                  <SelectItem value="rest">休息</SelectItem>
                  <SelectItem value="mental">精神的健康</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalValue" className="text-right">
                目標値
              </Label>
              <Input
                id="goalValue"
                value={goalValue}
                onChange={(e) => setGoalValue(e.target.value)}
                className="col-span-3"
                placeholder="例: 週20時間以下、週3回など"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deadline" className="text-right">
                期限
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {goalDeadline ? format(goalDeadline, 'yyyy年MM月dd日', { locale: ja }) : "日付を選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={goalDeadline}
                      onSelect={setGoalDeadline}
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">目標を追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default WorkLifeBalanceView
