import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
    </Routes>
  </Router>
);

export default App;