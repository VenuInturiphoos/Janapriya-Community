import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PlusCircle, Save, CheckSquare, Image as ImageIcon, IndianRupee, QrCode, Upload, Mail } from 'lucide-react';

export default function AdminPanel() {
  const [formData, setFormData] = useState({
    house_number: '',
    resident_name: '',
    contact: '',
    maintenance_due: 0
  });
  const [status, setStatus] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const qrInputRef = useRef(null);
  const [qrStatus, setQrStatus] = useState('');
  const bannerInputRef = useRef(null);
  const [bannerStatus, setBannerStatus] = useState('');
  const [bannerPosition, setBannerPosition] = useState(50);
  const [complaintEmails, setComplaintEmails] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryStatus, setGalleryStatus] = useState('');
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchPendingApprovals();
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, value')
        .in('id', ['complaint_emails', 'banner_position_y', 'community_images']);
      
      if (!error && data) {
        const emailSetting = data.find(s => s.id === 'complaint_emails');
        const posSetting = data.find(s => s.id === 'banner_position_y');
        const gallerySetting = data.find(s => s.id === 'community_images');
        
        if (emailSetting) setComplaintEmails(emailSetting.value);
        if (posSetting) setBannerPosition(parseInt(posSetting.value) || 50);
        if (gallerySetting) {
          const rawImages = JSON.parse(gallerySetting.value || '[]');
          const normalized = rawImages.map(img => typeof img === 'string' ? { url: img, date: new Date().toISOString() } : img);
          setGalleryImages(normalized);
        }
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  }

  async function fetchPendingApprovals() {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .not('payment_evidence_url', 'is', null)
        .gt('maintenance_due', 0);
      
      if (!error && data) {
        setPendingApprovals(data);
      }
    } catch (err) {
      console.warn('Could not fetch pending approvals:', err);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddHouse = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    
    try {
      const { error } = await supabase
        .from('houses')
        .insert([formData]);
        
      if (error) throw error;
      
      setStatus('House added successfully!');
      setFormData({ house_number: '', resident_name: '', contact: '', maintenance_due: 0 });
    } catch (err) {
      console.warn('Error saving to Supabase:', err.message);
      setStatus('Error: ' + err.message);
    }
  };

  const handleApprove = async (houseId) => {
    try {
      const { error } = await supabase
        .from('houses')
        .update({ maintenance_due: 0, payment_evidence_url: null })
        .eq('id', houseId);
        
      if (error) throw error;
      alert('Payment approved and dues cleared!');
      fetchPendingApprovals();
    } catch (err) {
      alert('Failed to approve: ' + err.message);
    }
  };

  const handleQRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrStatus('Uploading...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment_qr_${Math.random()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('settings')
        .upsert({ id: 'payment_qr', value: urlData.publicUrl });
      if (dbError) throw dbError;

      setQrStatus('QR Code Updated!');
    } catch (err) {
      setQrStatus('Error: ' + err.message);
    } finally {
      if (qrInputRef.current) qrInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerStatus('Uploading...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Math.random()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('settings')
        .upsert({ id: 'banner_image', value: urlData.publicUrl });
      if (dbError) throw dbError;

      setBannerStatus('Banner Image Updated!');
    } catch (err) {
      setBannerStatus('Error: ' + err.message);
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleSaveBannerPosition = async () => {
    setBannerStatus('Saving position...');
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'banner_position_y', value: bannerPosition.toString() });
      if (error) throw error;
      setBannerStatus('Banner position saved!');
    } catch (err) {
      setBannerStatus('Error: ' + err.message);
    }
  };

  const handleSaveEmails = async (e) => {
    e.preventDefault();
    setEmailStatus('Saving...');
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'complaint_emails', value: complaintEmails });
      if (error) throw error;
      setEmailStatus('Emails updated successfully!');
    } catch (err) {
      setEmailStatus('Error: ' + err.message);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGalleryStatus('Uploading image...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery_${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `settings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      const newImages = [{ url: urlData.publicUrl, date: new Date().toISOString() }, ...galleryImages];
      
      const { error: dbError } = await supabase
        .from('settings')
        .upsert({ id: 'community_images', value: JSON.stringify(newImages) });
      if (dbError) throw dbError;

      setGalleryImages(newImages);
      setGalleryStatus('Image added to gallery!');
    } catch (err) {
      setGalleryStatus('Error: ' + err.message);
    } finally {
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleDeleteGalleryImage = async (urlToDelete) => {
    if (!window.confirm('Remove this image from the gallery?')) return;
    try {
      const newImages = galleryImages.filter(img => img.url !== urlToDelete);
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'community_images', value: JSON.stringify(newImages) });
      if (error) throw error;
      setGalleryImages(newImages);
    } catch (err) {
      alert('Error deleting image: ' + err.message);
    }
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <h1 style={{ marginBottom: '8px' }}>Admin Dashboard</h1>
      <p style={{ marginBottom: '32px' }}>Manage directory and review payment screenshots.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Pending Approvals Section */}
        <div className="glass card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <CheckSquare color="var(--primary)" />
            <h2 style={{ margin: 0, fontSize: '20px' }}>Review Payment Screenshots</h2>
          </div>
          
          {pendingApprovals.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No pending payments to review.</p>
          ) : (
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {pendingApprovals.map(house => (
                <div key={house.id} style={{ padding: '16px', border: '1px solid var(--border-glass)', borderRadius: '12px', background: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '18px' }}>{house.house_number}</strong>
                    <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <IndianRupee size={14}/> {house.maintenance_due}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '12px' }}>Resident: {house.resident_name}</p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <a href={house.payment_evidence_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--primary)', textDecoration: 'none', background: 'rgba(99, 102, 241, 0.1)', padding: '6px 12px', borderRadius: '6px', fontWeight: 500 }}>
                      <ImageIcon size={16} /> View Screenshot
                    </a>
                  </div>
                  
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleApprove(house.id)}>
                    Approve & Clear Due
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {/* Add House Section */}
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <PlusCircle color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Add New House</h2>
            </div>
            
            <form onSubmit={handleAddHouse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>House Number</label>
                  <input type="text" name="house_number" className="form-control" value={formData.house_number} onChange={handleChange} placeholder="e.g. C-301" required />
                </div>
                <div className="form-group">
                  <label>Resident Name</label>
                  <input type="text" name="resident_name" className="form-control" value={formData.resident_name} onChange={handleChange} placeholder="e.g. Amit Patel" required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" name="contact" className="form-control" value={formData.contact} onChange={handleChange} placeholder="e.g. +91 9876543210" />
                </div>
                <div className="form-group">
                  <label>Initial Maintenance Due (₹)</label>
                  <input type="number" name="maintenance_due" className="form-control" value={formData.maintenance_due} onChange={handleChange} min="0" />
                </div>
              </div>
              
              {status && (
                <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', background: status.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: status.includes('Error') ? 'var(--danger)' : 'var(--success)', fontSize: '14px' }}>
                  {status}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                <Save size={18} /> Save House Record
              </button>
            </form>
          </div>

          {/* QR Code Section */}
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <QrCode color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Payment QR Code</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload a QR code (e.g. UPI) for residents to scan and pay their maintenance dues.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={qrInputRef}
              onChange={handleQRUpload}
            />
            
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'center' }} 
              onClick={() => qrInputRef.current.click()}
            >
              <Upload size={16} /> Upload New QR Code
            </button>
            
            {qrStatus && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: qrStatus.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
                {qrStatus}
              </div>
            )}
          </div>
          
          {/* Banner Upload Section */}
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <ImageIcon color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Home Page Banner</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload a hero image to display at the top of the home page directory.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={bannerInputRef}
              onChange={handleBannerUpload}
            />
            
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }} 
              onClick={() => bannerInputRef.current.click()}
            >
              <Upload size={16} /> Upload New Banner
            </button>
            
            <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>Vertical Position Offset</label>
                <span style={{ fontSize: '14px', color: 'var(--primary)' }}>{bannerPosition}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={bannerPosition}
                onChange={(e) => setBannerPosition(e.target.value)}
                style={{ width: '100%', marginBottom: '12px', cursor: 'pointer' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '6px 12px', fontSize: '14px' }}
                onClick={handleSaveBannerPosition}
              >
                Save Position
              </button>
            </div>
            
            {bannerStatus && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: bannerStatus.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
                {bannerStatus}
              </div>
            )}
          </div>
          
          {/* Community Images Gallery Upload */}
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <ImageIcon color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Community Gallery</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Upload photos of recent events to share with the community.</p>
            
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              ref={galleryInputRef}
              onChange={handleGalleryUpload}
            />
            
            <button 
              className="btn btn-outline" 
              style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }} 
              onClick={() => galleryInputRef.current.click()}
            >
              <Upload size={16} /> Upload New Photo
            </button>
            
            {galleryStatus && (
              <div style={{ marginTop: '8px', marginBottom: '16px', fontSize: '14px', color: galleryStatus.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
                {galleryStatus}
              </div>
            )}
            
            {galleryImages.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                {galleryImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={img.url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={() => handleDeleteGalleryImage(img.url)}
                      style={{ 
                        position: 'absolute', top: '4px', right: '4px', 
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', 
                        border: 'none', borderRadius: '50%', width: '24px', height: '24px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'pointer', fontSize: '12px' 
                      }}
                      title="Delete Image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Complaint Emails Section */}
          <div className="glass card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Mail color="var(--primary)" />
              <h2 style={{ margin: 0, fontSize: '20px' }}>Complaint Emails</h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Configure where resident complaints should be sent. Separate multiple emails with commas.</p>
            
            <form onSubmit={handleSaveEmails}>
              <div className="form-group">
                <label>Email Addresses</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={complaintEmails} 
                  onChange={(e) => setComplaintEmails(e.target.value)} 
                  placeholder="e.g. admin1@example.com, admin2@example.com" 
                />
              </div>
              
              {emailStatus && (
                <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', background: emailStatus.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: emailStatus.includes('Error') ? 'var(--danger)' : 'var(--success)', fontSize: '14px' }}>
                  {emailStatus}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Save size={18} /> Save Emails
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
