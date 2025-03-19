import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 認証コンテキスト
import { AuthProvider } from './contexts/AuthContext';

// 認証が必要なルートのプロテクター
import ProtectedRoute from './components/ProtectedRoute';

// ビューのインポート
import LoginView from './pages/general/Login';
import SignupView from './pages/general/Signup';
import DashboardView from './pages/general/Dashboard';
import OrganizationsView from './pages/general/Organizations';
import OrganizationDetailView from './pages/general/OrganizationDetail';

const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        {/* 認証不要のルート */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/signup" element={<SignupView />} />

        {/* 認証が必要なルート */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardView />
          </ProtectedRoute>
        } />
        
        <Route path="/organizations" element={
          <ProtectedRoute>
            <OrganizationsView />
          </ProtectedRoute>
        } />
        
        <Route path="/organizations/:id" element={
          <ProtectedRoute>
            <OrganizationDetailView />
          </ProtectedRoute>
        } />

        {/* 不明なルートは全てProtectedRouteでラップして、認証されていない場合はログインにリダイレクト */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
