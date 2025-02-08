import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DashboardView from './pages/general/Dashboard.tsx';
import ManualView from './pages/general/Manual.tsx';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<DashboardView />} />
      <Route path="/manual" element={<ManualView />} />
    </Routes>
  </Router>
);

export default App;
