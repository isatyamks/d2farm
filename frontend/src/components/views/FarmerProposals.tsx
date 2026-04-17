"use client";
import { useState, useEffect, useCallback } from 'react';

interface TimelineEntry { status: string; timestamp: string; note: string; }

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
    orderId?: { buyerName: string; crop: string; variety: string; quantityRequired: number };
    cropListingId?: { cropName: string; variety: string };
    timeline: TimelineEntry[];
}

const STATUS_MAP: Record<string, { label: string; cls: string; bar: string }> = {
    SENT:                 { label: 'New',         cls: 'status-warn',  bar: '#3B82F6' },
    ACCEPTED:             { label: 'Accepted',    cls: 'status-track', bar: '#10B981' },
    LOGISTICS_DISPATCHED: { label: 'In Transit',  cls: 'status-warn',  bar: '#F59E0B' },
    DELIVERED:            { label: 'Delivered',   cls: 'status-warn',  bar: '#F59E0B' },
    PAYMENT_RECEIVED:     { label: 'Paid',        cls: 'status-track', bar: '#22C55E' },
    REJECTED:             { label: 'Rejected',    cls: 'status-alert', bar: '#EF4444' },
};

const FILTERS = ['ALL', 'SENT', 'ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'] as const;

export default function FarmerProposals() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<Proposal | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lastPoll, setLastPoll] = useState(new Date());

    const fetchProposals = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:4000/api/proposals');
            const json = await res.json();
            if (json.success && Array.isArray(json.proposals)) {
                setProposals(json.proposals);
                setLastPoll(new Date());
                setError(null);
            }
        } catch {
            if (proposals.length === 0) {
                setError('Backend offline — start the server on port 4000.');
            }
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchProposals();
        const t = setInterval(fetchProposals, 8000);
        return () => clearInterval(t);
    }, [fetchProposals]);

    // When proposals list refreshes, keep selected in sync
    useEffect(() => {
        if (selected) {
            const refreshed = proposals.find(p => p._id === selected._id);
            if (refreshed) setSelected(refreshed);
        }
    }, [proposals]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAccept = async (id: string) => {
        setActing(id);
        try {
            const res = await fetch(`http://localhost:4000/api/proposals/${id}/accept-contract`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await fetchProposals();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to accept proposal.');
            }
        } catch {
            alert('Network error — backend may be offline.');
        } finally {
            setActing(null);
        }
    };

    const handleReject = async (id: string) => {
        setActing(id);
        try {
            const res = await fetch(`http://localhost:4000/api/proposals/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'REJECTED', note: 'Declined by buyer.' }),
            });
            if (res.ok) {
                await fetchProposals();
                setSelected(null);
            } else {
                alert('Failed to reject proposal.');
            }
        } catch {
            alert('Network error.');
        } finally {
            setActing(null);
        }
    };

    const newCount = proposals.filter(p => p.status === 'SENT').length;
    const filtered = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter);
    const sm = (p: Proposal) => STATUS_MAP[p.status] || STATUS_MAP['SENT'];

    return (
        <div>
            {/* ── Page Header ─────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ph ph-handshake"></i> Farmer Proposals
                        {newCount > 0 && (
                            <span style={{ background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '4px' }}>
                                {newCount} New
                            </span>
                        )}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Live feed · refreshes every 8s &nbsp;•&nbsp;
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            {lastPoll.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </p>
                </div>
                <button className="btn btn-outline" onClick={fetchProposals} style={{ gap: '0.5rem' }}>
                    <i className="ph ph-arrows-clockwise"></i> Refresh
                </button>
            </div>

            {/* ── Filter Tabs ─────────────────────────────── */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                {FILTERS.map(f => {
                    const count = f === 'ALL' ? proposals.length : proposals.filter(p => p.status === f).length;
                    return (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '0.5rem 0.9rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                                borderBottom: filter === f ? '2px solid var(--primary)' : '2px solid transparent',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {f === 'ALL' ? 'All' : STATUS_MAP[f]?.label || f}
                            <span style={{ marginLeft: '4px', fontSize: '0.75rem', color: filter === f ? 'var(--primary)' : '#94A3B8' }}>({count})</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Error Banner ──────────────────────────────── */}
            {error && (
                <div className="alert alert-warning mb-6">
                    <span className="alert-icon"><i className="ph ph-warning"></i></span>
                    <div className="alert-text">
                        <strong>Cannot connect to backend</strong>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="card-glass" style={{ textAlign: 'center', padding: '4rem' }}>
                    <i className="ph ph-spinner ph-spin" style={{ fontSize: '2rem', color: 'var(--primary)', display: 'block', marginBottom: '1rem' }}></i>
                    <p style={{ color: 'var(--text-muted)' }}>Connecting to live feed...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card-glass" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <i className="ph ph-inbox" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}></i>
                    <strong>No proposals here</strong>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Farmer proposals will appear here in real time.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

                    {/* ── Proposal List ──────────────────────── */}
                    <div>
                        {filtered.map(p => {
                            const meta = sm(p);
                            const isSelected = selected?._id === p._id;
                            return (
                                <div
                                    key={p._id}
                                    className="item-row"
                                    onClick={() => setSelected(isSelected ? null : p)}
                                    style={{
                                        cursor: 'pointer',
                                        borderLeftWidth: '4px',
                                        borderLeftColor: meta.bar,
                                        borderLeftStyle: 'solid',
                                        background: isSelected ? 'var(--primary-light)' : 'white',
                                        transition: 'var(--transition)',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                    }}
                                >
                                    {/* Row top */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                                        <div className="item-main">
                                            <div className="item-img" style={{ background: 'var(--primary-light)', fontSize: '1.25rem' }}>🌾</div>
                                            <div>
                                                <div className="item-title">
                                                    {p.orderId?.crop || p.cropListingId?.cropName || 'Crop'} ({p.orderId?.variety || p.cropListingId?.variety || ''})
                                                </div>
                                                <div className="item-sub">
                                                    {p.farmerId?.fullName || 'Farmer'} &nbsp;·&nbsp; {p.proposedQuantity} kg @ ₹{p.proposedPricePerUnit}/kg
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`item-status ${meta.cls}`}>{meta.label}</span>
                                    </div>

                                    {/* Row bottom */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                                            ₹{(p.totalValue || 0).toLocaleString('en-IN')}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            {p.blockchainTxHash && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                    <i className="ph ph-link" style={{ marginRight: '3px' }}></i>On-chain
                                                </span>
                                            )}
                                            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                                                {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {p.message && (
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', width: '100%' }}>
                                            "{p.message}"
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Detail Panel ──────────────────────── */}
                    {selected && (
                        <div className="card-glass fade-in" style={{ position: 'sticky', top: '1rem', borderTop: `4px solid ${sm(selected).bar}`, padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                    {selected.orderId?.crop || selected.cropListingId?.cropName || 'Crop'} Proposal
                                </h4>
                                <button onClick={() => setSelected(null)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                                    <i className="ph ph-x"></i>
                                </button>
                            </div>

                            {/* Key Financials */}
                            <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                                {[
                                    { l: 'Quantity',    v: `${selected.proposedQuantity} kg` },
                                    { l: 'Rate',        v: `₹${selected.proposedPricePerUnit}/kg` },
                                    { l: 'Total Value', v: `₹${(selected.totalValue || 0).toLocaleString('en-IN')}`, bold: true, color: 'var(--text-main)' },
                                    { l: '2% Escrow',   v: `₹${((selected.totalValue || 0) * 0.02).toFixed(0)}`, color: 'var(--primary)' },
                                ].map((item, i) => (
                                    <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.25rem' }}>{item.l}</div>
                                        <div style={{ fontWeight: item.bold ? 800 : 700, fontSize: '0.95rem', color: item.color || 'var(--text-main)' }}>{item.v}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Farmer message */}
                            {selected.message && (
                                <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                                    <span className="alert-icon"><i className="ph ph-chat-circle-text"></i></span>
                                    <div className="alert-text">
                                        <strong>Farmer's Note</strong>
                                        <p>"{selected.message}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Blockchain Hash */}
                            {selected.blockchainTxHash && (
                                <div style={{ background: '#0F172A', color: '#fff', padding: '0.9rem 1rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1.25rem' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <i className="ph ph-link"></i> Blockchain Receipt
                                    </div>
                                    <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', wordBreak: 'break-all', color: '#34D399', lineHeight: 1.5 }}>
                                        {selected.blockchainTxHash}
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            {selected.timeline?.length > 0 && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                                        <i className="ph ph-clock-countdown" style={{ marginRight: '4px' }}></i>Timeline
                                    </div>
                                    {selected.timeline.map((t, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '0.75rem', paddingBottom: '0.65rem', marginBottom: '0.65rem', borderBottom: i < selected.timeline.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: '5px', flexShrink: 0 }}></div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                                                    {STATUS_MAP[t.status]?.label || t.status}
                                                </div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                                    {new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {t.note && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>{t.note}</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons — only for SENT */}
                            {selected.status === 'SENT' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        disabled={acting === selected._id}
                                        onClick={() => handleAccept(selected._id)}
                                        style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
                                    >
                                        {acting === selected._id
                                            ? <><i className="ph ph-spinner ph-spin"></i> Processing...</>
                                            : <><i className="ph-fill ph-check-circle"></i> Accept &amp; Lock 2% Escrow</>
                                        }
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        disabled={acting === selected._id}
                                        onClick={() => handleReject(selected._id)}
                                        style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', color: 'var(--danger)', borderColor: 'var(--border-color)' }}
                                    >
                                        <i className="ph ph-x-circle"></i> Decline Proposal
                                    </button>
                                </div>
                            )}

                            {selected.status !== 'SENT' && (
                                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.5rem', background: 'var(--surface-bg)', borderRadius: 'var(--border-radius-md)' }}>
                                    Status: <strong>{STATUS_MAP[selected.status]?.label || selected.status}</strong> — no further action needed.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
