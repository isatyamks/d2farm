"use client";
import { useState, useEffect, useCallback } from 'react';
import ContractExport from './ContractExport';

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

const API = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const STATUS_MAP: Record<string, { label: string; cls: string; bar: string }> = {
    SENT:                 { label: 'New Proposal', cls: 'status-warn',  bar: '#3B82F6' },
    ACCEPTED:             { label: 'Accepted',     cls: 'status-track', bar: '#10B981' },
    LOGISTICS_DISPATCHED: { label: 'In Transit',   cls: 'status-warn',  bar: '#F59E0B' },
    DELIVERED:            { label: 'Delivered',    cls: 'status-warn',  bar: '#F59E0B' },
    PAYMENT_RECEIVED:     { label: 'Paid',         cls: 'status-track', bar: '#22C55E' },
    REJECTED:             { label: 'Rejected',     cls: 'status-alert', bar: '#EF4444' },
};

const FILTERS = ['ALL', 'SENT', 'ACCEPTED', 'LOGISTICS_DISPATCHED', 'DELIVERED', 'PAYMENT_RECEIVED'] as const;
const FILTER_LABELS: Record<string, string> = {
    ALL: 'All', SENT: 'New', ACCEPTED: 'Accepted',
    LOGISTICS_DISPATCHED: 'In Transit', DELIVERED: 'Delivered', PAYMENT_RECEIVED: 'Paid',
};

// ─── Tab strip — matches OrderTracking exactly ──────────────────────────────
const tabStyle = (active: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
    fontWeight: 600, fontSize: '0.9rem',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    whiteSpace: 'nowrap',
});

