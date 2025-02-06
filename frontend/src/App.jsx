import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard';
import CreateManualView from './pages/general/CreateManual';
import LoginView from './pages/login';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<CreateManualView />} />
      <Route path="/login" element={<LoginView />} />
    </Routes>
  </Router>
);

export default App;
