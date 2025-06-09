import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, User, Edit2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import userService from '@/services/userService';
import { 
  createDetailedError,
  getErrorMessage, 
  getRecommendedAction,
  createToastOptions,
  isPasswordChangeError 
} from '@/utils/errorHandler';
import { createAvatarProps } from '@/utils/avatarUtils';
import { ASSETS_CONFIG } from '@/config/app';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  department: string | undefined;
  position: string | undefined;
  bio: string | undefined;
  avatarUrl: string | undefined;
  createdAt?: string;
  updatedAt?: string;
}


// バリデーションエラーの型定義
interface ValidationErrors {
  name?: string;
  email?: string;
  department?: string;
  position?: string;
  bio?: string;
}

// シンプルなスケルトンコンポーネント
const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ローディングスケルトンコンポーネント
const ProfileSkeleton: React.FC = () => (
  <>
    <Header />
    <div className="p-6 bg-background min-h-screen bg-gray-50">
      <div className="mb-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

// ローディングオーバーレイコンポーネント
const LoadingOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>更新中...</span>
    </div>
  </div>
);

// パスワード変更カードコンポーネント
const PasswordChangeCard: React.FC = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const { toast } = useToast();

  // フィールドへの参照を追加
  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const validatePassword = () => {
    const errors: {[key: string]: string} = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = '現在のパスワードを入力してください。';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = '新しいパスワードを入力してください。';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'パスワードは6文字以上で入力してください。';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'パスワードの確認を入力してください。';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません。';
    }

    return errors;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));

    // リアルタイムバリデーション
    if (passwordErrors[name]) {
      const newErrors = { ...passwordErrors };
      delete newErrors[name];
      setPasswordErrors(newErrors);
    }
  };

  // エラーコードに基づくエラーハンドリング
  const handlePasswordError = (error: any) => {
    // エラーハンドリングユーティリティを使用
    const detailedError = createDetailedError(error);
    const userFriendlyMessage = getErrorMessage(detailedError);
    const recommendedAction = getRecommendedAction(detailedError);
    
    // フィールド固有のエラーを設定
    const fieldErrors: {[key: string]: string} = {};
    
    // エラーコードに基づくフィールドフォーカス
    switch (recommendedAction) {
      case 'FOCUS_CURRENT_PASSWORD':
        fieldErrors.currentPassword = userFriendlyMessage;
        setTimeout(() => currentPasswordRef.current?.focus(), 100);
        break;
      case 'FOCUS_NEW_PASSWORD':
        fieldErrors.newPassword = userFriendlyMessage;
        setTimeout(() => newPasswordRef.current?.focus(), 100);
        break;
      case 'FOCUS_CONFIRM_PASSWORD':
        fieldErrors.confirmPassword = userFriendlyMessage;
        setTimeout(() => confirmPasswordRef.current?.focus(), 100);
        break;
      case 'HIGHLIGHT_REQUIRED':
        // 必須フィールドのハイライト
        if (!passwordData.currentPassword) {
          fieldErrors.currentPassword = '現在のパスワードを入力してください。';
          setTimeout(() => currentPasswordRef.current?.focus(), 100);
        } else if (!passwordData.newPassword) {
          fieldErrors.newPassword = '新しいパスワードを入力してください。';
          setTimeout(() => newPasswordRef.current?.focus(), 100);
        } else if (!passwordData.confirmPassword) {
          fieldErrors.confirmPassword = 'パスワードの確認を入力してください。';
          setTimeout(() => confirmPasswordRef.current?.focus(), 100);
        }
        break;
      case 'SHOW_RETRY':
        // リトライ用の一般的なエラー表示
        fieldErrors.general = userFriendlyMessage;
        break;
      default:
        fieldErrors.general = userFriendlyMessage;
    }
    
    setPasswordErrors(fieldErrors);
    
    // パスワード変更エラーの場合は詳細なトーストも表示
    if (isPasswordChangeError(detailedError)) {
      const toastOptions = createToastOptions(detailedError);
      toast(toastOptions);
    } else {
      // 一般的なエラーの場合
      toast({
        title: "エラー",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await userService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (response.success) {
        toast({
          title: "成功",
          description: "パスワードが正常に変更されました。",
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordErrors({});
      } else {
        // レスポンスにエラーがある場合
        handlePasswordError({
          response: {
            data: {
              message: response.message,
              code: response.code,
              errors: response.errors
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      handlePasswordError(error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">パスワード変更</CardTitle>
        <p className="text-sm text-muted-foreground">セキュリティのため、定期的にパスワードを変更することをお勧めします。</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              現在のパスワード <span className="text-red-500" aria-label="必須項目">*</span>
            </label>
            <Input 
              id="currentPassword"
              type="password" 
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={`w-full transition-colors ${passwordErrors.currentPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              disabled={isChangingPassword}
              aria-invalid={!!passwordErrors.currentPassword}
              aria-describedby={passwordErrors.currentPassword ? "current-password-error" : undefined}
              autoComplete="current-password"
              ref={currentPasswordRef}
            />
            {passwordErrors.currentPassword && (
              <p id="current-password-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                <span className="mr-1">⚠️</span>
                {passwordErrors.currentPassword}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワード <span className="text-red-500" aria-label="必須項目">*</span>
            </label>
            <Input 
              id="newPassword"
              type="password" 
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={`w-full transition-colors ${passwordErrors.newPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              disabled={isChangingPassword}
              aria-invalid={!!passwordErrors.newPassword}
              aria-describedby={passwordErrors.newPassword ? "new-password-error" : "new-password-help"}
              autoComplete="new-password"
              ref={newPasswordRef}
            />
            <p id="new-password-help" className="text-xs text-gray-500 mt-1">
              6文字以上で入力してください
            </p>
            {passwordErrors.newPassword && (
              <p id="new-password-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                <span className="mr-1">⚠️</span>
                {passwordErrors.newPassword}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              新しいパスワードの確認 <span className="text-red-500" aria-label="必須項目">*</span>
            </label>
            <Input 
              id="confirmPassword"
              type="password" 
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className={`w-full transition-colors ${passwordErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
              disabled={isChangingPassword}
              aria-invalid={!!passwordErrors.confirmPassword}
              aria-describedby={passwordErrors.confirmPassword ? "confirm-password-error" : undefined}
              autoComplete="new-password"
              ref={confirmPasswordRef}
            />
            {passwordErrors.confirmPassword && (
              <p id="confirm-password-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                <span className="mr-1">⚠️</span>
                {passwordErrors.confirmPassword}
              </p>
            )}
          </div>
          <div className="pt-2">
            <Button 
              type="submit" 
              disabled={isChangingPassword}
              className="w-full sm:w-auto"
              aria-label={isChangingPassword ? "パスワードを変更中" : "パスワードを変更"}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  変更中...
                </>
              ) : (
                'パスワードを変更'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    department: undefined,
    position: undefined,
    bio: undefined,
    avatarUrl: undefined,
  });
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  
  // AbortControllerを使用してリクエストをキャンセル可能にする
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // データ取得の重複を防ぐフラグ
  const fetchingRef = useRef(false);

  // バリデーション関数
  const validateProfile = (profileData: UserProfile): ValidationErrors => {
    const errors: ValidationErrors = {};

    // 名前のバリデーション
    if (!profileData.name.trim()) {
      errors.name = '名前は必須です。';
    } else if (profileData.name.length > 50) {
      errors.name = '名前は50文字以内で入力してください。';
    }

    // メールアドレスのバリデーション
    if (!profileData.email.trim()) {
      errors.email = 'メールアドレスは必須です。';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        errors.email = '有効なメールアドレスを入力してください。';
      } else if (profileData.email.length > 255) {
        errors.email = 'メールアドレスは255文字以内で入力してください。';
      }
    }

    // 部門のバリデーション
    if (profileData.department && profileData.department.length > 100) {
      errors.department = '部門名は100文字以内で入力してください。';
    }

    // ポジションのバリデーション
    if (profileData.position && profileData.position.length > 100) {
      errors.position = 'ポジションは100文字以内で入力してください。';
    }

    // 自己紹介のバリデーション
    if (profileData.bio && profileData.bio.length > 1000) {
      errors.bio = '自己紹介は1000文字以内で入力してください。';
    }

    return errors;
  };

  // プロフィールデータを取得
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isMountedRef.current) return;
      
      try {
        setIsLoading(true);
        
        const response = await userService.getCurrentUser();
        
        if (!isMountedRef.current) return;
        
        if (response.success && response.data) {
          const userData = response.data as any; // UserSerializer から返されるデータ
          
          const profileData: UserProfile = {
            id: userData.id,
            name: userData.name || '',
            email: userData.email || '',
            department: userData.department || undefined,
            position: userData.position || undefined,
            bio: userData.bio || undefined,
            avatarUrl: userData.avatarUrl || undefined,
          };
          
          setProfile(profileData);
        } else {
          console.error('Failed to fetch profile:', response.message);
          toast({
            title: "エラー",
            description: "プロフィール情報の取得に失敗しました。",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        if (isMountedRef.current) {
          toast({
            title: "エラー",
            description: "プロフィール情報の取得中にエラーが発生しました。",
            variant: "destructive",
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    
    // クリーンアップ関数
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  


  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      fetchingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ローディング中はスケルトンを表示
  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    // リアルタイムバリデーション
    if (validationErrors[name as keyof ValidationErrors]) {
      const newErrors = { ...validationErrors };
      delete newErrors[name as keyof ValidationErrors];
      setValidationErrors(newErrors);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ドラッグ&ドロップ機能
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const processFile = async (file: File) => {
    // ファイル形式チェック
    if (!ASSETS_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ 
        title: "エラー", 
        description: "JPEG、PNG、WebP、GIF形式のみ対応しています。", 
        variant: "destructive" 
      });
      return;
    }

    // ファイルサイズチェック
    if (file.size > ASSETS_CONFIG.MAX_AVATAR_SIZE) {
      toast({ 
        title: "エラー", 
        description: "ファイルサイズは5MB以下にしてください。", 
        variant: "destructive" 
      });
      return;
    }

    // 画像の寸法チェック
    const img = new Image();
    const imageUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(imageUrl);
      
      // 最大解像度チェック
      const { width: maxWidth, height: maxHeight } = ASSETS_CONFIG.MAX_IMAGE_DIMENSIONS;
      if (img.width > maxWidth || img.height > maxHeight) {
        toast({ 
          title: "エラー", 
          description: `画像サイズは${maxWidth}x${maxHeight}ピクセル以下にしてください。`, 
          variant: "destructive" 
        });
        return;
      }

      if (!isMountedRef.current) return;

      setIsUploading(true);
      try {
        // 画像を圧縮してプレビュー表示
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // プレビュー用にリサイズ
        const maxSize = ASSETS_CONFIG.AVATAR_PREVIEW_SIZE;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        if (isMountedRef.current) {
          // プレビューを即座に更新
          setProfile(prev => ({
            ...prev,
            avatarUrl: compressedDataUrl
          }));

          // 即座にサーバーに保存
          const profileData: UserProfile = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            department: profile.department,
            position: profile.position,
            bio: profile.bio,
            avatarUrl: compressedDataUrl
          };

          // APIのupdateUserProfileDataは null を期待するため、undefinedをnullに変換
          const response = await userService.updateUserProfileData({
            name: profileData.name,
            email: profileData.email,
            department: profileData.department || null,
            position: profileData.position || null,
            bio: profileData.bio || null,
            avatarUrl: compressedDataUrl || null
          });

          if (response.success) {
            toast({ 
              title: "成功", 
              description: "プロフィール画像が正常に更新されました。" 
            });
            
            // プロフィールデータを再取得して最新の状態に更新
            try {
              const updatedResponse = await userService.getCurrentUser();
              
              if (updatedResponse.success && updatedResponse.data) {
                const userData = updatedResponse.data as any; // UserSerializer から返されるデータ
                
                const updatedProfileData: UserProfile = {
                  id: userData.id,
                  name: userData.name || '',
                  email: userData.email || '',
                  department: userData.department || undefined,
                  position: userData.position || undefined,
                  bio: userData.bio || undefined,
                  avatarUrl: userData.avatarUrl || undefined,
                };
                
                setProfile(updatedProfileData);
                
                // AuthContextも最新の情報で更新
                updateUser(updatedProfileData);
              }
            } catch (error) {
              console.error('Failed to refresh profile data:', error);
            }
          } else {
            // 保存に失敗した場合は元の画像に戻す
            setProfile(prev => ({
              ...prev,
              avatarUrl: profile.avatarUrl
            }));
            toast({ 
              title: "エラー", 
              description: response.message || "画像の保存に失敗しました。", 
              variant: "destructive" 
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to process image:', error);
        if (isMountedRef.current) {
          // エラーが発生した場合は元の画像に戻す
        setProfile(prev => ({
          ...prev,
            avatarUrl: profile.avatarUrl
          }));
          toast({ 
            title: "エラー", 
            description: "画像の処理に失敗しました。", 
            variant: "destructive" 
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      if (isMountedRef.current) {
        toast({ 
          title: "エラー", 
          description: "画像の読み込みに失敗しました。", 
          variant: "destructive" 
        });
        setIsUploading(false);
      }
    };
    
    img.src = imageUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processFile(file);
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
    setIsEditing(false);
    setOriginalProfile(null);
    setValidationErrors({});
  };

  const hasChanges = () => {
    if (!originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  };

  const saveProfile = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsUpdating(true);
      
      // バリデーション実行
      const errors = validateProfile(profile);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast({
          title: "入力エラー",
          description: "入力内容を確認してください。",
          variant: "destructive",
        });
        return;
      }

      const response = await userService.updateUserProfileData({
        name: profile.name,
        email: profile.email,
        department: profile.department || null,
        position: profile.position || null,
        bio: profile.bio || null,
        avatarUrl: profile.avatarUrl || null
      });
      
      if (!isMountedRef.current) return;
      
      if (response.success) {
        toast({
          title: "成功",
          description: "プロフィールが正常に更新されました。",
        });
        setIsEditing(false);
        setOriginalProfile(null); 
        setValidationErrors({});
        
        // プロフィールデータを再取得して最新の状態に更新
        try {
          const updatedResponse = await userService.getCurrentUser();
          
          if (updatedResponse.success && updatedResponse.data) {
            const userData = updatedResponse.data as any; // UserSerializer から返されるデータ
            
            const updatedProfileData: UserProfile = {
              id: userData.id,
              name: userData.name || '',
              email: userData.email || '',
              department: userData.department || undefined,
              position: userData.position || undefined,
              bio: userData.bio || undefined,
              avatarUrl: userData.avatarUrl || undefined,
            };
            
            setProfile(updatedProfileData);
            
            // AuthContextも最新の情報で更新
            updateUser(updatedProfileData);
          }
        } catch (error) {
          console.error('Failed to refresh profile data:', error);
        }
      } else {
        toast({
          title: "エラー",
          description: response.message || "プロフィールの更新に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      if (isMountedRef.current) {
      toast({
        title: "エラー",
        description: error.message || "プロフィールの更新中に予期せぬエラーが発生しました。",
        variant: "destructive",
      });
      }
    } finally {
      if (isMountedRef.current) {
      setIsUpdating(false);
      }
    }
  };

  return (
    <>
      <Header />
      <div className="p-4 sm:p-6 bg-background min-h-screen bg-gray-50">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">ダッシュボードに戻る</span>
            <span className="sm:hidden">戻る</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
            <User className="h-5 w-5 mr-2" />
            プロフィール
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">あなたのプロフィール情報を確認・編集できます。</p>
        </div>

        <Card className="relative">
          {isUpdating && <LoadingOverlay />}
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div 
                className={`relative flex-shrink-0 group ${isDragOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <img
                  {...createAvatarProps(profile.avatarUrl, profile.name, 'プロフィール画像')}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full cursor-pointer hover:opacity-80 transition-all duration-200 ${isUploading ? 'opacity-50' : ''} ${isDragOver ? 'scale-105' : ''}`}
                  onClick={handleAvatarClick}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-primary" />
                  </div>
                )}
                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-teal-primary bg-opacity-20 rounded-full">
                    <span className="text-teal-primary text-xs font-medium">ドロップ</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || isUpdating}
                  aria-label="プロフィール画像をアップロード"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-0 right-0 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow group-hover:scale-110"
                  onClick={handleAvatarClick}
                  disabled={isUploading || isUpdating}
                  aria-label="プロフィール画像を変更"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold">{profile.name || '名前未設定'}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {profile.department || '部門未設定'} - {profile.position || 'ポジション未設定'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                <Textarea
                  name="bio"
                  value={profile.bio || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(e)}
                  disabled={!isEditing || isUpdating}
                  className={`w-full transition-colors ${validationErrors.bio ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  placeholder="自己紹介を入力してください"
                  rows={4}
                />
                {validationErrors.bio && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {validationErrors.bio}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    名前 <span className="text-red-500" aria-label="必須項目">*</span>
                  </label>
                <Input
                    id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                    disabled={!isEditing || isUpdating}
                    className={`w-full transition-colors ${validationErrors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    required
                    aria-invalid={!!validationErrors.name}
                    aria-describedby={validationErrors.name ? "name-error" : undefined}
                  />
                  {validationErrors.name && (
                    <p id="name-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                      <span className="mr-1">⚠️</span>
                      {validationErrors.name}
                    </p>
                  )}
              </div>
              <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス <span className="text-red-500" aria-label="必須項目">*</span>
                  </label>
                <Input
                    id="email"
                  name="email"
                    type="email"
                  value={profile.email}
                  onChange={handleInputChange}
                    disabled={!isEditing || isUpdating}
                    className={`w-full transition-colors ${validationErrors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    required
                    aria-invalid={!!validationErrors.email}
                    aria-describedby={validationErrors.email ? "email-error" : undefined}
                  />
                  {validationErrors.email && (
                    <p id="email-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                      <span className="mr-1">⚠️</span>
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">部門</label>
                <Input
                    id="department"
                  name="department"
                    value={profile.department || ''}
                  onChange={handleInputChange}
                    disabled={!isEditing || isUpdating}
                    className={`w-full transition-colors ${validationErrors.department ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    aria-invalid={!!validationErrors.department}
                    aria-describedby={validationErrors.department ? "department-error" : undefined}
                  />
                  {validationErrors.department && (
                    <p id="department-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                      <span className="mr-1">⚠️</span>
                      {validationErrors.department}
                    </p>
                  )}
              </div>
              <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">ポジション</label>
                <Input
                    id="position"
                  name="position"
                    value={profile.position || ''}
                  onChange={handleInputChange}
                    disabled={!isEditing || isUpdating}
                    className={`w-full transition-colors ${validationErrors.position ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                    aria-invalid={!!validationErrors.position}
                    aria-describedby={validationErrors.position ? "position-error" : undefined}
                  />
                  {validationErrors.position && (
                    <p id="position-error" className="text-red-500 text-sm mt-1 flex items-center" role="alert">
                      <span className="mr-1">⚠️</span>
                      {validationErrors.position}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end mt-6 space-y-2 sm:space-y-0 sm:space-x-3">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="w-full sm:w-auto order-2 sm:order-1"
                    aria-label="変更をキャンセルして編集モードを終了"
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={saveProfile}
                    disabled={isUpdating || !hasChanges()}
                    className="w-full sm:w-auto order-1 sm:order-2"
                    aria-label={isUpdating ? "プロフィールを保存中" : "プロフィールの変更を保存"}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    setOriginalProfile(profile);
                    setIsEditing(true);
                  }}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                  aria-label="プロフィール情報を編集"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  編集
                </Button>
              )}
              </div>
          </CardContent>
        </Card>

        <PasswordChangeCard />
      </div>
    </>
  );
};

export default Profile; 
