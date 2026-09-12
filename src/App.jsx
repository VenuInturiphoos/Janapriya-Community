import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import HouseList from './components/HouseList';
import AdminPanel from './components/AdminPanel';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  // Simple auth simulation as per user request: "normal user and admin user are for now"
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [bannerPositionY, setBannerPositionY] = useState(50);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin);
  }, [isAdmin]);

  useEffect(() => {
    async function fetchBanner() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('id, value')
          .in('id', ['banner_image', 'banner_position_y']);
        
        if (!error && data) {
          const bannerSetting = data.find(s => s.id === 'banner_image');
          const posSetting = data.find(s => s.id === 'banner_position_y');
          if (bannerSetting) setBannerImageUrl(bannerSetting.value);
          if (posSetting) setBannerPositionY(parseInt(posSetting.value) || 50);
        }
      } catch (err) {
        console.warn('Could not fetch banner:', err);
      }
    }
    fetchBanner();
  }, []);

  return (
    <div style={bannerImageUrl ? {
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)), url(${bannerImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: `center ${bannerPositionY}%`,
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      width: '100%'
    } : { width: '100%', minHeight: '100vh' }}>
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
    </div>
  );
}

export default App;
