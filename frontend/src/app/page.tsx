"use client";
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// Import All Reconstructed Views
import Dashboard from '@/components/views/Dashboard';
import DemandPlanner from '@/components/views/DemandPlanner';
import ProcurementAI from '@/components/views/ProcurementAI';
import OrderPlacement from '@/components/views/OrderPlacement';
import OrderTracking from '@/components/views/OrderTracking';
import TransportLogistics from '@/components/views/TransportLogistics';
import MarketInsights from '@/components/views/MarketInsights';
import Wallet from '@/components/views/Wallet';
import UserProfile from '@/components/views/UserProfile';

export default function App() {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
            case 'planner': return <DemandPlanner setCurrentView={setCurrentView} />;
            case 'predictions': return <ProcurementAI setCurrentView={setCurrentView} />;
            case 'orders': return <OrderPlacement />;
            case 'tracking': return <OrderTracking />;
            case 'transport': return <TransportLogistics />;
            case 'market': return <MarketInsights />;
            case 'wallet': return <Wallet />;
            case 'profile': return <UserProfile />;
            default: return (
                <div className="card-glass text-center p-12">
                    <h1 className="text-2xl font-bold mb-4">WIP: {currentView}</h1>
                    <p className="text-gray-500">We are currently porting this Vanilla JS view natively to React TSX Components!</p>
                </div>
            );
        }
    };

    return (
        <div className="app-container">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main className="main-content">
                <Topbar currentView={currentView} />
                {/* 
                  Using key={currentView} forces React to destroy and recreate the div,
                  which automatically perfectly re-triggers the fade-in animation on every tab switch! 
                */}
                <div key={currentView} className="view-container fade-in">
                    {renderView()}
                </div>
            </main>
        </div>
    );
}
