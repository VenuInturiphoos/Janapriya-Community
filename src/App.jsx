import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserCircle, LogOut, LogIn, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import HouseList from './components/HouseList';
import AdminPanel from './components/AdminPanel';
import CommunityGallery from './components/CommunityGallery';
import Login from './components/Login';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [bannerPositionY, setBannerPositionY] = useState(50);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdminStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus(currentSession) {
    if (!currentSession?.user?.email) {
      setIsAdmin(false);
      setLoadingSession(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .ilike('email', currentSession.user.email)
        .maybeSingle();
        
      if (error) {
        console.warn('Admin check error:', error);
      }
        
      if (data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err) {
      console.warn('Admin check catch:', err);
      // either table doesn't exist or user not admin
      setIsAdmin(false);
    } finally {
      setLoadingSession(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

  if (loadingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

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
        padding: '12px 24px',
        borderRadius: '100px',
        boxShadow: 'var(--shadow-glass)'
      }}>
        {session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCircle size={28} color="var(--primary)" />
            <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', lineHeight: '1.2' }}>{session.user.email}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Admin Access' : 'Resident Access'}
              </span>
            </div>
            <button 
              className="btn btn-outline" 
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleLogout}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Welcome, Resident</span>
            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 16px', borderRadius: '100px', fontSize: '14px' }}
              onClick={() => window.location.hash = '#/login'}
            >
              <LogIn size={16} />
              Login as Admin
            </button>
          </div>
        )}
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
              <Route path="/login" element={!session ? <Login /> : <Navigate to="/houses" />} />
              <Route path="/houses" element={<HouseList isAdmin={isAdmin} />} />
              <Route path="/gallery" element={<CommunityGallery />} />
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
