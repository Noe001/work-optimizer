import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard.tsx';
import ManualView from './pages/general/Manual.tsx';
import LoginView from './pages/general/Login.tsx';
import SignUpView from './pages/general/Signup.tsx';
import KnowledgeBaseView from './pages/general/KnowledgeBase.tsx';
import MeetingView from './pages/general/Meeting.tsx';
import NotificationCenterView from './pages/general/NotificationCenter.tsx';
import ProfileView from './pages/general/Profile.tsx';
import SettingsView from './pages/general/Settings.tsx';
import WorkLifeBalanceView from './pages/general/WorkLifeBalance.tsx';
import TeamChatView from './pages/general/TeamChat.tsx';
import TaskManagerView from './pages/general/TaskManager.tsx';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<ManualView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/signup" element={<SignUpView />} />
      <Route path="/knowledge_base" element={<KnowledgeBaseView />} />
      <Route path="/meeting" element={<MeetingView />} />
      <Route path="/notification_center" element={<NotificationCenterView />} />
      <Route path="/profile" element={<ProfileView />} />
      <Route path="/settings" element={<SettingsView />} />
      <Route path="/work_life_balance" element={<WorkLifeBalanceView />} />
      <Route path="/team_chat" element={<TeamChatView />} />
      <Route path="/tasks" element={<TaskManagerView />} />
    </Routes>
  </Router>
);

export default App;
