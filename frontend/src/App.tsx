import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard.tsx';
import ManualView from './pages/general/Manual.tsx';
import LoginView from './pages/general/Login.tsx';
import SignUpView from './pages/general/Signup.tsx';
import KnowledgeBaseView from './pages/general/KnowledgeBase.tsx';
import MeetingView from './pages/general/Meeting.tsx';
import NotificationCenterView from './pages/general/NotificationCenter.tsx';
import ProfileView from './pages/general/Profile.tsx';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<ManualView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/signup" element={<SignUpView />} />
      <Route path="/knowledge-base" element={<KnowledgeBaseView />} />
      <Route path="/meeting" element={<MeetingView />} />
      <Route path="/notification_center" element={<NotificationCenterView />} />
      <Route path="/profile" element={<ProfileView />} />
    </Routes>
  </Router>
);

export default App;
