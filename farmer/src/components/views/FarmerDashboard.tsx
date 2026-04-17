"use client";
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

interface DashboardProps {
  farmerId: string;
  farmerData: Record<string, unknown> | null;
  setCurrentView: (view: string) => void;
}

interface ProposalData {
  _id: string;
  status: string;
  totalValue: number;
  proposedQuantity: number;
  paymentStatus: string;
  orderId?: { buyerName: string; crop: string; variety: string };
  cropListingId?: { cropName: string; variety: string };
  createdAt: string;
}

export default function FarmerDashboard({ farmerId, farmerData, setCurrentView }: DashboardProps) {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await apiGet(`/api/proposals?farmerId=${farmerId}`);
      if (res.success && res.data) {
        const data = res.data as { proposals: ProposalData[] };
        setProposals(data.proposals || []);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, [farmerId]);

  const metrics = (farmerData?.metrics || {}) as Record<string, number>;
  const wallet = (farmerData?.wallet || {}) as Record<string, unknown>;
  const activeProposals = proposals.filter(p => !['PAYMENT_RECEIVED', 'REJECTED'].includes(p.status));
  const pendingPayment = proposals.filter(p => p.status === 'DELIVERED' && p.paymentStatus !== 'COMPLETED');
  const totalPending = pendingPayment.reduce((sum, p) => sum + (p.totalValue || 0), 0);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      SENT: 'Sent', ACCEPTED: 'Accepted', LOGISTICS_DISPATCHED: 'In Transit',
      DELIVERED: 'Delivered', PAYMENT_RECEIVED: 'Paid', REJECTED: 'Rejected'
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (s === 'PAYMENT_RECEIVED') return 'var(--success)';
    if (s === 'REJECTED') return 'var(--danger)';
    if (s === 'DELIVERED') return 'var(--warning)';
    return 'var(--primary)';
  };

  const greeting = () => {
    const h = new Date().getHours();
    const name = (farmerData?.fullName as string)?.split(' ')[0] || '';
    if (h < 12) return `Good morning${name ? ', ' + name : ''}`;
    if (h < 17) return `Good afternoon${name ? ', ' + name : ''}`;
    return `Good evening${name ? ', ' + name : ''}`;
  };

  return (
    <div style={{ paddingTop: '1rem' }}>
      {/* Greeting */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.15rem' }}>
          {greeting()}
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Here&apos;s your farm overview
        </p>
      </div>

      {/* Balance card */}
      <div className="card-hero" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 500, marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {pendingPayment.length > 0 ? 'Pending' : 'Balance'}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>
              ₹{totalPending > 0 ? totalPending.toLocaleString('en-IN') : (wallet.balance as number || 0).toLocaleString('en-IN')}
            </div>
          </div>
          {pendingPayment.length > 0 && (
            <div style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
              {pendingPayment.length} pending
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { value: activeProposals.length, label: 'Active', color: 'var(--primary)' },
          { value: metrics.completedDeliveries || 0, label: 'Delivered', color: 'var(--warning)' },
          { value: metrics.trustScore || 80, label: 'Trust', color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card-solid" style={{ textAlign: 'center', padding: '0.75rem 0.5rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className="btn-big btn-primary" onClick={() => setCurrentView('crops')} id="add-crop-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Add Crop
        </button>
        <button className="btn-big btn-secondary" onClick={() => setCurrentView('orders')} id="view-orders-btn">
          Orders
        </button>
      </div>

      <button className="btn-big btn-secondary" onClick={() => setCurrentView('deeptech')} style={{ marginBottom: '1.25rem' }} id="deeptech-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
        Price Forecasts
      </button>

      {/* Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Recent</h2>
        {proposals.length > 0 && (
          <button onClick={() => setCurrentView('tracker')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
            See all
          </button>
        )}
      </div>

      {loading ? (
        <div className="card-solid" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto' }} />
        </div>
      ) : proposals.length === 0 ? (
        <div className="card-solid" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌱</div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>No activity yet</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>List your crops to start receiving orders</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {proposals.slice(0, 5).map((p) => (
            <div
              key={p._id}
              className="card-solid"
              onClick={() => setCurrentView('tracker')}
              style={{ cursor: 'pointer', padding: '0.85rem 1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.1rem' }}>
                    {p.orderId?.crop || p.cropListingId?.cropName || 'Crop'}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> · {p.orderId?.variety || p.cropListingId?.variety || ''}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.orderId?.buyerName || 'Buyer'} · {p.proposedQuantity}kg · ₹{(p.totalValue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: statusColor(p.status),
                  padding: '0.2rem 0.5rem',
                  background: p.status === 'PAYMENT_RECEIVED' ? 'var(--success-light)' : p.status === 'REJECTED' ? 'var(--danger-light)' : 'var(--primary-light)',
                  borderRadius: 'var(--radius-full)',
                  whiteSpace: 'nowrap',
                }}>
                  {statusLabel(p.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
