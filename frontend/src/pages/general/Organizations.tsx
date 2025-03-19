import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import organizationService, { Organization } from '../../services/organizationService';
import invitationService from '../../services/invitationService';
import { Copy, Loader2, Plus, Users, Server, Hash, ArrowRight } from 'lucide-react';

const OrganizationsView = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);
  const [validatedOrg, setValidatedOrg] = useState<{id: string, name: string, description: string} | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('組織の取得に失敗しました', error);
      toast({
        title: 'エラー',
        description: '組織の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName) {
      toast({
        title: '入力エラー',
        description: '組織名を入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreateLoading(true);
      await organizationService.createOrganization({
        name: organizationName,
        description: organizationDescription,
      });
      toast({
        title: '成功',
        description: '組織を作成しました',
      });
      setOrganizationName('');
      setOrganizationDescription('');
      setCreateDialogOpen(false);
      fetchOrganizations();
    } catch (error) {
      console.error('組織の作成に失敗しました', error);
      toast({
        title: 'エラー',
        description: '組織の作成に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleValidateInviteCode = async () => {
    if (!inviteCode) {
      toast({
        title: '入力エラー',
        description: '招待コードを入力してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      setValidateLoading(true);
      const response = await invitationService.validateInvitationCode(inviteCode);
      
      if (response.valid && response.organization) {
        setValidatedOrg(response.organization);
      } else {
        toast({
          title: 'エラー',
          description: response.error || '無効な招待コードです',
          variant: 'destructive',
        });
        setValidatedOrg(null);
      }
    } catch (error) {
      console.error('招待コードの検証に失敗しました', error);
      toast({
        title: 'エラー',
        description: '招待コードの検証に失敗しました',
        variant: 'destructive',
      });
      setValidatedOrg(null);
    } finally {
      setValidateLoading(false);
    }
  };

  const handleJoinWithInviteCode = async () => {
    if (!inviteCode) {
      return;
    }

    try {
      setJoinLoading(true);
      await invitationService.useInvitationCode(inviteCode);
      toast({
        title: '成功',
        description: '組織に参加しました',
      });
      setInviteCode('');
      setJoinDialogOpen(false);
      setValidatedOrg(null);
      fetchOrganizations();
    } catch (error) {
      console.error('組織への参加に失敗しました', error);
      toast({
        title: 'エラー',
        description: '組織への参加に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setJoinLoading(false);
    }
  };

  const handleViewOrganization = (org: Organization) => {
    navigate(`/organizations/${org.id}`);
  };

  const renderOrgCardColors = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-indigo-600',
      'bg-gradient-to-br from-blue-500 to-cyan-600',
      'bg-gradient-to-br from-emerald-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-amber-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">あなたの組織</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
            <ArrowRight className="mr-2 h-4 w-4" />
            組織に参加
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新しい組織を作成
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <Server className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">どの組織にも参加していません</h2>
          <p className="text-muted-foreground mb-6">新しい組織を作成するか、招待コードで既存の組織に参加しましょう</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
              招待コードで参加
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              新しい組織を作成
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org, index) => (
            <div
              key={org.id}
              className="group cursor-pointer overflow-hidden rounded-xl border transition-all hover:shadow-md"
              onClick={() => handleViewOrganization(org)}
            >
              <div className={`h-24 ${renderOrgCardColors(index)} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{org.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1">{org.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                  {org.description || 'この組織に説明はありません'}
                </p>
                <div className="mt-4 flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                  <span>メンバー</span>
                </div>
              </div>
            </div>
          ))}
          <div 
            className="flex flex-col items-center justify-center h-60 border border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">新しい組織を作成</p>
          </div>
        </div>
      )}

      {/* 組織作成ダイアログ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新しい組織を作成</DialogTitle>
            <DialogDescription>
              新しい組織を作成して、チームメンバーを招待しましょう。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">組織名</Label>
                <Input
                  id="name"
                  placeholder="組織名を入力"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  placeholder="組織の説明を入力"
                  value={organizationDescription}
                  onChange={(e) => setOrganizationDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                作成
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 招待コードでの参加ダイアログ */}
      <Dialog open={joinDialogOpen} onOpenChange={(open) => {
        setJoinDialogOpen(open);
        if (!open) {
          setInviteCode('');
          setValidatedOrg(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>招待コードで参加</DialogTitle>
            <DialogDescription>
              招待コードを入力して既存の組織に参加します。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">招待コード</Label>
              <div className="flex gap-2">
                <Input
                  id="inviteCode"
                  placeholder="招待コードを入力"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleValidateInviteCode}
                  disabled={validateLoading || !inviteCode}
                >
                  {validateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '確認'}
                </Button>
              </div>
            </div>
            
            {validatedOrg && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-lg">参加する組織</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p className="font-semibold">{validatedOrg.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {validatedOrg.description || '説明なし'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setJoinDialogOpen(false)}>
              キャンセル
            </Button>
            <Button 
              onClick={handleJoinWithInviteCode} 
              disabled={joinLoading || !validatedOrg}
            >
              {joinLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              参加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationsView; 
