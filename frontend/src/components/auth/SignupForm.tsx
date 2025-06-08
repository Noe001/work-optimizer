import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { SignupRequest } from '../../types/api';

// バリデーションスキーマ
const signupSchema = z.object({
  name: z.string()
    .min(2, '名前は2文字以上で入力してください')
    .max(50, '名前は50文字以下で入力してください'),
  email: z.string()
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以下で入力してください'),
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(128, 'パスワードは128文字以下で入力してください'),
  password_confirmation: z.string(),
  department: z.string()
    .max(100, '部署名は100文字以下で入力してください')
    .optional(),
  position: z.string()
    .max(100, '役職は100文字以下で入力してください')
    .optional(),
  bio: z.string()
    .max(1000, '自己紹介は1000文字以下で入力してください')
    .optional()
}).refine((data) => data.password === data.password_confirmation, {
  message: 'パスワードが一致しません',
  path: ['password_confirmation']
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      department: '',
      position: '',
      bio: ''
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const signupData: SignupRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        department: data.department || undefined,
        position: data.position || undefined,
        bio: data.bio || undefined
      };

      const success = await signup(signupData);
      
      if (success) {
        onSuccess?.();
      } else {
        setError('アカウント作成に失敗しました。入力内容を確認してください。');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // APIエラーの場合
      if (err.errors && Array.isArray(err.errors)) {
        // フィールド固有のエラーを設定
        err.errors.forEach((errorMsg: string) => {
          if (errorMsg.includes('メール')) {
            setFieldError('email', { message: errorMsg });
          } else if (errorMsg.includes('パスワード')) {
            setFieldError('password', { message: errorMsg });
          } else if (errorMsg.includes('名前')) {
            setFieldError('name', { message: errorMsg });
          }
        });
        setError(err.message || 'アカウント作成に失敗しました');
      } else {
        setError(err.message || 'アカウント作成中にエラーが発生しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">アカウント作成</CardTitle>
        <CardDescription className="text-center">
          新しいアカウントを作成してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 名前 */}
          <div className="space-y-2">
            <Label htmlFor="name">名前 *</Label>
            <Input
              id="name"
              type="text"
              placeholder="山田太郎"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* メールアドレス */}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@company.com"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* 部署 */}
          <div className="space-y-2">
            <Label htmlFor="department">部署</Label>
            <Input
              id="department"
              type="text"
              placeholder="営業部"
              {...register('department')}
              className={errors.department ? 'border-red-500' : ''}
            />
            {errors.department && (
              <p className="text-sm text-red-500">{errors.department.message}</p>
            )}
          </div>

          {/* 役職 */}
          <div className="space-y-2">
            <Label htmlFor="position">役職</Label>
            <Input
              id="position"
              type="text"
              placeholder="主任"
              {...register('position')}
              className={errors.position ? 'border-red-500' : ''}
            />
            {errors.position && (
              <p className="text-sm text-red-500">{errors.position.message}</p>
            )}
          </div>

          {/* パスワード */}
          <div className="space-y-2">
            <Label htmlFor="password">パスワード *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8文字以上"
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* パスワード確認 */}
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">パスワード確認 *</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showPasswordConfirmation ? 'text' : 'password'}
                placeholder="パスワードを再入力"
                {...register('password_confirmation')}
                className={errors.password_confirmation ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswordConfirmation ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
            )}
          </div>

          {/* 自己紹介 */}
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <textarea
              id="bio"
              placeholder="簡単な自己紹介をお書きください"
              {...register('bio')}
              className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.bio ? 'border-red-500' : ''
              }`}
              rows={3}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                作成中...
              </>
            ) : (
              'アカウント作成'
            )}
          </Button>

          {onSwitchToLogin && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                すでにアカウントをお持ちですか？{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-teal-primary hover:text-teal-dark font-medium"
                >
                  ログイン
                </button>
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}; 
