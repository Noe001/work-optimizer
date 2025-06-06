import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Users, Tags, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Manual } from '@/types/api';
import manualService, { ManualListParams } from '@/services/manualService';
import { useAuth } from '@/contexts/AuthContext';

import { 
  DEPARTMENTS, 
  CATEGORIES, 
  FILTER_OPTIONS, 
  getDepartmentLabel, 
  getCategoryLabel,
  getStatusBadgeVariant 
} from '@/constants/manual';

const ManualView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [manualToDelete, setManualToDelete] = useState<Manual | null>(null);

  // 初期化時にURLパラメータからフィルター条件を読み取る
  useEffect(() => {
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const category = searchParams.get('category');
    
    if (status) {
      setSelectedFilter(status);
    }
    if (department) {
      setSelectedDepartment(department);
    }
    if (category) {
      setSelectedCategory(category);
    }
    
    loadManuals({ page: 1 });
  }, [searchParams]);

  // フィルター変更時の処理
  useEffect(() => {
    setCurrentPage(1);
    loadManuals({ page: 1 });
  }, [selectedFilter, selectedDepartment, selectedCategory]);

  // ページ変更時の処理
  useEffect(() => {
    loadManuals();
  }, [currentPage]);

  // マニュアル一覧の読み込み
  const loadManuals = async (params?: ManualListParams) => {
    setLoading(true);

    try {
      const pageToLoad = params?.page ?? currentPage;
      const loadParams: ManualListParams = {
        page: pageToLoad,
        per_page: 10,
        query: searchQuery || undefined,
        department: selectedDepartment !== 'all' ? selectedDepartment : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        ...params,
      };

      let response;
      
      if (selectedFilter === 'my') {
        // 自分のマニュアルを取得
        response = await manualService.getMyManuals(loadParams);
      } else {
        // ステータスフィルターをloadParamsに追加（バックエンドで処理）
        if (selectedFilter === 'published' || selectedFilter === 'draft') {
          loadParams.status = selectedFilter;
        }
        
        // 全マニュアルを取得
        response = await manualService.getManuals(loadParams);
      }

      // レスポンス形式の自動判定と対応
      let manualsData: Manual[] = [];
      let metaData: any = null;
      
      if (response.success && response.data) {
        // 新しい形式: {success: true, data: {data: [...], meta: {...}}}
        if (response.data.data && Array.isArray(response.data.data)) {
          manualsData = response.data.data;
          metaData = response.data.meta;
        }
        // 旧形式または直接配列: {success: true, data: [...]}
        else if (Array.isArray(response.data)) {
          manualsData = response.data;
          metaData = { total_pages: 1, current_page: 1, total_count: response.data.length };
        }
        
        setManuals(manualsData);
        setTotalPages(metaData?.total_pages || 1);
      } else {
        setManuals([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // マニュアル削除
  const handleDelete = async (manual: Manual) => {
    try {
      await manualService.deleteManual(manual.id);
      toast.success('マニュアルを削除しました');
      setIsDeleteDialogOpen(false);
      loadManuals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // 検索実行
  const handleSearch = () => {
    setCurrentPage(1);
    loadManuals({ page: 1 });
  };

  // フィルターリセット
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setSelectedCategory('all');
    setSelectedFilter('all');
    setCurrentPage(1);
    loadManuals({ page: 1, per_page: 10 });
  };

  // ラベル変換関数


  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">業務マニュアル</h1>
              <p className="text-muted-foreground">組織の業務マニュアルを管理します</p>
            </div>
            <Button onClick={() => navigate('/manual/create')}>
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">キーワード検索</Label>
                <Input
                  id="search"
                  placeholder="タイトルで検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              
              <div>
                <Label>表示条件</Label>
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="表示条件を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>部門</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {DEPARTMENTS.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>カテゴリー</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button onClick={handleSearch} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* マニュアル一覧 */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">読み込み中...</div>
          ) : manuals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">マニュアルが見つかりませんでした</p>
                {selectedFilter === 'my' && (
                  <Button onClick={() => navigate('/manual/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    最初のマニュアルを作成
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            manuals.map((manual) => (
              <Card key={manual.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{manual.title}</h3>
                        <Badge variant={getStatusBadgeVariant(manual.status)}>
                          {manual.status === 'published' ? '公開中' : '下書き'}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span>
                          <Users className="h-4 w-4 inline mr-1" />
                          {getDepartmentLabel(manual.department)}
                        </span>
                        <span>
                          <Tags className="h-4 w-4 inline mr-1" />
                          {getCategoryLabel(manual.category)}
                        </span>
                        {manual.author && (
                          <span>作成者: {manual.author.name}</span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {manual.content?.substring(0, 150)}...
                      </p>

                      {manual.tags && (
                        <div className="mt-3">
                          {manual.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="mr-1">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedManual(manual)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {manual.can_edit && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/manual/edit/${manual.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setManualToDelete(manual);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => {
                  const newPage = Math.max(prev - 1, 1);
                  loadManuals({ page: newPage, per_page: 10 });
                  return newPage;
                });
              }}
            >
              前へ
            </Button>
            <span className="flex items-center px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => {
                  const newPage = Math.min(prev + 1, totalPages);
                  loadManuals({ page: newPage, per_page: 10 });
                  return newPage;
                });
              }}
            >
              次へ
            </Button>
          </div>
        )}

        {/* マニュアル詳細表示ダイアログ */}
        <Dialog open={!!selectedManual} onOpenChange={() => setSelectedManual(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedManual?.title}</DialogTitle>
              <DialogDescription>
                {selectedManual && (
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{getDepartmentLabel(selectedManual.department)}</span>
                    <span>{getCategoryLabel(selectedManual.category)}</span>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="prose max-w-none">
                {selectedManual?.content && (
                  <div className="whitespace-pre-wrap">{selectedManual.content}</div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 削除確認ダイアログ */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>マニュアルの削除</DialogTitle>
              <DialogDescription>
                「{manualToDelete?.title}」を削除しますか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={() => manualToDelete && handleDelete(manualToDelete)}
              >
                削除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ManualView;
