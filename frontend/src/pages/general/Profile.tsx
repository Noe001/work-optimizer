import React, { useState, useRef } from 'react';
import { ArrowLeft, User, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';

interface UserProfile {
  name: string;
  email: string;
  department: string;
  position: string;
  bio: string;
  avatarUrl: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '田中 太郎',
    email: 'tanaka@example.com',
    department: '営業部',
    position: 'マネージャー',
    bio: '',
    avatarUrl: '/images/circle-user-round.png'
  });

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ここで画像アップロード処理を実装
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          avatarUrl: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    console.log("プロフィール情報が保存されました:", profile);
    setIsEditing(false);
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

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt="プロフィール画像"
                  className="w-24 h-24 rounded-full cursor-pointer hover:opacity-80"
                  onClick={handleAvatarClick}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 right-0 bg-white rounded-full"
                  onClick={handleAvatarClick}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.department} - {profile.position}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">自己紹介</label>
                <Textarea
                  name="bio"
                  value={profile.bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e)}
                  disabled={!isEditing}
                  className="mt-1"
                  placeholder="自己紹介を入力してください"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">名前</label>
                <Input
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                <Input
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">部門</label>
                <Input
                  name="department"
                  value={profile.department}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ポジション</label>
                <Input
                  name="position"
                  value={profile.position}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-1"
                />
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={saveProfile}>保存</Button>
              </div>
            )}
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
