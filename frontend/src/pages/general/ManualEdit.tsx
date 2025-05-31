import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ManualDepartmentOption, ManualCategoryOption, ManualAccessLevelOption, ManualEditPermissionOption } from '@/types/api';
import manualService, { ManualFormData } from '@/services/manualService';

// 選択肢の定義
const departments: ManualDepartmentOption[] = [
  { value: 'sales', label: '営業部' },
  { value: 'dev', label: '開発部' },
  { value: 'hr', label: '人事部' },
];

const categories: ManualCategoryOption[] = [
  { value: 'procedure', label: '業務手順' },
  { value: 'rules', label: '規則・規定' },
  { value: 'system', label: 'システム操作' },
];

const accessLevels: ManualAccessLevelOption[] = [
  { value: 'all', label: '全社員' },
  { value: 'department', label: '部門内' },
  { value: 'specific', label: '指定メンバーのみ' },
];

const editPermissions: ManualEditPermissionOption[] = [
  { value: 'author', label: '作成者のみ' },
  { value: 'department', label: '部門管理者' },
  { value: 'specific', label: '指定メンバー' },
];

const ManualEditView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);

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

  // マニュアルデータの読み込み
  useEffect(() => {
    if (id) {
      loadManualForEdit(id);
    }
  }, [id]);

  // 編集用マニュアルの読み込み
  const loadManualForEdit = async (manualId: string) => {
    try {
      setLoading(true);
      const response = await manualService.getManual(manualId);
      if (response.success && response.data) {
        const manual = response.data;
        setFormData({
          title: manual.title,
          content: manual.content,
          department: manual.department,
          category: manual.category,
          access_level: manual.access_level,
          edit_permission: manual.edit_permission,
          status: manual.status,
          tags: manual.tags || '',
        });
      }
    } catch (error: any) {
      toast.error(error.message);
      navigate('/manual');
    } finally {
      setLoading(false);
    }
  };

  // フォーム入力処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof ManualFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // マニュアル更新
  const handleSave = async (status: 'draft' | 'published') => {
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

    if (!id) {
      toast.error('マニュアルIDが見つかりません');
      return;
    }

    try {
      const dataToSave = { ...formData, status };
      await manualService.updateManual(id, dataToSave);
      toast.success(status === 'draft' ? '下書きを保存しました' : 'マニュアルを更新しました');
      navigate('/manual');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="p-6 bg-background min-h-screen bg-gray-50">
          <div className="text-center py-8">読み込み中...</div>
        </div>
      </>
    );
  }

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
          <h1 className="text-2xl font-bold text-foreground">マニュアル編集</h1>
          <p className="text-muted-foreground">マニュアルの内容を編集します</p>
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
                  <Label htmlFor="title">タイトル *</Label>
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
                  <Label>部門 *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleSelectChange('department')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>カテゴリー *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange('category')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
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
                      {accessLevels.map(level => (
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
                      {editPermissions.map(perm => (
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
                  更新・公開
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManualEditView; 
