import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar, Search, Plus, Filter, List, CalendarDays, ChevronUp, ChevronDown, Edit, Trash2, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { taskService } from "@/services";
import { Task as ApiTask, SubTask as ApiSubTask } from "@/types/api";
import { usePaginatedApi } from "@/hooks";
import { ApiError } from "@/components/ui/api-error";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useToast } from "@/hooks";

interface User {
  id: number;
  name: string;
  avatar?: string;
  initials: string;
}

// UI表示用に拡張したタスクインターフェース
interface UITask {
  id: string | number;
  title: string;
  description?: string;
  status: "未着手" | "進行中" | "レビュー中" | "完了";
  priority: "低" | "中" | "高" | "緊急";
  dueDate?: string;
  assignee?: User;
  tags: string[];
  subtasks: { id: string | number; title: string; completed: boolean }[];
  attachments?: { name: string; url: string }[];
  comments?: { id: number; user: User; text: string; timestamp: string }[];
  createdAt: string;
}

// APIステータスとUIステータスのマッピング
const statusMapping: Record<string, "未着手" | "進行中" | "レビュー中" | "完了"> = {
  'pending': '未着手',
  'in_progress': '進行中',
  'review': 'レビュー中',
  'completed': '完了'
};

// API優先度とUI優先度のマッピング
const priorityMapping: Record<string, "低" | "中" | "高" | "緊急"> = {
  'low': '低',
  'medium': '中',
  'high': '高',
  'urgent': '緊急'
};

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
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(null);
  const [taskViewMode, setTaskViewMode] = useState<"list" | "board">("board");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string | number, boolean>>({});
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [tasks, setTasks] = useState<UITask[]>([]);
  const [taskOperationLoading, setTaskOperationLoading] = useState(false);
  const [updatingSubtasks, setUpdatingSubtasks] = useState<Record<string | number, boolean>>({});
  const { toast } = useToast();

  // サンプルユーザーデータ
  const users: User[] = [
    { id: 1, name: "佐藤太郎", initials: "ST" },
    { id: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
    { id: 3, name: "田中誠", initials: "TM" },
    { id: 4, name: "伊藤美咲", initials: "IM" },
  ];

  // タスク取得用のカスタムフック
  const {
    data: apiTasks,
    loading,
    error,
    hasMore,
    fetchData,
    updateParams,
    resetError
  } = usePaginatedApi<ApiTask>(
    // APIからタスクを取得する関数
    (page, perPage, params) => taskService.getTasks(page, perPage, params),
    // 初期パラメータ
    { 
      status: activeTab !== 'all' ? activeTab : undefined,
      search: searchTerm,
      priority: filterPriority,
      assignee: filterAssignee !== 'all' ? filterAssignee : undefined
    }
  );

  // APIタスクデータをUIタスクに変換
  useEffect(() => {
    if (apiTasks && apiTasks.length > 0) {
      const uiTasks = apiTasks.map(apiTask => convertApiTaskToUITask(apiTask));
      setTasks(uiTasks);
    }
  }, [apiTasks]);

  // 初回ロード時とフィルター条件変更時にデータを取得
  useEffect(() => {
    fetchData(true);
  }, []);

  // フィルター条件の変更を監視
  useEffect(() => {
    updateParams({
      status: activeTab !== 'all' ? activeTab : undefined,
      search: searchTerm,
      priority: filterPriority,
      assignee: filterAssignee !== 'all' ? filterAssignee : undefined
    });
  }, [activeTab, searchTerm, filterPriority, filterAssignee, updateParams]);

  // APIのタスクデータをUI用に変換
  const convertApiTaskToUITask = (apiTask: ApiTask): UITask => {
    // 担当者を見つける（実際のAPIでユーザーIDが返ってくると仮定）
    const assignee = apiTask.assigned_to 
      ? users.find(user => user.id.toString() === apiTask.assigned_to) 
      : undefined;

    // タグを変換（APIではタグが配列または文字列で返ってくる可能性がある）
    let tags: string[] = [];
    
    // APIのタグデータを安全に処理
    try {
      if (apiTask.tag_list) {
        // APIからタグリストが返ってきた場合
        if (Array.isArray(apiTask.tag_list)) {
          tags = apiTask.tag_list;
        } else if (typeof apiTask.tag_list === 'string') {
          tags = (apiTask.tag_list as string).split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      } else if (apiTask.tags) {
        // タグフィールドが直接返ってきた場合
        if (typeof apiTask.tags === 'string') {
          tags = (apiTask.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
        } else if (Array.isArray(apiTask.tags)) {
          tags = apiTask.tags;
        }
      }
    } catch (error) {
      console.error('タグデータの処理中にエラーが発生しました:', error);
      // エラーが発生した場合は空の配列を使用
      tags = [];
    }
      
    // サブタスクの変換
    let subtasks: { id: string | number; title: string; completed: boolean }[] = [];
    
    if (apiTask.subtasks && Array.isArray(apiTask.subtasks)) {
      subtasks = apiTask.subtasks.map(subtask => ({
        id: subtask.id,
        title: subtask.title,
        completed: subtask.status === 'completed'
      }));
    } else {
      // APIにサブタスクが実装されていない場合のフォールバック
      subtasks = [
        { id: 1, title: "業務フローの整理", completed: true },
        { id: 2, title: "マニュアル下書き作成", completed: true },
        { id: 3, title: "レビュー依頼", completed: false },
      ];
    }
    
    // 日付フォーマット
    const dueDate = apiTask.due_date;
      
    return {
      id: apiTask.id, // UUIDはそのまま使用する
      title: apiTask.title,
      description: apiTask.description,
      status: statusMapping[apiTask.status] || '未着手',
      priority: priorityMapping[apiTask.priority] || '中',
      dueDate,
      assignee,
      tags,
      subtasks,
      createdAt: apiTask.created_at,
      // 他のプロパティは必要に応じて追加
    };
  };

  // タスクの展開/折りたたみを切り替える
  const toggleTaskExpanded = (taskId: string | number) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // タスクの進捗率を計算
  const calculateTaskProgress = (task: UITask) => {
    if (task.subtasks.length === 0) return 0;
    const completedCount = task.subtasks.filter((subtask) => subtask.completed).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  };

  // タスク詳細ダイアログを開く
  const openTaskDetails = (taskId: string | number) => {
    try {
      const taskExists = tasks.some(task => task.id === taskId);
      if (!taskExists) {
        showErrorToast("指定されたタスクが見つかりませんでした");
        return;
      }
      setSelectedTaskId(taskId);
      setIsTaskDialogOpen(true);
    } catch (error) {
      console.error("タスク詳細を開く際にエラーが発生しました:", error);
      showErrorToast("タスク詳細を表示できませんでした");
    }
  };

  // タスク詳細ダイアログを閉じる
  const closeTaskDetails = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
  };

  // タスクを削除する
  const deleteTask = async (taskId: string | number) => {
    try {
      setTaskOperationLoading(true);
      const taskIdString = taskId.toString();
      const response = await taskService.deleteTask(taskIdString);
      if (response.success) {
        showSuccessToast("タスクが削除されました");
        setIsTaskDialogOpen(false);
        // タスク一覧を更新
        fetchData(true);
      } else {
        showErrorToast("タスクの削除に失敗しました");
      }
    } catch (error) {
      console.error("タスク削除エラー:", error);
      showErrorToast("タスクの削除中にエラーが発生しました");
    } finally {
      setTaskOperationLoading(false);
    }
  };

  // さらにタスクを読み込む
  const loadMoreTasks = () => {
    fetchData();
  };

  // タスク操作時の成功通知
  const showSuccessToast = (message: string) => {
    toast({
      title: "成功",
      description: message,
      variant: "default",
    });
  };

  // タスク操作時のエラー通知
  const showErrorToast = (message: string) => {
    toast({
      title: "エラー",
      description: message,
      variant: "destructive",
    });
  };

  // サブタスクの完了状態を切り替える関数
  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      // 対象のタスクとサブタスクを特定
      const taskIndex = tasks.findIndex(task => task.id.toString() === taskId);
      if (taskIndex === -1) return;
      
      const task = tasks[taskIndex];
      const subtaskIndex = task.subtasks.findIndex(subtask => subtask.id.toString() === subtaskId);
      if (subtaskIndex === -1) return;
      
      // UIの更新状態を設定
      const updatedTasks = [...tasks];
      const updatedSubtasks = [...updatedTasks[taskIndex].subtasks];
      updatedSubtasks[subtaskIndex] = {
        ...updatedSubtasks[subtaskIndex],
        completed: !updatedSubtasks[subtaskIndex].completed
      };
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        subtasks: updatedSubtasks
      };
      setTasks(updatedTasks);
      
      // 対象のサブタスクのローディング状態を設定
      const updatingSubtask: Record<string, boolean> = {};
      updatingSubtask[subtaskId] = true;
      setUpdatingSubtasks(prev => ({ ...prev, ...updatingSubtask }));
      
      // APIを呼び出してサブタスクの状態を更新
      const response = await taskService.toggleSubtaskStatus(taskId, subtaskId);
      
      if (response.success) {
        showSuccessToast("サブタスクのステータスを更新しました");
        
        // 更新が成功したら、タスク一覧を再取得せずに更新
        if (response.data?.parent_task) {
          const parentTask = convertApiTaskToUITask(response.data.parent_task);
          const updatedTasks = tasks.map(task => 
            task.id.toString() === taskId ? parentTask : task
          );
          setTasks(updatedTasks);
        }
      } else {
        // 失敗した場合は元の状態に戻す
        updatedSubtasks[subtaskIndex] = {
          ...updatedSubtasks[subtaskIndex],
          completed: !updatedSubtasks[subtaskIndex].completed
        };
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          subtasks: updatedSubtasks
        };
        setTasks(updatedTasks);
        
        showErrorToast("サブタスクの更新に失敗しました");
      }
    } catch (error) {
      console.error("サブタスク更新エラー:", error);
      showErrorToast("サブタスクの更新中にエラーが発生しました");
    } finally {
      // ローディング状態を解除
      const updatingSubtask: Record<string, boolean> = {};
      updatingSubtask[subtaskId] = false;
      setUpdatingSubtasks(prev => ({ ...prev, ...updatingSubtask }));
    }
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
                {tasks.filter((t) => t.status === status).length}
              </Badge>
            </div>
            <div className="bg-muted/40 p-2 rounded-b-md flex-1 space-y-2 min-h-[50vh]">
              {tasks
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
        {tasks.map((task) => (
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
                          <Checkbox 
                            checked={subtask.completed} 
                            className="mr-2" 
                            disabled={updatingSubtasks[subtask.id]}
                            onCheckedChange={() => handleToggleSubtask(task.id.toString(), subtask.id.toString())}
                          />
                          <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                            {subtask.title}
                            {updatingSubtasks[subtask.id] && (
                              <Loader2 className="h-3 w-3 inline ml-2 animate-spin" />
                            )}
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
                    <Link to={`/tasks/edit/${task.id}`}>
                      <Edit className="h-4 w-4 mr-2" /> 編集
                    </Link>
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
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">タスク管理</h1>
            <div className="flex items-center space-x-2">
              <Link to="/tasks/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新規タスク
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center justify-between mb-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                      setActiveTab(value);
                    }}
                    className="w-full md:w-auto"
                  >
                    <TabsList className="grid grid-cols-4 md:flex md:space-x-1">
                      <TabsTrigger value="all">すべて</TabsTrigger>
                      <TabsTrigger value="today">今日</TabsTrigger>
                      <TabsTrigger value="upcoming">今後</TabsTrigger>
                      <TabsTrigger value="assigned">担当</TabsTrigger>
                      <TabsTrigger value="completed">完了</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="タスクを検索..."
                        className="pl-8 w-full md:w-[250px]"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                        }}
                      />
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full md:w-auto">
                          <Filter className="h-4 w-4 mr-2" />
                          フィルター
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">優先度</h4>
                            <Select
                              value={filterPriority || ""}
                              onValueChange={(value) => {
                                setFilterPriority(value === "" ? null : value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="すべて" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">すべて</SelectItem>
                                <SelectItem value="低">低</SelectItem>
                                <SelectItem value="中">中</SelectItem>
                                <SelectItem value="高">高</SelectItem>
                                <SelectItem value="緊急">緊急</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium">担当者</h4>
                            <Select
                              value={filterAssignee}
                              onValueChange={(value) => {
                                setFilterAssignee(value);
                              }}
                            >
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
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="flex space-x-1">
                      <Button
                        variant={taskViewMode === "board" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTaskViewMode("board")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={taskViewMode === "list" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setTaskViewMode("list")}
                      >
                        <CalendarDays className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* APIエラー表示 */}
            <ApiError 
              error={error} 
              onRetry={() => {
                resetError();
                fetchData(true);
              }} 
            />

            {/* ローディング中表示 */}
            {loading && tasks.length === 0 && (
              <LoadingIndicator text="タスクを読み込み中..." size="lg" />
            )}

            {/* タスク一覧表示 */}
            {tasks.length > 0 && (
              <>
                {taskViewMode === "board" ? <BoardView /> : <ListView />}
                
                {/* もっと読み込むボタン */}
                {hasMore && (
                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={loadMoreTasks}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          読み込み中...
                        </>
                      ) : (
                        'もっと読み込む'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* タスクが0件の場合 */}
            {!loading && tasks.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-lg">
                <p className="text-muted-foreground mb-4">表示するタスクがありません</p>
                <Button variant="outline" onClick={() => fetchData(true)}>
                  更新する
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* タスク詳細ダイアログ */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-3xl">
            {selectedTaskId && (
              <>
                {tasks.find((t) => t.id === selectedTaskId) ? (
                  <TaskDetails 
                    task={tasks.find((t) => t.id === selectedTaskId)!} 
                    onClose={closeTaskDetails}
                    onDelete={deleteTask}
                    isLoading={taskOperationLoading}
                    calculateTaskProgress={calculateTaskProgress}
                    updatingSubtasks={updatingSubtasks}
                    handleToggleSubtask={handleToggleSubtask}
                  />
                ) : (
                  <div className="p-4 text-center">
                    <p className="mb-4 text-muted-foreground">タスクが見つかりませんでした</p>
                    <Button variant="outline" onClick={closeTaskDetails}>閉じる</Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

// タスク詳細コンポーネント
interface TaskDetailsProps {
  task: UITask;
  onClose: () => void;
  onDelete: (taskId: string | number) => Promise<void>;
  isLoading: boolean;
  calculateTaskProgress: (task: UITask) => number;
  updatingSubtasks?: Record<string | number, boolean>;
  handleToggleSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ 
  task, 
  onClose, 
  onDelete, 
  isLoading, 
  calculateTaskProgress,
  updatingSubtasks = {},
  handleToggleSubtask = async () => {} 
}) => {
  // 削除確認
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 削除処理
  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    await onDelete(task.id);
  };

  // サブタスクのチェック状態切り替え
  const toggleSubtask = (subtaskId: string | number) => {
    if (handleToggleSubtask) {
      handleToggleSubtask(task.id.toString(), subtaskId.toString());
    }
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <Badge className={`${statusColors[task.status]} mr-5`}>
            {task.status}
          </Badge>
        </div>
        <DialogDescription>
          作成日: {new Date(task.createdAt).toISOString().split('T')[0]} {task.dueDate && `/ 期限: ${task.dueDate}`}
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
                    <Checkbox 
                      checked={subtask.completed} 
                      className="mr-2" 
                      disabled={updatingSubtasks[subtask.id]}
                      onCheckedChange={() => toggleSubtask(subtask.id)}
                    />
                    <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                      {subtask.title}
                      {updatingSubtasks[subtask.id] && (
                        <Loader2 className="h-3 w-3 inline ml-2 animate-spin" />
                      )}
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
            <Link to={`/tasks/edit/${task.id}`}>
              <Button variant="outline" className="w-full flex items-center justify-center">
                <Edit className="h-4 w-4 mr-2" /> 編集
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full mt-2 flex items-center justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> {deleteConfirm ? "削除を確定" : "削除"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskManagerView; 
