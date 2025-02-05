import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard';
import CreateManualView from './pages/general/CreateManual';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<CreateManualView />} />
    </Routes>
  </Router>
);

export default App;
