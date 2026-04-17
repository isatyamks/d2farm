"use client";

export default function HarvestStatus() {
    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Dispatch & Logistics</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track outbound shipments and authorize vehicle loading.</p>
            </div>

            <div className="card-pwa" style={{ borderLeft: '4px solid var(--warning)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Contract #8821</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Buyer: Grand Hotel Kitchens</div>
                    </div>
                    <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>AWAITING PICKUP</span>
                </div>

                <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Cargo</span>
                        <strong style={{ color: 'var(--text-main)' }}>1,500kg Tomatoes</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Assigned Truck</span>
                        <strong style={{ color: 'var(--text-main)' }}>MH-15-AB-1234</strong>
                    </div>
                </div>

                <button className="btn-pwa">
                    <i className="ph ph-qr-code"></i> Scan Driver QR Code
                </button>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>Past Deliveries</h3>
            
            <div className="card-pwa" style={{ borderLeft: '3px solid var(--success)', background: 'var(--bg-main)', opacity: 0.9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Contract #8610</h3>
                    <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700 }}>DELIVERED</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>500kg Potato • Escrow Released <span style={{ color: 'var(--success)' }}>(+₹7,500)</span></div>
            </div>
        </div>
    );
}
