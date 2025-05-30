import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Clock,
  Users,
  Building,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Calendar,
  CheckSquare,
  MessageSquare,
  FileText,
  Database,
  Monitor,
  Laptop,
  Target,
  Zap,
  TrendingUp,
  Clock9,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { createAvatarProps } from "@/utils/avatarUtils";

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ユーザー情報を読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Work Optimizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  {...createAvatarProps(user.avatarUrl, user.display_name, 'ユーザーアバター')}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">
                  こんにちは、{user.display_name}さん
                </span>
              </div>
              <Button variant="outline" onClick={logout}>
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            ダッシュボード
          </h2>
          <p className="text-gray-600">
            業務効率化ツールへようこそ。今日も一日頑張りましょう！
          </p>
        </div>

        {/* プロフィール完成度アラート */}
        {!user.profile_complete && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">
                      プロフィールを完成させましょう
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                      部署や役職などの情報を追加すると、より便利にご利用いただけます。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ユーザー情報カード */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                プロフィール
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">名前</p>
                <p className="text-lg font-semibold">{user.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">メールアドレス</p>
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>

              {user.department && (
                <div>
                  <p className="text-sm font-medium text-gray-500">部署</p>
                  <div className="flex items-center mt-1">
                    <Building className="h-4 w-4 mr-1 text-gray-400" />
                    <p className="text-sm text-gray-900">{user.department}</p>
                  </div>
                </div>
              )}

              {user.position && (
                <div>
                  <p className="text-sm font-medium text-gray-500">役職</p>
                  <div className="flex items-center mt-1">
                    <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                    <p className="text-sm text-gray-900">{user.position}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">プロフィール完成度</p>
                <div className="flex items-center mt-1">
                  {user.profile_complete ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        完了
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        未完了
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {user.bio && (
                <div>
                  <p className="text-sm font-medium text-gray-500">自己紹介</p>
                  <p className="text-sm text-gray-900 mt-1">{user.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 勤怠情報カード */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                今月の勤怠
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">総労働時間</p>
                <p className="text-2xl font-bold text-blue-600">
                  {user.monthly_work_hours}時間
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">残業時間</p>
                <p className="text-2xl font-bold text-orange-600">
                  {user.monthly_overtime_hours}時間
                </p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-500">有給残日数</span>
                  <span className="text-lg font-semibold text-green-600">
                    {user.paid_leave_balance}日
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">病気休暇残日数</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {user.sick_leave_balance}日
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 組織情報カード */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                所属組織
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.organizations && user.organizations.length > 0 ? (
                <div className="space-y-3">
                  {user.organizations.map((org, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{org.name}</p>
                        <p className="text-sm text-gray-500">{org.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    まだ組織に所属していません
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">勤怠記録</h4>
                  <p className="text-sm text-gray-500 mt-1">出退勤を記録</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">休暇申請</h4>
                  <p className="text-sm text-gray-500 mt-1">有給・休暇の申請</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">タスク管理</h4>
                  <p className="text-sm text-gray-500 mt-1">タスクの作成・管理</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900">レポート</h4>
                  <p className="text-sm text-gray-500 mt-1">業務分析・レポート</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}; 
