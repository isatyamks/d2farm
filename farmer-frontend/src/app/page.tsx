"use client";
import { useState } from 'react';

// Stubbing out the isolated views before we implement them
import GeoRegistration from '@/components/GeoRegistration';
import CropListing from '@/components/CropListing';
import HarvestStatus from '@/components/HarvestStatus';
import MarketInsights from '@/components/MarketInsights';

export default function FarmerPortal() {
    const [currentView, setCurrentView] = useState('register');
    const [trustScore, setTrustScore] = useState(0);

    const renderView = () => {
        switch (currentView) {
            case 'register': return <GeoRegistration setTrustScore={setTrustScore} />;
            case 'listing': return <CropListing />;
            case 'tracking': return <HarvestStatus />;
            case 'market': return <MarketInsights />;
            default: return <div>404</div>;
        }
    };

    return (
        <main>
            {/* Minimal Mobile PWA Header */}
            <div className="header-pwa">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className="ph-fill ph-plant" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>D2Farm <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>| Farmer</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '16px' }}>
                    <i className="ph-fill ph-seal-check" style={{ color: 'var(--primary)' }}></i>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Score: {trustScore}</span>
                </div>
            </div>

            {/* Content Injection Zone */}
            <div style={{ padding: '1.5rem' }} key={currentView} className="fade-in">
                {renderView()}
            </div>

            {/* Persistent Mobile Bottom Navigation */}
            <div className="bottom-nav">
                <div className={`nav-item ${currentView === 'register' ? 'active' : ''}`} onClick={() => setCurrentView('register')}>
                    <i className="ph ph-map-pin nav-icon"></i>
                    <span>Register</span>
                </div>
                <div className={`nav-item ${currentView === 'listing' ? 'active' : ''}`} onClick={() => setCurrentView('listing')}>
                    <i className="ph ph-scan nav-icon"></i>
                    <span>Scan Crop</span>
                </div>
                <div className={`nav-item ${currentView === 'tracking' ? 'active' : ''}`} onClick={() => setCurrentView('tracking')}>
                    <i className="ph ph-truck nav-icon"></i>
                    <span>Logistics</span>
                </div>
                <div className={`nav-item ${currentView === 'market' ? 'active' : ''}`} onClick={() => setCurrentView('market')}>
                    <i className="ph ph-trend-up nav-icon"></i>
                    <span>When to Sell</span>
                </div>
            </div>
        </main>
    );
}
