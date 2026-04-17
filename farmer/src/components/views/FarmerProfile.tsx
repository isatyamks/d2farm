"use client";
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface FarmerProfileProps {
  farmerId: string;
  farmerData: Record<string, unknown> | null;
  setFarmerData: (data: Record<string, unknown> | null) => void;
}

export default function FarmerProfile({ farmerId, farmerData, setFarmerData }: FarmerProfileProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    <div className="stagger">
      {/* Profile Header */}
      <div className="card-hero" style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 0.75rem',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800
          }}>
            {((farmerData.fullName as string) || 'F').charAt(0)}
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{farmerData.fullName as string}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.15rem' }}>📱 {farmerData.phone as string}</div>
          <div style={{ marginTop: '0.5rem' }}>
            <span className="badge badge-success" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.7rem' }}>
              {farmerData.onboardingStatus === 'VERIFIED' ? '✅ Blockchain Verified' : '⏳ Verification Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Trust Score</div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', color: trustColor(metrics.trustScore || 80) }}>
            {metrics.trustScore || 80}/100
          </div>
        </div>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${metrics.trustScore || 80}%`,
            background: `linear-gradient(90deg, ${trustColor(metrics.trustScore || 80)}, ${trustColor(metrics.trustScore || 80)}dd)`,
            transition: 'width 1s ease'
          }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {trustLevel(metrics.trustScore || 80)} — Based on delivery history and buyer feedback
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{metrics.totalProposals || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Total Proposals</div>
        </div>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>{metrics.acceptedProposals || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Accepted</div>
        </div>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>{metrics.completedDeliveries || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Deliveries</div>
        </div>
        <div className="card-solid" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)' }}>{metrics.rejectedProposals || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.15rem' }}>Rejected</div>
        </div>
      </div>

      {/* Wallet */}
      <div className="card-dark" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>💳 Wallet</div>
          <span className="badge badge-success" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.15)', color: 'white' }}>ACTIVE</span>
        </div>

        {/* Total balance */}
        <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.25rem' }}>
          ₹{((wallet.balance as number) || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.55, fontFamily: 'monospace', marginBottom: '1rem' }}>
          {(wallet.custodialAddress as string || 'Not assigned').slice(0, 22)}...
        </div>

        {/* Locked vs Withdrawable breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '10px', borderLeft: '3px solid #F59E0B' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#FCD34D', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
              🔒 Locked
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>
              ₹{((wallet.lockedBalance as number) || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>Escrow hold</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.75rem', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#6EE7B7', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
              ✅ Free
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>
              ₹{((wallet.withdrawableBalance as number) || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>Can withdraw</div>
          </div>
        </div>

        {(wallet.lockedBalance as number) > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', background: 'rgba(245,158,11,0.12)', padding: '0.5rem 0.6rem', borderRadius: '8px' }}>
            ⚠️ Locked funds release automatically once the buyer confirms delivery. Cancelling forfeits your escrow.
          </div>
        )}
      </div>

      {/* Farm Location */}
      <div className="card-solid" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>📍 Farm Location</div>
        <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{farmerData.farmAddress as string || 'Location set via GPS'}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Coordinates: {farmLocation.coordinates ? `${farmLocation.coordinates[1]?.toFixed(4)}, ${farmLocation.coordinates[0]?.toFixed(4)}` : 'N/A'}
          {farmerData.farmSizeAcres ? ` • ${farmerData.farmSizeAcres} acres` : ''}
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
            <div style={{ background: '#F8FAFC', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
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
