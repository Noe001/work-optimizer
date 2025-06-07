import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Tag, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Eye } from "lucide-react";
import { taskService } from "@/services";
import { useToast } from "@/hooks";
import { renderMarkdown } from '@/utils/markdown';

// APIステータスとUIステータスのマッピング
const statusToApiMapping: Record<string, string> = {
  '未着手': 'pending',
  '進行中': 'in_progress',
  'レビュー中': 'review',
  '完了': 'completed'
};

// UIステータスとAPIステータスのマッピング
const apiToStatusMapping: Record<string, string> = {
  'pending': '未着手',
  'in_progress': '進行中',
  'review': 'レビュー中',
  'completed': '完了'
};

// API優先度とUI優先度のマッピング
const priorityToApiMapping: Record<string, string> = {
  '低': 'low',
  '中': 'medium',
  '高': 'high',
  '緊急': 'urgent'
};

// UI優先度とAPI優先度のマッピング
const apiToPriorityMapping: Record<string, string> = {
  'low': '低',
  'medium': '中',
  'high': '高',
  'urgent': '緊急'
};

// インターフェース定義
interface User {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

interface SubTask {
  id: number | string;
  title: string;
  completed: boolean;
  _destroy?: boolean;
}

// フォームデータの型定義
interface FormState {
  title: string;
  description: string;
  status: "未着手" | "進行中" | "レビュー中" | "完了";
  priority: "低" | "中" | "高" | "緊急";
  dueDate?: Date;
  assigneeId: string | null;
  tags: string[];
  subtasks: {
    id: string | number;
    title: string;
    completed: boolean;
    _destroy?: boolean;
  }[];
}

const CreateTaskView: React.FC = () => {
  const { taskId: pathParamTaskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const queryParamTaskId = searchParams.get('id');
  const taskId = pathParamTaskId || queryParamTaskId;
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // サンプルユーザーデータ（後でAPIから取得する）
  const users: User[] = [
    { id: "1", name: "佐藤太郎", initials: "ST" },
    { id: "2", name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
    { id: "3", name: "田中誠", initials: "TM" },
    { id: "4", name: "伊藤美咲", initials: "IM" },
  ];
  
  // フォームの初期状態
  const [formData, setFormData] = useState<FormState>({
    title: "",
    description: "",
    status: "未着手",
    priority: "中",
    dueDate: undefined,
    assigneeId: null,
    tags: [],
    subtasks: [],
  });

  // 編集モードの場合、既存のタスクデータを取得
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) {
        setIsEditMode(false);
        return;
      }

      setIsEditMode(true);
      setInitialLoading(true);

      try {
        // タスクIDが数値に変換できることを確認 (APIは数値IDを期待している場合)
        const actualTaskId = taskId.toString();
        
        const response = await taskService.getTask(actualTaskId);
        
        if (response.success && response.data) {
          const task = response.data;
          console.log("取得したタスク:", task);
          
          // タグデータの処理
          let tags: string[] = [];
          
          // 1. まずtag_listを確認
          if (task.tag_list) {
            if (Array.isArray(task.tag_list)) {
              tags = task.tag_list;
            } else if (typeof task.tag_list === 'string') {
              // カンマ区切りの文字列の場合は分割
              tags = task.tag_list.split(',').map(tag => tag.trim()).filter(Boolean);
            }
          } 
          // 2. tag_listがなければtagsを確認
          else if (task.tags) {
            if (Array.isArray(task.tags)) {
              tags = task.tags;
            } else if (typeof task.tags === 'string') {
              // カンマ区切りの文字列の場合は分割
              tags = task.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            }
          }
          
          console.log("処理後のタグ:", tags);
          
          // APIデータからフォームデータへの変換
          setFormData({
            title: task.title,
            description: task.description || "",
            status: apiToStatusMapping[task.status] as "未着手" | "進行中" | "レビュー中" | "完了" || "未着手",
            priority: apiToPriorityMapping[task.priority] as "低" | "中" | "高" | "緊急" || "中",
            dueDate: task.due_date ? parseISO(task.due_date) : undefined,
            assigneeId: task.assigned_to || null,
            tags: tags,
            subtasks: task.subtasks 
              ? task.subtasks.map(subtask => ({ 
                  id: subtask.id, // IDをそのまま使用
                  title: subtask.title,
                  completed: subtask.status === 'completed'
                }))
              : [],
          });
        } else {
          toast({
            title: "エラー",
            description: "タスクデータの取得に失敗しました",
            variant: "destructive"
          });
          navigate('/tasks');
        }
      } catch (error) {
        console.error("タスク取得エラー:", error);
        toast({
          title: "エラー",
          description: "タスクデータの取得中にエラーが発生しました",
          variant: "destructive"
        });
        navigate('/tasks');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchTaskData();
  }, [taskId, navigate, toast]);
  
  // タグを追加
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput("");
    }
  };
  
  // タグを削除
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  // サブタスクを追加
  const addSubtask = () => {
    if (subtaskInput.trim()) {
      const newSubtask: SubTask = {
        id: `temp_${Date.now()}`, // 一時的なIDに'temp_'プレフィックスを追加
        title: subtaskInput.trim(),
        completed: false
      };
      setFormData({
        ...formData,
        subtasks: [...formData.subtasks, newSubtask]
      });
      setSubtaskInput("");
    }
  };
  
  // サブタスクを削除（編集モード用）
  const markSubtaskForRemoval = (id: number | string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask => 
        subtask.id === id ? { ...subtask, _destroy: true } : subtask
      )
    }));
  };
  
  // サブタスクを削除（新規作成モード用 - UIから完全に消す）
  const removeSubtask = (id: number | string) => {
    setFormData(prev => ({
      ...prev,
      // 削除対象外のサブタスクのみ残す（_destroyフラグが付いているものも除く）
      subtasks: prev.subtasks.filter(subtask => subtask.id !== id && !subtask._destroy)
    }));
  };
  
  // サブタスクの完了状態を切り替え
  const toggleSubtaskCompletion = (id: number | string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(subtask => 
        subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
      )
    });
  };
  
  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // バリデーション（例：タイトルが空でないか）
    if (!formData.title.trim()) {
      toast({
        title: "入力エラー",
        description: "タスクタイトルを入力してください。",
        variant: "destructive"
      });
      return;
    }

    // API送信用のデータ形式に変換
    const formDataToSubmit = {
      title: formData.title,
      description: formData.description,
      status: statusToApiMapping[formData.status] as 'pending' | 'in_progress' | 'review' | 'completed',
      priority: priorityToApiMapping[formData.priority] as 'low' | 'medium' | 'high' | 'urgent',
      due_date: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : undefined,
      assigned_to: formData.assigneeId,
      tags: formData.tags.join(','), // tagsを文字列に変換
    };

    const payload = {
      task: {
        ...formDataToSubmit,
        // サブタスクの送信形式を調整
        subtasks_attributes: formData.subtasks.map(subtask => {
          const subtaskPayload: any = {
            title: subtask.title,
            // completed を status に変換
            status: subtask.completed ? 'completed' : 'pending',
            _destroy: subtask._destroy // 削除フラグ
          };
          // 既存のサブタスク（数値IDまたはUUID）の場合のみIDを含める
          // 一時的なID（temp_...）は含めない
          if (typeof subtask.id === 'number' || (typeof subtask.id === 'string' && !subtask.id.startsWith('temp_'))) {
            subtaskPayload.id = subtask.id;
          }
          return subtaskPayload;
        }).filter(subtask => !subtask._destroy || subtask.id) // _destroyがtrueでもIDがあれば送信（削除のため）, IDがなければ送信しない（新規追加をキャンセルした場合など）
      }
    };

    // TaskData型に合わせる (taskServiceが期待する形式)
    const taskDataPayload = payload.task;

    // デバッグログ
    console.log("送信ペイロード (TaskData):", JSON.stringify(taskDataPayload, null, 2));

    setLoading(true);
    setError(null);
    
    try {
      let response;
      if (isEditMode && taskId) {
        // 編集モード
        response = await taskService.updateTask(taskId.toString(), taskDataPayload);
      } else {
        // 新規作成モード
        response = await taskService.createTask(taskDataPayload);
      }
      
      if (response.success) {
        toast({
          title: isEditMode ? "成功" : "成功",
          description: isEditMode ? "タスクが更新されました" : "タスクが作成されました",
        });
        navigate('/tasks');
      } else {
        const errorMessage = response.message || (response.errors ? response.errors.join(', ') : "不明なエラー");
        setError(errorMessage);
        toast({
          title: "エラー",
          description: `タスクの送信に失敗しました: ${errorMessage}`,
          variant: "destructive"
        });
        console.error("タスク送信エラー:", response);
      }
    } catch (error: any) {
      console.error("タスク送信エラー:", error);
      const message = error.response?.data?.message || error.response?.data?.errors?.join(', ') || error.message || "予期せぬエラーが発生しました";
      setError(message);
      toast({
        title: "エラー",
        description: `タスクの送信に失敗しました: ${message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">タスクデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">{isEditMode ? "タスク編集" : "新規タスク作成"}</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* タスク情報 */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>タスク情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル<span className="text-red-500">*</span></Label>
                    <Input 
                      id="title" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="タスクのタイトルを入力"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">説明（Markdown対応）</Label>
                    <Tabs defaultValue="edit" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          編集
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          プレビュー
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="edit" className="mt-4">
                        <Textarea 
                          id="description" 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="タスクの詳細をMarkdown形式で入力してください&#10;&#10;例:&#10;## 作業手順&#10;1. 資料の確認&#10;2. データの収集&#10;3. 分析と報告&#10;&#10;**注意点**&#10;- 期限を守る&#10;- 品質を重視する"
                          rows={10}
                          className="font-mono"
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          MarkdownでHTMLを記述できます。見出し、リスト、強調などがサポートされています。
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="preview" className="mt-4">
                        <div className="border rounded-md p-4 min-h-[240px] bg-white">
                          {formData.description ? (
                            <div 
                              className="prose max-w-none prose-sm [&_h1]:text-[1.75rem] [&_h2]:text-2xl [&_h3]:text-xl [&_h4]:text-base [&_p]:my-0.5 [&_h1]:mb-1 [&_h2]:mb-1 [&_h2]:mt-0.5 [&_h3]:mb-0.5 [&_h4]:mb-0.5 [&_h5]:mb-0.5 [&_h6]:mb-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0 [&_blockquote]:my-1 [&_h1]:border-b [&_h1]:border-gray-300 [&_h1]:pb-1"
                              dangerouslySetInnerHTML={{ 
                                __html: renderMarkdown(formData.description) 
                              }}
                            />
                          ) : (
                            <div className="text-muted-foreground italic">
                              説明を入力するとここにプレビューが表示されます
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">ステータス</Label>
                      <Select 
                        value={formData.status}
                        onValueChange={(value) => setFormData({...formData, status: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ステータスを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="未着手">未着手</SelectItem>
                          <SelectItem value="進行中">進行中</SelectItem>
                          <SelectItem value="レビュー中">レビュー中</SelectItem>
                          <SelectItem value="完了">完了</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="priority">優先度</Label>
                      <Select 
                        value={formData.priority}
                        onValueChange={(value) => setFormData({...formData, priority: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="優先度を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="低">低</SelectItem>
                          <SelectItem value="中">中</SelectItem>
                          <SelectItem value="高">高</SelectItem>
                          <SelectItem value="緊急">緊急</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* 詳細設定とボタン */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>詳細設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>期限日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? (
                            format(formData.dueDate, 'yyyy-MM-dd')
                          ) : (
                            <span>期限日を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => setFormData({...formData, dueDate: date || undefined})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>担当者</Label>
                    <Select
                      value={formData.assigneeId || "unassigned"}
                      onValueChange={(value) => setFormData({...formData, assigneeId: value === "unassigned" ? null : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="担当者を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">未割り当て</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                                <AvatarFallback>{user.initials}</AvatarFallback>
                              </Avatar>
                              {user.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>タグ</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="タグを入力"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="pl-2">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 p-1 rounded-full hover:bg-gray-200"
                              title={`${tag}タグを削除`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>サブタスク</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        placeholder="サブタスクを入力"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSubtask();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSubtask} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.subtasks.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {formData.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`subtask-${subtask.id}`}
                                checked={subtask.completed}
                                onCheckedChange={() => toggleSubtaskCompletion(subtask.id)}
                              />
                              <Label
                                htmlFor={`subtask-${subtask.id}`}
                                className={subtask.completed ? "line-through text-gray-500" : ""}
                              >
                                {subtask.title}
                              </Label>
                            </div>
                            <button
                              type="button"
                              onClick={() => isEditMode ? markSubtaskForRemoval(subtask.id) : removeSubtask(subtask.id)}
                              className="text-gray-500 hover:text-gray-700"
                              title="サブタスクを削除"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* ボタンエリア */}
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isEditMode ? "更新中..." : "保存中..."}
                      </>
                    ) : (
                      isEditMode ? "タスクを更新" : "タスクを作成"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/tasks")}
                  >
                    キャンセル
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskView; 
