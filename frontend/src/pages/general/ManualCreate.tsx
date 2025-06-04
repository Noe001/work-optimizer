import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Tags, Users, Save, Send } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import manualService, { ManualFormData } from '@/services/manualService';
import { DEPARTMENTS, CATEGORIES, ACCESS_LEVELS, EDIT_PERMISSIONS } from '@/constants/manual';

const ManualCreateView: React.FC = () => {
  const navigate = useNavigate();

  // フォームデータ
  const [formData, setFormData] = useState<ManualFormData>({
    title: '',
    content: '',
    department: '',
    category: '',
    access_level: 'all',
    edit_permission: 'author',
    status: 'draft',
    tags: '',
  });

  // フォーム入力処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof ManualFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // マニュアル保存
  const handleSave = async (status: 'draft' | 'published') => {
    console.log('=== マニュアル保存開始 ===');
    console.log('フォームデータ:', formData);
    console.log('ステータス:', status);

    if (!formData.title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    if (!formData.department) {
      toast.error('部門を選択してください');
      return;
    }

    if (!formData.category) {
      toast.error('カテゴリーを選択してください');
      return;
    }

    try {
      const dataToSave = { ...formData, status };
      console.log('送信データ:', dataToSave);
      
      const result = await manualService.createManual(dataToSave);
      console.log('API結果:', result);
      
      toast.success(status === 'draft' ? '下書きを保存しました' : 'マニュアルを作成しました');
      navigate('/manual');
    } catch (error: any) {
      console.error('=== マニュアル保存エラー ===');
      console.error('エラー詳細:', error);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
      toast.error(error.message || 'マニュアルの作成に失敗しました');
    }
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/manual')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            マニュアル一覧に戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground">新規マニュアル作成</h1>
          <p className="text-muted-foreground">新しい業務マニュアルを作成します</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインエディター */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  マニュアル内容
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">
                    タイトル <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="マニュアルのタイトルを入力"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="content">内容</Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="マニュアルの内容を入力してください"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="min-h-[400px]"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">タグ</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="タグをカンマ区切りで入力（例: 手順,重要,新人向け）"
                    value={formData.tags}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 設定サイドバー */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tags className="h-5 w-5 mr-2" />
                  カテゴリー設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>
                    部門 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleSelectChange('department')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    カテゴリー <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange('category')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  アクセス権限
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>閲覧権限</Label>
                  <Select
                    value={formData.access_level}
                    onValueChange={handleSelectChange('access_level')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>編集権限</Label>
                  <Select
                    value={formData.edit_permission}
                    onValueChange={handleSelectChange('edit_permission')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EDIT_PERMISSIONS.map(perm => (
                        <SelectItem key={perm.value} value={perm.value}>
                          {perm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* アクションボタン */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={() => handleSave('draft')}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  下書き保存
                </Button>
                <Button
                  onClick={() => handleSave('published')}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  公開
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManualCreateView; 
