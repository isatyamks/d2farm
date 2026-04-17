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

interface ForecastDay { day: string; predicted_price: number; confidence_score: number; }
interface MLForecast {
    crop: string;
    farmerPrice: number;
    forecast: { trend: string; pct_change: string; action: string; days: ForecastDay[] };
    demand: { optimal_zone: string; distance_km: number; supply_deficit_pct: number; expected_premium_pct: number };
    spoilage: { risk_pct: number; risk_level: string; cold_chain_needed: boolean; stressor: string };
}

const API = 'http://localhost:4000';

const STATUS_MAP: Record<string, { label: string; cls: string; bar: string }> = {
    SENT:                 { label: 'New Proposal', cls: 'status-warn',  bar: '#3B82F6' },
    ACCEPTED:             { label: 'Accepted',     cls: 'status-track', bar: '#10B981' },
    LOGISTICS_DISPATCHED: { label: 'In Transit',   cls: 'status-warn',  bar: '#F59E0B' },
    DELIVERED:            { label: 'Delivered',    cls: 'status-warn',  bar: '#F59E0B' },
    PAYMENT_RECEIVED:     { label: 'Paid',         cls: 'status-track', bar: '#22C55E' },
    REJECTED:             { label: 'Rejected',     cls: 'status-alert', bar: '#EF4444' },
};

const FILTERS = ['ALL', 'SENT', 'ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'] as const;

