import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      // ログイン処理のロジックをここに追加
      console.log('Login attempt with:', formData);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const togglePasswordVisibility = (): void => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="p-6 bg-background min-h-screen bg-gray-50">
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl mb-3 text-center">WorkOptimizer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder=""
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                ログイン
              </Button>
              
              <div className="text-center text-sm text-gray-600 mt-4">
                <a href="/signup" className="hover:underline">
                  パスワードを作成
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