// ─── Proposal Detail ────────────────────────────────────────────────────────
function ProposalDetail({ proposal, onBack, onAccept, onReject, acting }: {
    proposal: Proposal; onBack: () => void;
    onAccept: (id: string) => void; onReject: (id: string) => void; acting: string | null;
}) {
    const [forecast, setForecast]     = useState<MLForecast | null>(null);
    const [mlLoading, setMlLoading]   = useState(true);
    const [exportOpen, setExportOpen] = useState(false);

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
            } catch { /* backend offline */ }
            setMlLoading(false);
        };
        run();
    }, [cropName, basePrice]);

    const marketHigh  = forecast ? Math.max(...forecast.forecast.days.map(d => d.predicted_price)) : null;
    const marketLow   = forecast ? Math.min(...forecast.forecast.days.map(d => d.predicted_price)) : null;
    const bestDiff    = marketHigh ? parseFloat((marketHigh - basePrice).toFixed(2)) : null;
    const buyerSaving = bestDiff !== null && bestDiff < 0 ? Math.abs(bestDiff) * qty : null;
    const buyerPaying = bestDiff !== null && bestDiff > 0 ? bestDiff * qty : null;

    return (
        <div className="fade-in">
            {exportOpen && (
                <ContractExport
                    proposalId={proposal._id}
                    cropName={`${proposal.orderId?.crop || proposal.cropListingId?.cropName || 'Crop'} (${proposal.orderId?.variety || proposal.cropListingId?.variety || ''})`}
                    onClose={() => setExportOpen(false)}
                />
            )}
            {/* Back to Proposals Button */}
            <div style={{ position: 'relative', zIndex: 10, marginBottom: '1.5rem' }}>
                <button 
                    className="btn btn-outline" 
                    onClick={() => {
                        console.log("Navigating back to proposals list");
                        onBack();
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <i className="ph ph-arrow-left"></i> Back to Proposals
                </button>
            </div>

            {/* Hero — matches OrderTracking order card header */}
            <div className="card-glass mb-6">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 52, height: 52, background: 'var(--primary-light)', borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🌾</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                                {cropName}
                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '1rem', marginLeft: '6px' }}>
                                    ({proposal.orderId?.variety || proposal.cropListingId?.variety || ''})
                                </span>
                            </h2>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                <strong>{proposal.farmerId?.fullName || 'Farmer'}</strong>
                                {proposal.farmerId?.phone && <> &nbsp;·&nbsp; {proposal.farmerId.phone}</>}
                                &nbsp;·&nbsp; {new Date(proposal.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                    <span className={`item-status ${meta.cls}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>{meta.label}</span>
                </div>
            </div>

            {/* Two-column body */}
            <div className="grid-main-side" style={{ gap: '1.5rem', alignItems: 'start' }}>

                {/* LEFT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Contract Terms */}
                    <div className="card-glass">
                        <div className="card-header">
                            <h3 className="card-title"><i className="ph ph-receipt" style={{ marginRight: '6px' }}></i>Contract Terms</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            {[
                                { l: 'Quantity',     v: `${qty.toLocaleString()} kg`,                        icon: 'ph-scales' },
                                { l: 'Rate / kg',    v: `₹${basePrice}`,                                     icon: 'ph-tag' },
                                { l: 'Total Value',  v: `₹${(qty * basePrice).toLocaleString('en-IN')}`,     icon: 'ph-currency-inr', bold: true, primary: true },
                                { l: '2% Escrow',    v: `₹${(qty * basePrice * 0.02).toFixed(0)}`,          icon: 'ph-lock-key', warn: true },
                            ].map((x, i) => (
                                <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                                    <i className={`ph ${x.icon}`} style={{ fontSize: '1.1rem', color: x.primary ? 'var(--primary)' : x.warn ? 'var(--warning)' : 'var(--text-muted)', marginTop: '1px', flexShrink: 0 }}></i>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{x.l}</div>
                                        <div style={{ fontWeight: x.bold ? 800 : 700, fontSize: '0.95rem', color: x.primary ? 'var(--primary)' : x.warn ? 'var(--warning)' : 'var(--text-main)' }}>{x.v}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {proposal.message && (
                            <div style={{ background: 'var(--surface-bg)', padding: '0.85rem', borderRadius: 'var(--border-radius-md)', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                <i className="ph ph-chat-circle-text" style={{ marginRight: '6px' }}></i>&ldquo;{proposal.message}&rdquo;
                            </div>
                        )}
                    </div>

                    {/* Timeline */}
                    {proposal.timeline?.length > 0 && (
                        <div className="card-glass">
                            <div className="card-header">
                                <h3 className="card-title"><i className="ph ph-clock-countdown" style={{ marginRight: '6px' }}></i>Timeline</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {[...proposal.timeline].reverse().map((t, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.85rem', paddingBottom: i < proposal.timeline.length - 1 ? '1rem' : 0 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? 'var(--primary)' : 'var(--border-color)', border: '2px solid', borderColor: i === 0 ? 'var(--primary)' : 'var(--border-color)', marginTop: '3px' }}></div>
                                            {i < proposal.timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border-color)', marginTop: '4px' }}></div>}
                                        </div>
                                        <div style={{ paddingBottom: '0.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: i === 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{STATUS_MAP[t.status]?.label || t.status}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' }}>{new Date(t.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                            {t.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t.note}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Blockchain receipt */}
                    {proposal.blockchainTxHash && (
                        <div className="card-glass" style={{ background: '#0F172A', border: '1px solid #1E293B' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem' }}>
                                <i className="ph ph-link" style={{ marginRight: '5px' }}></i>Blockchain Receipt
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', color: '#34D399', lineHeight: 1.6 }}>
                                {proposal.blockchainTxHash}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — ML Forecast panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="card-glass">
                        <div className="card-header">
                            <h3 className="card-title"><i className="ph ph-chart-line-up" style={{ marginRight: '6px' }}></i>ML Profit Forecast</h3>
                        </div>

                        {mlLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                <i className="ph ph-spinner ph-spin" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                Loading market data...
                            </div>
                        ) : forecast ? (
                            <>
                                {/* Verdict banner */}
                                <div style={{ background: forecast.forecast.trend === 'BULLISH' ? 'var(--warning-light)' : 'var(--success-light)', padding: '0.9rem', borderRadius: 'var(--border-radius-md)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: forecast.forecast.trend === 'BULLISH' ? '#B45309' : '#166534' }}>
                                        {forecast.forecast.action}
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '1rem', color: forecast.forecast.trend === 'BULLISH' ? 'var(--warning)' : 'var(--success)' }}>
                                        {forecast.forecast.pct_change}
                                    </span>
                                </div>

                                {/* Key numbers */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                                    {[
                                        { l: "Farmer's Ask",    v: `₹${basePrice}/kg`,               c: 'var(--text-main)' },
                                        { l: '7-Day High',      v: marketHigh ? `₹${marketHigh}` : '—', c: 'var(--success)' },
                                        { l: '7-Day Low',       v: marketLow  ? `₹${marketLow}`  : '—', c: 'var(--danger)' },
                                        { l: 'Demand Zone',     v: forecast.demand.optimal_zone,       c: 'var(--primary)', small: true },
                                    ].map((x, i) => (
                                        <div key={i} style={{ background: 'var(--surface-bg)', padding: '0.7rem', borderRadius: 'var(--border-radius-md)' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>{x.l}</div>
                                            <div style={{ fontWeight: 700, fontSize: x.small ? '0.78rem' : '0.92rem', color: x.c }}>{x.v}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Buyer saving / overpaying insight */}
                                {buyerSaving !== null && (
                                    <div className="alert alert-info" style={{ marginBottom: '0.75rem' }}>
                                        <span className="alert-icon"><i className="ph ph-piggy-bank"></i></span>
                                        <div className="alert-text"><strong>You save ₹{buyerSaving.toLocaleString('en-IN')}</strong><p>Farmer's rate is below projected market peak.</p></div>
                                    </div>
                                )}
                                {buyerPaying !== null && (
                                    <div className="alert alert-warning" style={{ marginBottom: '0.75rem' }}>
                                        <span className="alert-icon"><i className="ph ph-warning"></i></span>
                                        <div className="alert-text"><strong>Above market trend</strong><p>₹{Math.abs(bestDiff!).toFixed(2)}/kg above 7-day average. Consider negotiating.</p></div>
                                    </div>
                                )}

                                {/* 7-day bars */}
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>7-Day Price Projection</div>
                                {forecast.forecast.days.map((d, i) => {
                                    const isUp = d.predicted_price >= basePrice;
                                    const barPct = Math.min(100, (d.predicted_price / ((marketHigh ?? basePrice) * 1.1)) * 100);
                                    return (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
                                            <div style={{ width: 32, fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>{d.day.slice(0, 3)}</div>
                                            <div style={{ flex: 1, height: 5, background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${barPct}%`, background: isUp ? 'var(--success)' : 'var(--danger)', borderRadius: '999px', transition: 'width 0.4s ease' }}></div>
                                            </div>
                                            <div style={{ width: 56, textAlign: 'right', fontWeight: 700, fontSize: '0.82rem', color: isUp ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>₹{d.predicted_price}</div>
                                            <div style={{ width: 28, textAlign: 'right', fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>{d.confidence_score}%</div>
                                        </div>
                                    );
                                })}

                                {/* Spoilage */}
                                <div style={{ marginTop: '1rem', padding: '0.8rem', background: forecast.spoilage.risk_level === 'HIGH' ? 'var(--danger-light)' : 'var(--success-light)', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: forecast.spoilage.risk_level === 'HIGH' ? '#B91C1C' : '#15803D' }}>
                                        {forecast.spoilage.cold_chain_needed ? '❄️ Cold chain required' : '✅ Standard dispatch safe'}
                                        <div style={{ fontSize: '0.72rem', fontWeight: 400, marginTop: '2px', opacity: 0.8 }}>{forecast.spoilage.stressor}</div>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '1.4rem', color: forecast.spoilage.risk_level === 'HIGH' ? '#B91C1C' : '#15803D' }}>{forecast.spoilage.risk_pct}%</div>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                <i className="ph ph-cloud-slash" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                ML engine offline — start backend to see predictions.
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {proposal.status === 'SENT' && (
                        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className={`btn btn-primary ${acting === proposal._id ? 'btn-loading' : ''}`} 
                                disabled={Boolean(acting)}
                                onClick={() => onAccept(proposal._id)}
                                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                                {acting === proposal._id
                                    ? <><i className="ph ph-spinner"></i> Processing...</>
                                    : <><i className="ph-fill ph-check-circle"></i> Accept &amp; Lock 2% Escrow</>
                                }
                            </button>
                            <button className="btn btn-outline" disabled={acting === proposal._id}
                                onClick={() => onReject(proposal._id)}
                                style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', color: 'var(--danger)' }}>
                                <i className="ph ph-x-circle"></i> Decline Proposal
                            </button>
                            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Accepting locks ₹{(qty * basePrice * 0.02).toFixed(0)} from your wallet as escrow
                            </div>
                        </div>
                    )}
                    {proposal.status !== 'SENT' && (
                        <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                                <i className={`ph ${proposal.status === 'ACCEPTED' ? 'ph-lock-key' : proposal.status === 'PAYMENT_RECEIVED' ? 'ph-check-circle' : 'ph-info'}`}
                                    style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.4rem', color: meta.bar }}></i>
                                Status: <strong style={{ color: meta.bar }}>{meta.label}</strong>
                            </div>
                            {proposal.status !== 'REJECTED' && (
                                <button
                                    className="btn btn-outline"
                                    style={{ width: '100%', justifyContent: 'center', gap: '0.4rem' }}
                                    onClick={() => setExportOpen(true)}
                                >
                                    <i className="ph ph-file-pdf" style={{ color: 'var(--danger)' }}></i> Export Contract PDF
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main List View ─────────────────────────────────────────────────────────
export default function FarmerProposals() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading]     = useState(true);
    const [filter, setFilter]       = useState<string>('ALL');
    const [selected, setSelected]   = useState<Proposal | null>(null);
    const [acting, setActing]       = useState<string | null>(null);
    const [error, setError]         = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/api/proposals`);
            const json = await res.json();
            if (json.success && Array.isArray(json.proposals)) {
                setProposals(json.proposals);
                setError(null);
                if (selected) {
                    const updated = json.proposals.find((p: Proposal) => p._id === selected._id);
                    if (updated) setSelected(updated);
                }
            }
        } catch {
            if (proposals.length === 0) setError('Backend offline — start server on port 4000.');
        } finally { setLoading(false); }
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
            const res = await fetch(`${API}/api/proposals/${id}/confirm-acceptance`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
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

    if (selected) {
        return <ProposalDetail proposal={selected} onBack={() => setSelected(null)} onAccept={handleAccept} onReject={handleReject} acting={acting} />;
    }

    const newCount = proposals.filter(p => p.status === 'SENT').length;
    const filtered = filter === 'ALL' ? proposals : proposals.filter(p => p.status === filter);
    const sm       = (p: Proposal) => STATUS_MAP[p.status] || STATUS_MAP['SENT'];

    return (
        <div>
            {/* Refresh sits top-right, flush with the tab strip */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button className="btn btn-outline" onClick={fetchProposals} style={{ gap: '0.4rem', fontSize: '0.85rem' }}>
                    <i className="ph ph-arrows-clockwise"></i> Refresh
                </button>
            </div>

            {/* ── Tab strip — identical markup to OrderTracking ── */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                {FILTERS.map(f => {
                    const count = f === 'ALL' ? proposals.length : proposals.filter(p => p.status === f).length;
                    return (
                        <button key={f} onClick={() => setFilter(f)} style={tabStyle(filter === f)}>
                            <i className={`ph ${f === 'ALL' ? 'ph-list' : f === 'SENT' ? 'ph-bell' : f === 'ACCEPTED' ? 'ph-check' : f === 'LOGISTICS_DISPATCHED' ? 'ph-truck' : f === 'DELIVERED' ? 'ph-package' : 'ph-currency-inr'}`} style={{ marginRight: '0.3rem' }}></i>
                            {FILTER_LABELS[f]}
                            {f === 'SENT' && newCount > 0
                                ? <span style={{ background: 'var(--danger)', color: 'white', padding: '1px 6px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '4px' }}>{newCount}</span>
                                : <span style={{ fontSize: '0.75rem', color: filter === f ? 'var(--primary)' : '#CBD5E1', marginLeft: '3px' }}>({count})</span>
                            }
                        </button>
                    );
                })}
            </div>

            {/* ── Error / Loading / Empty states ── */}
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
                            <div key={p._id} className="card-glass"
                                onClick={() => setSelected(p)}
                                style={{ cursor: 'pointer', marginBottom: '0.75rem' }}>

                                {/* Top: icon + title + badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                        <div className="item-img" style={{ background: 'var(--primary-light)', fontSize: '1.2rem', flexShrink: 0 }}>🌾</div>
                                        <div>
                                            <div className="item-title">
                                                {p.orderId?.crop || p.cropListingId?.cropName || 'Crop'}
                                                <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px' }}>
                                                    ({p.orderId?.variety || p.cropListingId?.variety || ''})
                                                </span>
                                            </div>
                                            <div className="item-sub" style={{ marginTop: '2px' }}>
                                                {p.farmerId?.fullName || 'Farmer'} &nbsp;·&nbsp; {p.proposedQuantity.toLocaleString()} kg @ ₹{p.proposedPricePerUnit}/kg
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`item-status ${meta.cls}`}>{meta.label}</span>
                                </div>

                                {/* Bottom: value + date + cta */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{(p.totalValue || 0).toLocaleString('en-IN')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                            {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {p.blockchainTxHash && <span style={{ marginLeft: '8px', color: 'var(--primary)', fontWeight: 600 }}><i className="ph ph-link"></i> On-chain</span>}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        View Details <i className="ph ph-arrow-right"></i>
                                    </span>
                                </div>

                                {/* Farmer note preview */}
                                {p.message && (
                                    <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '0.6rem', borderTop: '1px solid var(--border-color)' }}>
                                        &ldquo;{p.message}&rdquo;
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
