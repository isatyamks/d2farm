"use client";

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

export default function Sidebar({ currentView, setCurrentView }: SidebarProps) {
    const menu = [
        { id: 'dashboard', icon: 'ph-squares-four', label: 'Dashboard' },
        { id: 'planner', icon: 'ph-chart-line-up', label: 'Demand Planner' },
        { id: 'predictions', icon: 'ph-brain', label: 'Procurement AI' },
        { id: 'orders', icon: 'ph-shopping-cart', label: 'Order Placement' },
        { id: 'contracts', icon: 'ph-link', label: 'Smart Contracts' },
        { id: 'tracking', icon: 'ph-truck', label: 'Order Tracking' },
        { id: 'market', icon: 'ph-trend-up', label: 'Market Insights' },
        { id: 'wallet', icon: 'ph-wallet', label: 'Payments & Wallet' },
    ];

    return (
        <nav className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <i className="ph-fill ph-plant"></i>
                    <span>D2Farm</span>
                </div>
            </div>
            
            <ul className="nav-links">
                {menu.map(item => (
                    <li 
                        key={item.id}
                        className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                        onClick={() => setCurrentView(item.id)}
                    >
                        <i className={`ph ${item.icon}`}></i>
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>

            <div className="sidebar-bottom">
                <div className="trust-score card-glass">
                    <div className="score-header">
                        <span>Trust Score</span>
                        <i className="ph-fill ph-seal-check text-green"></i>
                    </div>
                    <div className="score-value">98/100</div>
                    <div className="score-subtitle">Excellent Buyer</div>
                </div>
                {/* Profile Link */}
                <div 
                    className="nav-item" 
                    style={{ marginTop: '1rem' }} 
                    onClick={() => setCurrentView('profile')}
                >
                    <i className="ph ph-user-circle"></i>
                    <span>My Profile</span>
                </div>
            </div>
        </nav>
    );
}
