import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard';
import ManualView from './pages/general/Manual';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<ManualView />} />
    </Routes>
  </Router>
);

export default App;