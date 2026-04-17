import { useState, useEffect, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Dashboard({ setCurrentView }: { setCurrentView: (v: string) => void }) {
    const [stats, setStats] = useState<any>(null);
    const [activeOrders, setActiveOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [statsRes, propRes] = await Promise.all([
                fetch(`${API}/api/dashboard/stats`),
                fetch(`${API}/api/proposals`)
            ]);
            
            const statsJson = await statsRes.json();
            if (statsJson.success) setStats(statsJson);

            const propJson = await propRes.json();
            if (propJson.success) {
                // Show most recent 2 active proposals as "Active Orders" in negotiation
                setActiveOrders(propJson.proposals.slice(0, 2));
            }
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
        const t = setInterval(loadData, 10000);
        return () => clearInterval(t);
    }, [loadData]);

    if (loading && !stats) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
                <i className="ph ph-spinner ph-spin" style={{ fontSize: '2rem', marginRight: '0.5rem' }}></i>
                Loading Dashboard...
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="grid-cols-3 mb-6">
                {/* Next Delivery */}
                <div className="card-glass" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('tracking')}>
                    <div className="card-header">
                        <span className="card-title">Next Delivery</span>
                        <i className="ph ph-truck text-green" style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div className="metric-widget">
                        <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                            <i className="ph-fill ph-check-circle"></i>
                        </div>
                        <div className="metric-info">
                            <h4>{stats?.nextDelivery ? `${stats.nextDelivery.crop} ${stats.nextDelivery.qty}kg` : 'No upcoming delivery'}</h4>
                            <div className="value" style={{ fontSize: '1.2rem' }}>
                                {stats?.nextDelivery ? new Date(stats.nextDelivery.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '---'}
                            </div>
                            <span className={`item-status ${stats?.nextDelivery ? 'status-track' : 'status-warn'}`} style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                                {stats?.nextDelivery ? 'On Track' : 'Awaiting Harvest'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Weekly Demand */}
                <div className="card-glass" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('planner')}>
                    <div className="card-header">
                        <span className="card-title">Weekly Demand</span>
                        <i className="ph ph-chart-bar" style={{ fontSize: '1.5rem', color: 'var(--info)' }}></i>
                    </div>
                    <div className="metric-widget">
                        <div className="metric-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                            <i className="ph ph-basket"></i>
                        </div>
                        <div className="metric-info">
                            <h4>Total Open Requests</h4>
                            <div className="value">{(stats?.totalWeeklyDemandKg || 0).toLocaleString()} kg</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Across {stats?.totalOpenOrders || 0} active orders</div>
                        </div>
                    </div>
                </div>

                {/* Wallet Balance */}
                <div className="card-glass" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('wallet')}>
                    <div className="card-header">
                        <span className="card-title">Wallet Balance</span>
                        <i className="ph ph-wallet" style={{ fontSize: '1.5rem', color: 'var(--warning)' }}></i>
                    </div>
                    <div className="metric-widget">
                        <div className="metric-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                            <i className="ph ph-currency-inr"></i>
                        </div>
                        <div className="metric-info">
                            <h4>Available Funds</h4>
                            <div className="value">₹{(stats?.walletBalance || 0).toLocaleString('en-IN')}</div>
                            <button
                                className="btn btn-outline"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }}
                                onClick={e => { e.stopPropagation(); setCurrentView('wallet'); }}
                            >
                                Top Up
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-main-side">
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Active Farmer Proposals</h3>
                    {activeOrders.length === 0 ? (
                        <div className="card-glass" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No active proposals. <span style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setCurrentView('orders')}>Create an order</span> to start.
                        </div>
                    ) : (
                        activeOrders.map(p => (
                            <div key={p._id} className="item-row" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('proposals')}>
                                <div className="item-main">
                                    <div className="item-img"><i className="ph ph-handshake"></i></div>
                                    <div>
                                        <div className="item-title">{p.orderId?.crop || p.cropListingId?.cropName} - {p.proposedQuantity}kg</div>
                                        <div className="item-sub">From {p.farmerId?.fullName || 'Farmer'} • ₹{p.proposedPricePerUnit}/kg</div>
                                    </div>
                                </div>
                                <div className={`item-status ${p.status === 'SENT' ? 'status-warn' : 'status-track'}`}>
                                    {p.status === 'SENT' ? 'Review Needed' : p.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Crucial Alerts</h3>
                    <div className="alert alert-warning" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <i className="ph-fill ph-warning-circle"></i> <strong>Supply Insight</strong>
                        </div>
                        <p style={{ marginTop: '0.25rem' }}>{stats?.activeProposals ? `You have ${stats.activeProposals} new farmer proposals to review.` : 'Market supply looks stable. Check the planner for updates.'}</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => setCurrentView('proposals')}
                        >
                            Review Proposals
                        </button>
                    </div>
                    <div className="alert alert-danger" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <i className="ph-fill ph-trend-up"></i> <strong>Price Spike Alert</strong>
                        </div>
                        <p style={{ marginTop: '0.25rem' }}>Veg prices up ₹4/kg on average. Lock in current contracts to hedge risk.</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => setCurrentView('planner')}
                        >
                            Analyze Market Trends
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
