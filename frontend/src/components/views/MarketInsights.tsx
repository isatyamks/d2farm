"use client";
import { useState, useEffect } from 'react';

export default function MarketInsights() {
    const [summaries, setSummaries] = useState<any[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterCrop, setFilterCrop] = useState('ALL');
    const [filterPhase, setFilterPhase] = useState('ALL');
    const [sortBy, setSortBy] = useState('DATE_DESC');

    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const res = await fetch('http://localhost:4000/api/market-insights/ledger');
                if (res.ok) {
                    const data = await res.json();
                    setSummaries(data.summaries);
                    setRows(data.rows);
                }
            } catch(e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        // Initial Load
        fetchLedger();

        // 📈 STOCK MARKET TICKER REAL-TIME POLLING (Evry 4 Seconds)
        const interval = setInterval(fetchLedger, 4000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="card-glass text-center p-12" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph ph-spinner ph-spin" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                <h3 style={{ color: 'var(--text-main)' }}>Aggregating Live Market Data...</h3>
                <p style={{ color: 'var(--text-muted)' }}>Pinging Machine Learning Engine on Port 5000 to construct Timeline Matrices</p>
            </div>
        );
    }

    // Apply Filter & Sort Logic
    let processedRows = rows.filter(r => filterCrop === 'ALL' || r.crop === filterCrop);
    processedRows = processedRows.filter(r => filterPhase === 'ALL' || r.phase.includes(filterPhase));
    
    processedRows = [...processedRows].sort((a, b) => {
        if (sortBy === 'DATE_DESC') return b.dayOffset - a.dayOffset; // Future to past
        if (sortBy === 'DATE_ASC') return a.dayOffset - b.dayOffset;  // Past to future
        if (sortBy === 'PRICE_HIGH') return b.price - a.price;
        if (sortBy === 'PRICE_LOW') return a.price - b.price;
        return 0;
    });

    // Unique Crop Names for the dropdown
    const availableCrops = Array.from(new Set(rows.map(r => r.crop)));

    return (
        <div>
            {/* Minimal Square Ticker Dashboard */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {summaries.slice(0, 4).map((item) => {
                    const isScarcity = item.trend.includes('SCARCITY');
                    return (
                        <div key={item.id} className="card-glass hover-scale" style={{ 
                            flex: '0 0 auto', 
                            width: '140px', 
                            height: '140px', 
                            padding: '1rem',
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            textAlign: 'center',
                            borderRadius: '16px',
                            border: `1px solid ${isScarcity ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            background: isScarcity ? 'rgba(239,68,68,0.02)' : 'rgba(16,185,129,0.02)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                        }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {item.crop.split(' ')[0]}
                            </h4>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                                ₹{item.currentPrice.toFixed(0)}
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/kg</span>
                            </div>
                            <div style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 700, 
                                padding: '2px 8px', 
                                borderRadius: '12px',
                                background: isScarcity ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                color: isScarcity ? 'var(--danger)' : 'var(--success)' 
                            }}>
                                {isScarcity ? '▲ SCARCITY' : '▼ ABUNDANT'}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }}></span>
                            Live Market Ledger (MVP)
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Stock-market style auto-refreshing dashboard featuring native predictive columns.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filter Crop</label>
                            <select className="form-control" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
                                <option value="ALL">All Commodities</option>
                                {availableCrops.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filter Phase</label>
                            <select className="form-control" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={filterPhase} onChange={e => setFilterPhase(e.target.value)}>
                                <option value="ALL">All Phases</option>
                                <option value="HISTORICAL">Historical Archive</option>
                                <option value="LIVE CURRENT">Live Current</option>
                                <option value="FORECAST">AI Forecast (Future)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sort Operations</label>
                            <select className="form-control" style={{ padding: '0.5rem', fontSize: '0.85rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="DATE_DESC">Date (Newest First)</option>
                                <option value="DATE_ASC">Date (Oldest First)</option>
                                <option value="PRICE_HIGH">Price (Highest to Lowest)</option>
                                <option value="PRICE_LOW">Price (Lowest to Highest)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ overflow: 'auto', maxHeight: '500px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ background: 'var(--surface-bg)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phase Label</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Crop / Variety</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Algorithm Price</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Key Price Driver</th>
                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedRows.map(row => {
                                let bgPhase = 'transparent';
                                let tagBg = 'var(--surface-bg)';
                                let tagTextColor = 'var(--text-muted)';

                                if (row.phase.includes('FORECAST')) {
                                    bgPhase = 'rgba(16, 185, 129, 0.05)'; // Light green
                                    tagBg = '#10B981';
                                    tagTextColor = 'white';
                                } else if (row.phase.includes('CURRENT')) {
                                    bgPhase = 'rgba(59, 130, 246, 0.08)'; // Light blue
                                    tagBg = '#3B82F6';
                                    tagTextColor = 'white';
                                }

                                return (
                                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)', background: bgPhase, transition: 'background-color 0.5s ease' }}>
                                        <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>{row.date}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ background: tagBg, color: tagTextColor, padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                                                {row.phase}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                                            {row.crop} <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem', display: 'block' }}>{row.variety}</span>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 700, color: row.phase.includes('CURRENT') ? '#1E3A8A' : 'var(--text-main)', fontSize: '1.2rem' }}>
                                            ₹{row.price.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-main)' }}>
                                            <div style={{ fontSize: '0.85rem' }}>{row.driver}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ background: 'var(--surface-bg)', width: '60px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${row.confidence}%`, height: '100%', background: row.confidence > 85 ? 'var(--success)' : 'var(--warning)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: row.confidence > 85 ? 'var(--success)' : 'var(--warning)' }}>{row.confidence}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {processedRows.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No entries found matching your specific ML filter criteria.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
