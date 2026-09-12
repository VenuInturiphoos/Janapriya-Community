import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HouseList from './components/HouseList';
import AdminPanel from './components/AdminPanel';
import './index.css';

function App() {
  // Simple auth simulation as per user request: "normal user and admin user are for now"
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin);
  }, [isAdmin]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <main className="main-content glass card">
          <Routes>
            <Route path="/" element={<Navigate to="/houses" />} />
            <Route path="/houses" element={<HouseList isAdmin={isAdmin} />} />
            <Route 
              path="/admin" 
              element={isAdmin ? <AdminPanel /> : <Navigate to="/houses" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
