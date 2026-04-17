"use client";
import { useState } from 'react';

export default function OrderTracking() {
    const [activeTab, setActiveTab] = useState('overview');
    const [proposalState, setProposalState] = useState('SENT');
    const [isLoading, setIsLoading] = useState(false);

    const acceptProposal = async () => {
        setIsLoading(true);
        // Backend Integration: PUT /api/proposals/:id/accept-contract
        setTimeout(() => {
            setProposalState('ACCEPTED');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div>

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
                <button 
                    onClick={() => setActiveTab('proposals')}
                    style={{ 
                        background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.9rem',
                        color: activeTab === 'proposals' ? 'var(--primary)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'proposals' ? '2px solid var(--primary)' : '2px solid transparent'
                    }}
                >
                    <i className="ph ph-handshake" style={{ marginRight: '0.4rem' }}></i> Farmer Proposals <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '4px' }}>1 New</span>
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

                {/* TAB CONTENT: FARMER PROPOSALS (Database Sync) */}
                {activeTab === 'proposals' && (
                    <div className="fade-in">
                        <div style={{ border: '1px solid var(--primary)', borderRadius: '12px', padding: '1.5rem', background: 'var(--primary-light)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <i className="ph-fill ph-user-circle" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i> 
                                        Rajesh Kumar (Farmer ID: 67a9)
                                    </h3>
                                </div>
                                <span style={{ background: 'white', border: `1px solid ${proposalState === 'ACCEPTED' ? 'var(--success)' : 'var(--border-color)'}`, color: proposalState === 'ACCEPTED' ? 'var(--success)' : 'inherit', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    Status: {proposalState === 'ACCEPTED' ? 'ESCROW LOCKED' : 'SENT'}
                                </span>
                            </div>
                            
                            {proposalState === 'ACCEPTED' && (
                                <div style={{ background: 'var(--success-light)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--success)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <i className="ph-fill ph-shield-check" style={{ fontSize: '1.5rem', color: 'var(--success)' }}></i>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>Smart Contract Linked Successfully</div>
                                        <div style={{ fontSize: '0.85rem', color: '#065f46' }}>A 2% Upfront Margin (₹34) has been automatically withdrawn from your corporate pool and stored in the Blockchain Escrow.</div>
                                    </div>
                                </div>
                            )}

                            <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'white', padding: '1rem', borderRadius: '8px' }}>
                                "Fresh Rice (Basmati) ready for dispatch."
                            </p>

                            <div className="grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Proposed Qty</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>50 kg</div>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Proposed Price</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>₹34/kg</div>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Value</div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>₹1,700</div>
                                </div>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Blockchain Tx Hash</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                                        0xc2b805...1aa1f
                                    </div>
                                </div>
                            </div>

                            {proposalState !== 'ACCEPTED' && (
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button className="btn" style={{ background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                                        Decline Proposal
                                    </button>
                                    <button onClick={acceptProposal} disabled={isLoading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isLoading ? 0.7 : 1 }}>
                                        {isLoading ? <i className="ph ph-spinner ph-spin"></i> : <i className="ph-fill ph-check-circle"></i>} 
                                        {isLoading ? 'Executing Smart Contract...' : 'Accept & Lock 2% Escrow'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
