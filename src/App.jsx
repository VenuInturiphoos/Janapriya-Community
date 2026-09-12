import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserCircle, LogOut, LogIn } from 'lucide-react';
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
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top Right User Details Widget */}
      <div className="glass" style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 24px',
        borderRadius: '100px',
        boxShadow: 'var(--shadow-glass)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserCircle size={28} color="var(--primary)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '1.2' }}>{isAdmin ? 'Admin User' : 'Resident'}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Read {isAdmin ? '& Write' : 'Only'}</span>
          </div>
        </div>
        <button 
          className={`btn ${isAdmin ? 'btn-outline' : 'btn-primary'}`} 
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px' }}
          onClick={() => setIsAdmin(!isAdmin)}
        >
          {isAdmin ? <LogOut size={14} /> : <LogIn size={14} />}
          {isAdmin ? 'Logout' : 'Login'}
        </button>
      </div>

      {bannerImageUrl && (
        <div style={{
          width: '100%',
          height: '250px',
          backgroundImage: `url(${bannerImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${bannerPositionY}%`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          flexShrink: 0
        }} />
      )}
      <Router>
        <div className="app-container" style={{ 
          marginTop: bannerImageUrl ? '-60px' : '0', 
          position: 'relative', 
          zIndex: 10 
        }}>
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
