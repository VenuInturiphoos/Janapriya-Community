import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // If you are testing locally, this redirects back to localhost.
          // In production, it redirects to the GitHub Pages URL.
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.warn('Login Error:', err);
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
        
        {status === 'success' ? (
          <div style={{ padding: '24px 0' }}>
            <CheckCircle2 size={64} color="var(--success)" style={{ marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Check your email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.5' }}>
              We've sent a secure login link to <strong>{email}</strong>. Click the link to instantly log into the community.
            </p>
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
              <Mail size={32} />
            </div>
            
            <h1 style={{ marginBottom: '8px', fontSize: '24px' }}>Welcome Home</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
              Enter your email address to log into the Janapriya Community portal.
            </p>

            <form onSubmit={handleLogin} style={{ width: '100%' }}>
              <div style={{ position: 'relative', marginBottom: '24px' }}>
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
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
                {status === 'loading' ? 'Sending Link...' : 'Send Magic Link'}
                {!status.includes('loading') && <ArrowRight size={20} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
