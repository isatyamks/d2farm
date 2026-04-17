"use client";
import { useState } from 'react';

export default function GeoRegistration({ setTrustScore }: { setTrustScore: (s: number) => void }) {
    const [status, setStatus] = useState<'idle' | 'locating' | 'mining' | 'success'>('idle');
    const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
    const [hash, setHash] = useState('');

    const lockGPS = () => {
        setStatus('locating');
        // Simulate HTML5 GeoLocation API Extraction
        setTimeout(() => {
            setCoords({ lat: 20.0112, lng: 73.7902 }); // Mock Nashik Farm Coords
            setStatus('mining');
            
            // Simulate Blockchain Mining
            setTimeout(() => {
                setHash("0x" + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join(''));
                setStatus('success');
                setTrustScore(98); // Award Trust Score immediately representing verified KYC
            }, 2500);
        }, 1500);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Farm Verification</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Stamp your exact farm GPS coordinates onto the blockchain to unlock B2B Smart Contracts.</p>
            </div>

            <div className="card-pwa text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                    width: '100px', height: '100px', borderRadius: '50%', 
                    background: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-main)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    marginBottom: '1.5rem', border: `2px dashed ${status === 'success' ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'all 0.5s', animation: status === 'locating' || status === 'mining' ? 'pulse 1.5s infinite' : 'none'
                }}>
                    {status === 'success' ? (
                        <i className="ph-fill ph-check-circle" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                    ) : (
                        <i className="ph ph-satellite" style={{ fontSize: '3rem', color: status === 'idle' ? 'var(--border)' : 'var(--primary)' }}></i>
                    )}
                </div>

                {status === 'idle' && (
                    <button className="btn-pwa" onClick={lockGPS}>
                        <i className="ph ph-crosshair"></i> Extract Farm GPS
                    </button>
                )}

                {status === 'locating' && (
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>📡 Connecting to Satellite...</div>
                )}

                {status === 'mining' && (
                    <div style={{ width: '100%' }}>
                        <div style={{ color: 'var(--warning)', fontWeight: 600, marginBottom: '0.5rem' }}>🔗 Minting Blockchain Identity...</div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lat: {coords?.lat} | Lng: {coords?.lng}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ width: '100%', textAlign: 'left' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified HTML5 Coordinates</div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>{coords?.lat} N, {coords?.lng} E</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immutable Polygon Identity Hash</div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)', wordBreak: 'break-all', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                {hash}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {status === 'success' && (
                <div className="card-pwa" style={{ background: 'var(--primary)', color: '#ffffff', border: 'none', boxShadow: '0 8px 25px rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <i className="ph-fill ph-shield-check" style={{ fontSize: '2rem' }}></i>
                        <div>
                            <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.2rem' }}>KYC 100% Certified</strong>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>Your land is cryptographically verified. Top buyers can now securely offer you bulk contracts.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
