import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function CommunityGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'community_images')
        .single();
      
      if (!error && data && data.value) {
        // value is expected to be a JSON string array of URLs
        const urls = JSON.parse(data.value);
        setImages(urls);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.warn('Could not fetch community images:', err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Community Images</h1>
      </div>
      <p style={{ marginBottom: '32px', color: 'var(--text-muted)' }}>Recent memories and events from Janapriya Nagar.</p>

      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.3)', borderRadius: '12px' }}>
          <ImageIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <p>No images have been uploaded yet.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '16px' 
        }}>
          {images.map((url, idx) => (
            <div key={idx} style={{ 
              borderRadius: '12px', 
              overflow: 'hidden', 
              boxShadow: 'var(--shadow-sm)',
              aspectRatio: '1',
              backgroundColor: 'rgba(0,0,0,0.05)'
            }}>
              <img 
                src={url} 
                alt={`Community ${idx}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
