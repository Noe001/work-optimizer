"use client"

import type React from "react"
import { useState, type FormEvent, type ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle2, XCircle, Circle } from "lucide-react"

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface Validation {
  username: { isValid: boolean }
  email: { isValid: boolean }
  password: {
    hasMinLength: boolean
    hasNumber: boolean
    hasLetter: boolean
  }
  confirmPassword: { isValid: boolean }
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [validation, setValidation] = useState<Validation>({
    username: { isValid: false },
    email: { isValid: false },
    password: {
      hasMinLength: false,
      hasNumber: false,
      hasLetter: false,
    },
    confirmPassword: { isValid: false },
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "username":
        setValidation((prev) => ({
          ...prev,
          username: { isValid: /^[a-zA-Z0-9_-]{3,20}$/.test(value) },
        }))
        break
      case "email":
        setValidation((prev) => ({
          ...prev,
          email: { isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
        }))
        break
      case "password":
        setValidation((prev) => ({
          ...prev,
          password: {
            hasMinLength: value.length >= 8,
            hasNumber: /\d/.test(value),
            hasLetter: /[a-zA-Z]/.test(value),
          },
        }))
        break
      case "confirmPassword":
        setValidation((prev) => ({
          ...prev,
          confirmPassword: { isValid: value === formData.password },
        }))
        break
    }
  }

  const isFormValid = () => {
    return (
      validation.username.isValid &&
      validation.email.isValid &&
      validation.password.hasMinLength &&
      validation.password.hasNumber &&
      validation.password.hasLetter &&
      validation.confirmPassword.isValid
    )
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isFormValid()) {
      console.log("Form submitted:", formData)
      // Here you would typically send the data to your server
    }
  }

  const ValidationItem: React.FC<{
    isValid: boolean | null
    message: string
  }> = ({ isValid, message }) => (
    <div className="flex items-center space-x-2 text-sm">
      {isValid === null ? (
        <Circle className="h-4 w-4 text-gray-300" />
      ) : isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={isValid === null ? "text-gray-400" : isValid ? "text-green-600" : "text-red-600"}>
        {message}
      </span>
    </div>
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">アカウント作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder=""
                required
                className={`w-full ${
                  formData.username ? (validation.username.isValid ? "border-green-500" : "border-red-500") : ""
                }`}
              />
              <ValidationItem
                isValid={formData.username ? validation.username.isValid : null}
                message="3〜20文字の半角英数字、ハイフン、アンダースコアが使用可能です"
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
                placeholder=""
                required
                className={`w-full ${
                  formData.email ? (validation.email.isValid ? "border-green-500" : "border-red-500") : ""
                }`}
              />
              <ValidationItem
                isValid={formData.email ? validation.email.isValid : null}
                message="有効なメールアドレスを入力してください"
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
                  className={`w-full pr-10 ${
                    formData.password
                      ? (
                          validation.password.hasMinLength &&
                            validation.password.hasNumber &&
                            validation.password.hasLetter
                        )
                        ? "border-green-500"
                        : "border-red-500"
                      : ""
                  }`}
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
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder=""
                  required
                  className={`w-full pr-10 ${
                    formData.confirmPassword
                      ? validation.confirmPassword.isValid
                        ? "border-green-500"
                        : "border-red-500"
                      : ""
                  }`}
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

            <Button type="submit" className="w-full" disabled={!isFormValid()}>
              アカウント作成
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
  )
}

export default SignupPage

