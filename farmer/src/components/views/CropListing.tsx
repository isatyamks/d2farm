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
  qualityReport?: any;
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

const MOCK_SENSOR_DATA: Record<string, any> = {
  "Tomato": {
    "temperature_celsius": 18,
    "humidity_percentage": 78,
    "weight_per_unit_grams": 120,
    "firmness_score": 7,
    "gas_detection_status": "Normal",
    "cold_storage_used": true,
    "transport_duration_hours": 10
  },
  "Potato": {
    "temperature_celsius": 12,
    "humidity_percentage": 70,
    "weight_per_unit_grams": 150,
    "firmness_score": 8,
    "gas_detection_status": "Normal",
    "cold_storage_used": false,
    "transport_duration_hours": 14
  },
  "Apple": {
    "temperature_celsius": 6,
    "humidity_percentage": 85,
    "weight_per_unit_grams": 180,
    "firmness_score": 9,
    "gas_detection_status": "Normal",
    "cold_storage_used": true,
    "transport_duration_hours": 20
  }
};

export default function CropListing({ farmerId }: CropListingProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quality Inspection State
  const [inspectionListing, setInspectionListing] = useState<Listing | null>(null);
  const [inspectionImages, setInspectionImages] = useState<{ mimeType: string; data: string; preview: string }[]>([]);
  const [inspectionLoading, setInspectionLoading] = useState(false);

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
      if ((res.data as any)?.listing) {
        setInspectionListing((res.data as any).listing);
      }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5 - inspectionImages.length);
    const newImages = [...inspectionImages];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result && typeof ev.target.result === 'string') {
          newImages.push({ mimeType: file.type, data: ev.target.result, preview: ev.target.result });
          setInspectionImages([...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyzeQuality = async () => {
    if (!inspectionListing || inspectionImages.length === 0) return;
    setInspectionLoading(true);
    const sensorData = MOCK_SENSOR_DATA[inspectionListing.cropName] || MOCK_SENSOR_DATA["Potato"];
    const res = await apiPost('/api/crop-quality/analyze', {
        listingId: inspectionListing._id,
        cropName: inspectionListing.cropName,
        images: inspectionImages.map(img => ({ mimeType: img.mimeType, data: 'visual_simulation_active' })),
        sensorData: sensorData
    });
    setInspectionLoading(false);
    if (res.success) {
        setInspectionListing(null);
        setInspectionImages([]);
        fetchListings(); // Refresh to show report
        alert('Quality Inspection completed!');
    } else {
        alert('Failed to analyze quality: ' + ((res.data as any)?.message || res.error || ''));
    }
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = { VEGETABLE: '🥬', FRUIT: '🍎', GRAIN: '🌾', SPICE: '🌶️', PULSE: '🫘' };
    return icons[cat] || '🌱';
  };

  const methodColor = (m: string) => {
    if (m === 'ORGANIC') return { bg: '#DCFCE7', color: '#15803D' };
    if (m === 'HYDROPONIC') return { bg: '#DBEAFE', color: '#1D4ED8' };
    return { bg: '#F1F5F9', color: '#475569' };
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
                  <div style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{listing.totalQuantity.toLocaleString()} {listing.unit}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Price</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-dark)' }}>₹{listing.pricePerUnit}/{listing.unit}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
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

                {/* Quality Report rendering */}
                {listing.qualityReport ? (
                  <>
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: listing.qualityReport.overall_grade === 'A' ? '#F0FDF4' : listing.qualityReport.overall_grade === 'B' ? '#FFFBEB' : '#FEF2F2', borderRadius: 'var(--radius-sm)', border: '1px solid', borderColor: listing.qualityReport.overall_grade === 'A' ? '#BBF7D0' : listing.qualityReport.overall_grade === 'B' ? '#FEF08A' : '#FECACA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Quality Inspection</span>
                      <span style={{ fontWeight: 800, color: listing.qualityReport.overall_grade === 'A' ? '#166534' : listing.qualityReport.overall_grade === 'B' ? '#B45309' : '#991B1B' }}>
                        Grade {listing.qualityReport.overall_grade}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                      {(() => {
                        const sensor = MOCK_SENSOR_DATA[listing.cropName] || MOCK_SENSOR_DATA["Potato"];
                        return (
                          <>
                            {/* AI Visual Analysis */}
                            <div><span style={{ color: 'var(--text-muted)' }}>Defects:</span> {listing.qualityReport.defect_area_percentage || 0}% ({listing.qualityReport.primary_defect_category})</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Uniformity:</span> {listing.qualityReport.size_uniformity}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Shelf Life:</span> {listing.qualityReport.estimated_shelf_life_days} days</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Ripeness:</span> {listing.qualityReport.ripeness_index}/5</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Color:</span> <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: listing.qualityReport.dominant_color_hex, borderRadius: '50%', border: '1px solid #ccc' }}></span> {listing.qualityReport.dominant_color_hex}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Commodity:</span> {listing.qualityReport.commodity_type}</div>
                            
                            {/* AI Derived Analysis */}
                            <div><span style={{ color: 'var(--text-muted)' }}>Storage Cond:</span> {listing.qualityReport.storage_condition}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Freshness Score:</span> {listing.qualityReport.freshness_score}/100</div>
                            <div style={{ color: listing.qualityReport.temperature_risk === 'High' ? '#DC2626' : 'inherit' }}><span style={{ color: 'var(--text-muted)' }}>Temp Risk:</span> {listing.qualityReport.temperature_risk}</div>
                            <div style={{ color: listing.qualityReport.humidity_risk === 'High' ? '#DC2626' : 'inherit' }}><span style={{ color: 'var(--text-muted)' }}>Humid Risk:</span> {listing.qualityReport.humidity_risk}</div>

                            {/* Raw Hardware Sensors */}
                            <div><span style={{ color: 'var(--text-muted)' }}>Sensor Temp:</span> {sensor.temperature_celsius}°C</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Sensor Humidity:</span> {sensor.humidity_percentage}%</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Weight/Unit:</span> {sensor.weight_per_unit_grams}g</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Firmness:</span> {sensor.firmness_score}/10</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Silo Gas:</span> {sensor.gas_detection_status}</div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Cold Route:</span> {sensor.cold_storage_used ? 'Yes' : 'No'}</div>
                            <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Transport Time:</span> {sensor.transport_duration_hours}h</div>
                          </>
                        );
                      })()}
                    </div>
                    {!listing.qualityReport.compliance_passed && (
                      <div style={{ marginTop: '0.5rem', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 600 }}>
                        ⚠️ Failed Compliance: {listing.qualityReport.rejection_code}
                      </div>
                    )}
                  </div>

                  {listing.qualityReport.qr_code_url && listing.qualityReport.qr_payload && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px dashed #CBD5E1', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>Traceability QR Code</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Scan to view full crop quality report</div>
                      
                      <div style={{ display: 'inline-block', padding: '0.5rem', background: '#FFFFFF', borderRadius: '0.5rem', border: '1px solid #E2E8F0', marginBottom: '0.75rem' }}>
                        <img 
                          src={listing.qualityReport.qr_code_url} 
                          alt="Crop Report QR Code" 
                          style={{ width: '150px', height: '150px', cursor: 'pointer' }}
                          onClick={() => window.open(listing.qualityReport.qr_payload.report_url, '_blank')}
                        />
                      </div>
                      
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Batch ID: {listing.qualityReport.qr_payload.batch_id}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <a 
                          href={listing.qualityReport.qr_code_url}
                          download={`Crop_Report_${listing.qualityReport.qr_payload.batch_id}.png`}
                          style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', background: '#E2E8F0', color: 'var(--text-color)', borderRadius: 'var(--radius-sm)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          ⬇️ Download QR
                        </a>
                        <button 
                          onClick={() => window.open(listing.qualityReport.qr_payload.report_url, '_blank')}
                          style={{ border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
                        >
                          👁️ View Report
                        </button>
                      </div>
                    </div>
                  )}
                  
                  </>
              ) : (
                  <div style={{ marginTop: '0.75rem' }}>
                    <button onClick={() => setInspectionListing(listing)} style={{ width: '100%', padding: '0.5rem', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>
                      + Request Quality Inspection
                    </button>
                  </div>
                )}
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

      {/* Quality Inspection Modal */}
      {inspectionListing && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" style={{ alignItems: 'flex-start', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget && !inspectionLoading) setInspectionListing(null); }}>
          <div className="modal-sheet" style={{ maxHeight: '100dvh', height: '100dvh', borderRadius: 0, display: 'flex', flexDirection: 'column', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>AI Quality Inspection 🔍</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Upload sample images of {inspectionListing.cropName}.</p>
              </div>
              <button disabled={inspectionLoading} onClick={() => { setInspectionListing(null); setInspectionImages([]); }} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              
              {/* IoT Sensor readout */}
              <div style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   📡 Attached IoT Sensor Data
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem', color: '#166534' }}>
                  {(() => {
                    const sensor = MOCK_SENSOR_DATA[inspectionListing.cropName] || MOCK_SENSOR_DATA["Potato"];
                    return (
                      <>
                        <div><span style={{ opacity: 0.7 }}>Temp:</span> {sensor.temperature_celsius}°C</div>
                        <div><span style={{ opacity: 0.7 }}>Humidity:</span> {sensor.humidity_percentage}%</div>
                        <div><span style={{ opacity: 0.7 }}>Firmness:</span> {sensor.firmness_score}/10</div>
                        <div><span style={{ opacity: 0.7 }}>Gas Check:</span> {sensor.gas_detection_status}</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '2px dashed #CBD5E1' }}>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="quality-images-upload" disabled={inspectionLoading || inspectionImages.length >= 5} />
                <label htmlFor="quality-images-upload" style={{ cursor: 'pointer', display: 'block', padding: '1rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                  <div style={{ fontWeight: 600 }}>Tap to Select Images</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 5 images of the batch</div>
                </label>
              </div>

              {inspectionImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {inspectionImages.map((img, i) => (
                    <div key={i} style={{ aspectRatio: '1', position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={img.preview} alt={`Sample ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setInspectionImages(inspectionImages.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {inspectionLoading && (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#F0F9FF', borderRadius: 'var(--radius-md)' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem', borderColor: '#3B82F6', borderRightColor: 'transparent' }} />
                  <div style={{ fontWeight: 700, color: '#1E3A8A' }}>Analyzing crop quality...</div>
                  <div style={{ fontSize: '0.8rem', color: '#3B82F6', marginTop: '0.25rem' }}>Using Gemini Vision AI</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button className="btn-big btn-primary" onClick={handleAnalyzeQuality} disabled={inspectionLoading || inspectionImages.length === 0} style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                {inspectionLoading ? 'Generating Report...' : `Analyze ${inspectionImages.length} Images`}
              </button>
              <button className="btn-big btn-secondary" onClick={() => { setInspectionListing(null); setInspectionImages([]); }} disabled={inspectionLoading}>
                Skip for Now
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
