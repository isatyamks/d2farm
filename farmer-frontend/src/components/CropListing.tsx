"use client";
import { useState } from 'react';

export default function CropListing() {
    const [step, setStep] = useState<'form' | 'scanning' | 'results'>('form');
    const [crop, setCrop] = useState('Tomato');
    
    const simulateIoTScan = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('scanning');
        setTimeout(() => {
            setStep('results');
        }, 3000);
    };

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>IoT Visual AI Scan</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Upload a picture of your harvest. Our AI will automatically grade the quality for premium buyers.</p>
            </div>

            {step === 'form' && (
                <form onSubmit={simulateIoTScan} className="card-pwa">
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select Crop Type</label>
                    <select className="input-pwa" value={crop} onChange={e => setCrop(e.target.value)}>
                        <option value="Tomato">Tomatoes (Hybrid)</option>
                        <option value="Onion">Onion (Red Nashik)</option>
                        <option value="Potato">Potato (Agra Big)</option>
                    </select>

                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload Harvest Photo</label>
                    <div style={{ 
                        border: '2px dashed var(--border)', borderRadius: '12px', padding: '2rem', 
                        textAlign: 'center', marginTop: '0.5rem', marginBottom: '1.5rem', background: 'var(--bg-main)'
                    }}>
                        <i className="ph ph-camera" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}></i>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>Tap to Open Camera</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>(Required for AI Verification)</div>
                    </div>

                    <button type="submit" className="btn-pwa">
                        <i className="ph-fill ph-magic-wand"></i> Run AI Edge Scan
                    </button>
                </form>
            )}

            {step === 'scanning' && (
                <div className="card-pwa text-center" style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <i className="ph ph-aperture ph-spin" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Executing Edge Vision AI</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scanning color density, identifying pest damage, and analyzing moisture levels...</p>
                </div>
            )}

            {step === 'results' && (
                <div className="fade-in">
                    <div className="card-pwa" style={{ border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ph-fill ph-check-circle"></i> Grade A Certified
                            </h3>
                            <button className="btn-outline-pwa" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'white' }} onClick={() => setStep('form')}>Rescan</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visual Pest Damage</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>0.02%</div>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Color Density</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>94/100</div>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Shelf Life</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>14 Days</div>
                            </div>
                            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.8rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Moisture Level</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--warning)' }}>Optimized</div>
                            </div>
                        </div>

                        <button className="btn-pwa">
                            <i className="ph ph-broadcast"></i> Publish Listing to Buyers
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
