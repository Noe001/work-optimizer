import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Tag, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// インターフェース定義
interface User {
  id: number;
  name: string;
  avatar?: string;
  initials: string;
}

interface SubTask {
  id: number;
  title: string;
  completed: boolean;
}

interface TaskFormData {
  title: string;
  description: string;
  status: "未着手" | "進行中" | "レビュー中" | "完了";
  priority: "低" | "中" | "高" | "緊急";
  dueDate: Date | undefined;
  assigneeId: number | null;
  tags: string[];
  subtasks: SubTask[];
}

const CreateTaskView: React.FC = () => {
  const navigate = useNavigate();
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  
  // サンプルユーザーデータ
  const users: User[] = [
    { id: 1, name: "佐藤太郎", initials: "ST" },
    { id: 2, name: "鈴木花子", avatar: "/avatars/hanako.jpg", initials: "SH" },
    { id: 3, name: "田中誠", initials: "TM" },
    { id: 4, name: "伊藤美咲", initials: "IM" },
  ];
  
  // フォームの初期状態
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "未着手",
    priority: "中",
    dueDate: undefined,
    assigneeId: null,
    tags: [],
    subtasks: [],
  });
  
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
        id: Date.now(), // 一時的なIDとして現在のタイムスタンプを使用
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
  
  // サブタスクを削除
  const removeSubtask = (id: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.filter(subtask => subtask.id !== id)
    });
  };
  
  // サブタスクの完了状態を切り替え
  const toggleSubtaskCompletion = (id: number) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks.map(subtask => 
        subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
      )
    });
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("タスク作成:", formData);
    // 実際の実装では、ここでAPIを呼び出してタスクを保存します
    // 保存成功後にタスク一覧ページに戻る
    navigate("/tasks");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">新規タスク作成</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* メインコンテンツ */}
            <div className="md:col-span-2 space-y-6">
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
                    <Label htmlFor="description">説明</Label>
                    <Textarea 
                      id="description" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="タスクの詳細を入力"
                      rows={5}
                    />
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
                  
                  <div className="space-y-2">
                    <Label>サブタスク</Label>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="サブタスクを入力"
                        value={subtaskInput}
                        onChange={(e) => setSubtaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSubtask();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSubtask} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.subtasks.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {formData.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={subtask.completed}
                              onCheckedChange={() => toggleSubtaskCompletion(subtask.id)}
                              id={`subtask-${subtask.id}`}
                            />
                            <Label 
                              htmlFor={`subtask-${subtask.id}`}
                              className={`flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}
                            >
                              {subtask.title}
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubtask(subtask.id)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* サイドバー */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>詳細設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">期限日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? (
                            format(formData.dueDate, 'yyyy年MM月dd日', { locale: ja })
                          ) : (
                            <span>期限日を選択</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.dueDate}
                          onSelect={(date) => setFormData({...formData, dueDate: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assignee">担当者</Label>
                    <Select 
                      value={formData.assigneeId?.toString() || "none"}
                      onValueChange={(value) => setFormData({...formData, assigneeId: value === "none" ? null : parseInt(value)})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="担当者を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">担当者なし</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                {user.avatar ? (
                                  <AvatarImage src={user.avatar} alt={user.name} />
                                ) : null}
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
                    <Label htmlFor="tags">タグ</Label>
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="タグを入力"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} size="icon">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                            <span>{tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTag(tag)}
                              className="h-4 w-4 p-0 ml-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex space-x-2">
                <Button type="submit" className="flex-1">タスクを作成</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/tasks")}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskView; 
