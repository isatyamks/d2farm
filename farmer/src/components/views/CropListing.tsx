"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { saveOffline } from '@/lib/offlineStorage';

interface CropListingProps {
  farmerId: string;
}

interface Listing {
  _id: string;
  category: string;
  cropName: string;
  variety: string;
  method: string;
  totalQuantity: number;
  unit: string;
  moqRange: { min: number; max: number };
  harvestDateRange: { start: string; end: string };
  pricePerUnit: number;
  status: string;
}

const CATEGORIES = ['VEGETABLE', 'FRUIT', 'GRAIN', 'SPICE', 'PULSE'];
const METHODS = ['ORGANIC', 'CONVENTIONAL', 'HYDROPONIC'];

const CROP_OPTIONS: Record<string, string[]> = {
  VEGETABLE: ['Tomato', 'Onion', 'Potato', 'Capsicum', 'Cabbage', 'Carrot', 'Cauliflower', 'Brinjal'],
  FRUIT: ['Mango', 'Banana', 'Guava', 'Papaya', 'Pomegranate', 'Grape', 'Orange'],
  GRAIN: ['Wheat', 'Rice', 'Jowar', 'Bajra', 'Maize', 'Barley'],
  SPICE: ['Turmeric', 'Ginger', 'Garlic', 'Chilli', 'Coriander', 'Cumin'],
  PULSE: ['Toor Dal', 'Moong Dal', 'Chana', 'Urad Dal', 'Masoor Dal'],
};

const VARIETY_OPTIONS: Record<string, string[]> = {
  Tomato: ['Hybrid', 'Cherry', 'Roma', 'Desi'],
  Onion: ['Red Nashik', 'White', 'Yellow', 'Spring Onion'],
  Potato: ['Agra Big', 'Kufri Jyoti', 'Sweet Potato', 'Baby Potato'],
  Wheat: ['Sharbati', 'Durum', 'Lokwan', 'Sujata'],
  Rice: ['Basmati', 'Sona Masuri', 'Kolam', 'Indrayani'],
  Capsicum: ['Green', 'Red', 'Yellow'],
  Mango: ['Alphonso', 'Kesar', 'Totapuri', 'Langra'],
  Banana: ['Cavendish', 'Robusta', 'Red Banana'],
};

