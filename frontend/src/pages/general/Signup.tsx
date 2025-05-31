"use client"

import React, { useState, useEffect, type FormEvent, type ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, XCircle, Circle } from 'lucide-react';
import { SignupRequest } from '@/types/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  createUnifiedError,
  formatValidationErrors 
} from '@/utils/errorHandler';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Validation {
  name: { isValid: boolean; error?: string };
  email: { isValid: boolean; error?: string };
  password: {
    hasMinLength: boolean;
    hasNumber: boolean;
    hasLetter: boolean;
    error?: string;
  };
  confirmPassword: { isValid: boolean; error?: string };
}

const SignupView: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading: authLoading, error: authError, clearError } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [validation, setValidation] = useState<Validation>({
    name: { isValid: false },
    email: { isValid: false },
    password: {
      hasMinLength: false,
      hasNumber: false,
      hasLetter: false,
    },
    confirmPassword: { isValid: false },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // フィールドへの参照
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 認証済みの場合はダッシュボードにリダイレクト
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // AuthContextのエラーを監視してローカルエラーに反映
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // コンポーネントがマウントされた時にエラーをクリア
  useEffect(() => {
    clearError();
    setError(null);
  }, [clearError]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
    
    // 入力時にエラーをクリア
    if (error) {
      setError(null);
      clearError();
    }
  };

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        setValidation((prev) => ({
          ...prev,
          name: { isValid: /^[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF_-]{3,20}$/.test(value) },
        }));
        break;
      case 'email':
        setValidation((prev) => ({
          ...prev,
          email: { isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
        }));
        break;
      case 'password':
        setValidation((prev) => ({
          ...prev,
          password: {
            hasMinLength: value.length >= 8,
            hasNumber: /\d/.test(value),
            hasLetter: /[a-zA-Z]/.test(value),
          },
        }));
        break;
      case 'confirmPassword':
        setValidation((prev) => ({
          ...prev,
          confirmPassword: { isValid: value === formData.password },
        }));
        break;
    }
  };

  const isFormValid = () => {
    return (
      validation.name.isValid &&
      validation.email.isValid &&
      validation.password.hasMinLength &&
      validation.password.hasNumber &&
      validation.password.hasLetter &&
      validation.confirmPassword.isValid
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    clearError();

    if (!isFormValid()) {
      setError('すべての項目を正しく入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const signupData: SignupRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        department: '',
        position: '',
        bio: ''
      };
      
      // AuthContextのsignup関数を使用して認証状態の一貫性を保つ
      const result = await signup(signupData);
      
      if (result.success) {
        // 成功時の処理 - AuthContextが認証状態を管理するため、
        // isAuthenticatedの変更でuseEffectによりダッシュボードに自動遷移される
        // navigate('/dashboard'); // このコードは不要（useEffectで自動実行される）
      } else {
        // エラーはAuthContextで設定されるため、
        // authErrorの変更でuseEffectによりローカルエラーに反映される
        if (result.error) {
          setError(result.error);
        }
      }
    } catch (err: any) {
      console.error('Signup error details:', err);
      
      // サーバーエラーの詳細処理を使用
      handleServerError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // サーバーエラーの詳細処理
  const handleServerError = (error: any) => {
    const unifiedError = createUnifiedError(error);
    
    // フィールド固有のエラーをバリデーション状態に反映
    const newValidation = { ...validation };
    
    if (unifiedError.fieldErrors.name) {
      newValidation.name.error = unifiedError.fieldErrors.name;
      setTimeout(() => nameRef.current?.focus(), 100);
    }
    
    if (unifiedError.fieldErrors.email) {
      newValidation.email.error = unifiedError.fieldErrors.email;
      setTimeout(() => emailRef.current?.focus(), 100);
    }
    
    if (unifiedError.fieldErrors.password) {
      newValidation.password.error = unifiedError.fieldErrors.password;
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
    
    if (unifiedError.fieldErrors.password_confirmation) {
      newValidation.confirmPassword.error = unifiedError.fieldErrors.password_confirmation;
      setTimeout(() => confirmPasswordRef.current?.focus(), 100);
    }
    
    setValidation(newValidation);
    
    // メインエラーメッセージを設定
    if (unifiedError.generalErrors.length > 0) {
      setError(formatValidationErrors(unifiedError.generalErrors));
    } else {
      setError(unifiedError.message);
    }
  };

  const ValidationItem: React.FC<{
    isValid: boolean | null;
    message: string;
    serverError?: string;
  }> = ({ isValid, message, serverError }) => (
    <div className="flex items-center space-x-2 text-sm">
      {isValid === null ? (
        <Circle className="h-4 w-4 text-gray-300" />
      ) : isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={isValid === null ? 'text-gray-400' : isValid ? 'text-green-600' : 'text-red-600'}>
        {message}
      </span>
      {serverError && (
        <div className="text-xs text-red-500 ml-2">
          {serverError}
        </div>
      )}
    </div>
  );

  // ローディング状態の統合（AuthContextとローカル状態）
  const isSubmitting = isLoading || authLoading;
  
  // エラーメッセージの統合（ローカルエラーとAuthContextエラー）
  const displayError = error || authError;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">アカウント作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">ユーザー名</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder=""
                required
                className={`w-full ${
                  formData.name ? (validation.name.isValid ? 'border-green-500' : 'border-red-500') : ''
                }`}
                ref={nameRef}
              />
              <ValidationItem
                isValid={formData.name ? validation.name.isValid : null}
                message="3〜20文字の英数字、ハイフン、アンダースコアが使用可能です"
                serverError={validation.name.error}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={`例: user${Date.now().toString().slice(-4)}@example.com`}
                required
                className={`w-full ${
                  formData.email ? (validation.email.isValid ? 'border-green-500' : 'border-red-500') : ''
                }`}
                ref={emailRef}
              />
              <ValidationItem
                isValid={formData.email ? validation.email.isValid : null}
                message="まだ登録されていない有効なメールアドレスを入力してください"
                serverError={validation.email.error}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                  className={`w-full pr-10 ${
                    formData.password
                      ? validation.password.hasMinLength && validation.password.hasNumber && validation.password.hasLetter
                        ? 'border-green-500'
                        : 'border-red-500'
                      : ''
                  }`}
                  ref={passwordRef}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                <ValidationItem
                  isValid={formData.password ? validation.password.hasMinLength : null}
                  message="8文字以上で入力してください"
                />
                <ValidationItem
                  isValid={formData.password ? validation.password.hasNumber : null}
                  message="数字を含める必要があります"
                />
                <ValidationItem
                  isValid={formData.password ? validation.password.hasLetter : null}
                  message="アルファベットを含める必要があります"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                  className={`w-full pr-10 ${
                    formData.confirmPassword
                      ? validation.confirmPassword.isValid
                        ? 'border-green-500'
                        : 'border-red-500'
                      : ''
                  }`}
                  ref={confirmPasswordRef}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <ValidationItem
                isValid={formData.confirmPassword ? validation.confirmPassword.isValid : null}
                message="パスワードが一致する必要があります"
              />
            </div>

            {displayError && (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border-l-4 border-red-500 shadow-sm animate-pulse">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">エラーが発生しました</div>
                    <div className="mt-1">{displayError}</div>
                    {displayError.includes('メールアドレス') && displayError.includes('登録されています') && (
                      <div className="mt-2 text-xs text-red-500 bg-red-100 p-2 rounded">
                        💡 <strong>ヒント:</strong> 別のメールアドレスを使用してください。例: user{Date.now().toString().slice(-4)}@example.com
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!isFormValid() || isSubmitting}>
              {isSubmitting ? 'アカウント作成中...' : 'アカウント作成'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              すでにアカウントをお持ちの方は
              <a href="/login" className="text-blue-600 hover:underline ml-1">
                ログイン
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupView;

