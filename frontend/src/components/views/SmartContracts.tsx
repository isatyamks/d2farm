"use client";
import { useState } from 'react';

export default function SmartContracts() {
    const [status, setStatus] = useState<null | 'locking' | 'success'>(null);
    const [txHash, setTxHash] = useState('');

    const lockContract = () => {
        setStatus('locking');
        setTimeout(() => {
            // Generate a fake SHA-256 style hash for UI effect
            const hash = "0x" + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
            setTxHash(hash);
            setStatus('success');
        }, 3000);
    };

    return (
        <div>
            {status === 'success' && (
                <div className="modal-overlay active">
                    <div className="modal active" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ph-fill ph-check-circle"></i> Digital Smart Contract Locked
                            </h3>
                            <button className="close-modal" onClick={() => setStatus(null)}><i className="ph ph-x"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '0' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                                The terms have been cryptographically sealed. Both parties are now bound by the agreed dataset. The 5% escrow payment has been released to the smart contract.
                            </p>
                            <div style={{ background: '#0F172A', color: 'white', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--success)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>Immutable Transaction Hash:</div>
                                <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', wordBreak: 'break-all' }}>{txHash}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ph ph-link"></i> Cryptographic Contracts
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Review farmer proposals and lock tamper-proof B2B supply agreements via 5% margin deposits.
                    </p>
                </div>
            </div>

            <div className="grid-main-side">
                <div>
                    <div className="card-glass mb-6">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 8, height: 8, background: 'var(--warning)', borderRadius: '50%', display: 'block' }}></span>
                                Pending Farmer Proposal #8821
                            </h3>
                            <span className="insight-tag" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>Awaiting Buyer Review</span>
                        </div>

                        <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Farmer Entity</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Nashik Organic Farms (Rajesh)</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.25rem' }}>Verified KYC • 98% Trust Score</div>
                            </div>
                            <div style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--surface-bg)' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Commodity Specs</div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Onion (Red Nashik) • Grade A</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Low moisture, Premium Export Quality</div>
                            </div>
                        </div>

                        <table style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>Quantity Guaranteed</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>1,500 kg</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>Locked Rate</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>₹24.00 / kg</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem 0', color: 'var(--text-muted)' }}>Harvest / Dispatch Date</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>Oct 30, 2026</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.75rem 0', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>Total Contract Value</td>
                                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>₹36,000</td>
                                </tr>
                            </tbody>
                        </table>

                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                            onClick={lockContract}
                            disabled={status === 'locking'}
                        >
                            {status === 'locking' ? (
                                <><i className="ph ph-spinner ph-spin"></i> Generating Cryptographic Signature...</>
                            ) : (
                                <><i className="ph ph-lock-key"></i> Pay 5% Margin (₹1,800) & Seal Smart Contract</>
                            )}
                        </button>
                    </div>
                </div>

                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Immutable Network Logs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card-glass" style={{ padding: '1rem', borderLeft: '3px solid var(--success)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.9rem' }}>Contract #8742</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>SEALED</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Potato (Agra) • 500kg • ₹15/kg</div>
                            <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                Hash: 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
                            </div>
                        </div>

                        <div className="card-glass" style={{ padding: '1rem', borderLeft: '3px solid var(--success)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <strong style={{ fontSize: '0.9rem' }}>Contract #8610</strong>
                                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>SEALED</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Wheat (Sharbati) • 2,000kg • ₹22/kg</div>
                            <div style={{ background: 'var(--surface-bg)', padding: '0.5rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                Hash: 0x4a44dc15364204a80fe80e9039455cc1608281820af2b2a95b3e218202425021
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
