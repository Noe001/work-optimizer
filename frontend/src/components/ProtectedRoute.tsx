import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 認証が必要なルートをラップするコンポーネント
 * 認証されていない場合はログインページにリダイレクト
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 認証状態の読み込み中
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">認証情報を確認中...</div>
      </div>
    );
  }

  // 未認証ならログインページへリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 認証済みなら子コンポーネントを表示
  return <>{children}</>;
};

export default ProtectedRoute; 
