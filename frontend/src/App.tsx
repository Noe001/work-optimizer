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
import TaskManagerView from './pages/general/TaskManager';
import TeamChatView from './pages/general/TeamChat';
import KnowledgeBaseView from './pages/general/KnowledgeBase';
import ManualView from './pages/general/Manual';
import MeetingView from './pages/general/Meeting';
import ProfileView from './pages/general/Profile';
import SettingsView from './pages/general/Settings';
import CreateTaskView from './pages/general/CreateTask';
import AttendanceView from './pages/general/Attendance';

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
        
        {/* タスク管理 */}
        <Route path="/tasks" element={
          <ProtectedRoute>
            <TaskManagerView />
          </ProtectedRoute>
        } />
        
        {/* タスク作成 */}
        <Route path="/tasks/create" element={
          <ProtectedRoute>
            <CreateTaskView />
          </ProtectedRoute>
        } />
        
        {/* タスク編集 */}
        <Route path="/tasks/edit/:taskId" element={
          <ProtectedRoute>
            <CreateTaskView />
          </ProtectedRoute>
        } />

        {/* チーム会話 */}
        <Route path="/team_chat" element={
          <ProtectedRoute>
            <TeamChatView />
          </ProtectedRoute>
        } />

        {/* 勤怠管理 */}
        <Route path="/attendance" element={
          <ProtectedRoute>
            <AttendanceView />
          </ProtectedRoute>
        } />

        {/* ナレッジベース */}
        <Route path="/knowledge_base" element={
          <ProtectedRoute>
            <KnowledgeBaseView />
          </ProtectedRoute>
        } />

        {/* マニュアル */}
        <Route path="/manual" element={
          <ProtectedRoute>
            <ManualView />
          </ProtectedRoute>
        } />

        {/* ミーティング */}
        <Route path="/meeting" element={
          <ProtectedRoute>
            <MeetingView />
          </ProtectedRoute>
        } />

        {/* プロフィール */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileView />
          </ProtectedRoute>
        } />

        {/* 設定 */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsView />
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
