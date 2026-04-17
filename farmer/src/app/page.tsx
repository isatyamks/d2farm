"use client";
import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import FarmerDashboard from '@/components/views/FarmerDashboard';
import CropListing from '@/components/views/CropListing';
import ProposalCenter from '@/components/views/ProposalCenter';
import TransactionTracker from '@/components/views/TransactionTracker';
import FarmerProfile from '@/components/views/FarmerProfile';
import Onboarding from '@/components/views/Onboarding';
import DeepTechEngine from '@/components/views/DeepTechEngine';
import { syncOfflineData } from '@/lib/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [farmerId, setFarmerId] = useState<string | null>(null);
  const [farmerData, setFarmerData] = useState<Record<string, unknown> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Check for existing session
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem('d2farm_farmer');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setFarmerId(data.id);
        setFarmerData(data);
      } catch { /* no stored session */ }
    }
  }, []);

  // Online/offline detection + sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData().then(({ synced }) => {
        if (synced > 0) console.log(`🔄 Synced ${synced} offline entries`);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOnboardingComplete = (farmer: Record<string, unknown>) => {
    setFarmerId(farmer.id as string);
    setFarmerData(farmer);
    localStorage.setItem('d2farm_farmer', JSON.stringify(farmer));
    setCurrentView('dashboard');
  };

  // Show onboarding if no farmer session
  if (!farmerId) {
    if (!isMounted) return <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner spinner-dark" /></div>;
    return (
      <div className="app-shell">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (!isMounted) return <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner spinner-dark" /></div>;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <FarmerDashboard farmerId={farmerId} farmerData={farmerData} setCurrentView={setCurrentView} />;
      case 'crops':
        return <CropListing farmerId={farmerId} />;
      case 'orders':
        return <ProposalCenter farmerId={farmerId} />;
      case 'tracker':
        return <TransactionTracker farmerId={farmerId} />;
      case 'profile':
        return <FarmerProfile farmerId={farmerId} farmerData={farmerData} setFarmerData={setFarmerData} />;
      case 'deeptech':
        return <DeepTechEngine farmerId={farmerId} />;
      default:
        return <FarmerDashboard farmerId={farmerId} farmerData={farmerData} setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <span className="sync-dot offline" />
          Offline — changes saved locally
        </div>
      )}

      {/* Header */}
      <div className="top-header">
        <div className="top-header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" /><path d="M10 20c5.5-2.5 8-8 6-13" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3" /><path d="M14.1 6a7 7 0 00-1.1 4c-1.9-.5-3-.8-4.3-1.1" />
          </svg>
          D2Farm
        </div>
        <div className="top-header-actions">
          <button className="header-icon-btn" id="notifications-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 003.4 0" />
            </svg>
            <span className="notif-badge">2</span>
          </button>
          <div
            className="header-icon-btn"
            onClick={() => setCurrentView('profile')}
            style={{ background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 600, fontSize: '0.8rem' }}
          >
            {(farmerData?.fullName as string || 'F')[0]}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="app-content" key={currentView}>
        <div className="fade-slide-up">
          {renderView()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}
