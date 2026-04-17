"use client";
import { useState } from 'react';

export default function OrderTracking() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ph ph-truck"></i> Transport Tracking
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Core logistics status for Order #4092.
                    </p>
                </div>
            </div>

            {/* Minimal Horizontal Sub-Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <button 
                    onClick={() => setActiveTab('overview')}
                    style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.9rem',
                        color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent'
                    }}
                >
                    <i className="ph ph-squares-four" style={{ marginRight: '0.4rem' }}></i> Status Overview
                </button>
                <button 
                    onClick={() => setActiveTab('tracking')}
                    style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.9rem',
                        color: activeTab === 'tracking' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'tracking' ? '2px solid var(--primary)' : '2px solid transparent'
                    }}
                >
                    <i className="ph ph-map-pin" style={{ marginRight: '0.4rem' }}></i> Live Tracking Map
                </button>
            </div>

            <div className="card-glass mb-6" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Order #4092</h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>1,500kg Tomatoes (Hybrid)</div>
                    </div>
                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600 }}>
                        ETA: Today, 4:00 PM 
                    </span>
                </div>

                {/* TAB CONTENT: OVERVIEW (Minimal) */}
                {activeTab === 'overview' && (
                    <div className="fade-in">
                        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Origin (Farm)</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>Rajesh Kumar (Nashik Farms)</div>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Current Status</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }}></span>
                                    In Transit
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
                            <i className="ph ph-check"></i> Mark Shipment as Received
                        </button>
                    </div>
                )}

                {/* TAB CONTENT: LIVE TRACKING (Minimal) */}
                {activeTab === 'tracking' && (
                    <div className="fade-in">
                        <div style={{ position: 'relative', paddingLeft: '2.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
                            <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }}></div>
                            <div style={{ position: 'absolute', left: '10px', top: 0, height: '50%', width: '2px', background: 'var(--primary)' }}></div>
                            
                            <div style={{ position: 'relative', marginBottom: '3rem' }}>
                                <div style={{ position: 'absolute', left: '-2.4rem', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', border: '3px solid white' }}></div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Picked Up from Farm</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Nashik Farms • 9:00 AM
                                </div>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '3rem' }}>
                                <div style={{ position: 'absolute', left: '-2.45rem', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', border: '5px solid var(--primary)' }}></div>
                                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>In Transit</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                    Mumbai Highway Toll • 12:45 PM
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-2.4rem', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--surface-bg)', border: '3px solid var(--border-color)' }}></div>
                                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Destination Drop-off</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    South DC Warehouse
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
