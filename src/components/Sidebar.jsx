import { NavLink } from 'react-router-dom';
import { Home, Settings, UserCircle, LogOut, LogIn } from 'lucide-react';

export default function Sidebar({ isAdmin, setIsAdmin }) {
  return (
    <div className="sidebar glass card" style={{ height: 'fit-content', minHeight: 'calc(100vh - 48px)', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }}>
          <Home size={24} />
        </div>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, lineHeight: '1.2' }}>Janapriya Nagar<br/>Phase 2 Miyapur</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <NavLink to="/houses" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Home size={20} />
          <span>Directory</span>
        </NavLink>
        
        {isAdmin && (
          <NavLink to="/admin" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Settings size={20} />
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <UserCircle size={36} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{isAdmin ? 'Admin User' : 'Resident'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Read {isAdmin ? '& Write' : 'Only'} Access</div>
          </div>
        </div>
        
        <button 
          className={`btn ${isAdmin ? 'btn-outline' : 'btn-primary'}`} 
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => setIsAdmin(!isAdmin)}
        >
          {isAdmin ? <LogOut size={16} /> : <LogIn size={16} />}
          {isAdmin ? 'Logout Admin' : 'Login as Admin'}
        </button>
      </div>
    </div>
  );
}
