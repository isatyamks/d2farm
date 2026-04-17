"use client";
import { useRef } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: any;
  loading?: boolean;
}

export default function AgreementModal({ isOpen, onClose, contract, loading }: AgreementModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Contract ${contract?.contractNumber || ''}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 2cm 1.5cm; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
        .ag-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #166534; }
        .ag-header h1 { font-size: 18px; color: #166534; letter-spacing: 1px; }
        .ag-header p { font-size: 11px; color: #666; margin-top: 4px; }
        .ag-section { margin-bottom: 20px; }
        .ag-section-title { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
        .ag-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .ag-box { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
        .ag-box .label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600; }
        .ag-box .value { font-weight: 600; font-size: 13px; margin-top: 2px; }
        .ag-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
        .ag-row:last-child { border-bottom: none; }
        .ag-row .k { color: #666; }
        .ag-row .v { font-weight: 600; text-align: right; }
        .ag-sig { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
        .ag-sig-box { text-align: center; }
        .ag-sig-line { border-bottom: 1px dashed #999; height: 28px; display: flex; align-items: flex-end; justify-content: center; font-weight: 700; font-size: 11px; color: #166534; }
        .ag-sig-label { font-size: 10px; color: #888; margin-top: 6px; }
        .ag-footer { text-align: center; margin-top: 24px; font-size: 10px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        .ag-blockchain { background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 11px; margin-top: 12px; word-break: break-all; }
        .ag-stamp { display: inline-block; border: 2px solid #166534; color: #166534; padding: 4px 16px; border-radius: 4px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; transform: rotate(-3deg); }
      </style></head><body>${printContents}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  // ── Styling constants ─────────────────────────────────────────────────────
  const S = {
    overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
    modal: { width: '100%', maxWidth: '560px', maxHeight: '90vh', background: '#fff', borderRadius: '16px', display: 'flex', flexDirection: 'column' as const, boxShadow: '0 24px 48px rgba(0,0,0,0.18)', overflow: 'hidden' },
    header: { padding: '1rem 1.25rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc' },
    body: { padding: '1.25rem', overflowY: 'auto' as const, flexGrow: 1 },
    footer: { padding: '0.85rem 1.25rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: '#fff' },
    sectionTitle: { fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '0.6rem', paddingBottom: '0.35rem', borderBottom: '1px solid #f0f0f0' },
    gridTwo: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' },
    box: { padding: '0.65rem 0.8rem', border: '1px solid #eaeaea', borderRadius: '8px', background: '#fefefe' },
    boxLabel: { fontSize: '0.62rem', fontWeight: 600, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.3px' },
    boxValue: { fontSize: '0.88rem', fontWeight: 700, marginTop: '0.15rem', color: '#1f2937' },
    row: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' },
    rowKey: { color: '#888' },
    rowVal: { fontWeight: 600, color: '#1f2937', textAlign: 'right' as const },
    btnClose: { padding: '0.55rem 1.25rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
    btnDownload: { padding: '0.55rem 1.5rem', background: '#166534', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' },
    closeIcon: { background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: '0.4rem' },
  };

  if (loading) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.modal, alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner spinner-dark" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ color: '#666', fontSize: '0.85rem' }}>Fetching contract...</div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div style={S.overlay}>
        <div style={{ ...S.modal, alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
          <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>No Contract Found</div>
          <div style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1rem' }}>This proposal does not have a contract generated yet.</div>
          <button style={S.btnClose} onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const c = contract;
  const contractDate = c.contractDate ? new Date(c.contractDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const expiryDate = c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const farmerSignedAt = c.signatures?.farmerSignedAt ? new Date(c.signatures.farmerSignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const buyerSignedAt = c.signatures?.buyerSignedAt ? new Date(c.signatures.buyerSignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={S.modal}>

        {/* ─── Header ───────────────────────────────────────── */}
        <div style={S.header}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#111' }}>
              Contract Agreement
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
              {c.contractNumber || '—'} · {c.issuedBy || 'D2Farm'}
            </div>
          </div>
          <button style={S.closeIcon} onClick={onClose}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* ─── Body (printable) ─────────────────────────────── */}
        <div style={S.body} ref={printRef}>

          {/* Print header (only visible in printed version) */}
          <div className="ag-header" style={{ textAlign: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '2px solid #166534' }}>
            <h1 style={{ fontSize: '1rem', color: '#166534', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>D2FARM PROCUREMENT PLATFORM</h1>
            <p style={{ fontSize: '0.72rem', color: '#666', margin: '0.2rem 0 0' }}>Smart Contract Agreement · Ref: {c.contractNumber}</p>
            <p style={{ fontSize: '0.68rem', color: '#999', margin: '0.1rem 0 0' }}>Executed on {contractDate} · Valid until {expiryDate}</p>
          </div>

          {/* Parties */}
          <div className="ag-section" style={{ marginBottom: '1rem' }}>
            <div style={S.sectionTitle}>Contracting Parties</div>
            <div style={S.gridTwo}>
              <div style={S.box}>
                <div style={S.boxLabel}>Party 1 — Farmer</div>
                <div style={S.boxValue}>{c.farmer?.name || '—'}</div>
                {c.farmer?.fatherName && <div style={{ fontSize: '0.72rem', color: '#888' }}>S/o {c.farmer.fatherName}</div>}
                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
                  {[c.farmer?.village, c.farmer?.tehsil, c.farmer?.district, c.farmer?.state].filter(Boolean).join(', ') || c.farmer?.state || '—'}
                </div>
                {c.farmer?.phone && <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.1rem' }}>📞 +91 {c.farmer.phone}</div>}
              </div>
              <div style={S.box}>
                <div style={S.boxLabel}>Party 2 — Buyer</div>
                <div style={S.boxValue}>{c.buyer?.name || '—'}</div>
                {c.buyer?.businessName && <div style={{ fontSize: '0.72rem', color: '#888' }}>{c.buyer.businessName}</div>}
                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '0.15rem' }}>
                  {[c.buyer?.city, c.buyer?.state].filter(Boolean).join(', ') || c.buyer?.state || '—'}
                </div>
                {c.buyer?.phone && <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.1rem' }}>📞 {c.buyer.phone}</div>}
              </div>
            </div>
          </div>

          {/* Produce */}
          <div className="ag-section" style={{ marginBottom: '1rem' }}>
            <div style={S.sectionTitle}>Produce Details</div>
            <div style={{ ...S.box, padding: '0.5rem 0.8rem' }}>
              <div style={S.row}><span style={S.rowKey}>Crop</span><span style={S.rowVal}>{c.produce?.cropName} ({c.produce?.variety || 'Standard'})</span></div>
              <div style={S.row}><span style={S.rowKey}>Quantity</span><span style={S.rowVal}>{c.produce?.quantityKg?.toLocaleString('en-IN')} kg</span></div>
              <div style={S.row}><span style={S.rowKey}>Rate</span><span style={S.rowVal}>₹{c.produce?.pricePerKg}/kg</span></div>
              <div style={S.row}><span style={S.rowKey}>Grade</span><span style={S.rowVal}>{c.produce?.grade || 'Standard'}</span></div>
              <div style={S.row}><span style={S.rowKey}>Packaging</span><span style={S.rowVal}>{c.produce?.packagingType || 'Jute Bags'}</span></div>
              {c.produce?.qualityParameters && (
                <div style={S.row}><span style={S.rowKey}>Quality</span><span style={S.rowVal}>Moisture ≤{c.produce.qualityParameters.moistureMaxPct}%, FM ≤{c.produce.qualityParameters.foreignMatterMaxPct}%</span></div>
              )}
            </div>
          </div>

          {/* Financials */}
          <div className="ag-section" style={{ marginBottom: '1rem' }}>
            <div style={S.sectionTitle}>Financial Terms</div>
            <div style={{ ...S.box, background: '#f0fdf4', borderColor: '#bbf7d0', padding: '0.5rem 0.8rem' }}>
              <div style={S.row}><span style={{ ...S.rowKey, color: '#166534' }}>Total Contract Value</span><span style={{ ...S.rowVal, fontSize: '1rem', color: '#14532d' }}>₹{c.financials?.totalContractValue?.toLocaleString('en-IN')}</span></div>
              <div style={S.row}><span style={{ ...S.rowKey, color: '#166534' }}>Escrow Locked (2%)</span><span style={{ ...S.rowVal, color: '#166534' }}>₹{c.financials?.escrowAmount?.toLocaleString('en-IN')}</span></div>
              <div style={S.row}><span style={{ ...S.rowKey, color: '#166534' }}>Balance on Delivery</span><span style={S.rowVal}>₹{c.financials?.remainingBalance?.toLocaleString('en-IN')}</span></div>
              <div style={S.row}><span style={S.rowKey}>Payment Mode</span><span style={S.rowVal}>{c.financials?.paymentMode || 'NEFT/IMPS'}</span></div>
              <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowKey}>Late Penalty</span><span style={S.rowVal}>₹{c.financials?.latePenaltyPerDay || 500}/day</span></div>
            </div>
          </div>

          {/* Blockchain */}
          {c.blockchain?.transactionHash && (
            <div className="ag-section" style={{ marginBottom: '1rem' }}>
              <div style={S.sectionTitle}>Blockchain Verification</div>
              <div className="ag-blockchain" style={{ background: '#f8fafc', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155' }}>🔗 {c.blockchain.network || 'Polygon'} Network</span>
                  <span style={{ fontSize: '0.62rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>VERIFIED</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  Tx: {c.blockchain.transactionHash}
                </div>
                {c.blockchain.verificationUrl && (
                  <a
                    href={c.blockchain.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.68rem', color: '#166534', textDecoration: 'underline', marginTop: '0.3rem', display: 'inline-block' }}
                  >
                    View on {c.blockchain.network || 'Polygon'}scan →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Legal */}
          <div className="ag-section" style={{ marginBottom: '1rem' }}>
            <div style={S.sectionTitle}>Legal & Jurisdiction</div>
            <div style={{ ...S.box, padding: '0.5rem 0.8rem' }}>
              <div style={S.row}><span style={S.rowKey}>Governing Law</span><span style={S.rowVal}>{c.governingLaw || 'Laws of India'}</span></div>
              <div style={S.row}><span style={S.rowKey}>Jurisdiction</span><span style={S.rowVal}>{c.jurisdiction || '—'}</span></div>
              <div style={{ ...S.row, borderBottom: 'none' }}><span style={S.rowKey}>Arbitration</span><span style={{ ...S.rowVal, fontSize: '0.72rem', maxWidth: '60%' }}>{c.arbitrationClause || '—'}</span></div>
            </div>
          </div>

          {/* Signatures */}
          <div className="ag-section" style={{ marginBottom: '0.5rem' }}>
            <div style={S.sectionTitle}>Digital Signatures</div>
            <div style={S.gridTwo}>
              <div style={{ textAlign: 'center' }}>
                <div className="ag-sig-line" style={{ borderBottom: '1px dashed #bbb', height: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: c.signatures?.farmerSigned ? '#166534' : '#ccc' }}>
                  {c.signatures?.farmerSigned ? '✓ Digitally Signed' : 'Pending'}
                </div>
                <div className="ag-sig-label" style={{ fontSize: '0.68rem', color: '#888', marginTop: '0.35rem' }}>Farmer — {c.farmer?.name}</div>
                {farmerSignedAt && <div style={{ fontSize: '0.6rem', color: '#aaa' }}>{farmerSignedAt}</div>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="ag-sig-line" style={{ borderBottom: '1px dashed #bbb', height: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: c.signatures?.buyerSigned ? '#166534' : '#ccc' }}>
                  {c.signatures?.buyerSigned ? '✓ Digitally Signed' : 'Pending'}
                </div>
                <div className="ag-sig-label" style={{ fontSize: '0.68rem', color: '#888', marginTop: '0.35rem' }}>Buyer — {c.buyer?.name}</div>
                {buyerSignedAt && <div style={{ fontSize: '0.6rem', color: '#aaa' }}>{buyerSignedAt}</div>}
              </div>
            </div>
            {c.signatures?.witnessName && (
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.62rem', color: '#aaa' }}>
                Witness: {c.signatures.witnessName}
              </div>
            )}
          </div>

          {/* Status stamp */}
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span className="ag-stamp" style={{
              display: 'inline-block', border: '2px solid #166534', color: '#166534',
              padding: '0.25rem 1rem', borderRadius: '4px', fontWeight: 800,
              fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px',
              transform: 'rotate(-2deg)'
            }}>
              {c.status || 'ACTIVE'}
            </span>
          </div>

          {/* Footer metadata */}
          <div className="ag-footer" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.6rem', color: '#ccc', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' }}>
            Version {c.version || '1.0'} · Generated by {c.issuedBy || 'D2Farm Procurement Platform'}
          </div>
        </div>

        {/* ─── Footer Actions ──────────────────────────────── */}
        <div style={S.footer}>
          <button style={S.btnClose} onClick={onClose}>Close</button>
          <button style={S.btnDownload} onClick={handleDownload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
