import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/services/api';

interface SessionNavProps {
  className?: string;
}

const SessionNav: React.FC<SessionNavProps> = ({ className = '' }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // ユーザー情報を取得
  useEffect(() => {
    const checkSession = async () => {
      try {
        // ローカルストレージからユーザー情報を取得
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        }

        // セッションをチェック
        const response = await authAPI.checkSession();
        if (response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // ログアウト処理
  const handleLogout = () => {
    navigate('/sessions/logout');
  };

  return (
    <nav className={`p-4 shadow-sm ${className}`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          ワークオプティマイザー
        </Link>

        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-sm">読み込み中...</span>
          ) : user ? (
            <>
              <span className="text-sm mr-2">
                こんにちは、{user.name}さん
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/sessions/new">ログイン</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/signup">新規登録</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SessionNav; 
