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
      SENT: 'Proposal Sent', ACCEPTED: 'Accepted', LOGISTICS_DISPATCHED: 'Dispatched',
      DELIVERED: 'Delivered', PAYMENT_RECEIVED: 'Paid', REJECTED: 'Rejected'
    };
    return map[s] || s;
  };

  const statusBadge = (s: string) => {
    if (['PAYMENT_RECEIVED'].includes(s)) return 'badge-success';
    if (['ACCEPTED', 'LOGISTICS_DISPATCHED'].includes(s)) return 'badge-primary';
    if (['DELIVERED'].includes(s)) return 'badge-warning';
    if (['REJECTED'].includes(s)) return 'badge-danger';
    return 'badge-info';
  };

  return (
    <div className="stagger">
      {/* Hero: Payment Status */}
      <div className="card-hero" style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.25rem', fontWeight: 600 }}>
            {pendingPayment.length > 0 ? '💰 Pending Payments' : '✅ All Payments Clear'}
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '0.5rem' }}>
            ₹{totalPending > 0 ? totalPending.toLocaleString('en-IN') : (wallet.balance as number || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {pendingPayment.length > 0
              ? `${pendingPayment.length} delivery awaiting payment`
              : 'Wallet Balance'
            }
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            {activeProposals.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Active
          </div>
        </div>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>
            {metrics.completedDeliveries || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Delivered
          </div>
        </div>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
            {metrics.trustScore || 80}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Trust Score
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <button className="btn-big btn-primary" onClick={() => setCurrentView('crops')} id="add-crop-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Add Crop
        </button>
        <button className="btn-big btn-secondary" onClick={() => setCurrentView('orders')} id="view-orders-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 00-1.172-2.872L3 3" /><path d="M15 9l6-6" />
          </svg>
          Open Orders
        </button>
      </div>

      <button className="btn-big" onClick={() => setCurrentView('deeptech')} style={{ width: '100%', marginBottom: '1.25rem', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        Access DeepTech ML Forecasts
      </button>

      {/* Active Proposals */}
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Recent Activity</span>
        <button onClick={() => setCurrentView('tracker')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
          View All →
        </button>
      </div>

      {loading ? (
        <div className="card-solid" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="card-solid empty-state" style={{ padding: '2rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, margin: '0 auto 0.75rem' }}>
            <path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 00-1.172-2.872L3 3" /><path d="M15 9l6-6" />
          </svg>
          <h3>No proposals yet</h3>
          <p>List your crops and respond to buyer orders to get started!</p>
          <button className="btn-big btn-primary" onClick={() => setCurrentView('crops')} style={{ maxWidth: 200, margin: '0 auto' }}>
            Add Your First Crop
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {proposals.slice(0, 4).map((p) => (
            <div
              key={p._id}
              className="card-solid"
              onClick={() => setCurrentView('tracker')}
              style={{ cursor: 'pointer', padding: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {p.orderId?.crop || p.cropListingId?.cropName || 'Crop'} ({p.orderId?.variety || p.cropListingId?.variety || ''})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {p.orderId?.buyerName || 'Buyer'} • {p.proposedQuantity}kg
                  </div>
                </div>
                <span className={`badge ${statusBadge(p.status)}`}>
                  {statusLabel(p.status)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                  ₹{(p.totalValue || 0).toLocaleString('en-IN')}
                </div>
                {p.status === 'DELIVERED' && p.paymentStatus !== 'COMPLETED' && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--warning)', fontWeight: 700 }}>⏳ Payment Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
