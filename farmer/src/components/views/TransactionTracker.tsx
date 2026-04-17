"use client";
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import AgreementModal from '../AgreementModal';

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

const STAGES = [
  { key: 'SENT', label: 'Sent', desc: 'Proposal submitted' },
  { key: 'ACCEPTED', label: 'Accepted', desc: 'Buyer confirmed' },
  { key: 'LOGISTICS_DISPATCHED', label: 'In Transit', desc: 'Picked up from farm' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Received by buyer' },
  { key: 'PAYMENT_RECEIVED', label: 'Paid', desc: 'Payment complete' },
];

export default function TransactionTracker({ farmerId }: TransactionTrackerProps) {
  const [proposals, setProposals] = useState<TrackedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TrackedProposal | null>(null);
  const [showAgreement, setShowAgreement] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractData, setContractData] = useState<any>(null);
  const [contractLoading, setContractLoading] = useState(false);

  const openAgreement = async (proposalId: string) => {
    setShowAgreement(true);
    setContractLoading(true);
    setContractData(null);
    const res = await apiGet(`/api/contracts/proposal/${proposalId}`);
    if (res.success && res.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = res.data as any;
      setContractData(d.contract || null);
    }
    setContractLoading(false);
  };

  useEffect(() => {
    const fetch = async () => {
      const res = await apiGet(`/api/proposals?farmerId=${farmerId}`);
      if (res.success && res.data) {
        const data = res.data as { proposals: TrackedProposal[] };
        const list = data.proposals || [];
        setProposals(list);
        if (list.length > 0 && !selected) setSelected(list[0]);
      }
      setLoading(false);
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  const getStages = (status: string) => {
    if (status === 'REJECTED') {
      return [
        { key: 'SENT', label: 'Sent', desc: 'Proposal submitted' },
        { key: 'REJECTED', label: 'Rejected', desc: 'Buyer declined' },
      ];
    }
    return STAGES;
  };

  const stageIdx = (status: string, list: typeof STAGES) => list.findIndex(s => s.key === status);

  const stageTime = (timeline: TimelineEntry[], key: string) => {
    const e = timeline.find(t => t.status === key);
    return e ? new Date(e.timestamp) : null;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📦</div>
        <h3>No transactions yet</h3>
        <p>Send proposals to buyers to start tracking deliveries here.</p>
      </div>
    );
  }

  const stages = selected ? getStages(selected.status) : [];
  const curIdx = selected ? stageIdx(selected.status, stages) : -1;
  const paid = selected?.paymentStatus === 'COMPLETED';

  return (
    <div>
      {/* Header */}
      <h2 className="section-title" style={{ marginBottom: '0.15rem' }}>Transactions</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        {proposals.length} total
      </p>

      {/* Tabs */}
      {proposals.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.25rem' }}>
          {proposals.map((p) => {
            const active = selected?._id === p._id;
            return (
              <button
                key={p._id}
                onClick={() => setSelected(p)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: active ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                  background: active ? 'var(--primary-light)' : 'white',
                  color: active ? 'var(--primary-dark)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  fontFamily: 'inherit',
                }}
              >
                {p.orderId?.crop || p.cropListingId?.cropName || 'Order'}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fade-slide-up" key={selected._id}>

          {/* Summary */}
          <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {selected.orderId?.crop || selected.cropListingId?.cropName || 'Crop'}
                  <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}> · {selected.orderId?.variety || selected.cropListingId?.variety || ''}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {selected.orderId?.buyerName || 'Buyer'} · {selected.proposedQuantity} kg
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                <span className={`badge ${paid ? 'badge-success' : 'badge-warning'}`}>
                  {paid ? 'Paid' : 'Pending'}
                </span>
                {(selected.status !== 'SENT' && selected.status !== 'REJECTED') && (
                  <button 
                    onClick={() => openAgreement(selected._id)}
                    style={{
                      fontSize: '0.75rem', padding: '0.35rem 0.75rem', 
                      background: 'var(--primary-light)', color: 'var(--primary-dark)',
                      border: '1px solid var(--primary)', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Agreement
                  </button>
                )}
              </div>
            </div>

            {/* Amount row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              padding: '0.85rem 1rem',
              background: 'var(--surface-bg)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Amount</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  ₹{(selected.totalValue || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Rate</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  ₹{selected.proposedPricePerUnit}/kg
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar - horizontal steps */}
          <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>Status</div>

            {/* Mini progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.25rem' }}>
              {stages.map((s, i) => {
                const done = i <= curIdx;
                return (
                  <div key={s.key} style={{ flex: 1, height: '4px', borderRadius: '2px', background: done ? 'var(--primary)' : 'var(--border-color)', transition: 'background 0.4s ease' }} />
                );
              })}
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {stages.map((stage, idx) => {
                const done = idx < curIdx;
                const active = idx === curIdx;
                const pending = idx > curIdx;
                const rejected = stage.key === 'REJECTED';
                const time = stageTime(selected.timeline, stage.key);
                const entry = selected.timeline.find(t => t.status === stage.key);
                const last = idx === stages.length - 1;

                return (
                  <div key={stage.key} style={{ display: 'flex', gap: '0.85rem' }}>
                    {/* Dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0 }}>
                      <div style={{
                        width: done ? '20px' : '24px',
                        height: done ? '20px' : '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: done ? 'var(--primary)' : active ? 'white' : 'white',
                        border: done ? 'none' : active ? '2px solid var(--primary)' : `2px solid var(--border-color)`,
                        color: done ? 'white' : active ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                        marginTop: done ? '2px' : '0',
                      }}>
                        {done && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                        {active && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rejected ? 'var(--danger)' : 'var(--primary)' }} />}
                      </div>
                      {!last && (
                        <div style={{
                          width: '2px',
                          flexGrow: 1,
                          minHeight: '1.75rem',
                          background: done ? 'var(--primary)' : 'var(--border-color)',
                        }} />
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ paddingBottom: last ? '0' : '1.25rem', flex: 1, paddingTop: '0.1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{
                          fontSize: '0.88rem',
                          fontWeight: done || active ? 700 : 500,
                          color: pending ? 'var(--text-muted)' : rejected ? 'var(--danger)' : 'var(--text-main)',
                          textDecoration: rejected ? 'line-through' : 'none',
                        }}>
                          {stage.label}
                        </div>
                        {time && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: pending ? 0.5 : 0.8, marginTop: '0.1rem' }}>{stage.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blockchain */}
          {selected.blockchainTxHash && (
            <div className="card-solid" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Blockchain Record</div>
              <div style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Tx Hash</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-main)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {selected.blockchainTxHash}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Verified on Polygon
              </div>
            </div>
          )}
        </div>
      )}
      
      {showAgreement && (
        <AgreementModal 
          isOpen={showAgreement} 
          onClose={() => { setShowAgreement(false); setContractData(null); }} 
          contract={contractData}
          loading={contractLoading}
        />
      )}
    </div>
  );
}
