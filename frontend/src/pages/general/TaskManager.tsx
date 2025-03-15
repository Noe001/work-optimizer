import React, { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Calendar, Clock, Search, Plus, Filter, Users, Tag, List, CalendarDays, ChevronUp, ChevronDown, Edit, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: number;
  name: string;
  avatar?: string;
  initials: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "未着手" | "進行中" | "レビュー中" | "完了";
  priority: "低" | "中" | "高" | "緊急";
  dueDate?: string;
  assignee?: User;
  tags: string[];
  subtasks: { id: number; title: string; completed: boolean }[];
  attachments?: { name: string; url: string }[];
  comments?: { id: number; user: User; text: string; timestamp: string }[];
  createdAt: string;
}

const priorityColors = {
  "低": "bg-green-100 text-green-800",
  "中": "bg-blue-100 text-blue-800",
  "高": "bg-amber-100 text-amber-800",
  "緊急": "bg-red-100 text-red-800"
};

const statusColors = {
  "未着手": "bg-slate-100 text-slate-800",
  "進行中": "bg-sky-100 text-sky-800",
  "レビュー中": "bg-purple-100 text-purple-800",
  "完了": "bg-emerald-100 text-emerald-800"
};

const TaskManagerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<"list" | "board">("board");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});

  // サンプルユーザーデータ
  const users: User[] = [
    { id: 1, name: "佐藤太郎", initials: "ST" },
    { id: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
    { id: 3, name: "田中誠", initials: "TM" },
    { id: 4, name: "伊藤美咲", initials: "IM" },
  ];

  // サンプルタスクデータ
  const tasks: Task[] = [
    {
      id: 1,
      title: "業務マニュアルの作成",
      description: "営業部向けの業務マニュアルを作成する。基本的な業務フローと例外処理を含める。",
      status: "進行中",
      priority: "高",
      dueDate: "2023-06-25",
      assignee: users[0],
      tags: ["マニュアル", "営業部"],
      subtasks: [
        { id: 1, title: "業務フローの整理", completed: true },
        { id: 2, title: "マニュアル下書き作成", completed: true },
        { id: 3, title: "レビュー依頼", completed: false },
        { id: 4, title: "最終版作成", completed: false },
      ],
      attachments: [
        { name: "業務フロー図.pdf", url: "#" },
        { name: "マニュアルテンプレート.docx", url: "#" },
      ],
      comments: [
        {
          id: 1,
          user: users[1],
          text: "序章部分の業務説明をもう少し詳細にしてもらえますか？",
          timestamp: "2023-06-20 14:30",
        },
        {
          id: 2,
          user: users[0],
          text: "承知しました。明日までに追記します。",
          timestamp: "2023-06-20 15:45",
        },
      ],
      createdAt: "2023-06-15",
    },
    {
      id: 2,
      title: "週次MTGの議事録作成",
      description: "6月第3週の週次ミーティングの議事録をまとめる。",
      status: "完了",
      priority: "中",
      dueDate: "2023-06-22",
      assignee: users[1],
      tags: ["会議", "議事録"],
      subtasks: [
        { id: 5, title: "会議メモの整理", completed: true },
        { id: 6, title: "議事録作成", completed: true },
        { id: 7, title: "参加者への共有", completed: true },
      ],
      createdAt: "2023-06-20",
    },
    {
      id: 3,
      title: "ナレッジベース更新",
      description: "新しいプロジェクト管理ツールの使用方法をナレッジベースに追加する。",
      status: "未着手",
      priority: "低",
      dueDate: "2023-06-30",
      assignee: users[2],
      tags: ["ナレッジ", "ツール"],
      subtasks: [
        { id: 8, title: "新ツールの機能整理", completed: false },
        { id: 9, title: "マニュアル作成", completed: false },
        { id: 10, title: "ナレッジベースへの登録", completed: false },
      ],
      createdAt: "2023-06-19",
    },
    {
      id: 4,
      title: "クライアント向けプレゼン資料作成",
      description: "7月の新規プロジェクト提案用のプレゼンテーション資料を作成する。",
      status: "進行中",
      priority: "緊急",
      dueDate: "2023-06-28",
      assignee: users[3],
      tags: ["プレゼン", "クライアント", "提案"],
      subtasks: [
        { id: 11, title: "提案内容の整理", completed: true },
        { id: 12, title: "スライド作成", completed: false },
        { id: 13, title: "内部レビュー", completed: false },
        { id: 14, title: "資料の最終調整", completed: false },
      ],
      attachments: [
        { name: "提案概要.pdf", url: "#" },
      ],
      createdAt: "2023-06-21",
    },
    {
      id: 5,
      title: "プロジェクトBの進捗報告書作成",
      description: "プロジェクトBの月次進捗報告書を作成し、ステークホルダーに共有する。",
      status: "レビュー中",
      priority: "高",
      dueDate: "2023-06-26",
      assignee: users[0],
      tags: ["報告書", "プロジェクトB"],
      subtasks: [
        { id: 15, title: "データ収集", completed: true },
        { id: 16, title: "報告書作成", completed: true },
        { id: 17, title: "内部レビュー", completed: true },
        { id: 18, title: "最終調整", completed: false },
      ],
      createdAt: "2023-06-18",
    },
  ];

  // タスクの展開/折りたたみを切り替える
  const toggleTaskExpanded = (taskId: number) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // フィルタリングされたタスクを取得
  const getFilteredTasks = () => {
    let filtered = tasks;

    // タブによるフィルター
    if (activeTab !== "all") {
      filtered = filtered.filter((task) => {
        if (activeTab === "today" && task.dueDate === "2023-06-25") return true;
        if (activeTab === "upcoming" && task.dueDate && task.dueDate > "2023-06-25") return true;
        if (activeTab === "assigned" && task.assignee?.id === 1) return true;
        if (activeTab === "completed" && task.status === "完了") return true;
        return false;
      });
    }

    // 検索語によるフィルター
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          (task.description && task.description.toLowerCase().includes(term)) ||
          task.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // 優先度によるフィルター
    if (filterPriority) {
      filtered = filtered.filter((task) => task.priority === filterPriority);
    }

    return filtered;
  };

  // 選択されたタスクを取得
  const getSelectedTask = () => {
    if (selectedTaskId === null) return null;
    return tasks.find((task) => task.id === selectedTaskId);
  };

  // タスクの進捗率を計算
  const calculateTaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) return 0;
    const completedCount = task.subtasks.filter((subtask) => subtask.completed).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  };

  // タスク詳細ダイアログを開く
  const openTaskDetails = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsTaskDialogOpen(true);
  };

  // タスク詳細ダイアログを閉じる
  const closeTaskDetails = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
  };

  // タスクボードビュー (カンバンボード風のUI)
  const BoardView = () => {
    const statusColumns = ["未着手", "進行中", "レビュー中", "完了"];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusColumns.map((status) => (
          <div key={status} className="flex flex-col">
            <div className="p-2 bg-muted rounded-t-md font-medium flex justify-between items-center">
              <span>{status}</span>
              <Badge variant="outline">
                {getFilteredTasks().filter((t) => t.status === status).length}
              </Badge>
            </div>
            <div className="bg-muted/40 p-2 rounded-b-md flex-1 space-y-2 min-h-[50vh]">
              {getFilteredTasks()
                .filter((task) => task.status === status)
                .map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md" onClick={() => openTaskDetails(task.id)}>
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                      {task.description && (
                        <CardDescription className="line-clamp-2 mb-2">
                          {task.description}
                        </CardDescription>
                      )}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {task.dueDate || "期限なし"}
                        </div>
                        <Badge className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span>{calculateTaskProgress(task)}% 完了</span>
                            <span>
                              {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                            </span>
                          </div>
                          <Progress value={calculateTaskProgress(task)} className="h-1.5" />
                        </div>
                      )}
                      {task.assignee && (
                        <div className="mt-2 flex justify-end">
                          <Avatar className="h-6 w-6">
                            {task.assignee.avatar ? (
                              <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                            ) : null}
                            <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // タスクリストビュー
  const ListView = () => {
    return (
      <div className="space-y-2">
        {getFilteredTasks().map((task) => (
          <Card key={task.id} className={expandedTasks[task.id] ? "" : "hover:bg-accent/10"}>
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => toggleTaskExpanded(task.id)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <Checkbox checked={task.status === "完了"} />
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  {!expandedTasks[task.id] && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {task.description || "説明なし"}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={statusColors[task.status]}>{task.status}</Badge>
                <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                {task.dueDate && (
                  <div className="text-sm flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.dueDate}
                  </div>
                )}
                {task.assignee && (
                  <Avatar className="h-6 w-6">
                    {task.assignee.avatar ? (
                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                    ) : null}
                    <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                  </Avatar>
                )}
                {expandedTasks[task.id] ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {expandedTasks[task.id] && (
              <CardContent className="pt-0">
                {task.description && <p className="mb-4">{task.description}</p>}
                
                {task.subtasks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">サブタスク</h4>
                    <div className="space-y-1">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center">
                          <Checkbox checked={subtask.completed} className="mr-2" />
                          <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {task.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">タグ</h4>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={() => openTaskDetails(task.id)}>
                    詳細を見る
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    <Edit className="h-4 w-4 mr-1" /> 編集
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-6 flex-1">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">タスク管理</h1>
            <Button className="flex items-center">
              <Plus className="h-4 w-4 mr-1" /> 新規タスク作成
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* フィルターサイドバー */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">フィルター</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full grid grid-cols-2 mb-2">
                      <TabsTrigger value="all">すべて</TabsTrigger>
                      <TabsTrigger value="today">今日</TabsTrigger>
                    </TabsList>
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="upcoming">今後</TabsTrigger>
                      <TabsTrigger value="assigned">自分</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="mt-4">
                    <Label className="text-sm mb-1.5 block">優先度</Label>
                    <Select
                      value={filterPriority || "all"}
                      onValueChange={(value) => setFilterPriority(value === "all" ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="すべて" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="低">低</SelectItem>
                        <SelectItem value="中">中</SelectItem>
                        <SelectItem value="高">高</SelectItem>
                        <SelectItem value="緊急">緊急</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4">
                    <Label className="text-sm mb-1.5 block">担当者</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="すべて" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">タグ</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(tasks.flatMap((task) => task.tags))).map((tag, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* メインコンテンツ */}
            <div className="md:col-span-3 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="タスクを検索..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={taskViewMode === "list" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTaskViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={taskViewMode === "board" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTaskViewMode("board")}
                      >
                        <CalendarDays className="h-4 w-4" />
                      </Button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60">
                          <div className="space-y-2">
                            <Label>ソート</Label>
                            <Select defaultValue="dueDate">
                              <SelectTrigger>
                                <SelectValue placeholder="期限日" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dueDate">期限日</SelectItem>
                                <SelectItem value="priority">優先度</SelectItem>
                                <SelectItem value="title">タイトル</SelectItem>
                                <SelectItem value="createdAt">作成日</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  {taskViewMode === "board" ? <BoardView /> : <ListView />}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* タスク詳細ダイアログ */}
      <Dialog open={isTaskDialogOpen} onOpenChange={closeTaskDetails}>
        <DialogContent className="max-w-3xl">
          {(() => {
            const task = getSelectedTask();
            if (!task) return null;
            
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-xl">{task.title}</DialogTitle>
                    <Badge className={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                  </div>
                  <DialogDescription>
                    作成日: {task.createdAt} {task.dueDate && `/ 期限: ${task.dueDate}`}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-4">
                    {task.description && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">説明</h3>
                        <p>{task.description}</p>
                      </div>
                    )}
                    
                    {task.subtasks && task.subtasks.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">サブタスク</h3>
                        <div className="space-y-2">
                          {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center">
                              <Checkbox checked={subtask.completed} className="mr-2" />
                              <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span>{calculateTaskProgress(task)}% 完了</span>
                            <span>
                              {task.subtasks.filter((st) => st.completed).length}/
                              {task.subtasks.length}
                            </span>
                          </div>
                          <Progress value={calculateTaskProgress(task)} className="h-2" />
                        </div>
                      </div>
                    )}
                    
                    {task.attachments && task.attachments.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">添付ファイル</h3>
                        <div className="space-y-2">
                          {task.attachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center p-2 border rounded hover:bg-accent cursor-pointer"
                            >
                              <span>{attachment.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {task.comments && task.comments.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">コメント</h3>
                        <div className="space-y-3">
                          {task.comments.map((comment) => (
                            <div key={comment.id} className="flex space-x-2">
                              <Avatar className="h-8 w-8">
                                {comment.user.avatar ? (
                                  <AvatarImage src={comment.user.avatar} alt={comment.user.name} />
                                ) : null}
                                <AvatarFallback>{comment.user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-baseline">
                                  <span className="font-medium text-sm mr-2">{comment.user.name}</span>
                                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                                </div>
                                <p className="text-sm mt-1">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3">
                          <Textarea placeholder="コメントを追加..." className="resize-none" />
                          <Button className="mt-2">コメントを送信</Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-2">優先度</h3>
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    {task.assignee && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">担当者</h3>
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            {task.assignee.avatar ? (
                              <AvatarImage
                                src={task.assignee.avatar}
                                alt={task.assignee.name}
                              />
                            ) : null}
                            <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                          </Avatar>
                          <span>{task.assignee.name}</span>
                        </div>
                      </div>
                    )}
                    
                    {task.tags && task.tags.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">タグ</h3>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 mt-4 border-t">
                      <Button variant="outline" className="w-full flex items-center justify-center">
                        <Edit className="h-4 w-4 mr-2" /> 編集
                      </Button>
                      <Button variant="outline" className="w-full mt-2 flex items-center justify-center text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" /> 削除
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskManagerView; 
