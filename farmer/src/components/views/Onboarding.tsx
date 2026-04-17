"use client";
import { useState } from 'react';
import MapPicker from '@/components/MapPicker';
import { apiPost } from '@/lib/api';

interface OnboardingProps {
  onComplete: (farmer: Record<string, unknown>) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [govIdType, setGovIdType] = useState('AADHAAR');
  const [govIdNumber, setGovIdNumber] = useState('');
  const [govIdImage, setGovIdImage] = useState<string>('');
  const [farmLat, setFarmLat] = useState(19.076);
  const [farmLng, setFarmLng] = useState(72.8777);
  const [farmAddress, setFarmAddress] = useState('');
  const [farmSizeAcres, setFarmSizeAcres] = useState('');

  const totalSteps = 4;

  const handleGovIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGovIdImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFarmLat(lat);
    setFarmLng(lng);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const res = await apiPost('/api/farmer/register', {
      fullName,
      phone,
      govId: {
        type: govIdType,
        number: govIdNumber,
        imageBase64: govIdImage,
      },
      farmLocation: {
        type: 'Point',
        coordinates: [farmLng, farmLat], // GeoJSON: [lng, lat]
      },
      farmAddress,
      farmSizeAcres: parseFloat(farmSizeAcres) || 0,
    });

    if (res.success && res.data) {
      const data = res.data as { farmer: Record<string, unknown> };
      onComplete(data.farmer);
    } else {
      setError((res.data as { message?: string })?.message || res.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const canNext = () => {
    switch (step) {
      case 1: return String(fullName || '').trim().length >= 2 && String(phone || '').trim().length >= 10;
      case 2: return String(govIdNumber || '').trim().length >= 4;
      case 3: return farmLat !== 0 && farmLng !== 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div style={{ padding: '1.5rem 1rem', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" /><path d="M10 20c5.5-2.5 8-8 6-13" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3" /><path d="M14.1 6a7 7 0 00-1.1 4c-1.9-.5-3-.8-4.3-1.1" />
          </svg>
          D2Farm
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Farmer Registration</div>
      </div>

      {/* Step Indicators */}
      <div className="steps">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`step-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'completed' : ''}`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div style={{ flex: 1 }} className="fade-slide-up" key={step}>
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>Welcome, Farmer! 🌾</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Let&apos;s set up your profile so buyers can find you.
            </p>

            <div className="form-group">
              <label className="form-label">Your Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rajesh Kumar Patil"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                id="onboard-name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                id="onboard-phone"
                inputMode="numeric"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>Government ID 🪪</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your identity is verified securely on the blockchain. No one else can see your original documents.
            </p>

            <div className="form-group">
              <label className="form-label">ID Type</label>
              <select className="form-select" value={govIdType} onChange={(e) => setGovIdType(e.target.value)} id="onboard-id-type">
                <option value="AADHAAR">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="DRIVING_LICENSE">Driving License</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ID Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 1234-5678-9012"
                value={govIdNumber}
                onChange={(e) => setGovIdNumber(e.target.value)}
                id="onboard-id-number"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Photo of ID (Optional)</label>
              <label
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '1.25rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', background: '#FAFBFC', color: 'var(--text-muted)', fontSize: '0.9rem',
                  transition: 'var(--transition)',
                }}
              >
                {govIdImage ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Photo uploaded</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Tap to upload photo
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={handleGovIdUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>Farm Location 📍</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Stand at your farm gate and tap &quot;Use My Location&quot; for best accuracy. Or drag the pin.
            </p>

            <MapPicker onLocationSelect={handleLocationSelect} initialLat={farmLat} initialLng={farmLng} />

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Farm Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Plot 42, Nashik District"
                value={farmAddress}
                onChange={(e) => setFarmAddress(e.target.value)}
                id="onboard-address"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Farm Size (Acres)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 12"
                value={farmSizeAcres}
                onChange={(e) => setFarmSizeAcres(e.target.value)}
                id="onboard-size"
                inputMode="decimal"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem' }}>Review & Submit ✅</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Please review your details. Your identity will be verified on the blockchain.
            </p>

            <div className="card-solid" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Personal</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.15rem' }}>{fullName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📱 {phone}</div>
            </div>

            <div className="card-solid" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Government ID</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.15rem' }}>{govIdType}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{govIdNumber}</div>
              {govIdImage && <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.25rem' }}>✅ Photo attached</div>}
            </div>

            <div className="card-solid" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Farm</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.15rem' }}>{farmAddress || 'Location set via GPS'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {farmLat.toFixed(4)}, {farmLng.toFixed(4)} {farmSizeAcres ? `• ${farmSizeAcres} acres` : ''}</div>
            </div>

            <div className="card" style={{ background: 'var(--info-light)', border: '1px solid rgba(59, 130, 246, 0.15)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem' }}>🔗</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E40AF', marginBottom: '0.25rem' }}>Blockchain Verification</div>
                  <div style={{ fontSize: '0.8rem', color: '#1E3A8A' }}>
                    Your Farmer ID and Farm Location will be recorded as tamper-proof NFTs on the Polygon network. No gas fees — we handle everything!
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-light)', color: '#B91C1C', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: '100%', 
        maxWidth: '480px', 
        padding: '1rem',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        background: 'var(--surface-bg)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex', 
        gap: '0.75rem',
        zIndex: 100
      }}>
        {step > 1 && (
          <button type="button" className="btn-big btn-secondary" onClick={() => setStep(s => s - 1)} style={{ flex: '0 0 auto', width: 'auto', padding: '1rem 1.5rem' }}>
            ←
          </button>
        )}
        {step < totalSteps ? (
          <button type="button" className="btn-big btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ flex: 1 }} id="onboard-next-btn">
            Continue →
          </button>
        ) : (
          <button type="button" className="btn-big btn-primary" onClick={handleSubmit} disabled={loading || !canNext()} style={{ flex: 1 }} id="onboard-submit-btn">
            {loading ? (
              <>
                <span className="spinner" />
                Registering...
              </>
            ) : (
              'Register & Verify on Blockchain 🔗'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
