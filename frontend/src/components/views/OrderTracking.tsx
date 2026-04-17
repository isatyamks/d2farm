"use client";

export default function OrderTracking() {
    return (
        <div>
            <div className="card-glass mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>Order #4092</h2>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>200kg Onions • Arriving Today</div>
                    </div>
                    <span className="insight-tag tag-stable" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>ETA: 4:00 PM</span>
                </div>

                <div style={{ position: 'relative', paddingLeft: '2rem', marginBottom: '2rem' }}>
                    <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '2px', background: 'var(--border-color)' }}></div>
                    <div style={{ position: 'absolute', left: '6px', top: 0, height: '60%', width: '2px', background: 'var(--primary)' }}></div>
                    
                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <div style={{ position: 'absolute', left: '-2.35rem', top: 0, width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', border: '3px solid white', boxShadow: '0 0 0 2px var(--primary)' }}></div>
                        <div style={{ fontWeight: 600 }}>Farm Pickup Confirmed</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Farmer: Rajesh Kumar <span style={{ color: 'var(--success)', fontWeight: 600 }}>(95% Reliability Score)</span><br />
                            9:00 AM • Nashik Farms
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <div style={{ position: 'absolute', left: '-2.4rem', top: 0, width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', boxShadow: '0 0 4px var(--primary)' }}></div>
                        <div style={{ fontWeight: 600, color: 'var(--primary)' }}>In Transit</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Vehicle: MH-15-AB-1234 • Driver: Amit<br />
                            Last Checkpoint: Highway Toll
                        </div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-2.35rem', top: 0, width: '14px', height: '14px', borderRadius: '50%', background: 'white', border: '3px solid var(--border-color)' }}></div>
                        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Delivery</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            Expected at Your Warehouse
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline"><i className="ph ph-phone"></i> Call Driver</button>
                    <button className="btn btn-primary"><i className="ph ph-check"></i> Mark Received</button>
                </div>
            </div>
        </div>
    );
}
