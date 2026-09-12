import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function CommunityGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

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
        // value can be an array of objects { url, date } or legacy strings
        const rawImages = JSON.parse(data.value);
        const normalized = rawImages.map(img => typeof img === 'string' ? { url: img, date: null } : img);
        setImages(normalized);
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

  // Group images by date
  const groupedImages = images.reduce((acc, img) => {
    const dateStr = img.date 
      ? new Date(img.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) 
      : 'Older Uploads';
    
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(img);
    return acc;
  }, {});

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {Object.entries(groupedImages).map(([date, imgs]) => (
            <div key={date}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                {date}
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '16px' 
              }}>
                {imgs.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedImage(img.url)}
                    style={{ 
                      borderRadius: '12px', 
                      overflow: 'hidden', 
                      boxShadow: 'var(--shadow-sm)',
                      aspectRatio: '1',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                  >
                    <img 
                      src={img.url} 
                      alt={`Community ${date} ${idx}`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} 
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10000
            }}
          >
            <X color="black" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Expanded view" 
            style={{
              maxHeight: '90vh',
              maxWidth: '90vw',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
}
