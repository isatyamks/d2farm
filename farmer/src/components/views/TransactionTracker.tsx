"use client";
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';

interface TransactionTrackerProps {
  farmerId: string;
}

interface TimelineEntry {
  status: string;
  timestamp: string;
  note: string;
}

interface TrackedProposal {
  _id: string;
  status: string;
  proposedQuantity: number;
  proposedPricePerUnit: number;
  totalValue: number;
  paymentStatus: string;
  timeline: TimelineEntry[];
  blockchainTxHash: string | null;
  orderId?: { buyerName: string; crop: string; variety: string };
  cropListingId?: { cropName: string; variety: string };
  createdAt: string;
}

const LIFECYCLE_STAGES = [
  { key: 'SENT', label: 'Proposal Sent', icon: '📩', description: 'Your proposal was submitted to the buyer' },
  { key: 'ACCEPTED', label: 'Accepted', icon: '✅', description: 'Buyer accepted your proposal' },
  { key: 'LOGISTICS_DISPATCHED', label: 'Dispatched', icon: '🚚', description: 'Shipment picked up from your farm' },
  { key: 'DELIVERED', label: 'Delivered', icon: '📦', description: 'Goods delivered to buyer warehouse' },
  { key: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: '💰', description: 'Full payment credited to your wallet' },
];

export default function TransactionTracker({ farmerId }: TransactionTrackerProps) {
  const [proposals, setProposals] = useState<TrackedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<TrackedProposal | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      const res = await apiGet(`/api/proposals?farmerId=${farmerId}`);
      if (res.success && res.data) {
        const data = res.data as { proposals: TrackedProposal[] };
        const active = (data.proposals || []).filter(p => p.status !== 'REJECTED');
        setProposals(active);
        if (active.length > 0 && !selectedProposal) {
          setSelectedProposal(active[0]);
        }
      }
      setLoading(false);
    };
    fetchProposals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  const getStageIndex = (status: string) => {
    return LIFECYCLE_STAGES.findIndex(s => s.key === status);
  };

  const getTimeForStage = (timeline: TimelineEntry[], stageKey: string) => {
    const entry = timeline.find(t => t.status === stageKey);
    if (!entry) return null;
    return new Date(entry.timestamp);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading transactions...</div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
        <h3>No transactions yet</h3>
        <p>Your proposal-to-payment journey will appear here once you send proposals to buyers.</p>
      </div>
    );
  }

  const currentStageIdx = selectedProposal ? getStageIndex(selectedProposal.status) : -1;

  return (
    <div>
      <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Transaction Tracker</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Proposal → Payment journey</p>

      {/* Proposal Selector (if multiple) */}
      {proposals.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          {proposals.map((p) => (
            <button
              key={p._id}
              onClick={() => setSelectedProposal(p)}
              className={selectedProposal?._id === p._id ? 'btn-big btn-primary btn-sm' : 'btn-big btn-secondary btn-sm'}
              style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}
            >
              {p.orderId?.crop || p.cropListingId?.cropName || 'Order'} • ₹{(p.totalValue || 0).toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )}

      {selectedProposal && (
        <div className="fade-slide-up" key={selectedProposal._id}>
          {/* Payment Hero Card */}
          <div className={selectedProposal.paymentStatus === 'COMPLETED' ? 'card-hero' : 'card-dark'} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {selectedProposal.paymentStatus === 'COMPLETED' ? '💰 Payment Received' : selectedProposal.status === 'DELIVERED' ? '⏳ Awaiting Payment' : '📋 Transaction Value'}
                </div>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.1, marginTop: '0.35rem' }}>
                  ₹{(selectedProposal.totalValue || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <span className={`badge ${selectedProposal.paymentStatus === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                {selectedProposal.paymentStatus === 'COMPLETED' ? 'PAID' : 'PENDING'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', opacity: 0.8, position: 'relative', zIndex: 1 }}>
              <span>{selectedProposal.orderId?.buyerName || 'Buyer'}</span>
              <span>{selectedProposal.proposedQuantity}kg @ ₹{selectedProposal.proposedPricePerUnit}/kg</span>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="card-solid" style={{ marginBottom: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                🌾
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedProposal.orderId?.crop || selectedProposal.cropListingId?.cropName || 'Crop'} ({selectedProposal.orderId?.variety || selectedProposal.cropListingId?.variety || ''})
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedProposal.orderId?.buyerName || 'Buyer'} • Qty: {selectedProposal.proposedQuantity}kg
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card-solid" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Delivery Timeline
            </div>

            <div className="timeline">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentStageIdx;
                const isActive = idx === currentStageIdx;
                const isPending = idx > currentStageIdx;
                const stageTime = getTimeForStage(selectedProposal.timeline, stage.key);
                const timelineEntry = selectedProposal.timeline.find(t => t.status === stage.key);

                return (
                  <div key={stage.key} className="timeline-item">
                    <div className={`timeline-dot ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                        <span style={{ fontSize: '1rem' }}>{stage.icon}</span>
                        <span className={`timeline-title ${isActive ? 'active' : isPending ? 'pending' : ''}`}>
                          {stage.label}
                        </span>
                      </div>
                      {stageTime ? (
                        <div className="timeline-meta">
                          {formatDate(stageTime)} at {formatTime(stageTime)}
                          {timelineEntry?.note && (
                            <span style={{ display: 'block', marginTop: '0.15rem' }}>{timelineEntry.note}</span>
                          )}
                        </div>
                      ) : isPending ? (
                        <div className="timeline-meta" style={{ fontStyle: 'italic' }}>
                          {stage.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blockchain Proof */}
          {selectedProposal.blockchainTxHash && (
            <div className="card-solid" style={{ marginTop: '0.75rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>🔗</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Blockchain Proof</span>
              </div>
              <div style={{ background: '#0F172A', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Transaction Hash
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', lineHeight: 1.4 }}>
                  {selectedProposal.blockchainTxHash}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                Immutably recorded on Polygon Network
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