// ─── Proposal Detail View ──────────────────────────────────────────────────────
function ProposalDetail({ proposal, onBack, onAccept, onReject, acting }: {
    proposal: Proposal;
    onBack: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    acting: string | null;
}) {
    const [forecast, setForecast] = useState<MLForecast | null>(null);
    const [mlLoading, setMlLoading] = useState(true);

    const cropName = proposal.orderId?.crop || proposal.cropListingId?.cropName || 'Tomato';
    const basePrice = proposal.proposedPricePerUnit;
    const qty       = proposal.proposedQuantity;
    const meta      = STATUS_MAP[proposal.status] || STATUS_MAP['SENT'];

    useEffect(() => {
        const run = async () => {
            setMlLoading(true);
            try {
                const res = await fetch(`${API}/api/ml/farmer-forecast?crop=${encodeURIComponent(cropName)}&basePrice=${basePrice}&travelHours=8&temperature=30`);
                const json = await res.json();
                if (json.success) setForecast(json);
            } catch {/* backend offline */}
            setMlLoading(false);
        };
        run();
    }, [cropName, basePrice]);

    // Profit analysis derived from ML
    const marketHigh = forecast ? Math.max(...forecast.forecast.days.map(d => d.predicted_price)) : null;
    const marketLow  = forecast ? Math.min(...forecast.forecast.days.map(d => d.predicted_price)) : null;
    const bestDiff   = marketHigh ? parseFloat((marketHigh - basePrice).toFixed(2)) : null;
    const isBullish  = forecast?.forecast.trend === 'BULLISH';
    const buyerSaving = bestDiff !== null && bestDiff < 0 ? Math.abs(bestDiff) * qty : null;
    const buyerPaying  = bestDiff !== null && bestDiff > 0 ? bestDiff * qty : null;

    return (
        <div className="fade-in">
            {/* Back button */}
            <button className="btn btn-outline" onClick={onBack} style={{ marginBottom: '1.25rem', gap: '0.5rem' }}>
                <i className="ph ph-arrow-left"></i> Back to Proposals
            </button>

            {/* Hero Header */}
            <div className="card-glass mb-6" style={{ borderTop: `4px solid ${meta.bar}`, padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 56, height: 56, background: 'var(--primary-light)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🌾</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                                {cropName} ({proposal.orderId?.variety || proposal.cropListingId?.variety || ''})
                            </h2>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                                by <strong>{proposal.farmerId?.fullName || 'Farmer'}</strong>
                                {proposal.farmerId?.phone && <> · {proposal.farmerId.phone}</>}
                                &nbsp;·&nbsp; Submitted {new Date(proposal.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <span className={`item-status ${meta.cls}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>{meta.label}</span>
                </div>
            </div>

            <div className="grid-cols-2 mb-6" style={{ gap: '1.5rem', alignItems: 'start' }}>

                {/* ── LEFT COLUMN ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Contract Financials */}
                    <div className="card-glass">
                        <div className="card-header">
                            <h3 className="card-title"><i className="ph ph-receipt" style={{ marginRight: '6px' }}></i>Contract Terms</h3>
                        </div>
                        <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                            {[
                                { l: 'Proposed Qty',   v: `${qty.toLocaleString()} kg`,                          icon: 'ph-scales' },
                                { l: 'Rate / kg',      v: `₹${basePrice}`,                                        icon: 'ph-currency-inr' },
                                { l: 'Total Value',    v: `₹${(proposal.totalValue || 0).toLocaleString('en-IN')}`, icon: 'ph-money', bold: true },
                                { l: '2% Escrow Lock', v: `₹${((proposal.totalValue || 0) * 0.02).toFixed(0)}`,  icon: 'ph-lock-key', color: 'var(--warning)' },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <i className={`ph ${item.icon}`}></i> {item.l}
                                    </div>
                                    <div style={{ fontWeight: item.bold ? 800 : 700, fontSize: '1.05rem', color: item.color || 'var(--text-main)' }}>{item.v}</div>
                                </div>
                            ))}
                        </div>

                        {proposal.message && (
                            <div className="alert alert-info" style={{ margin: 0 }}>
                                <span className="alert-icon"><i className="ph ph-chat-circle-text"></i></span>
                                <div className="alert-text">
                                    <strong>Farmer's Note</strong>
                                    <p>"{proposal.message}"</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    <div className="card-glass">
                        <div className="card-header">
                            <h3 className="card-title"><i className="ph ph-clock-countdown" style={{ marginRight: '6px' }}></i>Proposal Timeline</h3>
                        </div>
                        {proposal.timeline?.length > 0 ? proposal.timeline.map((t, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: i < proposal.timeline.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === proposal.timeline.length - 1 ? 'var(--primary)' : 'var(--border-color)', flexShrink: 0 }}></div>
                                    {i < proposal.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-color)', marginTop: '4px' }}></div>}
                                </div>
                                <div style={{ paddingBottom: '0.25rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{STATUS_MAP[t.status]?.label || t.status}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {t.note && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>{t.note}</div>}
                                </div>
                            </div>
                        )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No timeline entries yet.</p>}
                    </div>

                    {/* Blockchain Proof */}
                    {proposal.blockchainTxHash && (
                        <div className="card-glass" style={{ background: '#0F172A', color: 'white' }}>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ph ph-link"></i> On-Chain Blockchain Receipt
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', color: '#34D399', lineHeight: 1.6 }}>
                                {proposal.blockchainTxHash}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>Immutably recorded on Polygon Network</div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT COLUMN — ML Profit Forecast ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* ML Profit Analysis */}
                    <div className="card-glass">
                        <div className="card-header">
                            <h3 className="card-title"><i className="ph ph-trend-up" style={{ marginRight: '6px' }}></i>ML Profit Forecast</h3>
                            <span style={{ fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>Live</span>
                        </div>

                        {mlLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <i className="ph ph-spinner ph-spin" style={{ fontSize: '1.5rem', color: 'var(--primary)' }}></i>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Running prediction engine...</p>
                            </div>
                        ) : forecast ? (
                            <>
                                {/* Verdict banner */}
                                <div style={{
                                    background: isBullish ? 'var(--success-light)' : 'var(--warning-light)',
                                    border: `1px solid ${isBullish ? 'var(--success)' : 'var(--warning)'}`,
                                    borderRadius: 'var(--border-radius-md)',
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1.25rem',
                                }}>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: isBullish ? 'var(--success)' : '#B45309', marginBottom: '0.25rem' }}>
                                        {isBullish ? '📈 Market price rising' : '📉 Market price falling'} — {forecast.forecast.action}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        7-day projected change: <strong>{forecast.forecast.pct_change}%</strong> vs farmer's ask of ₹{basePrice}/kg
                                    </div>
                                </div>

                                {/* Key numbers */}
                                <div className="grid-cols-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Farmer Asks</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>₹{basePrice}/kg</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>7-Day Market High</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>₹{marketHigh}/kg</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>7-Day Market Low</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--danger)' }}>₹{marketLow}/kg</div>
                                    </div>
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.3rem' }}>Best Demand Zone</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-dark)' }}>{forecast.demand.optimal_zone}</div>
                                    </div>
                                </div>

                                {/* Buyer profit insight */}
                                {buyerSaving !== null && (
                                    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
                                        <span className="alert-icon"><i className="ph ph-piggy-bank"></i></span>
                                        <div className="alert-text">
                                            <strong>Buying below market</strong>
                                            <p>You save <strong>₹{(buyerSaving).toLocaleString('en-IN')}</strong> on this {qty}kg order vs projected market peak for {cropName}.</p>
                                        </div>
                                    </div>
                                )}
                                {buyerPaying !== null && (
                                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                                        <span className="alert-icon"><i className="ph ph-warning"></i></span>
                                        <div className="alert-text">
                                            <strong>Above market trend</strong>
                                            <p>Farmer's rate is ₹{Math.abs(bestDiff!).toFixed(2)}/kg above the projected 7-day average. Consider negotiating or waiting.</p>
                                        </div>
                                    </div>
                                )}

                                {/* Day-by-day table */}
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                    7-Day Price Projection
                                </div>
                                {forecast.forecast.days.map((d, i) => {
                                    const diff = d.predicted_price - basePrice;
                                    const isUp = diff >= 0;
                                    const barPct = Math.min(100, (d.predicted_price / (marketHigh! * 1.1)) * 100);
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                            <div style={{ width: 60, fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>{d.day.slice(0, 3)}</div>
                                            <div style={{ flex: 1, height: 6, background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${barPct}%`, background: isUp ? 'var(--success)' : 'var(--danger)', borderRadius: '999px', transition: 'width 0.4s ease' }}></div>
                                            </div>
                                            <div style={{ width: 70, textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: isUp ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                                                ₹{d.predicted_price}
                                            </div>
                                            <div style={{ width: 32, textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                                {d.confidence_score}%
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Spoilage quick view */}
                                <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: forecast.spoilage.risk_level === 'HIGH' ? 'var(--danger-light)' : 'var(--success-light)', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: forecast.spoilage.risk_level === 'HIGH' ? '#B91C1C' : '#15803D' }}>
                                        {forecast.spoilage.cold_chain_needed ? '❄️ Cold chain required' : '✅ Standard dispatch safe'}
                                        <div style={{ fontSize: '0.75rem', fontWeight: 400, marginTop: '2px' }}>Spoilage risk: {forecast.spoilage.stressor}</div>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '1.5rem', color: forecast.spoilage.risk_level === 'HIGH' ? '#B91C1C' : '#15803D' }}>
                                        {forecast.spoilage.risk_pct}%
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                <i className="ph ph-cloud-slash" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                ML engine offline. Start backend to see predictions.
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    {proposal.status === 'SENT' && (
                        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="btn btn-primary"
                                disabled={acting === proposal._id}
                                onClick={() => onAccept(proposal._id)}
                                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem' }}
                            >
                                {acting === proposal._id
                                    ? <><i className="ph ph-spinner ph-spin"></i> Processing...</>
                                    : <><i className="ph-fill ph-check-circle"></i> Accept &amp; Lock 2% Escrow</>
                                }
                            </button>
                            <button
                                className="btn btn-outline"
                                disabled={acting === proposal._id}
                                onClick={() => onReject(proposal._id)}
                                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', color: 'var(--danger)', borderColor: 'var(--border-color)' }}
                            >
                                <i className="ph ph-x-circle"></i> Decline Proposal
                            </button>
                            {forecast && (
                                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Accepting locks ₹{((proposal.totalValue || 0) * 0.02).toFixed(0)} from your wallet as escrow
                                </div>
                            )}
                        </div>
                    )}

                    {proposal.status !== 'SENT' && (
                        <div className="card-glass" style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)' }}>
                            <i className={`ph ${proposal.status === 'ACCEPTED' ? 'ph-lock-key' : proposal.status === 'PAYMENT_RECEIVED' ? 'ph-check-circle' : 'ph-info'}`} style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem', color: meta.bar }}></i>
                            Status: <strong style={{ color: meta.bar }}>{STATUS_MAP[proposal.status]?.label}</strong>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>No action required at this stage.</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main List View ────────────────────────────────────────────────────────────
export default function FarmerProposals() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [selected, setSelected] = useState<Proposal | null>(null);
    const [acting, setActing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/proposals`);
            const json = await res.json();
            if (json.success && Array.isArray(json.proposals)) {
                setProposals(json.proposals);
                setError(null);
                // keep selected in sync
                if (selected) {
                    const updated = json.proposals.find((p: Proposal) => p._id === selected._id);
                    if (updated) setSelected(updated);
                }
            }
        } catch {
            if (proposals.length === 0) setError('Backend offline — start server on port 4000.');
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    useEffect(() => {
        fetchProposals();
        const t = setInterval(fetchProposals, 8000);
        return () => clearInterval(t);
    }, [fetchProposals]);

    const handleAccept = async (id: string) => {
        setActing(id);
        try {
            const res = await fetch(`${API}/api/proposals/${id}/accept-contract`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            if (res.ok) { await fetchProposals(); }
            else { const e = await res.json(); alert(e.message || 'Failed to accept.'); }
        } catch { alert('Network error.'); }
        setActing(null);
    };

    const handleReject = async (id: string) => {
        setActing(id);
        try {
            const res = await fetch(`${API}/api/proposals/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJECTED', note: 'Declined by buyer.' }) });
            if (res.ok) { setSelected(null); await fetchProposals(); }
            else { alert('Failed to reject.'); }
        } catch { alert('Network error.'); }
        setActing(null);
    };

    // ── Detail view ──
    if (selected) {
        return <ProposalDetail proposal={selected} onBack={() => setSelected(null)} onAccept={handleAccept} onReject={handleReject} acting={acting} />;
    }

    const newCount = proposals.filter(p => p.status === 'SENT').length;
    const filtered = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter);
    const sm = (p: Proposal) => STATUS_MAP[p.status] || STATUS_MAP['SENT'];

    return (
        <div>
            {/* Filter + Refresh bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', flex: 1 }}>
                    {FILTERS.map(f => {
                        const count = f === 'ALL' ? proposals.length : proposals.filter(p => p.status === f).length;
                        const isActive = filter === f;
                        return (
                            <button key={f} onClick={() => setFilter(f)} style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: isActive ? 'var(--primary)' : 'var(--text-muted)', borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {f === 'ALL' ? 'All' : STATUS_MAP[f]?.label || f}
                                {f === 'SENT' && newCount > 0
                                    ? <span style={{ background: 'var(--danger)', color: 'white', padding: '1px 6px', borderRadius: '12px', fontSize: '0.7rem' }}>{newCount}</span>
                                    : <span style={{ fontSize: '0.75rem', color: isActive ? 'var(--primary)' : '#CBD5E1' }}>({count})</span>
                                }
                            </button>
                        );
                    })}
                </div>
                <button className="btn btn-outline" onClick={fetchProposals} style={{ gap: '0.4rem', fontSize: '0.85rem', flexShrink: 0 }}>
                    <i className="ph ph-arrows-clockwise"></i> Refresh
                </button>
            </div>

            {error && (
                <div className="alert alert-warning mb-6">
                    <span className="alert-icon"><i className="ph ph-warning"></i></span>
                    <div className="alert-text"><strong>Cannot connect to backend</strong><p>{error}</p></div>
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
                <div>
                    {filtered.map(p => {
                        const meta = sm(p);
                        return (
                            <div key={p._id} className="item-row" onClick={() => setSelected(p)}
                                style={{ cursor: 'pointer', borderLeftWidth: '4px', borderLeftColor: meta.bar, borderLeftStyle: 'solid', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem', transition: 'var(--transition)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                                    <div className="item-main">
                                        <div className="item-img" style={{ background: 'var(--primary-light)', fontSize: '1.25rem' }}>🌾</div>
                                        <div>
                                            <div className="item-title">{p.orderId?.crop || p.cropListingId?.cropName || 'Crop'} ({p.orderId?.variety || p.cropListingId?.variety || ''})</div>
                                            <div className="item-sub">{p.farmerId?.fullName || 'Farmer'} &nbsp;·&nbsp; {p.proposedQuantity} kg @ ₹{p.proposedPricePerUnit}/kg</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={`item-status ${meta.cls}`}>{meta.label}</span>
                                        <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)' }}></i>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>₹{(p.totalValue || 0).toLocaleString('en-IN')}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        {p.blockchainTxHash && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}><i className="ph ph-link" style={{ marginRight: '3px' }}></i>On-chain</span>}
                                        <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>View Details →</span>
                                    </div>
                                </div>
                                {p.message && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', width: '100%' }}>"{p.message}"</div>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
