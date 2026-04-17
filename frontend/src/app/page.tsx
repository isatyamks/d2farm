"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// Views
import Dashboard from '@/components/views/Dashboard';
import DemandPlanner from '@/components/views/DemandPlanner';
import FarmerProposals from '@/components/views/FarmerProposals';
import OrderPlacement from '@/components/views/OrderPlacement';
import OrderTracking from '@/components/views/OrderTracking';
import MarketInsights from '@/components/views/MarketInsights';
import Wallet from '@/components/views/Wallet';
import UserProfile from '@/components/views/UserProfile';
import SmartContracts from '@/components/views/SmartContracts';

// Valid view IDs
const VALID_VIEWS = ['dashboard', 'planner', 'proposals', 'orders', 'contracts', 'tracking', 'market', 'wallet', 'profile'] as const;
type ViewId = typeof VALID_VIEWS[number];

function isValidView(v: string): v is ViewId {
    return VALID_VIEWS.includes(v as ViewId);
}

function AppInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawView = searchParams.get('view') ?? 'dashboard';
    const currentView: ViewId = isValidView(rawView) ? rawView : 'dashboard';

    const setCurrentView = useCallback((view: string) => {
        router.push(`/?view=${view}`, { scroll: false });
    }, [router]);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':  return <Dashboard setCurrentView={setCurrentView} />;
            case 'planner':    return <DemandPlanner setCurrentView={setCurrentView} />;
            case 'proposals':  return <FarmerProposals />;
            case 'orders':     return <OrderPlacement />;
            case 'contracts':  return <SmartContracts />;
            case 'tracking':   return <OrderTracking />;
            case 'market':     return <MarketInsights />;
            case 'wallet':     return <Wallet />;
            case 'profile':    return <UserProfile />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main className="main-content">
                <Topbar currentView={currentView} />
                {/* key={currentView} destroys + recreates the div, re-triggering fade-in on every navigation */}
                <div key={currentView} className="view-container fade-in">
                    {renderView()}
                </div>
            </main>
        </div>
    );
}

// useSearchParams() requires a Suspense boundary in Next.js App Router
export default function App() {
    return (
        <Suspense fallback={null}>
            <AppInner />
        </Suspense>
    );
}
