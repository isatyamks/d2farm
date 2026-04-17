"use client";
import { useState, useEffect } from 'react';

interface ForecastDay { day: string; predicted_price: number; confidence_score: number; }
interface MLData {
    crop: string;
    farmerPrice: number;
    forecast: { trend: string; pct_change: string; action: string; days: ForecastDay[] };
    demand: { optimal_zone: string; distance_km: number; supply_deficit_pct: number; expected_premium_pct: number };
    spoilage: { risk_pct: number; risk_level: string; cold_chain_needed: boolean; stressor: string };
    route: { recommended: { name: string; eta: number; cold_nodes: number }; alternative: { name: string; eta: number } };
}

interface Listing { _id: string; cropName: string; variety: string; pricePerUnit: number; }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function DeepTechEngine({ farmerId }: { farmerId: string }) {
    const [listings, setListings] = useState<Listing[]>([]);
    const [selectedCrop, setSelectedCrop] = useState<Listing | null>(null);
    const [mlData, setMlData] = useState<MLData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('forecast');

    // Step 1: Load farmer's real crop listings
    useEffect(() => {
        const fetchListings = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/listings?farmerId=${farmerId}`);
                const json = await res.json();
                const crops: Listing[] = json.listings || [];
                setListings(crops);
                if (crops.length > 0) {
                    setSelectedCrop(crops[0]);
                }
            } catch {
                // Fallback with demo data if no listings exist yet
                const demo: Listing[] = [
                    { _id: 'demo1', cropName: 'Tomato', variety: 'Hybrid', pricePerUnit: 22 },
                ];
                setListings(demo);
                setSelectedCrop(demo[0]);
            }
        };
        fetchListings();
    }, [farmerId]);

    // Step 2: When selected crop changes, call the ML forecast API
    useEffect(() => {
        if (!selectedCrop) return;
        const fetchForecast = async () => {
            setLoading(true);
            setMlData(null);
            try {
                const params = new URLSearchParams({
                    crop: selectedCrop.cropName,
                    basePrice: String(selectedCrop.pricePerUnit),
                    travelHours: '8',
                    temperature: '30',
                });
                const res = await fetch(`${API_BASE}/api/ml/farmer-forecast?${params}`);
                const json = await res.json();
                if (json.success) setMlData(json);
            } catch (e) {
                console.error('ML request failed', e);
            }
            setLoading(false);
        };
        fetchForecast();
    }, [selectedCrop]);

    const isBullish = mlData?.forecast.trend === 'BULLISH';
    const spoilageColor = mlData
        ? mlData.spoilage.risk_level === 'HIGH' ? 'var(--danger)' 
        : mlData.spoilage.risk_level === 'MEDIUM' ? 'var(--warning)' 
        : 'var(--success)'
        : 'var(--text-muted)';

    return (
        <div className="stagger">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>ML Forecast</h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Live predictions for your crops.</p>
                </div>
                <span className="badge badge-success">Live</span>
            </div>

            {/* Crop Selector — uses farmer's actual listings */}
            {listings.length > 0 && (
                <div className="card-solid" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Forecasting for
                    </div>
                    <div className="toggle-group">
                        {listings.slice(0, 4).map(l => (
                            <button
                                key={l._id}
                                className={`toggle-option ${selectedCrop?._id === l._id ? 'active' : ''}`}
                                onClick={() => setSelectedCrop(l)}
                                style={{ fontSize: '0.8rem' }}
                            >
                                {l.cropName}
                            </button>
                        ))}
                    </div>
                    {selectedCrop && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Your listed price: <strong style={{ color: 'var(--primary-dark)' }}>₹{selectedCrop.pricePerUnit}/kg</strong> · {selectedCrop.variety}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="card-solid empty-state" style={{ padding: '4rem 2rem' }}>
                    <div className="spinner spinner-dark" style={{ margin: '0 auto 1rem', width: '28px', height: '28px' }}></div>
                    <p style={{ color: 'var(--text-muted)' }}>Calculating predictions...</p>
                </div>
            ) : mlData ? (
                <>
                    {/* Tab Navigation */}
                    <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
                        {['forecast', 'demand', 'spoilage', 'route'].map(tab => (
                            <button
                                key={tab}
                                className={`toggle-option ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="fade-slide-up" key={activeTab + mlData.crop}>

                        {/* PRICE FORECAST TAB */}
                        {activeTab === 'forecast' && (
                            <>
                                {/* Hero card: colour changes based on actual trend */}
                                <div className="card-hero" style={{
                                    background: isBullish
                                        ? 'linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 100%)'
                                        : 'linear-gradient(145deg, #DC2626 0%, #EF4444 100%)',
                                    marginBottom: '1rem'
                                }}>
                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{ fontSize: '0.78rem', opacity: 0.85, fontWeight: 600, marginBottom: '0.3rem' }}>
                                            7-Day Outlook · {mlData.crop}
                                        </div>
                                        <div style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.4rem' }}>
                                            {mlData.forecast.action}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                            Expected {isBullish ? 'gain' : 'drop'} of <strong>{Math.abs(parseFloat(mlData.forecast.pct_change))}%</strong> over 7 days vs your ₹{mlData.farmerPrice}/kg
                                        </div>
                                    </div>
                                </div>

                                <div className="card-solid">
                                    <div className="section-title" style={{ marginBottom: '1rem' }}>Day-by-Day Price Projection</div>
                                    <div className="timeline">
                                        {mlData.forecast.days.map((d, i) => {
                                            const diff = d.predicted_price - mlData.farmerPrice;
                                            const isUp = diff >= 0;
                                            return (
                                                <div key={i} className="timeline-item">
                                                    <div className={`timeline-dot ${i === 0 ? 'active' : i < 3 ? 'completed' : 'pending'}`}></div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <div className={`timeline-title ${i === 0 ? 'active' : i >= 5 ? 'pending' : ''}`}>
                                                            {d.day}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontWeight: 800, color: isUp ? 'var(--success)' : 'var(--danger)' }}>
                                                                ₹{d.predicted_price}
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', color: isUp ? 'var(--success)' : 'var(--danger)' }}>
                                                                {isUp ? '▲' : '▼'}{Math.abs(diff).toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="timeline-meta">Confidence: {d.confidence_score}%</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* DEMAND TAB */}
                        {activeTab === 'demand' && (
                            <div className="card-solid">
                                <div className="section-title">Best Market to Sell</div>
                                <div style={{ margin: '1rem 0 1.5rem' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                        {mlData.demand.optimal_zone}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {mlData.demand.distance_km}km from your farm
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ textAlign: 'center', background: 'var(--success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1 }}>
                                            +{mlData.demand.expected_premium_pct}%
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, marginTop: '0.25rem' }}>PRICE PREMIUM</div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: 'var(--warning-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)', lineHeight: 1 }}>
                                            {mlData.demand.supply_deficit_pct}%
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#B45309', fontWeight: 700, marginTop: '0.25rem' }}>SUPPLY DEFICIT</div>
                                    </div>
                                </div>

                                <button className="btn-big btn-primary">Route Stock to This Market</button>
                            </div>
                        )}

                        {/* SPOILAGE RISK TAB */}
                        {activeTab === 'spoilage' && (
                            <div className="card-solid">
                                <div className="section-title">Consignment Health</div>
                                <div style={{ textAlign: 'center', padding: '1.5rem 0 1.75rem' }}>
                                    <div style={{ fontSize: '3.5rem', fontWeight: 900, color: spoilageColor, lineHeight: 1 }}>
                                        {mlData.spoilage.risk_pct}%
                                    </div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: spoilageColor, marginTop: '0.5rem', textTransform: 'uppercase' }}>
                                        {mlData.spoilage.risk_level} Spoilage Risk
                                    </div>
                                </div>
                                <div className="divider" style={{ margin: '0 0 1.25rem' }}></div>

                                <div className="metric-row" style={{ marginBottom: '1rem' }}>
                                    <div className="metric-icon" style={{ background: 'var(--danger-light)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path></svg>
                                    </div>
                                    <div>
                                        <div className="metric-value" style={{ fontSize: '1rem' }}>{mlData.spoilage.stressor}</div>
                                        <div className="metric-label">Primary Decay Driver</div>
                                    </div>
                                </div>

                                <div style={{
                                    background: mlData.spoilage.cold_chain_needed ? 'var(--danger-light)' : 'var(--success-light)',
                                    color: mlData.spoilage.cold_chain_needed ? '#B91C1C' : '#15803D',
                                    padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'center', fontSize: '0.9rem'
                                }}>
                                    {mlData.spoilage.cold_chain_needed
                                        ? '❄️ Cold Chain Required for Safe Transit'
                                        : '✅ Standard Dispatch — No Cold Chain Needed'
                                    }
                                </div>
                            </div>
                        )}

                        {/* ROUTE TAB */}
                        {activeTab === 'route' && (
                            <div className="card-solid">
                                <div className="section-title">Optimal Transit Route</div>

                                <div className="metric-row" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="metric-icon" style={{ background: 'var(--primary-light)' }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                                    </div>
                                    <div>
                                        <div className="metric-value" style={{ fontSize: '1rem' }}>{mlData.route.recommended.name}</div>
                                        <div className="metric-label">ETA: {mlData.route.recommended.eta}h · {mlData.route.recommended.cold_nodes} cold storage nodes</div>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--surface-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Alternative</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{mlData.route.alternative.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ETA: {mlData.route.alternative.eta}h</div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="card-solid empty-state">
                    <h3>Forecast unavailable</h3>
                    <p>Could not connect to ML engine. Please check your backend is running.</p>
                </div>
            )}
        </div>
    );
}
