import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { IndianRupee, User, AlertCircle, CheckCircle2, Upload, FileImage, Loader2, Trash2, QrCode, Pencil, Save, Mail, MessageSquare } from 'lucide-react';

export default function HouseList({ isAdmin }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [bannerPositionY, setBannerPositionY] = useState(50);
  const [isQRPopupOpen, setIsQRPopupOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  // Edit State
  const [editingHouse, setEditingHouse] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editStatus, setEditStatus] = useState('');

  // Complaint State
  const [complaintEmails, setComplaintEmails] = useState('');
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ name: '', houseNumber: '', subject: '', description: '' });

  const mockHouses = [
    { id: 1, house_number: 'A-101', resident_name: 'John Doe', contact: '+91 9876543210', maintenance_due: 1500, payment_evidence_url: null },
    { id: 2, house_number: 'A-102', resident_name: 'Jane Smith', contact: '+91 9876543211', maintenance_due: 0, payment_evidence_url: null },
    { id: 3, house_number: 'B-201', resident_name: 'Rahul Kumar', contact: '+91 9876543212', maintenance_due: 3000, payment_evidence_url: null },
    { id: 4, house_number: 'B-202', resident_name: 'Priya Sharma', contact: '+91 9876543213', maintenance_due: 0, payment_evidence_url: null },
  ];

  useEffect(() => {
    fetchHouses();
    fetchSettings();
  }, []);

  async function fetchHouses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .order('house_number');
      
      if (error || !data || data.length === 0) {
        console.warn('Supabase fetch returned no data or failed, using mock data for preview.');
        setHouses(mockHouses);
      } else {
        // Sort dynamically handling both G-221 and 221-G formats
        const sortedData = data.sort((a, b) => {
          const numA = parseInt(a.house_number.replace(/\D/g, '') || 0);
          const numB = parseInt(b.house_number.replace(/\D/g, '') || 0);
          
          if (numA === numB) {
            // Sort G before F regardless of format
            const isAG = a.house_number.toUpperCase().includes('G');
            const isBG = b.house_number.toUpperCase().includes('G');
            if (isAG && !isBG) return -1;
            if (!isAG && isBG) return 1;
            return a.house_number.localeCompare(b.house_number);
          }
          return numA - numB;
        });
        setHouses(sortedData);
      }
    } catch (err) {
      console.warn('Error fetching houses:', err);
      setHouses(mockHouses);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, value');
      
      if (!error && data) {
        const qrSetting = data.find(s => s.id === 'payment_qr');
        const emailSetting = data.find(s => s.id === 'complaint_emails');
        const bannerSetting = data.find(s => s.id === 'banner_image');
        const posSetting = data.find(s => s.id === 'banner_position_y');
        
        if (qrSetting) setQrCodeUrl(qrSetting.value);
        if (emailSetting) setComplaintEmails(emailSetting.value);
        if (bannerSetting) setBannerImageUrl(bannerSetting.value);
        if (posSetting) setBannerPositionY(parseInt(posSetting.value) || 50);
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  }

  const handleUploadClick = (houseId) => {
    setUploadingId(houseId);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingId) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadingId}-${Math.random()}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('evidences')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('houses')
        .update({ payment_evidence_url: publicUrlData.publicUrl })
        .eq('id', uploadingId);

      if (updateError) throw updateError;

      alert('Screenshot uploaded successfully!');
      fetchHouses(); // Refresh data
    } catch (error) {
      console.error('Error uploading:', error.message);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteHouse = async (houseId, houseNumber) => {
    if (!window.confirm(`Are you sure you want to delete ${houseNumber}? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', houseId);
      
      if (error) throw error;
      
      alert(`${houseNumber} deleted successfully.`);
      fetchHouses();
    } catch (error) {
      alert('Error deleting house: ' + error.message);
    }
  };

  const handleEditClick = (house) => {
    setEditingHouse(house);
    setEditFormData({
      resident_name: house.resident_name || '',
      contact: house.contact || '',
      maintenance_due: house.maintenance_due || 0
    });
    setEditStatus('');
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditStatus('Saving...');
    try {
      const { error } = await supabase
        .from('houses')
        .update({
          resident_name: editFormData.resident_name,
          contact: editFormData.contact,
          maintenance_due: editFormData.maintenance_due
        })
        .eq('id', editingHouse.id);
      
      if (error) throw error;
      
      setEditingHouse(null);
      fetchHouses();
    } catch (err) {
      setEditStatus('Error: ' + err.message);
    }
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!complaintEmails) {
      alert('Admin has not configured any complaint email addresses yet.');
      return;
    }
    
    const subject = encodeURIComponent(`Complaint [${complaintForm.houseNumber}]: ${complaintForm.subject}`);
    const body = encodeURIComponent(
      `Resident Name: ${complaintForm.name}\n` +
      `House Number: ${complaintForm.houseNumber}\n\n` +
      `Complaint Description:\n${complaintForm.description}`
    );
    
    // Trigger mailto link to open default email client
    window.location.href = `mailto:${complaintEmails}?subject=${subject}&body=${body}`;
    setIsComplaintOpen(false);
    setComplaintForm({ name: '', houseNumber: '', subject: '', description: '' });
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {bannerImageUrl && (
        <div style={{ 
          width: '100%', 
          height: '250px', 
          borderRadius: '16px',
          marginBottom: '24px',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${bannerImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${bannerPositionY}%`,
          display: 'flex',
          alignItems: 'flex-end',
          padding: '24px',
          color: 'white',
          boxShadow: 'var(--shadow-glass)'
        }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>House Directory</h1>
            <p style={{ margin: 0, opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Welcome to your community dashboard</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        {!bannerImageUrl && (
          <div>
            <h1 style={{ marginBottom: '8px' }}>House Directory</h1>
            <p>View all houses and their maintenance status.</p>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end', width: bannerImageUrl ? '100%' : 'auto' }}>
          <div 
            className="glass" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--danger)', color: 'var(--danger)' }}
            onClick={() => setIsComplaintOpen(true)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <MessageSquare size={18} />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Raise Complaint</span>
          </div>

          {qrCodeUrl && (
            <div 
              className="glass" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              onClick={() => setIsQRPopupOpen(true)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <QrCode size={18} />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Pay Dues</span>
            </div>
          )}
          {isAdmin && (
            <div className="badge badge-success" style={{ fontSize: '14px', padding: '8px 16px' }}>
              Admin Mode Active
            </div>
          )}
        </div>
      </div>

      <div className="house-grid">
        {houses.map(house => {
          const isPaid = house.maintenance_due <= 0;
          const isPendingApproval = !isPaid && house.payment_evidence_url;
          
          return (
            <div key={house.id} className="house-card glass card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: '250px' }}>
                <h3 
                  style={{ 
                    fontSize: '20px', 
                    margin: 0, 
                    color: (!isAdmin && !isPaid) ? 'var(--primary)' : 'var(--text-main)', 
                    width: '80px',
                    cursor: (!isAdmin && !isPaid) ? 'pointer' : 'default',
                    textDecoration: (!isAdmin && !isPaid) ? 'underline' : 'none'
                  }}
                  onClick={() => {
                    if (!isAdmin && !isPaid) {
                      handleUploadClick(house.id);
                    }
                  }}
                  title={(!isAdmin && !isPaid) ? "Click to upload payment screenshot" : ""}
                >
                  {house.house_number}
                </h3>
                <span className={`badge ${isPaid ? 'badge-success' : isPendingApproval ? 'badge-warning' : 'badge-danger'}`} style={{ backgroundColor: isPendingApproval ? 'rgba(245, 158, 11, 0.1)' : undefined, color: isPendingApproval ? '#f59e0b' : undefined, whiteSpace: 'nowrap' }}>
                  {isPaid ? 'Paid' : isPendingApproval ? 'Under Review' : 'Due'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', width: '150px' }}>
                  <User size={16} color="var(--text-muted)" />
                  <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{house.resident_name}</span>
                </div>
                
                {isAdmin && house.contact && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)', width: '150px' }}>
                    <span>📞 {house.contact}</span>
                  </div>
                )}
              </div>
                
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px',
                background: isPaid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                borderRadius: '8px', border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: isPaid ? 'var(--success)' : 'var(--danger)', width: '80px' }}>
                  <IndianRupee size={16} style={{ marginRight: '4px' }}/>{isPaid ? '0' : house.maintenance_due}
                </div>

                {!isPaid && !isAdmin && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    onClick={() => handleUploadClick(house.id)}
                    disabled={uploadingId === house.id}
                  >
                    {uploadingId === house.id ? <Loader2 size={14} className="animate-spin" /> : isPendingApproval ? <FileImage size={14} /> : <Upload size={14} />}
                    <span style={{ marginLeft: '6px' }}>{uploadingId === house.id ? 'Uploading...' : isPendingApproval ? 'Update Screenshot' : 'Upload'}</span>
                  </button>
                )}

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      onClick={() => handleEditClick(house)}
                    >
                      <Pencil size={14} style={{ marginRight: '6px' }} />
                      Edit
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)', borderColor: 'var(--danger)', whiteSpace: 'nowrap' }}
                      onClick={() => handleDeleteHouse(house.id, house.house_number)}
                    >
                      <Trash2 size={14} style={{ marginRight: '6px' }} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit House Modal Popup */}
      {editingHouse && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999 }} 
          onClick={() => setEditingHouse(null)}
        >
          <div 
            className="card glass" 
            style={{ 
              background: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              padding: '32px', maxWidth: '400px', width: '90%', boxShadow: 'var(--shadow-glass)',
              maxHeight: '90vh', overflowY: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--text-muted)' }} 
              onClick={() => setEditingHouse(null)}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pencil size={24} /> Edit {editingHouse.house_number}
            </h2>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Resident Name</label>
                <input 
                  type="text" 
                  name="resident_name" 
                  className="form-control" 
                  value={editFormData.resident_name} 
                  onChange={handleEditChange} 
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Contact Number</label>
                <input 
                  type="text" 
                  name="contact" 
                  className="form-control" 
                  value={editFormData.contact} 
                  onChange={handleEditChange} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Maintenance Due (₹)</label>
                <input 
                  type="number" 
                  name="maintenance_due" 
                  className="form-control" 
                  value={editFormData.maintenance_due} 
                  onChange={handleEditChange} 
                  min="0" 
                />
              </div>
              
              {editStatus && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: editStatus.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: editStatus.includes('Error') ? 'var(--danger)' : 'var(--success)', fontSize: '14px' }}>
                  {editStatus}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}>
                <Save size={16} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal Popup */}
      {isQRPopupOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999 }} 
          onClick={() => setIsQRPopupOpen(false)}
        >
          <div 
            className="card glass" 
            style={{ 
              background: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              padding: '40px', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: 'var(--shadow-glass)',
              maxHeight: '90vh', overflowY: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--text-muted)' }} 
              onClick={() => setIsQRPopupOpen(false)}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <QrCode size={24} /> Pay Maintenance
            </h2>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
              <img src={qrCodeUrl} alt="Payment QR Code" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }} />
            </div>
            <p style={{ marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Scan this QR code using any UPI app (Google Pay, PhonePe, Paytm) to clear your dues. 
              <br/><br/>
              <strong>After paying, don't forget to take a screenshot and upload it!</strong>
            </p>
          </div>
        </div>
      )}

      {/* Complaint Modal Popup */}
      {isComplaintOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999 }} 
          onClick={() => setIsComplaintOpen(false)}
        >
          <div 
            className="card glass" 
            style={{ 
              background: 'white', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              padding: '32px', maxWidth: '500px', width: '90%', boxShadow: 'var(--shadow-glass)',
              maxHeight: '90vh', overflowY: 'auto'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--text-muted)' }} 
              onClick={() => setIsComplaintOpen(false)}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, marginBottom: '24px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={24} /> Raise a Complaint
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Submit your concern directly to the admin committee. Your default email app will open to send this message securely.
            </p>
            
            <form onSubmit={handleComplaintSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={complaintForm.name} 
                    onChange={e => setComplaintForm({...complaintForm, name: e.target.value})} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>House Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={complaintForm.houseNumber} 
                    onChange={e => setComplaintForm({...complaintForm, houseNumber: e.target.value})} 
                    placeholder="e.g. 221-G"
                    required 
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Complaint Subject</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={complaintForm.subject} 
                  onChange={e => setComplaintForm({...complaintForm, subject: e.target.value})} 
                  placeholder="e.g. Broken streetlight near block A"
                  required 
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea 
                  className="form-control" 
                  value={complaintForm.description} 
                  onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} 
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', justifyContent: 'center', background: 'var(--danger)' }}>
                <Mail size={16} /> Prepare Email to Admin
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
