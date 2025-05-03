import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar, Search, Plus, Filter, List, CalendarDays, ChevronUp, ChevronDown, Edit, Trash2, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { taskService } from "@/services";
import { Task as ApiTask } from "@/types/api";
import { usePaginatedApi } from "@/hooks";
import { ApiError } from "@/components/ui/api-error";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useToast } from "@/hooks";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  "低": "bg-blue-100 text-blue-700",
  "中": "bg-yellow-100 text-yellow-700",
  "高": "bg-orange-100 text-orange-700",
  "緊急": "bg-red-100 text-red-700"
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

  // 削除確認用の状態を追加
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // 拡張フィルター機能
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // 保存済みフィルター機能
  const [savedFilters, setSavedFilters] = useState<{
    id: string;
    name: string;
    filters: {
      status?: string;
      priority?: string | null;
      assignee?: string;
      tags?: string[];
      startDate?: Date | null;
      endDate?: Date | null;
      statuses?: string[];
      search?: string;
    };
  }[]>([
    {
      id: '1',
      name: '優先度高のタスク',
      filters: {
        priority: '高',
      }
    },
    {
      id: '2',
      name: '今週期限のタスク',
      filters: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      }
    }
  ]);
  
  // 現在のフィルター名
  const [currentFilterName, setCurrentFilterName] = useState('');
  
  // クイックフィルターが開いているかどうか
  const [quickFilterOpen, setQuickFilterOpen] = useState(false);
  
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
      assignee: filterAssignee !== 'all' ? filterAssignee : undefined,
      tags: filterTags.length > 0 ? filterTags.join(',') : undefined,
      start_date: filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : undefined,
      end_date: filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : undefined,
      statuses: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined
    }
  );

  // APIタスクデータをUIタスクに変換
  useEffect(() => {
    if (apiTasks && apiTasks.length > 0) {
      const uiTasks = apiTasks.map(apiTask => convertApiTaskToUITask(apiTask));
      setTasks(uiTasks);
      
      // 利用可能なタグを収集
      const tagSet = new Set<string>();
      apiTasks.forEach(task => {
        if (task.tags) {
          if (Array.isArray(task.tags)) {
            task.tags.forEach(tag => tagSet.add(tag));
          } else if (typeof task.tags === 'string') {
            task.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => tagSet.add(tag));
          }
        }
        if (task.tag_list) {
          if (Array.isArray(task.tag_list)) {
            task.tag_list.forEach(tag => tagSet.add(tag));
          } else if (typeof task.tag_list === 'string') {
            task.tag_list.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => tagSet.add(tag));
          }
        }
      });
      setAvailableTags(Array.from(tagSet));
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
      assignee: filterAssignee !== 'all' ? filterAssignee : undefined,
      tags: filterTags.length > 0 ? filterTags.join(',') : undefined,
      start_date: filterStartDate ? format(filterStartDate, 'yyyy-MM-dd') : undefined,
      end_date: filterEndDate ? format(filterEndDate, 'yyyy-MM-dd') : undefined,
      statuses: filterStatuses.length > 0 ? filterStatuses.join(',') : undefined
    });
  }, [activeTab, searchTerm, filterPriority, filterAssignee, filterTags, filterStartDate, filterEndDate, filterStatuses, updateParams]);

  // APIタスクをUIタスク形式に変換する
  const convertApiTaskToUITask = (apiTask: ApiTask): UITask => {
    let assignee: User | undefined = undefined;
    let tags: string[] = [];
    
    // 担当者情報がある場合
    if (apiTask.assigned_to && apiTask.assignee_name) {
      assignee = {
        id: parseInt(apiTask.assigned_to),
        name: apiTask.assignee_name,
        initials: apiTask.assignee_name
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
      };
    }
    
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
    
    // getTaskで取得したタスクデータにサブタスクが含まれていることを期待する
    if (apiTask.subtasks && Array.isArray(apiTask.subtasks)) {
      console.log('サブタスクデータ:', apiTask.subtasks);
      subtasks = apiTask.subtasks.map(subtask => ({
        id: subtask.id || Math.random().toString(36).substring(2, 10), // IDがない場合はランダムなIDを生成
        title: subtask.title,
        completed: subtask.status === 'completed' || (subtask as any).completed === true
      }));
    } else {
      console.log('サブタスクデータがありません', apiTask);
    }
    
    // 日付フォーマット
    const dueDate = apiTask.due_date;
      
    const result = {
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
    
    return result;
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
  const openTaskDetails = async (taskId: string | number) => {
    try {
      setTaskOperationLoading(true);
      
      // タスクの最新情報を取得
      const response = await taskService.getTask(taskId.toString());
      
      if (response.success && response.data) {
        // データをUIタスクに変換
        const uiTask = convertApiTaskToUITask(response.data);
        
        // タスク一覧を効率的に更新（スプレッド演算子ではなくmapを使用してパフォーマンス向上）
        setTasks(prevTasks => 
          prevTasks.map(task => task.id === taskId ? uiTask : task)
        );
        
      setSelectedTaskId(taskId);
      setIsTaskDialogOpen(true);
      } else {
        toast({
          title: "エラー",
          description: response.message || "タスクの読み込みに失敗しました",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("タスク詳細の取得中にエラーが発生しました", error);
      toast({
        title: "エラー",
        description: "タスクの読み込み中にエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setTaskOperationLoading(false);
    }
  };

  // タスク詳細ダイアログを閉じる
  const closeTaskDetails = () => {
    setIsTaskDialogOpen(false);
    setSelectedTaskId(null);
  };

  // 削除処理関数を TaskManagerView に移動
  const handleDeleteTask = async () => {
    if (!selectedTaskId) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      setTaskOperationLoading(true); // 削除操作のローディング開始
      const taskIdString = selectedTaskId.toString();
      const response = await taskService.deleteTask(taskIdString);
      if (response.success) {
        showSuccessToast("タスクが削除されました");
        closeTaskDetails(); // ダイアログを閉じる
        setDeleteConfirm(false); // 確認状態をリセット
        fetchData(true); // タスク一覧を再取得
      } else {
        showErrorToast(response.message || "タスクの削除に失敗しました");
        setDeleteConfirm(false); // 確認状態をリセット
      }
    } catch (error) {
      console.error("タスク削除エラー:", error);
      showErrorToast("タスクの削除中にエラーが発生しました");
      setDeleteConfirm(false); // 確認状態をリセット
    } finally {
      setTaskOperationLoading(false); // 削除操作のローディング終了
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
    const originalTasks = [...tasks];
    setUpdatingSubtasks(prev => ({ ...prev, [subtaskId]: true }));

    // UIを先に更新（オプティミスティックアップデート）
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask => 
            subtask.id.toString() === subtaskId.toString() 
              ? { ...subtask, completed: !subtask.completed } 
              : subtask
          );
          return { ...task, subtasks: updatedSubtasks };
        }
        return task;
      })
    );

    try {
      // API呼び出し
      const response = await taskService.toggleSubtaskStatus(taskId, subtaskId);
      
      // API呼び出しのエラーハンドリング
      if (!response.success) {
        showErrorToast(response.message || "サブタスクの更新に失敗しました。");
        // エラー時は元の状態に戻す
        setTasks(originalTasks);
      } else {
        // API成功時の処理（UIは既に更新済みなのでここでは不要だが、念のためレスポンスデータで更新も可能）
        showSuccessToast("サブタスクのステータスを更新しました。");
        // 必要であればレスポンスデータで再更新
        // if (response.data?.parent_task) {
        //   const parentTask = convertApiTaskToUITask(response.data.parent_task);
        //   setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? parentTask : t));
        // }
      }
    } catch (error) {
      console.error("サブタスクの更新エラー:", error);
      showErrorToast("サブタスクの更新中にエラーが発生しました。");
      // エラー時は元の状態に戻す
      setTasks(originalTasks);
    } finally {
      setUpdatingSubtasks(prev => ({ ...prev, [subtaskId]: false }));
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
                          <MarkdownRenderer 
                            content={task.description} 
                            className="text-sm !line-clamp-2 !p-0 !m-0 [&_h1]:!text-sm [&_h2]:!text-sm [&_h3]:!text-sm [&_h4]:!text-sm [&_h5]:!text-sm [&_h6]:!text-sm [&_h1]:!font-normal [&_h2]:!font-normal [&_h3]:!font-normal [&_h4]:!font-normal [&_h5]:!font-normal [&_h6]:!font-normal [&_h1]:!my-0 [&_h2]:!my-0 [&_h3]:!my-0 [&_h4]:!my-0 [&_h5]:!my-0 [&_h6]:!my-0 [&_h1]:!mt-0 [&_h1]:!mb-0 [&_p]:!my-0 [&_ul]:!my-0 [&_ol]:!my-0 [&_blockquote]:!my-0" 
                          />
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
                {task.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">説明</h4>
                    <div className="border-t-2 border-b-2 border-border py-3 my-1">
                      <MarkdownRenderer content={task.description} preserveLineBreaks={true} />
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-2">サブタスク</h3>
                  {task.subtasks.length > 0 ? (
                    <div className="space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center p-2 hover:bg-muted/40 rounded-md">
                          <Checkbox 
                            checked={subtask.completed} 
                            className="mr-3 h-5 w-5" 
                            disabled={updatingSubtasks[subtask.id]}
                            onCheckedChange={() => handleToggleSubtask(task.id.toString(), subtask.id.toString())}
                          />
                          <span className={`text-base ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                            {subtask.title}
                            {updatingSubtasks[subtask.id] && (
                              <Loader2 className="h-3 w-3 inline ml-2 animate-spin" />
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span>{calculateTaskProgress(task)}% 完了</span>
                          <span>
                            {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                          </span>
                        </div>
                        <Progress value={calculateTaskProgress(task)} className="h-2.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic text-base">サブタスクはありません</div>
                  )}
                </div>
                
                {task.tags.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2">タグ</h4>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    );
  };

  // すべてのフィルターをリセットする
  const resetAllFilters = () => {
    setFilterPriority(null);
    setFilterAssignee("all");
    setFilterTags([]);
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterStatuses([]);
  };

  // タグフィルターを追加する
  const addTagFilter = (tag: string) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
    setNewTagInput('');
  };

  // タグフィルターを削除する
  const removeTagFilter = (tag: string) => {
    setFilterTags(filterTags.filter(t => t !== tag));
  };

  // ステータスフィルターの切り替え
  const toggleStatusFilter = (status: string) => {
    if (filterStatuses.includes(status)) {
      setFilterStatuses(filterStatuses.filter(s => s !== status));
    } else {
      setFilterStatuses([...filterStatuses, status]);
    }
  };

  // ステータスのラベルを取得
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': '未着手',
      'in_progress': '進行中',
      'review': 'レビュー中',
      'completed': '完了'
    };
    return statusMap[status] || status;
  };

  // フィルターのチップを表示するコンポーネント
  const FilterChips = () => {
    // 適用されているフィルターがあるかチェック
    const hasActiveFilters = 
      filterPriority !== null || 
      filterAssignee !== "all" || 
      filterTags.length > 0 || 
      filterStartDate !== null || 
      filterEndDate !== null || 
      filterStatuses.length > 0;
    
    if (!hasActiveFilters) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-4 mb-2">
        {filterPriority && (
          <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            優先度: {filterPriority}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => setFilterPriority(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filterAssignee !== "all" && (
          <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            担当者: {users.find(u => u.id.toString() === filterAssignee)?.name || filterAssignee}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => setFilterAssignee("all")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filterTags.map(tag => (
          <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            タグ: {tag}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => removeTagFilter(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {filterStartDate && (
          <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            開始日: {format(filterStartDate, 'yyyy/MM/dd')}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => setFilterStartDate(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filterEndDate && (
          <Badge variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            終了日: {format(filterEndDate, 'yyyy/MM/dd')}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => setFilterEndDate(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}
        
        {filterStatuses.map(status => (
          <Badge key={status} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
            ステータス: {getStatusLabel(status)}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-4 w-4 p-0 hover:bg-transparent" 
              onClick={() => toggleStatusFilter(status)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
        
        {hasActiveFilters && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resetAllFilters}>
            フィルターをクリア
          </Button>
        )}
      </div>
    );
  };

  // フィルターを保存する
  const saveCurrentFilter = () => {
    if (!currentFilterName.trim()) {
      toast({
        title: "エラー",
        description: "フィルター名を入力してください",
        variant: "destructive",
      });
      return;
    }
    
    const newFilter = {
      id: Date.now().toString(),
      name: currentFilterName,
      filters: {
        status: activeTab !== 'all' ? activeTab : undefined,
        priority: filterPriority,
        assignee: filterAssignee !== 'all' ? filterAssignee : undefined,
        tags: filterTags,
        startDate: filterStartDate,
        endDate: filterEndDate,
        statuses: filterStatuses,
        search: searchTerm
      }
    };
    
    setSavedFilters([...savedFilters, newFilter]);
    setCurrentFilterName('');
    toast({
      title: "成功",
      description: "フィルター設定を保存しました",
    });
  };
  
  // 保存済みフィルターを適用する
  const applySavedFilter = (filter: typeof savedFilters[0]) => {
    const { filters } = filter;
    
    // 各フィルター設定を適用
    setActiveTab(filters.status || 'all');
    setFilterPriority(filters.priority || null);
    setFilterAssignee(filters.assignee || 'all');
    setFilterTags(filters.tags || []);
    setFilterStartDate(filters.startDate || null);
    setFilterEndDate(filters.endDate || null);
    setFilterStatuses(filters.statuses || []);
    setSearchTerm(filters.search || '');
    
    // フィルターダイアログを閉じる
    setFilterDialogOpen(false);
    setQuickFilterOpen(false);
    
    toast({
      title: "フィルター適用",
      description: `${filter.name}のフィルター設定を適用しました`,
    });
  };
  
  // 保存済みフィルターを削除
  const deleteSavedFilter = (id: string) => {
    setSavedFilters(savedFilters.filter(filter => filter.id !== id));
    toast({
      title: "削除完了",
      description: "保存済みフィルターを削除しました",
    });
  };
  
  // クイックアクション用の関数
  const quickFilterActions = [
    {
      label: "今日期限",
      icon: <Calendar className="h-4 w-4 mr-2" />,
      action: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFilterStartDate(today);
        setFilterEndDate(tomorrow);
        setQuickFilterOpen(false);
      }
    },
    {
      label: "自分のタスク",
      icon: <Avatar className="h-4 w-4 mr-2"><AvatarFallback>私</AvatarFallback></Avatar>,
      action: () => {
        // ユーザーID 1を自分として仮定
        setFilterAssignee("1");
        setQuickFilterOpen(false);
      }
    },
    {
      label: "優先度:高",
      icon: <Badge className="bg-orange-100 text-orange-700 mr-2">高</Badge>,
      action: () => {
        setFilterPriority("高");
        setQuickFilterOpen(false);
      }
    },
    {
      label: "未完了タスク",
      icon: <Checkbox className="mr-2" />,
      action: () => {
        setFilterStatuses(['pending', 'in_progress', 'review']);
        setQuickFilterOpen(false);
      }
    }
  ];

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
                    <TabsList className="grid grid-cols-5 md:flex md:space-x-1">
                      <TabsTrigger value="all">すべて</TabsTrigger>
                      <TabsTrigger value="today">今日</TabsTrigger>
                      <TabsTrigger value="upcoming">今後</TabsTrigger>
                      <TabsTrigger value="assigned">担当</TabsTrigger>
                      <TabsTrigger value="completed">完了</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:items-center md:space-x-2">
                    <div className="relative w-full md:w-auto">
                      <div className="flex items-center border rounded-md overflow-hidden">
                        <div className="pl-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                          placeholder="タスクを検索..."
                          className="border-0 w-full md:w-[250px]"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              // Enterキーでフォーカスを外す
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0 mr-1"
                            onClick={() => setSearchTerm('')}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Popover open={quickFilterOpen} onOpenChange={setQuickFilterOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 px-3"
                          >
                            <Filter className="h-4 w-4 mr-2" />
                            クイックフィルター
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="end">
                          <div className="space-y-4">
                            <h4 className="font-medium">クイックフィルター</h4>
                            <div className="space-y-2">
                              {quickFilterActions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="ghost"
                                  className="w-full justify-start text-left"
                                  onClick={action.action}
                                >
                                  {action.icon} {action.label}
                                </Button>
                              ))}
                            </div>
                            
                            <Separator />
                            
                            <h4 className="font-medium">保存済みフィルター</h4>
                            {savedFilters.length > 0 ? (
                              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                                {savedFilters.map(filter => (
                                  <div 
                                    key={filter.id} 
                                    className="flex items-center justify-between rounded-md p-2 hover:bg-accent"
                                  >
                                    <Button 
                                      variant="ghost" 
                                      className="h-8 text-left justify-start p-2 flex-grow"
                                      onClick={() => applySavedFilter(filter)}
                                    >
                                      {filter.name}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7" 
                                      onClick={() => deleteSavedFilter(filter.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">保存済みのフィルターはありません</p>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button
                        variant="outline"
                        className="h-9"
                        onClick={() => setFilterDialogOpen(true)}
                      >
                          <Filter className="h-4 w-4 mr-2" />
                          詳細フィルター
                      </Button>

                      <div className="flex space-x-1">
                        <Button
                          variant={taskViewMode === "board" ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setTaskViewMode("board")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={taskViewMode === "list" ? "default" : "outline"}
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setTaskViewMode("list")}
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* フィルターチップ表示 */}
                <FilterChips />
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

        {/* 詳細フィルターダイアログを修正 */}
        <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>詳細フィルター</DialogTitle>
              <DialogDescription>
                条件を指定してタスクをフィルタリングします
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid gap-5 py-4">
                {/* ステータスフィルター（複数選択） */}
                <div className="space-y-2">
                  <h4 className="font-medium">ステータス</h4>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'in_progress', 'review', 'completed'].map(status => (
                      <Badge 
                        key={status}
                        variant={filterStatuses.includes(status) ? "default" : "outline"} 
                        className="cursor-pointer px-3 py-1.5"
                        onClick={() => toggleStatusFilter(status)}
                      >
                        {getStatusLabel(status)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* 優先度フィルター - ラジオボタンに変更 */}
                <div className="space-y-2">
                  <h4 className="font-medium">優先度</h4>
                  <div className="flex flex-wrap gap-2">
                    {['低', '中', '高', '緊急'].map(priority => (
                      <Badge 
                        key={priority}
                        variant={filterPriority === priority ? "default" : "outline"} 
                        className={`cursor-pointer px-3 py-1.5 ${filterPriority === priority ? '' : 'opacity-70'}`}
                        onClick={() => setFilterPriority(filterPriority === priority ? null : priority)}
                      >
                        {priority}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* 担当者フィルター - アバターを表示 */}
                <div className="space-y-2">
                  <h4 className="font-medium">担当者</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={filterAssignee === "all" ? "default" : "outline"} 
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => setFilterAssignee("all")}
                    >
                      すべて
                    </Badge>
                    
                    {users.map((user) => (
                      <Badge 
                        key={user.id}
                        variant={filterAssignee === user.id.toString() ? "default" : "outline"} 
                        className="cursor-pointer pl-1 pr-3 py-1 flex items-center gap-1"
                        onClick={() => setFilterAssignee(filterAssignee === user.id.toString() ? "all" : user.id.toString())}
                      >
                        <Avatar className="h-5 w-5">
                          {user.avatar ? <AvatarImage src={user.avatar} /> : null}
                          <AvatarFallback className="text-[10px]">{user.initials}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* タグフィルター - 使いやすいUI */}
                <div className="space-y-2">
                  <h4 className="font-medium">タグ</h4>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input 
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="タグを入力..."
                        className="pr-20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            e.preventDefault();
                            addTagFilter(newTagInput.trim());
                          }
                        }}
                      />
                      <Button 
                        variant="ghost"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => {
                          if (newTagInput.trim()) {
                            addTagFilter(newTagInput.trim());
                          }
                        }}
                      >
                        追加
                      </Button>
                    </div>
                  </div>
                  
                  {/* 選択可能なタグリスト */}
                  {availableTags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">利用可能なタグ：</p>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 rounded-md border border-border">
                        {availableTags
                          .sort((a, b) => a.localeCompare(b, 'ja'))
                          .map(tag => (
                          <Badge 
                            key={tag}
                            variant={filterTags.includes(tag) ? "default" : "secondary"} 
                            className="cursor-pointer text-xs"
                            onClick={() => {
                              if (filterTags.includes(tag)) {
                                removeTagFilter(tag);
                              } else {
                                addTagFilter(tag);
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 選択済みタグの表示 */}
                  {filterTags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">選択中のタグ：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {filterTags.map(tag => (
                          <Badge key={tag} className="pl-2 pr-1 py-1 flex items-center gap-1">
                            {tag}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 p-0 hover:bg-transparent" 
                              onClick={() => removeTagFilter(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 日付範囲フィルター - カレンダー表示を改善 */}
                <div className="space-y-2">
                  <h4 className="font-medium">期間</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">開始日</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {filterStartDate ? (
                              format(filterStartDate, 'yyyy/MM/dd')
                            ) : (
                              <span className="text-muted-foreground">日付を選択</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={filterStartDate ?? undefined}
                            onSelect={(date) => setFilterStartDate(date || null)}
                            locale={ja}
                            required={false}
                          />
                          {filterStartDate && (
                            <div className="p-3 border-t border-border">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setFilterStartDate(null)}
                              >
                                開始日をクリア
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">終了日</p>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {filterEndDate ? (
                              format(filterEndDate, 'yyyy/MM/dd')
                            ) : (
                              <span className="text-muted-foreground">日付を選択</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={filterEndDate ?? undefined}
                            onSelect={(date) => setFilterEndDate(date || null)}
                            locale={ja}
                            disabled={(date) => filterStartDate ? date < filterStartDate : false}
                            required={false}
                          />
                          {filterEndDate && (
                            <div className="p-3 border-t border-border">
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                className="w-full"
                                onClick={() => setFilterEndDate(null)}
                              >
                                終了日をクリア
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                
                {/* フィルター保存機能 */}
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">フィルター設定を保存</h4>
                  <div className="flex space-x-2">
                    <Input
                      value={currentFilterName}
                      onChange={(e) => setCurrentFilterName(e.target.value)}
                      placeholder="フィルター名を入力..."
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={saveCurrentFilter}
                      disabled={!currentFilterName.trim()}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="flex justify-between mt-4 pt-4 border-t">
              <Button variant="destructive" onClick={resetAllFilters}>
                リセット
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={() => setFilterDialogOpen(false)}>
                  適用
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* タスク詳細ダイアログ */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="flex flex-row justify-between items-start pr-6 pb-4">
              {/* 左側のタイトルと説明 */}
              <div>
                <DialogTitle className="text-[1.8rem]">{tasks.find((t) => t.id === selectedTaskId)?.title || 'タスク詳細'}</DialogTitle>
                <DialogDescription>
                  {tasks.find((t) => t.id === selectedTaskId)?.createdAt && (
                     `作成日： ${new Date(tasks.find((t) => t.id === selectedTaskId)!.createdAt).toLocaleDateString('ja-JP', {year: 'numeric', month: '2-digit', day: '2-digit'})}`
                  )}
                </DialogDescription>
              </div>
              {/* 右側のボタン */}
              {selectedTaskId && tasks.find((t) => t.id === selectedTaskId) && (
                <div className="flex space-x-2 flex-shrink-0 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-3 text-xs"
                    asChild
                  >
                    <Link to={`/tasks/edit/${selectedTaskId}`}>
                      <Edit className="h-4 w-4 mr-1" /> 編集
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDeleteTask}
                    disabled={taskOperationLoading}
                  >
                    {taskOperationLoading && deleteConfirm ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    {deleteConfirm ? "確定" : "削除"}
                  </Button>
                </div>
              )}
            </DialogHeader>
            {selectedTaskId && (
              <>
                {tasks.find((t) => t.id === selectedTaskId) ? (
                  <TaskDetails 
                    task={tasks.find((t) => t.id === selectedTaskId)!} 
                    onClose={closeTaskDetails}
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
  calculateTaskProgress: (task: UITask) => number;
  updatingSubtasks?: Record<string | number, boolean>;
  handleToggleSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ 
  task, 
  calculateTaskProgress,
  updatingSubtasks = {},
  handleToggleSubtask = async () => {} 
}) => {
  // サブタスクのチェック状態切り替え
  const toggleSubtask = (subtaskId: string | number) => {
    if (handleToggleSubtask) {
      handleToggleSubtask(task.id.toString(), subtaskId.toString());
    }
  };

  return (
    <div className="p-4 max-h-[calc(90vh-2rem)] overflow-y-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">説明</h3>
        <div className="border-t-2 border-b-2 border-border py-4 my-2">
          {task.description ? (
            <MarkdownRenderer content={task.description} preserveLineBreaks={true} />
          ) : (
            <div className="text-base text-muted-foreground italic">説明なし</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium mb-2">サブタスク</h3>
          {task.subtasks && task.subtasks.length > 0 ? (
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center p-2 hover:bg-muted/40 rounded-md">
                  <Checkbox 
                    checked={subtask.completed} 
                    className="mr-3 h-5 w-5" 
                    disabled={updatingSubtasks[subtask.id]}
                    onCheckedChange={() => toggleSubtask(subtask.id)}
                  />
                  <span className={`text-base ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                    {subtask.title}
                    {updatingSubtasks[subtask.id] && (
                      <Loader2 className="h-3 w-3 inline ml-2 animate-spin" />
                    )}
                  </span>
                </div>
              ))}
              <div className="mt-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span>{calculateTaskProgress(task)}% 完了</span>
                  <span>
                    {task.subtasks.filter((st) => st.completed).length}/{task.subtasks.length}
                  </span>
                </div>
                <Progress value={calculateTaskProgress(task)} className="h-2.5" />
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-base">サブタスクはありません</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">優先度</h3>
              <Badge className={`${priorityColors[task.priority]} text-sm px-2 py-0.5`}>
                {task.priority}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">ステータス</h3>
              <Badge variant="outline" className="text-sm px-2 py-0.5">
                {task.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">担当者</h3>
              {task.assignee ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    {task.assignee.avatar ? (
                      <AvatarImage
                        src={task.assignee.avatar}
                        alt={task.assignee.name}
                      />
                    ) : null}
                    <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-base">{task.assignee.name}</span>
                </div>
              ) : (
                <div className="text-muted-foreground italic text-base">未着手</div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">期限日</h3>
              {task.dueDate ? (
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {task.dueDate}
                </div>
              ) : (
                <div className="text-muted-foreground italic text-base">期限日は未設定です</div>
              )}
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">タグ</h3>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagerView; 
