import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MarketDetails from './pages/MarketDetails';
import Leaderboard from './pages/Leaderboard';
import CreateContest from './pages/CreateContest';
import SportsDashboard from './pages/SportsDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sports/:category?" element={<SportsDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/create-contest" element={<CreateContest />} />
        <Route path="/market/:topicId/:marketId" element={<MarketDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

