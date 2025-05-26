import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import userService from '@/services/userService';
import { User as ApiUser } from '@/types/api';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  department: string | null;
  position: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// 拡張されたUser型（プロフィール用）
interface ExtendedUser extends ApiUser {
  department?: string;
  position?: string;
  bio?: string;
  avatarUrl?: string;
}

// シンプルなスケルトンコンポーネント
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ローディングスケルトンコンポーネント
const ProfileSkeleton: React.FC = () => (
  <>
    <Header />
    <div className="p-6 bg-background min-h-screen bg-gray-50">
      <div className="mb-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ローディングオーバーレイコンポーネント
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>更新中...</span>
    </div>
  </div>
);

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    department: null,
    position: null,
    bio: null,
    avatarUrl: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // プロフィールデータを取得
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await userService.getCurrentUser();
        
        if (response.success && response.data) {
          const userData = response.data as ExtendedUser;
          setProfile({
            id: userData.id,
            name: userData.name || '',
            email: userData.email || '',
            department: userData.department || null,
            position: userData.position || null,
            bio: userData.bio || null,
            avatarUrl: userData.avatarUrl || userData.avatar || '/images/circle-user-round.png',
            createdAt: userData.created_at,
            updatedAt: userData.updated_at
          });
        } else {
          setError(response.message || 'プロフィール情報の取得に失敗しました。');
        }
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        setError('プロフィール情報の取得中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ローディング中はスケルトンを表示
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // エラー時の表示
  if (error) {
    return (
      <>
        <Header />
        <div className="p-6 bg-background min-h-screen bg-gray-50">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  再読み込み
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "エラー", 
        description: "JPEG、PNG、WebP形式のみ対応しています。", 
        variant: "destructive" 
      });
      return;
    }

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "エラー", 
        description: "ファイルサイズは5MB以下にしてください。", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);
    try {
      // 一時的にプレビューを表示
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);

      // 実際のアップロード処理は後で実装
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await userService.uploadAvatar(formData);
      
      toast({ 
        title: "成功", 
        description: "画像がアップロードされました。" 
      });
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      toast({ 
        title: "エラー", 
        description: "画像のアップロードに失敗しました。", 
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setIsUpdating(true);
      
      // バリデーション
      if (!profile.name.trim()) {
        toast({
          title: "エラー",
          description: "名前は必須です。",
          variant: "destructive",
        });
        return;
      }

      if (!profile.email.trim()) {
        toast({
          title: "エラー",
          description: "メールアドレスは必須です。",
          variant: "destructive",
        });
        return;
      }

      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        toast({
          title: "エラー",
          description: "有効なメールアドレスを入力してください。",
          variant: "destructive",
        });
        return;
      }

      const response = await userService.updateUserProfileData(profile);
      if (response.success) {
        toast({
          title: "成功",
          description: "プロフィールが正常に更新されました。",
        });
        setIsEditing(false);
        setOriginalProfile(null); 
      } else {
        toast({
          title: "エラー",
          description: response.message || "プロフィールの更新に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "エラー",
        description: error.message || "プロフィールの更新中に予期せぬエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
    setIsEditing(false);
    setOriginalProfile(null); // Clear original profile after cancelling
  };

  return (
    <>
      <Header />
      <div className="p-6 bg-background min-h-screen bg-gray-50">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4 p-0 hover:bg-transparent">
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <User className="h-5 w-5 mr-2" />
            プロフィール
          </h1>
          <p className="text-muted-foreground">あなたのプロフィール情報を確認・編集できます。</p>
        </div>

        <Card className="relative">
          {isUpdating && <LoadingOverlay />}
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profile.avatarUrl || '/images/circle-user-round.png'}
                  alt="プロフィール画像"
                  className={`w-24 h-24 rounded-full cursor-pointer hover:opacity-80 ${isUploading ? 'opacity-50' : ''}`}
                  onClick={handleAvatarClick}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || isUpdating}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 right-0 bg-white rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUploading || isUpdating}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.name || '名前未設定'}</h2>
                <p className="text-muted-foreground">
                  {profile.department || '部門未設定'} - {profile.position || 'ポジション未設定'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">自己紹介</label>
                <Textarea
                  name="bio"
                  value={profile.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e)}
                  disabled={!isEditing || isUpdating}
                  className="mt-1"
                  placeholder="自己紹介を入力してください"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">名前 <span className="text-red-500">*</span></label>
                <Input
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  disabled={!isEditing || isUpdating}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">メールアドレス <span className="text-red-500">*</span></label>
                <Input
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  disabled={!isEditing || isUpdating}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">部門</label>
                <Input
                  name="department"
                  value={profile.department || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing || isUpdating}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ポジション</label>
                <Input
                  name="position"
                  value={profile.position || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing || isUpdating}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    setOriginalProfile(profile);
                    setIsEditing(true);
                  }}
                  disabled={isLoading}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  編集
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>パスワード変更</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">現在のパスワード</label>
                <Input type="password" name="currentPassword" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">新しいパスワード</label>
                <Input type="password" name="newPassword" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">新しいパスワードの確認</label>
                <Input type="password" name="confirmPassword" />
              </div>
              <Button>パスワードを変更</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Profile; 
