"use client";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiGet } from '@/lib/api';

interface FarmerProfileProps {
  farmerId: string;
  farmerData: Record<string, unknown> | null;
  setFarmerData: (data: Record<string, unknown> | null) => void;
}

export default function FarmerProfile({ farmerId, farmerData, setFarmerData }: FarmerProfileProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch fresh farmer data from API every time profile is viewed
  useEffect(() => {
    if (!farmerId) return;
    const fetchFresh = async () => {
      const res = await apiGet(`/api/farmer/${farmerId}`);
      if (res.success && res.data) {
        const data = res.data as { farmer: Record<string, unknown> };
        if (data.farmer) {
          const fresh = {
            ...data.farmer,
            id: data.farmer._id || data.farmer.id || farmerId,
          };
          setFarmerData(fresh);
          localStorage.setItem('d2farm_farmer', JSON.stringify(fresh));
        }
      }
    };
    fetchFresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  if (!farmerData) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
        <h3>Profile not loaded</h3>
        <p>Please log in again.</p>
      </div>
    );
  }

  const metrics = (farmerData.metrics || {}) as Record<string, number>;
  const wallet = (farmerData.wallet || {}) as Record<string, unknown>;
  const blockchainMeta = (farmerData.blockchainMeta || {}) as Record<string, unknown>;
  const farmLocation = (farmerData.farmLocation || {}) as { coordinates?: number[] };

  const handleLogout = () => {
    localStorage.removeItem('d2farm_farmer');
    setFarmerData(null);
    window.location.reload();
  };

  const trustColor = (score: number) => {
    if (score >= 90) return '#16A34A';
    if (score >= 70) return '#D97706';
    return '#DC2626';
  };

  const trustLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <div style={{ paddingTop: '1rem' }}>
      {/* Profile Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 0.75rem',
          background: 'var(--primary)', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', fontWeight: 700
        }}>
          {((farmerData.fullName as string) || 'F').charAt(0)}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{farmerData.fullName as string}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{farmerData.phone as string}</div>
        <div style={{ marginTop: '0.5rem' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 600,
            padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)',
            background: farmerData.onboardingStatus === 'VERIFIED' ? 'var(--success-light)' : 'var(--warning-light)',
            color: farmerData.onboardingStatus === 'VERIFIED' ? 'var(--success)' : 'var(--warning)',
          }}>
            {farmerData.onboardingStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Trust Score */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Trust Score</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: trustColor(metrics.trustScore || 80) }}>
            {metrics.trustScore || 80}
          </div>
        </div>
        <div style={{ height: 6, background: 'var(--surface-bg)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.35rem' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${metrics.trustScore || 80}%`,
            background: trustColor(metrics.trustScore || 80),
            transition: 'width 0.8s ease'
          }} />
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {trustLevel(metrics.trustScore || 80)}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[
          { label: 'Proposals', value: metrics.totalProposals || 0, color: 'var(--primary)' },
          { label: 'Accepted', value: metrics.acceptedProposals || 0, color: 'var(--success)' },
          { label: 'Deliveries', value: metrics.completedDeliveries || 0, color: 'var(--warning)' },
          { label: 'Rejected', value: metrics.rejectedProposals || 0, color: 'var(--danger)' }
        ].map(s => (
          <div key={s.label} className="card-solid" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.1rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Wallet */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>Wallet</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>
              ₹{((wallet.balance as number) || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--success-light)', color: 'var(--success)' }}>
            Active
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Locked</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--warning)' }}>
              ₹{((wallet.lockedBalance as number) || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Available</div>
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)' }}>
              ₹{((wallet.withdrawableBalance as number) || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {wallet.custodialAddress as string || 'Address assigning...'}
        </div>
      </div>

      {/* Farm Location */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1.25rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Farm Location</div>
        <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{farmerData.farmAddress as string || 'Location set via GPS'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {farmLocation.coordinates ? `${farmLocation.coordinates[1]?.toFixed(4)}, ${farmLocation.coordinates[0]?.toFixed(4)}` : 'Coordinates pending'}
          {farmerData.farmSizeAcres ? ` · ${farmerData.farmSizeAcres} acres` : ''}
        </div>
      </div>

      {/* Blockchain Verification */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>🔗 Blockchain Verification</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Farmer ID NFT</span>
            {blockchainMeta.farmerIdTokenId ? (
              <span className="badge badge-success">✅ Minted</span>
            ) : (
              <span className="badge badge-warning">⏳ Pending</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Farmland NFT</span>
            {blockchainMeta.farmlandTokenId ? (
              <span className="badge badge-success">✅ Recorded</span>
            ) : (
              <span className="badge badge-warning">⏳ Pending</span>
            )}
          </div>
          {Boolean(blockchainMeta.txHash) && (
            <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Tx Hash</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {String(blockchainMeta.txHash)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gov ID */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>🪪 Government ID</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.85rem' }}>{(farmerData.govId as Record<string, string>)?.type || 'AADHAAR'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(farmerData.govId as Record<string, string>)?.number || 'Not provided'}</div>
          </div>
          <span className="badge badge-success">Verified</span>
        </div>
      </div>

      {/* Member Since */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Member since {farmerData.joinedAt ? new Date(farmerData.joinedAt as string).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'}
      </div>

      {/* Logout */}
      <button
        className="btn-big btn-danger"
        onClick={() => setShowLogoutConfirm(true)}
        id="logout-btn"
        style={{ marginBottom: '1rem' }}
      >
        Log Out
      </button>

      {/* Logout Confirmation */}
      {showLogoutConfirm && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div className="modal-handle" />
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👋</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Log out of D2Farm?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your offline data will be preserved.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-big btn-secondary" onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-big btn-primary" onClick={handleLogout} style={{ flex: 1, background: 'var(--danger)' }} id="confirm-logout-btn">Log Out</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