export default function CropListing({ farmerId }: CropListingProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [category, setCategory] = useState('VEGETABLE');
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [method, setMethod] = useState('CONVENTIONAL');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [moqMin, setMoqMin] = useState('');
  const [moqMax, setMoqMax] = useState('');
  const [harvestStart, setHarvestStart] = useState('');
  const [harvestEnd, setHarvestEnd] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  useEffect(() => {
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  const fetchListings = async () => {
    setLoading(true);
    const res = await apiGet(`/api/listings?farmerId=${farmerId}`);
    if (res.success && res.data) {
      const data = res.data as { listings: Listing[] };
      setListings(data.listings || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCategory('VEGETABLE');
    setCropName('');
    setVariety('');
    setMethod('CONVENTIONAL');
    setTotalQuantity('');
    setMoqMin('');
    setMoqMax('');
    setHarvestStart('');
    setHarvestEnd('');
    setPricePerUnit('');
  };

  const handleSubmit = async () => {
    if (!cropName || !totalQuantity || !harvestStart || !harvestEnd || !pricePerUnit) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    const listingData = {
      farmerId,
      category,
      cropName,
      variety: variety || 'Standard',
      method,
      totalQuantity: parseInt(totalQuantity),
      unit: 'kg',
      moqRange: { min: parseInt(moqMin) || 1, max: parseInt(moqMax) || parseInt(totalQuantity) },
      harvestDateRange: { start: new Date(harvestStart).toISOString(), end: new Date(harvestEnd).toISOString() },
      pricePerUnit: parseFloat(pricePerUnit),
    };

    const res = await apiPost('/api/listings', listingData, 'cropListings');

    if (res.success) {
      setShowForm(false);
      resetForm();
      fetchListings();
    } else if (res.offline) {
      // Saved offline
      await saveOffline('cropListings', { endpoint: '/api/listings', body: listingData }, 'CREATE');
      setShowForm(false);
      resetForm();
      alert('Saved offline! Will sync when you have internet.');
    } else {
      const errMsg = (res.data as any)?.message || 'Failed to save. Please try again.';
      alert(errMsg);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this crop listing?')) return;
    const res = await apiDelete(`/api/listings/${id}`);
    if (res.success) {
      setListings(listings.filter(l => l._id !== id));
    }
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = { VEGETABLE: '🥬', FRUIT: '🍎', GRAIN: '🌾', SPICE: '🌶️', PULSE: '🫘' };
    return icons[cat] || '🌱';
  };

  const methodColor = (m: string) => {
    if (m === 'ORGANIC') return { bg: '#DCFCE7', color: '#15803D' };
    if (m === 'HYDROPONIC') return { bg: '#DBEAFE', color: '#1D4ED8' };
    return { bg: 'var(--surface-bg)', color: 'var(--text-muted)' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: '0.15rem' }}>My Crops</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{listings.length} active listings</p>
        </div>
      </div>

      {/* Add Crop Button */}
      <button className="btn-big btn-primary" onClick={() => setShowForm(true)} id="add-crop-listing-btn" style={{ marginBottom: '1.25rem' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
        Add New Crop
      </button>

      {/* Listing Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading crops...</div>
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌱</div>
          <h3>No crops listed yet</h3>
          <p>Add your first crop to start receiving buyer orders!</p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {listings.map((listing) => {
            const mc = methodColor(listing.method);
            return (
              <div key={listing._id} className="card-solid" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                      {categoryIcon(listing.category)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{listing.cropName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{listing.variety}</div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: mc.bg, color: mc.color }}>{listing.method}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{listing.totalQuantity.toLocaleString()} {listing.unit}</div>
                  </div>
                  <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Price</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>₹{listing.pricePerUnit}/{listing.unit}</div>
                  </div>
                  <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>MOQ</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{listing.moqRange?.min || 1}{listing.unit}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    🗓️ {new Date(listing.harvestDateRange.start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} — {new Date(listing.harvestDateRange.end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </div>
                  <button onClick={() => handleDelete(listing._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Crop Modal */}
      {showForm && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" style={{ alignItems: 'flex-start' }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-sheet" style={{ maxHeight: '100dvh', height: '100dvh', borderRadius: 0, display: 'flex', flexDirection: 'column', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Add New Crop 🌾</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fill in all details about your harvest.</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="toggle-group" style={{ flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c} className={`toggle-option ${category === c ? 'active' : ''}`}
                    onClick={() => { setCategory(c); setCropName(''); setVariety(''); }}
                    style={{ fontSize: '0.75rem', padding: '0.5rem', flex: '1 1 auto' }}
                  >
                    {categoryIcon(c)} {c.charAt(0) + c.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Name */}
            <div className="form-group">
              <label className="form-label">Crop Name</label>
              <select className="form-select" value={cropName} onChange={(e) => { setCropName(e.target.value); setVariety(''); }} id="crop-name-select">
                <option value="">Select crop...</option>
                {(CROP_OPTIONS[category] || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Variety */}
            <div className="form-group">
              <label className="form-label">Variety</label>
              {cropName && VARIETY_OPTIONS[cropName] ? (
                <select className="form-select" value={variety} onChange={(e) => setVariety(e.target.value)} id="crop-variety-select">
                  <option value="">Select variety...</option>
                  {VARIETY_OPTIONS[cropName].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              ) : (
                <input type="text" className="form-input" placeholder="e.g. Grade A" value={variety} onChange={(e) => setVariety(e.target.value)} />
              )}
            </div>

            {/* Method */}
            <div className="form-group">
              <label className="form-label">Cultivation Method</label>
              <div className="toggle-group" style={{ flexWrap: 'wrap' }}>
                {METHODS.map(m => (
                  <button key={m} className={`toggle-option ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)} style={{ flex: '1 1 30%' }}>
                    {m === 'ORGANIC' ? '🌿' : m === 'HYDROPONIC' ? '💧' : '🚜'} {m.charAt(0) + m.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Total Quantity (kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 5000" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} inputMode="numeric" id="crop-quantity" />
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹/kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 22" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} inputMode="decimal" id="crop-price" />
              </div>
            </div>

            {/* MOQ Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Min Order (kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 500" value={moqMin} onChange={(e) => setMoqMin(e.target.value)} inputMode="numeric" />
              </div>
              <div className="form-group">
                <label className="form-label">Max Order (kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 5000" value={moqMax} onChange={(e) => setMoqMax(e.target.value)} inputMode="numeric" />
              </div>
            </div>

            {/* Harvest Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Harvest Start</label>
                <input type="date" className="form-input" value={harvestStart} onChange={(e) => setHarvestStart(e.target.value)} id="harvest-start" />
              </div>
              <div className="form-group">
                <label className="form-label">Harvest End</label>
                <input type="date" className="form-input" value={harvestEnd} onChange={(e) => setHarvestEnd(e.target.value)} id="harvest-end" />
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button className="btn-big btn-primary" onClick={handleSubmit} disabled={saving} id="save-crop-btn">
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Crop Listing'}
              </button>
              <button className="btn-big btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
