import React, { useState } from 'react';
import { ArrowLeft, User, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';

interface UserProfile {
  name: string;
  email: string;
  department: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '田中 太郎',
    email: 'tanaka@example.com',
    department: '営業部',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
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
            <CardTitle className="flex justify-between items-center">
              <span>ユーザー情報</span>
              <Button variant="ghost" size="icon" onClick={toggleEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
            </div>
            {isEditing && (
              <div className="flex justify-end mt-4">
                <Button onClick={saveProfile}>保存</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Profile; 
