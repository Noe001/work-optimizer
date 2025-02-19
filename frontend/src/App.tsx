import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard.tsx';
import ManualView from './pages/general/Manual.tsx';
import LoginView from './pages/general/Login.tsx';
import SignUpView from './pages/general/Signup.tsx';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<ManualView />} />
      <Route path="/login" element={<LoginView />} />
      <Route path="/signup" element={<SignUpView />} />
    </Routes>
  </Router>
);

export default App;
