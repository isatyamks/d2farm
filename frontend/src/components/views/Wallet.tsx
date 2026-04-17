"use client";

export default function Wallet() {
    return (
        <div>
            <div className="grid-main-side">
                <div>
                    <div className="card-glass mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Wallet Balance</div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹14,500.00</div>
                            </div>
                            <button className="btn btn-primary">+ Add Funds</button>
                        </div>
                        <div className="progress-container mb-6">
                            <div className="progress-bar" style={{ width: '45%' }}></div>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You have used ₹12,000 of your ₹25,000 monthly credit limit (Available for trusted buyers).</div>
                    </div>

                    <h3 style={{ marginBottom: '1rem' }}>Recent Transactions</h3>
                    <div className="item-row">
                        <div className="item-main">
                            <div className="item-img" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}><i className="ph ph-arrow-up-right"></i></div>
                            <div>
                                <div className="item-title">Deposit: Order #4092</div>
                                <div className="item-sub">Oct 24, 2023</div>
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>- ₹1,800</div>
                    </div>
                    <div className="item-row">
                        <div className="item-main">
                            <div className="item-img" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><i className="ph ph-arrow-down-left"></i></div>
                            <div>
                                <div className="item-title">Wallet Top Up</div>
                                <div className="item-sub">Oct 22, 2023</div>
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>+ ₹10,000</div>
                    </div>
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>View Full Ledger</button>
                </div>

                <div>
                    <div className="card-glass" style={{ background: '#0F172A', color: 'white' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'white' }}>Pending Payments</h3>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span>Order #4089 (Delivered)</span>
                                <strong>₹8,200</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Due Today</div>
                        </div>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                <span>Order #4090 (Delivered)</span>
                                <strong>₹4,500</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Due in 2 days</div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'white', color: '#0F172A' }}>Pay All Now (₹12,700)</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
