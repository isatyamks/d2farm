"use client";

export default function UserProfile() {
    return (
        <div>
            <div className="card-glass" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="https://i.pravatar.cc/150?img=11" alt="User" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem', border: '4px solid var(--primary-light)' }} />
                    <h2 style={{ marginBottom: '0.25rem' }}>Grand Hotel Kitchens</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Joined Jan 2022 • Premium Buyer</div>
                </div>

                <div className="grid-cols-2 mb-6">
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-bg)', borderRadius: 'var(--border-radius-md)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>99.2%</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Order Completion Rate</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--surface-bg)', borderRadius: 'var(--border-radius-md)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>0.8%</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cancellation Rate</div>
                    </div>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Your excellent trust score unlocks a ₹25,000 monthly credit limit and priority delivery routing.</p>
                
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}><i className="ph ph-pencil-simple"></i> Edit Business Details</button>
                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', color: 'var(--danger)' }}><i className="ph ph-sign-out"></i> Sign Out</button>
            </div>
        </div>
    );
}
