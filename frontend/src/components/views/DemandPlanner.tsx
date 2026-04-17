"use client";

export default function DemandPlanner({ setCurrentView }: any) {
    return (
        <div>
            <div className="card-glass mb-6">
                <div className="grid-cols-3" style={{ alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>CROP PREDICTION</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <img src="https://img.icons8.com/color/48/000000/tomato.png" width="40" alt="Tomato" />
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tomatoes</h2>
                                <span className="insight-tag tag-stable">Demand Steady</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Past 7 Days Usage</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>100 kg / day</div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--primary-dark)', fontWeight: 600, marginBottom: '0.25rem' }}>Expected Next Week</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>110 kg / day</div>
                    </div>
                </div>
                
                <div style={{ marginTop: '2rem', background: 'var(--surface-bg)', padding: '1.5rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>Recommended Action</h3>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>750 kg total</span>
                    </div>
                    
                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Adjust Quantity (kg)</label>
                            <input type="number" className="form-control" defaultValue="750" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Delivery Schedule</label>
                            <select className="form-control" defaultValue="Split: Everyday (107kg/day)">
                                <option>Split: Everyday (107kg/day)</option>
                                <option>Split: Every 2 Days</option>
                                <option>Single Drop</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCurrentView('orders')}>Approve & Send to Orders</button>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Other Top Ingredients</h3>
            <div className="grid-cols-2">
                <div className="item-row" style={{ cursor: 'pointer' }}>
                    <div className="item-main">
                        <img src="https://img.icons8.com/color/48/000000/onion.png" width="30" alt="Onion" />
                        <div>
                            <div className="item-title">Onion (Nashik)</div>
                            <div className="item-sub">Suggested: 400kg/week</div>
                        </div>
                    </div>
                    <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)' }}></i>
                </div>
                <div className="item-row" style={{ cursor: 'pointer' }}>
                    <div className="item-main">
                        <img src="https://img.icons8.com/color/48/000000/potato.png" width="30" alt="Potato" />
                        <div>
                            <div className="item-title">Potato (Agra, Big)</div>
                            <div className="item-sub">Suggested: 600kg/week</div>
                        </div>
                    </div>
                    <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)' }}></i>
                </div>
            </div>
        </div>
    );
}
