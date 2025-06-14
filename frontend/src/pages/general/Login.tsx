import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import { 
  getErrorMessage, 
  getRecommendedAction, 
  createDetailedError,
  createToastOptions,
  isLoginError 
} from '@/utils/errorHandler';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // フィールドへの参照
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 認証済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // AuthContextのエラーを監視してローカルエラーに反映
  useEffect(() => {
    if (authError) {
      handleErrorWithCodeHandling(authError);
    }
  }, [authError]);

  // コンポーネントがマウントされた時にエラーをクリア
  useEffect(() => {
    clearError();
    setError('');
  }, [clearError]);

  // エラーコードに基づく詳細なエラーハンドリング
  const handleErrorWithCodeHandling = (errorMessage: string, errorCode?: string) => {
    const errorObject = {
      message: errorMessage,
      code: errorCode,
    };
    
    const detailedError = createDetailedError(errorObject);
    const userFriendlyMessage = getErrorMessage(detailedError);
    const recommendedAction = getRecommendedAction(detailedError);
    
    setError(userFriendlyMessage);
    
    // エラーコードに基づくアクション実行
    switch (recommendedAction) {
      case 'FOCUS_EMAIL':
        setTimeout(() => emailRef.current?.focus(), 100);
        break;
      case 'FOCUS_PASSWORD':
        setTimeout(() => passwordRef.current?.focus(), 100);
        break;
      case 'HIGHLIGHT_REQUIRED':
        // 必須フィールドのハイライト（簡易実装）
        if (!email) {
          setTimeout(() => emailRef.current?.focus(), 100);
        } else if (!password) {
          setTimeout(() => passwordRef.current?.focus(), 100);
        }
        break;
      case 'LOGOUT':
      case 'REDIRECT_LOGIN':
        // 既にログインページにいるのでアクション不要
        break;
    }
    
    // ログインエラーの場合は詳細なトーストも表示
    if (isLoginError(detailedError)) {
      const toastOptions = createToastOptions(detailedError);
      toast(toastOptions);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    // 入力時にエラーをクリア
    if (error) {
      setError('');
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearError();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // 成功時の処理 - AuthContextが認証状態を管理するため、
        // isAuthenticatedの変更でuseEffectによりダッシュボードに自動遷移される
      } else {
        // エラーはAuthContextで設定されるため、
        // authErrorの変更でuseEffectによりローカルエラーに反映される
        if (result.error) {
          handleErrorWithCodeHandling(result.error);
        }
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      
      // 予期しないエラーの場合のフォールバック
      let errorMessage = 'ログイン中にエラーが発生しました。';
      let errorCode = undefined;
      
      if (err.response?.data?.code) {
        errorCode = err.response.data.code;
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        errorMessage = err.errors[0];
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      handleErrorWithCodeHandling(errorMessage, errorCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング状態の統合（AuthContextとローカル状態）
  const isLoggingIn = isSubmitting || isLoading;
  
  // エラーメッセージの統合（ローカルエラーとAuthContextエラー）
  const displayError = error || authError;

  // ログイン中の場合はローディング表示
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">認証情報を確認中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ログイン</CardTitle>
          <CardDescription className="text-center">
            アカウントにログインして続ける
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                ref={emailRef}
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isSubmitting}
                className={error && !email ? 'border-red-500 dark:border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                disabled={isSubmitting}
                className={error && !password ? 'border-red-500 dark:border-red-500' : ''}
              />
            </div>

            {displayError && (
              <Alert variant="destructive">
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            アカウントをお持ちでない方は
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={() => navigate('/signup')}
              disabled={isSubmitting}
            >
              新規登録
            </Button>
            へ
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login; 
