import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../hooks/use-toast';
import organizationService, { Organization } from '../../services/organizationService';
import invitationService, { Invitation } from '../../services/invitationService';
import { Loader2, ArrowLeft, Users, Calendar, Server, Copy, Trash2, Plus, RefreshCw, Shield } from 'lucide-react';

const OrganizationDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [createInviteLoading, setCreateInviteLoading] = useState(false);
  const [createInviteDialogOpen, setCreateInviteDialogOpen] = useState(false);
  const [permanent, setPermanent] = useState(false);
  const [expiresIn, setExpiresIn] = useState('24');
  const [usesAllowed, setUsesAllowed] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchOrganizationDetails(id);
    }
  }, [id]);

  const fetchOrganizationDetails = async (organizationId: string) => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganization(organizationId);
      setOrganization(data);
      fetchInvitations(organizationId);
    } catch (error) {
      console.error('組織の詳細取得に失敗しました', error);
      toast({
        title: 'エラー',
        description: '組織の詳細取得に失敗しました',
        variant: 'destructive',
      });
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async (organizationId: string) => {
    try {
      setInvitationsLoading(true);
      const data = await invitationService.getOrganizationInvitations(organizationId);
      setInvitations(data);
    } catch (error) {
      console.error('招待リンクの取得に失敗しました', error);
      toast({
        title: 'エラー',
        description: '招待リンクの取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!organization) return;

    try {
      setCreateInviteLoading(true);
      
      const data = {
        permanent,
        expires_in: permanent ? undefined : parseInt(expiresIn),
        uses_allowed: permanent || !usesAllowed ? undefined : parseInt(usesAllowed)
      };
      
      await invitationService.createInvitation(organization.id, data);
      
      toast({
        title: '成功',
        description: '招待リンクを作成しました',
      });
      
      fetchInvitations(organization.id);
      setCreateInviteDialogOpen(false);
      resetInviteForm();
    } catch (error) {
      console.error('招待リンクの作成に失敗しました', error);
      toast({
        title: 'エラー',
        description: '招待リンクの作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setCreateInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (invitationId: string) => {
    if (!organization) return;

    try {
      await invitationService.deleteInvitation(invitationId);
      
      toast({
        title: '成功',
        description: '招待リンクを削除しました',
      });
      
      fetchInvitations(organization.id);
    } catch (error) {
      console.error('招待リンクの削除に失敗しました', error);
      toast({
        title: 'エラー',
        description: '招待リンクの削除に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'コピーしました',
      description: '招待コードをクリップボードにコピーしました',
    });
  };

  const resetInviteForm = () => {
    setPermanent(false);
    setExpiresIn('24');
    setUsesAllowed('');
  };

  const handleBack = () => {
    navigate('/organizations');
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-destructive/10 p-4 rounded-md">
          <p className="text-destructive">組織が見つかりませんでした。</p>
        </div>
        <Button variant="outline" className="mt-4" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          組織一覧に戻る
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ja-JP', options);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{organization.name}</h1>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full max-w-md mx-auto">
          <TabsTrigger value="overview" className="flex-1">概要</TabsTrigger>
          <TabsTrigger value="invites" className="flex-1">招待管理</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">メンバー</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                組織の概要
              </CardTitle>
              <CardDescription>
                組織の基本情報
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">組織ID</h3>
                <div className="flex items-center gap-2 text-sm font-mono bg-muted p-2 rounded">
                  <code>{organization.id}</code>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6"
                    onClick={() => handleCopyInviteCode(organization.id)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">説明</h3>
                <p className="text-muted-foreground">
                  {organization.description || '組織の説明はありません。'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-1.5 h-4 w-4" />
                  作成日: {formatDate(organization.created_at)}
                </div>
                <div className="flex items-center">
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  最終更新日: {formatDate(organization.updated_at)}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  メンバー管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  組織のメンバーを管理します。「メンバー」タブで詳細を確認できます。
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab('members')}
                >
                  メンバー管理を表示
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  招待リンク
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  招待リンクを作成して新しいメンバーを招待します。「招待管理」タブで詳細を確認できます。
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setActiveTab('invites')}
                >
                  招待リンクを管理
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invites" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  招待リンク管理
                </CardTitle>
                <Button onClick={() => setCreateInviteDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  招待リンクを作成
                </Button>
              </div>
              <CardDescription>
                組織へのアクセスを許可する招待リンクを管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : invitations.length === 0 ? (
                <div className="bg-muted/50 p-8 rounded-lg text-center">
                  <Shield className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="text-lg font-medium mb-1">招待リンクがありません</h3>
                  <p className="text-muted-foreground mb-4">
                    新しいメンバーを招待するには招待リンクを作成してください
                  </p>
                  <Button onClick={() => setCreateInviteDialogOpen(true)}>
                    招待リンクを作成
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invite) => (
                    <Card key={invite.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 pb-3 border-b bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium">招待コード</div>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="h-7"
                              onClick={() => handleCopyInviteCode(invite.code)}
                            >
                              <Copy className="mr-1 h-3.5 w-3.5" />
                              コピー
                            </Button>
                          </div>
                          <code className="text-sm bg-background p-1.5 rounded block">
                            {invite.code}
                          </code>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-muted-foreground">作成日</div>
                            <div>{formatDate(invite.created_at)}</div>
                            
                            <div className="text-muted-foreground">有効期限</div>
                            <div>{invite.expires_at ? formatDate(invite.expires_at) : '無期限'}</div>
                            
                            <div className="text-muted-foreground">使用回数</div>
                            <div>{invite.uses_count} / {invite.uses_allowed || '∞'}</div>
                          </div>
                          
                          <div className="mt-4 flex justify-end">
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteInvite(invite.id)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              削除
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                メンバー管理
              </CardTitle>
              <CardDescription>
                組織のメンバーと役割を管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium mb-1">メンバー管理機能は準備中です</h3>
              <p className="text-muted-foreground mb-4">
                組織のメンバー管理機能は現在開発中です。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 招待リンク作成ダイアログ */}
      <Dialog open={createInviteDialogOpen} onOpenChange={(open) => {
        setCreateInviteDialogOpen(open);
        if (!open) resetInviteForm();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>招待リンクを作成</DialogTitle>
            <DialogDescription>
              新しいメンバーを招待するためのリンクを作成します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="permanent" className="flex-1">
                無期限の招待リンク
              </Label>
              <Switch
                id="permanent"
                checked={permanent}
                onCheckedChange={setPermanent}
              />
            </div>

            {!permanent && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="expiresIn">有効期限（時間）</Label>
                  <Input
                    id="expiresIn"
                    type="number"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    min="1"
                    placeholder="24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usesAllowed">最大使用回数（空欄は無制限）</Label>
                  <Input
                    id="usesAllowed"
                    type="number"
                    value={usesAllowed}
                    onChange={(e) => setUsesAllowed(e.target.value)}
                    min="1"
                    placeholder="無制限"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateInviteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateInvite} disabled={createInviteLoading}>
              {createInviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationDetailView; 
