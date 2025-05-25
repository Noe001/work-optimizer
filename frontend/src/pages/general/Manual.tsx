import React from 'react';
import { ArrowLeft, BookOpen, FileText, Users, Tags, Plus, Image, Link, List } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Type definitions
type Department = 'sales' | 'dev' | 'hr';
type Category = 'procedure' | 'rules' | 'system';
type AccessLevel = 'all' | 'department' | 'specific';
type EditPermission = 'author' | 'department' | 'specific';

interface SelectOption {
  value: string;
  label: string;
}

const departments: SelectOption[] = [
  { value: 'sales', label: '営業部' },
  { value: 'dev', label: '開発部' },
  { value: 'hr', label: '人事部' },
];

const categories: SelectOption[] = [
  { value: 'procedure', label: '業務手順' },
  { value: 'rules', label: '規則・規定' },
  { value: 'system', label: 'システム操作' },
];

const accessLevels: SelectOption[] = [
  { value: 'all', label: '全社員' },
  { value: 'department', label: '部門内' },
  { value: 'specific', label: '指定メンバーのみ' },
];

const editPermissions: SelectOption[] = [
  { value: 'author', label: '作成者のみ' },
  { value: 'department', label: '部門管理者' },
  { value: 'specific', label: '指定メンバー' },
];

interface ManualFormData {
  title: string;
  content: string;
  department: Department | '';
  category: Category | '';
  accessLevel: AccessLevel | '';
  editPermission: EditPermission | '';
  tags: string[];
}

const CreateManual: React.FC = () => {
  const [formData, setFormData] = React.useState<ManualFormData>({
    title: '社内Wiki作成手順',
    content: '# 社内Wiki作成手順\n\nこのマニュアルでは、社内Wikiを効果的に作成するための手順を説明します。\n\n## 1. Wikiの目的を明確にする\n\nWikiを作成する目的（情報共有、ナレッジ蓄積など）を定義します。\n\n## 2. 構造を設計する\n\n情報のカテゴリ分けや、ページの階層構造を設計します。\n\n## 3. コンテンツを作成・編集する\n\n分かりやすい文章と図解でコンテンツを作成します。\n\n## 4. アクセス権限を設定する\n\n誰が閲覧・編集できるかを設定します。\n\n## 5. 公開・運用する\n\n公開後も定期的に内容を見直し、最新の状態を保ちます。',
    department: 'dev',
    category: 'procedure',
    accessLevel: 'all',
    editPermission: 'department',
    tags: ['wiki', '手順', '情報共有', 'ナレッジ'],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: keyof ManualFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePublish = () => {
    // Implement publish logic
    console.log('Publishing manual:', formData);
  };

  const handleSaveDraft = () => {
    // Implement draft saving logic
    console.log('Saving draft:', formData);
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" className="mb-4 p-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground">マニュアル作成</h1>
          <p className="text-muted-foreground">業務マニュアルの新規作成と編集ができます</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <BookOpen className="inline-block mr-2 h-5 w-5" />
                  マニュアル詳細
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="マニュアルのタイトルを入力"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <Tabs defaultValue="edit">
                    <TabsList>
                      <TabsTrigger value="edit">編集</TabsTrigger>
                      <TabsTrigger value="preview">プレビュー</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                      <div className="space-y-4">
                        {/* Editor Toolbar */}
                        <div className="flex items-center space-x-2 border-b pb-2">
                          <Button variant="outline" size="sm">
                            <List className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Image className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>

                        <Textarea
                          name="content"
                          placeholder="マニュアルの内容を入力してください"
                          value={formData.content}
                          onChange={handleInputChange}
                          className="min-h-[300px]"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="border rounded-md p-4 min-h-[500px]">
                        {formData.content || 'プレビューがここに表示されます'}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Category Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Tags className="inline-block mr-2 h-5 w-5" />
                  カテゴリー設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">部門</Label>
                  <Select
                    value={formData.department}
                    onValueChange={handleSelectChange('department')}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="部門を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">カテゴリー</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange('category')}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  新規カテゴリーを作成
                </Button>
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Tags className="inline-block mr-2 h-5 w-5" />
                  タグ設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">タグ</Label>
                  <Input
                    id="tags"
                    name="tags"
                    placeholder="タグをカンマ区切りで入力"
                    value={formData.tags.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                    })}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            tags: formData.tags.filter((_, i) => i !== index)
                          })}
                          className="ml-1 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                        >
                          &times;
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Access Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Users className="inline-block mr-2 h-5 w-5" />
                  アクセス設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="access-level">公開範囲</Label>
                  <Select
                    value={formData.accessLevel}
                    onValueChange={handleSelectChange('accessLevel')}
                  >
                    <SelectTrigger id="access-level">
                      <SelectValue placeholder="公開範囲を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-permission">編集権限</Label>
                  <Select
                    value={formData.editPermission}
                    onValueChange={handleSelectChange('editPermission')}
                  >
                    <SelectTrigger id="edit-permission">
                      <SelectValue placeholder="編集権限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {editPermissions.map((perm) => (
                        <SelectItem key={perm.value} value={perm.value}>
                          {perm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button onClick={handlePublish}>
                マニュアルを公開
              </Button>
              <Button variant="outline" onClick={handleSaveDraft}>
                下書きとして保存
              </Button>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <FileText className="inline-block mr-2 h-5 w-5" />
              効果的なマニュアル作成のヒント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                目的と対象読者を明確にし、適切な詳細レベルで記述しましょう
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                画像や図表を活用し、視覚的に分かりやすい説明を心がけましょう
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                定期的な更新と見直しを行い、常に最新の情報を維持しましょう
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreateManual;
