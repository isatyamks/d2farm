"use client";
import { useState, useEffect } from 'react';

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

export default function DemandPlanner({ setCurrentView }: any) {
    const [summaries, setSummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [focusCrop, setFocusCrop] = useState<any>(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const res = await fetch(`${API}/api/market-insights/ledger`);
                const json = await res.json();
                if (json.success && json.summaries) {
                    setSummaries(json.summaries);
                    setFocusCrop(json.summaries[0]);
                }
            } catch (e) {
                console.error("Planner fetch error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTrends();
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><i className="ph ph-spinner ph-spin"></i> Analyzing consumption patterns...</div>;

    return (
        <div className="fade-in">
            {focusCrop && (
                <div className="card-glass mb-6">
                    <div className="grid-cols-3" style={{ alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AI DEMAND FORECAST</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--surface-bg)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                    <i className="ph ph-chart-line-up" style={{ color: 'var(--primary)' }}></i>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{focusCrop.crop}</h2>
                                    <span className={`insight-tag ${focusCrop.trend.includes('SCARCITY') ? 'tag-danger' : 'tag-stable'}`}>
                                        {focusCrop.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Avg. Market Price</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{focusCrop.currentPrice}/kg</div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '0.25rem' }}>Future Strategy</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{focusCrop.strategy}</div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '2rem', background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>Procurement Recommendation</h3>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>Auto-filled Order Params</span>
                        </div>
                        
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Suggested Qty (kg)</label>
                                <input type="number" className="form-control" defaultValue="750" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Procurement Urgency</label>
                                <div className="form-control" style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="ph ph-info" style={{ color: 'var(--info)' }}></i>
                                    {focusCrop.trend.includes('SCARCITY') ? 'High — Buy now to hedge spike' : 'Normal — Seasonal stock available'}
                                </div>
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCurrentView('orders')}>
                            Approve & Go to Order Placement
                        </button>
                    </div>
                </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Multi-Commodity Signals</h3>
            <div className="grid-cols-2">
                {summaries.slice(1, 5).map(item => (
                    <div key={item.id} className="item-row" style={{ cursor: 'pointer' }} onClick={() => setFocusCrop(item)}>
                        <div className="item-main">
                            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'var(--surface-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="ph ph-trend-up" style={{ color: item.trend.includes('SCARCITY') ? 'var(--danger)' : 'var(--success)' }}></i>
                            </div>
                            <div>
                                <div className="item-title">{item.crop}</div>
                                <div className="item-sub">Trend: {item.trend} • Forecast: ₹{item.predictedFuturePrice}/kg</div>
                            </div>
                        </div>
                        <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)' }}></i>
                    </div>
                ))}
            </div>
        </div>
    );
}
