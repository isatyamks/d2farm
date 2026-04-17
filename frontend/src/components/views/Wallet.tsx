"use client";
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface WalletData {
    balance: number;
    lockedBalance: number;
    creditLimit: number;
}

interface TxEntry {
    _id: string;
    status: string;
    paymentStatus: string;
    totalValue: number;
    createdAt: string;
    orderId?: { crop: string };
}

export default function Wallet() {
    const [wallet, setWallet] = useState<WalletData>({ balance: 50000, lockedBalance: 0, creditLimit: 0 });
    const [txns, setTxns] = useState<TxEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all proposals to derive real wallet ledger
                const res = await fetch(`${API_BASE}/api/proposals`);
                const json = await res.json();
                if (json.success) {
                    setTxns(json.proposals || []);

                    // Reconstruct wallet state from accepted proposals
                    const accepted = (json.proposals || []).filter((p: TxEntry) => p.status === 'ACCEPTED' || p.paymentStatus === 'ESCROW_LOCKED');
                    const totalEscrowed = accepted.reduce((sum: number, p: TxEntry) => sum + (p.totalValue * 0.02), 0);
                    setWallet(prev => ({ ...prev, lockedBalance: parseFloat(totalEscrowed.toFixed(2)) }));
                }
            } catch {
                // keep defaults
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const availableBalance = wallet.balance - wallet.lockedBalance;
    const escrowPct = wallet.balance > 0 ? Math.min((wallet.lockedBalance / wallet.balance) * 100, 100) : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ph ph-wallet"></i> Payments &amp; Wallet
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Your live escrow and payment ledger</p>
                </div>
            </div>

            <div className="grid-main-side">
                <div>
                    {/* Main Balance Card */}
                    <div className="card-glass mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                                    Available Balance
                                </div>
                                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>
                                    ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                    Total wallet: ₹{wallet.balance.toLocaleString('en-IN')}
                                </div>
                            </div>
                            <button className="btn btn-primary"><i className="ph ph-plus"></i> Add Funds</button>
                        </div>

                        {/* Escrow Bar */}
                        {wallet.lockedBalance > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <i className="ph ph-lock-key"></i> In Escrow (Locked)
                                    </span>
                                    <span style={{ color: 'var(--warning)' }}>₹{wallet.lockedBalance.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: `${escrowPct}%`, background: 'var(--warning)' }}></div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                    Locked as 2% advance on accepted contracts. Released to farmers on delivery confirmation.
                                </div>
                            </div>
                        )}

                        {/* Escrow Info Banner */}
                        <div className="alert alert-warning" style={{ margin: 0 }}>
                            <span className="alert-icon"><i className="ph ph-info"></i></span>
                            <div className="alert-text">
                                <strong>Escrow Protection</strong>
                                <p>When you accept a farmer proposal, 2% of the contract value is locked from your balance as a trust commitment. This releases to the farmer only after delivery is confirmed.</p>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Breakdown */}
                    <div className="grid-cols-2 mb-6">
                        <div className="card-glass">
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                                <i className="ph ph-check-circle" style={{ color: 'var(--success)', marginRight: '4px' }}></i>Available
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
                                ₹{availableBalance.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to spend</div>
                        </div>
                        <div className="card-glass">
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem' }}>
                                <i className="ph ph-lock-key" style={{ color: 'var(--warning)', marginRight: '4px' }}></i>Escrowed
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>
                                ₹{wallet.lockedBalance.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Pending delivery</div>
                        </div>
                    </div>

                    {/* Transaction Ledger */}
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Contract Ledger</h3>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <i className="ph ph-spinner ph-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                        </div>
                    ) : txns.length === 0 ? (
                        <div className="card-glass" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No transactions yet
                        </div>
                    ) : (
                        txns.slice(0, 8).map(p => {
                            const escrow = parseFloat((p.totalValue * 0.02).toFixed(2));
                            const isEscrowed = p.status === 'ACCEPTED';
                            const isPaid = p.status === 'PAYMENT_RECEIVED';
                            return (
                                <div key={p._id} className="item-row">
                                    <div className="item-main">
                                        <div className="item-img" style={{
                                            background: isPaid ? 'var(--success-light)' : isEscrowed ? 'var(--warning-light)' : 'var(--info-light)',
                                            color: isPaid ? 'var(--success)' : isEscrowed ? 'var(--warning)' : 'var(--info)'
                                        }}>
                                            <i className={`ph ${isPaid ? 'ph-check-circle' : isEscrowed ? 'ph-lock-key' : 'ph-handshake'}`}></i>
                                        </div>
                                        <div>
                                            <div className="item-title">{p.orderId?.crop || 'Contract'} Proposal</div>
                                            <div className="item-sub">
                                                {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {isEscrowed && <span style={{ marginLeft: '6px', color: 'var(--warning)', fontWeight: 600 }}>• 2% Escrowed</span>}
                                                {isPaid && <span style={{ marginLeft: '6px', color: 'var(--success)', fontWeight: 600 }}>• Settled</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, color: isPaid ? 'var(--danger)' : 'var(--text-main)' }}>
                                        {isEscrowed ? `- ₹${escrow.toLocaleString('en-IN')}` : isPaid ? `- ₹${p.totalValue.toLocaleString('en-IN')}` : `₹${p.totalValue.toLocaleString('en-IN')}`}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                        <i className="ph ph-list"></i> View Full Ledger
                    </button>
                </div>

                {/* Right Panel */}
                <div>
                    <div className="card-glass" style={{ background: '#0F172A', color: 'white', marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.25rem', color: 'white', fontSize: '1rem' }}>
                            <i className="ph ph-clock-countdown" style={{ marginRight: '6px' }}></i>Escrowed Contracts
                        </h3>
                        {txns.filter(p => p.status === 'ACCEPTED').length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No active escrows.</p>
                        ) : (
                            txns.filter(p => p.status === 'ACCEPTED').map(p => (
                                <div key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{p.orderId?.crop || 'Contract'}</span>
                                        <strong style={{ color: '#FCD34D' }}>₹{(p.totalValue * 0.02).toFixed(0)}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                        Locked • Releases on delivery
                                    </div>
                                </div>
                            ))
                        )}
                        <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                            🔒 Escrow funds are held by the smart contract and auto-released on delivery confirmation. If a farmer cancels, the 2% is forfeited as a trust penalty.
                        </div>
                    </div>

                    <div className="card-glass">
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Smart Wallet Rules</h4>
                        {[
                            { icon: 'ph-check', color: 'var(--success)', text: '2% escrowed on contract acceptance' },
                            { icon: 'ph-lock-key', color: 'var(--warning)', text: 'Locked funds earn trust, not interest' },
                            { icon: 'ph-x-circle', color: 'var(--danger)', text: 'Farmer cancellation forfeits their escrow' },
                            { icon: 'ph-arrows-clockwise', color: 'var(--primary)', text: 'Full 100% paid on delivery confirmation' },
                        ].map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <i className={`ph ${r.icon}`} style={{ color: r.color, fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}></i>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
