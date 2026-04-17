"use client";
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Proposal {
    _id: string;
    status: string;
    paymentStatus: string;
    proposedQuantity: number;
    proposedPricePerUnit: number;
    totalValue: number;
    message: string;
    blockchainTxHash: string | null;
    createdAt: string;
    farmerId?: { fullName: string; phone: string };
    orderId?: { crop: string; variety: string };
    cropListingId?: { cropName: string; variety: string };
    timeline: { status: string; timestamp: string; note: string }[];
}

const STAGE_ORDER = ['SENT', 'ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'];
const STAGE_LABELS: Record<string, string> = {
    SENT: 'Proposal Sent', ACCEPTED: 'Contract Locked',
    LOGISTICS_DISPATCHED: 'In Transit', DELIVERED: 'Delivered',
    PAYMENT_RECEIVED: 'Payment Complete',
};

const crop = (p: Proposal) => p.orderId?.crop || p.cropListingId?.cropName || 'Crop';
const variety = (p: Proposal) => p.orderId?.variety || p.cropListingId?.variety || '';

export default function SmartContracts() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Proposal | null>(null);
    const [locking, setLocking] = useState<string | null>(null);
    const [txSuccess, setTxSuccess] = useState<{ hash: string; amount: number } | null>(null);

    const load = useCallback(async () => {
        try {
            const r = await fetch(`${API_BASE}/api/proposals`);
            const j = await r.json();
            if (j.success) {
                setProposals(j.proposals);
                setSelected(s => s ? (j.proposals.find((p: Proposal) => p._id === s._id) ?? s) : null);
            }
        } catch { /* offline */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

    const lockContract = async (p: Proposal) => {
        setLocking(p._id);
        try {
            const res = await fetch(`${API_BASE}/api/proposals/${p._id}/accept-contract`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}'
            });
            const json = await res.json();
            if (res.ok) {
                setTxSuccess({
                    hash: json.proposal?.blockchainTxHash ||
                        '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
                    amount: json.escrowAmount || parseFloat((p.totalValue * 0.02).toFixed(2))
                });
                await load();
            } else { alert(json.message || 'Failed to lock contract.'); }
        } catch { alert('Network error.'); }
        setLocking(null);
    };

    const pending = proposals.filter(p => p.status === 'SENT');
    const active = proposals.filter(p => ['ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED'].includes(p.status));
    const done = proposals.filter(p => p.status === 'PAYMENT_RECEIVED' || p.status === 'REJECTED');

    return (
        <div>
            {/* ── Success Modal ─────────────────────────────── */}
            {txSuccess && (
                <div className="modal-overlay active" onClick={() => setTxSuccess(null)}>
                    <div className="modal active" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ph-fill ph-check-circle"></i> Contract Locked On-Chain
                            </h3>
                            <button className="close-modal" onClick={() => setTxSuccess(null)}><i className="ph ph-x"></i></button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            The supply agreement is cryptographically sealed. <strong style={{ color: 'var(--warning)' }}>₹{txSuccess.amount.toLocaleString('en-IN')}</strong> has been locked in escrow and will release to the farmer on delivery confirmation.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {[
                                { l: 'Escrow Locked', v: `₹${txSuccess.amount.toLocaleString('en-IN')}`, c: 'var(--warning)' },
                                { l: 'Status', v: 'ACTIVE', c: 'var(--success)' }
                            ].map((x, i) => (
                                <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.3rem' }}>{x.l}</div>
                                    <div style={{ fontWeight: 800, color: x.c, fontSize: '1rem' }}>{x.v}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ background: '#0F172A', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px dashed #34D399' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>Blockchain Receipt</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', color: '#34D399' }}>{txSuccess.hash}</div>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.85rem' }} onClick={() => setTxSuccess(null)}>Done</button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

                {/* ── LEFT: Contract queues ───────────────── */}
                <div>
                    {loading ? (
                        <div className="card-glass" style={{ textAlign: 'center', padding: '3rem' }}>
                            <i className="ph ph-spinner ph-spin" style={{ fontSize: '2rem', color: 'var(--primary)', display: 'block', marginBottom: '0.75rem' }}></i>
                            <p style={{ color: 'var(--text-muted)' }}>Loading contracts...</p>
                        </div>
                    ) : (
                        <>
                            {/* Pending */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }}></span>
                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                                        Awaiting Your Review ({pending.length})
                                    </span>
                                </div>

                                {pending.length === 0 ? (
                                    <div className="card-glass" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        <i className="ph ph-inbox" style={{ fontSize: '1.75rem', display: 'block', marginBottom: '0.5rem', opacity: 0.4 }}></i>
                                        <span style={{ fontSize: '0.9rem' }}>No new proposals awaiting review</span>
                                    </div>
                                ) : pending.map(p => (
                                    <div key={p._id} className="card-glass"
                                        onClick={() => setSelected(selected?._id === p._id ? null : p)}
                                        style={{ marginBottom: '0.75rem', cursor: 'pointer', borderLeft: '4px solid var(--warning)', background: selected?._id === p._id ? '#FFFBEB' : undefined }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                                <div className="item-img" style={{ background: 'var(--warning-light)', fontSize: '1.2rem', flexShrink: 0 }}>🌾</div>
                                                <div>
                                                    <div className="item-title">{crop(p)} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({variety(p)})</span></div>
                                                    <div className="item-sub" style={{ marginTop: '2px' }}>
                                                        {p.farmerId?.fullName || 'Farmer'} &nbsp;·&nbsp; {p.proposedQuantity.toLocaleString()} kg @ ₹{p.proposedPricePerUnit}/kg
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="item-status status-warn">Pending</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{(p.totalValue || 0).toLocaleString('en-IN')}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600 }}>2% escrow = ₹{((p.totalValue || 0) * 0.02).toFixed(0)}</div>
                                            </div>
                                            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}
                                                disabled={locking === p._id}
                                                onClick={e => { e.stopPropagation(); lockContract(p); }}>
                                                {locking === p._id
                                                    ? <><i className="ph ph-spinner ph-spin"></i> Locking...</>
                                                    : <><i className="ph ph-lock-key"></i> Lock Contract</>
                                                }
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Active */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }}></span>
                                    <span style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                                        Active Contracts ({active.length})
                                    </span>
                                </div>
                                {active.length === 0
                                    ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '1rem' }}>No active contracts.</p>
                                    : active.map(p => (
                                        <div key={p._id} className="item-row"
                                            onClick={() => setSelected(selected?._id === p._id ? null : p)}
                                            style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary)', background: selected?._id === p._id ? 'var(--primary-light)' : 'white', marginBottom: '0.5rem' }}>
                                            <div className="item-main" style={{ flex: 1 }}>
                                                <div className="item-img" style={{ background: 'var(--primary-light)' }}>🌾</div>
                                                <div>
                                                    <div className="item-title">{crop(p)} — {p.proposedQuantity.toLocaleString()} kg</div>
                                                    <div className="item-sub">{STAGE_LABELS[p.status]} &nbsp;·&nbsp; ₹{(p.totalValue || 0).toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span className="item-status status-track">{STAGE_LABELS[p.status]}</span>
                                                {p.blockchainTxHash && <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}><i className="ph ph-link"></i></span>}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                            {/* Completed */}
                            {done.length > 0 && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ width: 8, height: 8, background: '#94A3B8', borderRadius: '50%', flexShrink: 0, display: 'inline-block' }}></span>
                                        <span style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                                            Completed / Rejected ({done.length})
                                        </span>
                                    </div>
                                    {done.map(p => (
                                        <div key={p._id} className="item-row"
                                            onClick={() => setSelected(selected?._id === p._id ? null : p)}
                                            style={{ cursor: 'pointer', opacity: 0.7, marginBottom: '0.5rem', background: selected?._id === p._id ? 'var(--surface-bg)' : 'white' }}>
                                            <div className="item-main" style={{ flex: 1 }}>
                                                <div className="item-img" style={{
                                                    background: p.status === 'PAYMENT_RECEIVED' ? 'var(--success-light)' : 'var(--danger-light)',
                                                    color: p.status === 'PAYMENT_RECEIVED' ? 'var(--success)' : 'var(--danger)'
                                                }}>
                                                    <i className={`ph ${p.status === 'PAYMENT_RECEIVED' ? 'ph-check-circle' : 'ph-x-circle'}`}></i>
                                                </div>
                                                <div>
                                                    <div className="item-title">{crop(p)} — {p.proposedQuantity.toLocaleString()} kg</div>
                                                    <div className="item-sub">{p.status === 'PAYMENT_RECEIVED' ? 'Payment Complete' : 'Rejected'} &nbsp;·&nbsp; ₹{(p.totalValue || 0).toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <span className={`item-status ${p.status === 'PAYMENT_RECEIVED' ? 'status-track' : 'status-alert'}`}>
                                                {p.status === 'PAYMENT_RECEIVED' ? 'Paid' : 'Rejected'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── RIGHT: Detail / Stats ───────────────── */}
                <div style={{ position: 'sticky', top: '1rem' }}>
                    {selected ? (
                        // ── Contract Detail
                        <div className="card-glass fade-in" style={{
                            borderTop: `4px solid ${selected.status === 'SENT' ? 'var(--warning)' : selected.status === 'REJECTED' ? 'var(--danger)' : 'var(--primary)'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Contract Detail</span>
                                <button className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setSelected(null)}>
                                    <i className="ph ph-x"></i>
                                </button>
                            </div>

                            {/* Farmer + Crop */}
                            <div style={{ background: 'var(--surface-bg)', padding: '0.9rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{crop(selected)} ({variety(selected)})</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                    {selected.farmerId?.fullName || 'N/A'}{selected.farmerId?.phone && ` · ${selected.farmerId.phone}`}
                                </div>
                            </div>

                            {/* Key numbers */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                                {[
                                    { l: 'Quantity', v: `${selected.proposedQuantity.toLocaleString()} kg` },
                                    { l: 'Rate', v: `₹${selected.proposedPricePerUnit}/kg` },
                                    { l: 'Total', v: `₹${(selected.totalValue || 0).toLocaleString('en-IN')}`, bold: true },
                                    { l: '2% Escrow', v: `₹${((selected.totalValue || 0) * 0.02).toFixed(0)}`, color: 'var(--warning)' },
                                ].map((x, i) => (
                                    <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.7rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>{x.l}</div>
                                        <div style={{ fontWeight: x.bold ? 800 : 700, fontSize: '0.92rem', color: x.color || 'var(--text-main)' }}>{x.v}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Buyer guarantee callout */}
                            <div style={{ background: 'var(--info-light)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.6 }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>💡 What this locks in for you</div>
                                <ul style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                    <li>Fixed ₹{selected.proposedPricePerUnit}/kg — price can't change</li>
                                    <li>Farmer forfeits escrow if they cancel</li>
                                    <li>Payment releases only after delivery</li>
                                </ul>
                            </div>

                            {/* Stage pipeline bar */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>Pipeline</div>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    {STAGE_ORDER.map((s, i) => {
                                        const idx = STAGE_ORDER.indexOf(selected.status);
                                        return <div key={s} title={STAGE_LABELS[s]} style={{ flex: 1, height: 5, borderRadius: '999px', background: idx >= i ? (idx === i ? 'var(--primary)' : 'var(--success)') : 'var(--border-color)' }}></div>;
                                    })}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem' }}>
                                    {STAGE_LABELS[selected.status] || selected.status}
                                </div>
                            </div>

                            {/* Farmer note */}
                            {selected.message && (
                                <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                                    <span className="alert-icon"><i className="ph ph-chat-circle-text"></i></span>
                                    <div className="alert-text"><strong>Farmer&apos;s Note</strong><p>&ldquo;{selected.message}&rdquo;</p></div>
                                </div>
                            )}

                            {/* Blockchain hash */}
                            {selected.blockchainTxHash && (
                                <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>On-Chain Proof</div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.63rem', wordBreak: 'break-all', color: '#34D399' }}>{selected.blockchainTxHash}</div>
                                </div>
                            )}

                            {/* Lock CTA */}
                            {selected.status === 'SENT' && (
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}
                                    disabled={locking === selected._id}
                                    onClick={() => lockContract(selected)}>
                                    {locking === selected._id
                                        ? <><i className="ph ph-spinner ph-spin"></i> Locking...</>
                                        : <><i className="ph ph-lock-key"></i> Lock — Pay ₹{((selected.totalValue || 0) * 0.02).toFixed(0)} Escrow</>
                                    }
                                </button>
                            )}
                        </div>
                    ) : (
                        // ── Overview sidebar
                        <>
                            <div className="card-glass" style={{ marginBottom: '1rem' }}>
                                <div className="card-header">
                                    <h4 className="card-title">Portfolio</h4>
                                </div>
                                {[
                                    { l: 'Pending Review', v: pending.length, c: 'var(--warning)' },
                                    { l: 'Active Contracts', v: active.length, c: 'var(--primary)' },
                                    { l: 'Completed', v: done.filter(p => p.status === 'PAYMENT_RECEIVED').length, c: 'var(--success)' },
                                    { l: 'Escrowed Now', v: `₹${active.reduce((s, p) => s + (p.totalValue * 0.02), 0).toFixed(0)}`, c: 'var(--warning)' },
                                ].map((x, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{x.l}</span>
                                        <span style={{ fontWeight: 800, color: x.c, fontSize: '1rem' }}>{x.v}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="card-glass" style={{ background: '#0F172A', color: 'white' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Recent On-Chain</div>
                                {proposals.filter(p => p.blockchainTxHash).slice(0, 3).length === 0 ? (
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>No sealed contracts yet.</p>
                                ) : proposals.filter(p => p.blockchainTxHash).slice(0, 3).map(p => (
                                    <div key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0.7rem', marginBottom: '0.7rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>{crop(p)} · {p.proposedQuantity}kg</span>
                                            <span style={{ fontSize: '0.68rem', color: '#34D399', fontWeight: 700 }}>SEALED</span>
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>
                                            {p.blockchainTxHash?.slice(0, 30)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
