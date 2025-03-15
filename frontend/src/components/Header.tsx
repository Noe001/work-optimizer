import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  MessageSquare,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  CheckSquare,
  FileText,
  Database,
  Calendar,
  Heart,
} from "lucide-react";

// ナビゲーションリンクの定義
const navigationLinks = [
  { path: "/", icon: Home, label: "ダッシュボード" },
  { path: "/tasks", icon: CheckSquare, label: "タスク管理" },
  { path: "/meeting", icon: Calendar, label: "ミーティング" },
  { path: "/team_chat", icon: MessageSquare, label: "チーム会話" },
  { path: "/knowledge_base", icon: Database, label: "ナレッジベース" },
  { path: "/manual", icon: FileText, label: "マニュアル" },
  { path: "/work_life_balance", icon: Heart, label: "健康管理" },
];

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-md">
      <div className="container mx-auto flex h-14 items-center px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.path} asChild>
                  <Link to={link.path} className="flex items-center">
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex items-center gap-2 font-semibold">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/w-o_logo.png" alt="logo" className="h-7 w-7" />
            <span className="hidden md:inline">WorkOptimizer</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-4 mx-6 overflow-x-auto">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Button
                key={link.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="flex items-center gap-1"
                asChild
              >
                <Link to={link.path}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
        
        <div className="flex-1 mx-4 relative hidden sm:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input type="text" placeholder="検索..." className="pl-8" />
        </div>
        
        <div className="flex items-center gap-2">
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
              <DropdownMenuItem asChild>
                <Link to="/notification_center" className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">会議リマインド</span>
                    <span className="text-sm text-muted-foreground">14:00 プロジェクトMTG</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/tasks" className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-medium">タスク期限</span>
                    <span className="text-sm text-muted-foreground">マニュアル作成 本日期限</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/notification_center" className="cursor-pointer flex items-center">
                  すべての通知を見る
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <img src="/images/circle-user-round.png" alt="ユーザーアバター" className="w-8 h-8 rounded-full" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>田中 太郎</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  プロフィール
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/login" className="cursor-pointer flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header; 
