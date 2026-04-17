export default function Dashboard({ setCurrentView }: { setCurrentView: (v: string) => void }) {
    return (
        <div>
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
                            <h4>Tomatoes 100kg</h4>
                            <div className="value" style={{ fontSize: '1.2rem' }}>Tomorrow, 8 AM</div>
                            <span className="item-status status-track" style={{ display: 'inline-block', marginTop: '0.5rem' }}>On Track</span>
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
                            <h4>Total Ordered</h4>
                            <div className="value">850 kg</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>+12% from last week</div>
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
                            <h4>Available</h4>
                            <div className="value">₹14,500</div>
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
                    <h3 style={{ marginBottom: '1rem' }}>Active Orders</h3>
                    {/* Clickable row → Order Tracking */}
                    <div className="item-row" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('tracking')}>
                        <div className="item-main">
                            <div className="item-img"><i className="ph ph-package"></i></div>
                            <div>
                                <div className="item-title">Onions - 200kg</div>
                                <div className="item-sub">Order #4092 • Expected Today</div>
                            </div>
                        </div>
                        <div className="item-status status-track">In Transit (ETA 4 PM)</div>
                    </div>
                    <div className="item-row">
                        <div className="item-main">
                            <div className="item-img" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}><i className="ph ph-package"></i></div>
                            <div>
                                <div className="item-title">Potatoes - 500kg</div>
                                <div className="item-sub">Order #4093 • Partially Fulfilled</div>
                            </div>
                        </div>
                        <button
                            className="btn btn-outline"
                            onClick={() => setCurrentView('orders')}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                        >
                            Review (420kg max)
                        </button>
                    </div>
                </div>

                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Crucial Alerts</h3>
                    <div className="alert alert-warning" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <i className="ph-fill ph-warning-circle"></i> <strong>Supply Tight</strong>
                        </div>
                        <p style={{ marginTop: '0.25rem' }}>Onion supply limited next week. Secure your stock now.</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => setCurrentView('planner')}
                        >
                            Review Demand Planner
                        </button>
                    </div>
                    <div className="alert alert-danger" style={{ flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <i className="ph-fill ph-trend-up"></i> <strong>Price Spike</strong>
                        </div>
                        <p style={{ marginTop: '0.25rem' }}>Tomato prices up ₹4/kg. Lock in current prices.</p>
                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                            onClick={() => setCurrentView('proposals')}
                        >
                            View Farmer Proposals
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
