import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, ArrowRight, UserPlus, LogIn as LogInIcon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setStatus('loading');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        // Sometimes Supabase requires email verification even for passwords. 
        // We'll show a generic success message, or it auto-logs them in.
        setStatus('success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        // If login is successful, App.jsx's onAuthStateChange will automatically hide this component
      }
    } catch (err) {
      console.warn('Auth Error:', err);
      setErrorMessage(err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass card" style={{
        maxWidth: '400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        
        {status === 'success' && isSignUp ? (
          <div style={{ padding: '24px 0' }}>
            <h2 style={{ marginBottom: '8px' }}>Account Created!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
              Your account has been created successfully. 
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setIsSignUp(false);
                setStatus('idle');
                setPassword('');
              }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              color: 'white',
              boxShadow: 'var(--shadow-md)'
            }}>
              {isSignUp ? <UserPlus size={32} /> : <Lock size={32} />}
            </div>
            
            <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>{isSignUp ? 'Create Account' : 'Admin Login'}</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
              {isSignUp ? 'Register to manage the Janapriya Community portal.' : 'Enter your credentials to access the admin portal.'}
            </p>

            <form onSubmit={handleAuth} style={{ width: '100%' }}>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <div style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }}>
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255,255,255,0.8)',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>

              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }}>
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(255,255,255,0.8)',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>

              {status === 'error' && (
                <div style={{ 
                  color: 'var(--danger)', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  marginBottom: '24px',
                  fontSize: '14px' 
                }}>
                  {errorMessage}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={status === 'loading'}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  fontSize: '16px', 
                  borderRadius: '12px',
                  justifyContent: 'center',
                  opacity: status === 'loading' ? 0.7 : 1
                }}
              >
                {status === 'loading' ? (isSignUp ? 'Creating...' : 'Logging in...') : (isSignUp ? 'Sign Up' : 'Log In')}
                {!status.includes('loading') && (isSignUp ? <UserPlus size={20} /> : <LogInIcon size={20} />)}
              </button>
            </form>
            
            <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
              <button 
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setStatus('idle');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {isSignUp ? 'Log in here' : 'Sign up here'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
