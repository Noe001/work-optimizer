import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Home,
  FilePlus,
  BookOpen,
  MessageSquare,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
} from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-md">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <img src="/images/w-o_logo.png" alt="logo" className="h-7 w-7" />
          <span className="hidden md:inline">WorkOptimizer</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 mx-6">
          {[
            { icon: Home, label: "ホーム" },
            { icon: FilePlus, label: "新規作成" },
            { icon: BookOpen, label: "ドキュメント" },
            { icon: MessageSquare, label: "チャット" },
          ].map(({ icon: Icon, label }) => (
            <Button key={label} variant="ghost" className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>
        <div className="flex-1 mx-4 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input type="text" placeholder="検索..." className="pl-8" />
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-black text-white text-xs rounded-full">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>通知</DropdownMenuLabel>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">会議リマインド</span>
                  <span className="text-sm text-muted-foreground">14:00 プロジェクトMTG</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">タスク期限</span>
                  <span className="text-sm text-muted-foreground">マニュアル作成 本日期限</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <img src="public/images/circle-user-round.png" alt="ユーザーアバター" className="w-8 h-8 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>田中 太郎</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                プロフィール
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                設定
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header; 
