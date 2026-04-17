"use client";
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';

interface ProposalCenterProps {
  farmerId: string;
}

interface MatchedOrder {
  _id: string;
  buyerName: string;
  crop: string;
  variety: string;
  quantityRequired: number;
  unit: string;
  priceOffered: number;
  status: string;
  matchScore: number;
  matchReasons: string[];
  matchingListing?: {
    id: string;
    cropName: string;
    variety: string;
    pricePerUnit: number;
    totalQuantity: number;
  };
  createdAt: string;
}

interface SentProposal {
  _id: string;
  status: string;
  proposedQuantity: number;
  proposedPricePerUnit: number;
  totalValue: number;
  message: string;
  orderId?: { buyerName: string; crop: string; variety: string; quantityRequired: number };
  createdAt: string;
}

export default function ProposalCenter({ farmerId }: ProposalCenterProps) {
  const [tab, setTab] = useState<'open' | 'sent'>('open');
  const [matchedOrders, setMatchedOrders] = useState<MatchedOrder[]>([]);
  const [sentProposals, setSentProposals] = useState<SentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  const fetchData = async () => {
    setLoading(true);
    const [matchRes, proposalRes] = await Promise.all([
      apiGet(`/api/match/orders?farmerId=${farmerId}`),
      apiGet(`/api/proposals?farmerId=${farmerId}`),
    ]);

    if (matchRes.success && matchRes.data) {
      const data = matchRes.data as { matchedOrders: MatchedOrder[] };
      setMatchedOrders(data.matchedOrders || []);
    }
    if (proposalRes.success && proposalRes.data) {
      const data = proposalRes.data as { proposals: SentProposal[] };
      setSentProposals(data.proposals || []);
    }
    setLoading(false);
  };

  const sendProposal = async (order: MatchedOrder) => {
    setSendingTo(order._id);

    const proposalData = {
      farmerId,
      orderId: order._id,
      cropListingId: order.matchingListing?.id,
      proposedQuantity: Math.min(order.quantityRequired, order.matchingListing?.totalQuantity || order.quantityRequired),
      proposedPricePerUnit: order.matchingListing?.pricePerUnit || (order.priceOffered / order.quantityRequired),
      message: `Fresh ${order.crop} (${order.variety}) ready for dispatch.`,
    };

    const res = await apiPost('/api/proposals', proposalData);
    if (res.success) {
      // Move to sent tab and refresh
      setTab('sent');
      fetchData();
    } else {
      alert('Failed to send proposal. Please try again.');
    }
    setSendingTo(null);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      SENT: 'Sent', ACCEPTED: 'Accepted', REJECTED: 'Rejected',
      LOGISTICS_DISPATCHED: 'Dispatched', DELIVERED: 'Delivered', PAYMENT_RECEIVED: 'Paid'
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
    <div>
      {/* Header */}
      <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Proposal Center</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Match with buyers and send proposals</p>

      {/* Tabs */}
      <div className="toggle-group" style={{ marginBottom: '1.25rem' }}>
        <button className={`toggle-option ${tab === 'open' ? 'active' : ''}`} onClick={() => setTab('open')}>
          Open Orders ({matchedOrders.length})
        </button>
        <button className={`toggle-option ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          My Proposals ({sentProposals.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Finding matches...</div>
        </div>
      ) : (
        <div className="fade-slide-up" key={tab}>
          {/* Open Orders Tab */}
          {tab === 'open' && (
            matchedOrders.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📋</div>
                <h3>No matching orders</h3>
                <p>Add more crops to see buyer orders that match your harvest!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matchedOrders.map((order) => (
                  <div key={order._id} className="card-solid" style={{ padding: '1.25rem' }}>
                    {/* Match Score */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                          background: order.matchScore >= 70 ? 'var(--primary-light)' : 'var(--warning-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.8rem',
                          color: order.matchScore >= 70 ? 'var(--primary-dark)' : 'var(--warning)'
                        }}>
                          {order.matchScore}%
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.crop} ({order.variety})</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.buyerName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#F8FAFC', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quantity Needed</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.quantityRequired.toLocaleString()} {order.unit}</div>
                      </div>
                      <div style={{ background: '#F8FAFC', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Value</div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-dark)' }}>₹{order.priceOffered.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                      {order.matchReasons.map((reason, i) => (
                        <span key={i} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>✓ {reason}</span>
                      ))}
                    </div>

                    {/* Send Proposal Button */}
                    <button
                      className="btn-big btn-primary"
                      onClick={() => sendProposal(order)}
                      disabled={sendingTo === order._id}
                      id={`send-proposal-${order._id}`}
                    >
                      {sendingTo === order._id ? (
                        <><span className="spinner" /> Sending...</>
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                          </svg>
                          Send Proposal
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Sent Proposals Tab */}
          {tab === 'sent' && (
            sentProposals.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📩</div>
                <h3>No proposals sent</h3>
                <p>Check Open Orders to find buyers matching your crops.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sentProposals.map((p) => (
                  <div key={p._id} className="card-solid" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {p.orderId?.crop || 'Crop'} ({p.orderId?.variety || ''})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {p.orderId?.buyerName || 'Buyer'} • {p.proposedQuantity}kg @ ₹{p.proposedPricePerUnit}/kg
                        </div>
                      </div>
                      <span className={`badge ${statusBadge(p.status)}`}>{statusLabel(p.status)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-dark)' }}>
                        ₹{p.totalValue.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
