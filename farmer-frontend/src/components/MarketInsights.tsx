"use client";

export default function MarketInsights() {
    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>AI Market Intelligence</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Predictive algorithms showing exactly when and whom to sell to maximize your farm's profit.</p>
            </div>

            {/* Strategic Advice Card */}
            <div className="card-pwa" style={{ background: 'var(--surface)', border: '2px solid var(--primary)', boxShadow: '0 8px 30px rgba(16, 185, 129, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <i className="ph-fill ph-lightbulb" style={{ color: 'var(--warning)', fontSize: '1.5rem' }}></i>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Action: HOLD ONIONS</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                    Our ML model predicts a <strong style={{ color: 'var(--primary)' }}>15% price spike</strong> for Red Nashik Onions starting next week due to approaching highway logistics delays. 
                    <strong style={{ color: 'var(--danger)', display: 'block', marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        Recommendation: Do not dispatch yields today. Withhold your stock until Thursday to lock in ₹24/kg.
                    </strong>
                </p>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Local Demand Hotzones</h3>
            
            <div className="card-pwa">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)' }}>BigBasket Supermarkets</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>Urgent Buyer Demand</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>₹22/kg</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asking for 1000kg Tomatoes</div>
                    </div>
                </div>
                <button className="btn-outline-pwa" style={{ padding: '0.8rem', background: 'var(--surface)' }}>Offer Direct Contract</button>
            </div>

            <div className="card-pwa" style={{ opacity: 0.9, background: 'var(--bg-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)' }}>Grand Hotel Kitchens</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standard Replenishment</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>₹15/kg</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asking for 500kg Potato</div>
                    </div>
                </div>
                <button className="btn-outline-pwa" style={{ padding: '0.8rem', borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>Offer Direct Contract</button>
            </div>
        </div>
    );
}
