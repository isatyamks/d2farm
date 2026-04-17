"use client";
import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function OrderTracking() {
    const [activeTab, setActiveTab] = useState('overview');
    const [orders, setOrders] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/proposals`);
            const json = await res.json();
            if (json.success) {
                // Trackable = ACCEPTED, LOGISTICS_DISPATCHED, DELIVERED
                const trackable = json.proposals.filter((p: any) => 
                    ['ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'].includes(p.status)
                );
                setOrders(trackable);
                if (!selected && trackable.length > 0) setSelected(trackable[0]);
                else if (selected) {
                    const updated = trackable.find((o: any) => o._id === selected._id);
                    if (updated) setSelected(updated);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selected]);

    useEffect(() => { load(); }, [load]);

    const markReceived = async () => {
        if (!selected) return;
        setActioning(true);
        try {
            const res = await fetch(`${API}/api/proposals/${selected._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DELIVERED', note: 'Buyer marked as received' })
            });
            if (res.ok) await load();
        } catch (e) { alert("Action failed"); }
        finally { setActioning(false); }
    };

    if (loading && orders.length === 0) return <div style={{ padding: '2rem', textAlign: 'center' }}><i className="ph ph-spinner ph-spin"></i> Locating shipments...</div>;

    if (orders.length === 0) return (
        <div className="card-glass text-center p-12">
            <i className="ph ph-truck" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
            <h3 style={{ marginTop: '1rem' }}>No active shipments</h3>
            <p style={{ color: 'var(--text-muted)' }}>Orders will appear here once you accept a farmer's proposal.</p>
        </div>
    );

    return (
        <div>
            {/* Header / Selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', flex: 1 }}>
                    {orders.map(o => (
                        <button 
                            key={o._id}
                            onClick={() => setSelected(o)}
                            className={`btn ${selected?._id === o._id ? 'btn-primary' : 'btn-outline'}`}
                            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            #{o._id.slice(-4)}: {o.orderId?.crop || o.cropListingId?.cropName}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
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
                    <i className="ph ph-map-pin" style={{ marginRight: '0.4rem' }}></i> Transit Map
                </button>
            </div>

            <div className="card-glass mb-6" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Order #{selected._id.slice(-6)}</h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                            {selected.proposedQuantity}kg {selected.orderId?.crop || selected.cropListingId?.cropName}
                        </div>
                    </div>
                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600 }}>
                        {selected.status === 'ACCEPTED' ? 'Preparing for Dispatch' : selected.status === 'LOGISTICS_DISPATCHED' ? 'In Transit' : selected.status}
                    </span>
                </div>

                {activeTab === 'overview' && (
                    <div className="fade-in">
                        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Farming Partner</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>{selected.farmerId?.fullName || "Verified Farmer"}</div>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1.5rem', borderRadius: '12px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Network Check</div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 1.5s infinite' }}></span>
                                    {selected.status === 'ACCEPTED' ? 'Awaiting Dispatch' : 'Signal High: Tracking Live'}
                                </div>
                            </div>
                        </div>

                        {selected.status === 'LOGISTICS_DISPATCHED' && (
                            <button 
                                onClick={markReceived}
                                disabled={actioning}
                                className={`btn btn-primary ${actioning ? 'btn-loading' : ''}`} 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                            >
                                {actioning ? <><i className="ph ph-spinner"></i> Syncing Ledger...</> : <><i className="ph ph-check"></i> Mark Shipment as Received</>}
                            </button>
                        )}
                        {selected.status === 'DELIVERED' && (
                            <div className="alert alert-success">
                                <i className="ph ph-check-circle"></i> Shipment reached DC. Awaiting final payment settlement.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tracking' && (
                    <div className="fade-in">
                        <div style={{ position: 'relative', paddingLeft: '2.5rem', marginBottom: '1rem', marginTop: '1rem' }}>
                            <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }}></div>
                            <div style={{ position: 'absolute', left: '10px', top: 0, height: selected.status === 'ACCEPTED' ? '10%' : '50%', width: '2px', background: 'var(--primary)' }}></div>
                            
                            <div style={{ position: 'relative', marginBottom: '3rem' }}>
                                <div style={{ position: 'absolute', left: '-2.4rem', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: selected.status !== 'ACCEPTED' ? 'var(--primary)' : 'var(--border-color)', border: '3px solid white' }}></div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Assigned to Warehouse</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Verified & Sealed
                                </div>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '3rem' }}>
                                <div style={{ position: 'absolute', left: '-2.45rem', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', border: `5px solid ${selected.status === 'LOGISTICS_DISPATCHED' ? 'var(--primary)' : 'var(--border-color)'}` }}></div>
                                <div style={{ fontWeight: 800, color: selected.status === 'LOGISTICS_DISPATCHED' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1.2rem' }}>In Transit</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                                    {selected.status === 'LOGISTICS_DISPATCHED' ? 'Currently moving towards Destination Center' : 'Pending dispatch'}
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-2.4rem', top: '2px', width: '16px', height: '16px', borderRadius: '50%', background: selected.status === 'DELIVERED' || selected.status === 'PAYMENT_RECEIVED' ? 'var(--success)' : 'var(--surface-bg)', border: '3px solid var(--border-color)' }}></div>
                                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '1.1rem' }}>Destination Drop-off</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Verified at QC Gate
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
