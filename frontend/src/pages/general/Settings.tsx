"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bell,
  User,
  Shield,
  Palette,
  Settings,
  Lock,
} from "lucide-react"
import Header from "@/components/Header"

const SettingsView: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* プロフィール設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  プロフィール設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>表示名</Label>
                  <Input placeholder="表示名を入力" />
                </div>
                <div className="space-y-2">
                  <Label>メールアドレス</Label>
                  <Input type="email" placeholder="メールアドレスを入力" />
                </div>
                <div className="space-y-2">
                  <Label>部署</Label>
                  <Input placeholder="部署名を入力" />
                </div>
                <Button>保存</Button>
              </CardContent>
            </Card>

            {/* 通知設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>メール通知</Label>
                    <p className="text-sm text-muted-foreground">
                      重要な更新をメールで受け取る
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>会議リマインダー</Label>
                    <p className="text-sm text-muted-foreground">
                      会議開始前に通知を受け取る
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>リマインダー時間</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="通知タイミングを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5分前</SelectItem>
                      <SelectItem value="10">10分前</SelectItem>
                      <SelectItem value="15">15分前</SelectItem>
                      <SelectItem value="30">30分前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>タスク期限通知</Label>
                    <p className="text-sm text-muted-foreground">
                      タスクの期限が近づいた時に通知する
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>タスク期限通知のタイミング</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="通知タイミングを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1日前</SelectItem>
                      <SelectItem value="3">3日前</SelectItem>
                      <SelectItem value="7">1週間前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 表示設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  表示設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>言語</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="言語を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>ダークモード</Label>
                    <p className="text-sm text-muted-foreground">
                      ダークテーマを使用する
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            {/* セキュリティ設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  セキュリティ設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>二段階認証</Label>
                    <p className="text-sm text-muted-foreground">
                      ログイン時の追加セキュリティ
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>パスワード変更</Label>
                  <Input type="password" placeholder="現在のパスワード" />
                  <Input type="password" placeholder="新しいパスワード" />
                  <Input type="password" placeholder="新しいパスワードの確認" />
                  <Button>パスワードを変更</Button>
                </div>
              </CardContent>
            </Card>

            {/* アプリケーション設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  アプリケーション設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>デフォルトページ</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="起動時のページを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">ダッシュボード</SelectItem>
                      <SelectItem value="manuals">業務マニュアル</SelectItem>
                      <SelectItem value="knowledge">ナレッジベース</SelectItem>
                      <SelectItem value="meetings">会議管理</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自動保存</Label>
                    <p className="text-sm text-muted-foreground">
                      編集内容を自動的に保存する
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>自動保存間隔</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="保存間隔を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30秒</SelectItem>
                      <SelectItem value="60">1分</SelectItem>
                      <SelectItem value="300">5分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* プライバシー設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  プライバシー設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>プロフィール公開</Label>
                    <p className="text-sm text-muted-foreground">
                      プロフィール情報を他のユーザーに公開する
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>オンライン状態の表示</Label>
                    <p className="text-sm text-muted-foreground">
                      自分のオンライン状態を他のユーザーに表示する
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>活動履歴の記録</Label>
                    <p className="text-sm text-muted-foreground">
                      アプリケーション使用状況の分析のために活動履歴を記録する
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  )
}

export default SettingsView 
