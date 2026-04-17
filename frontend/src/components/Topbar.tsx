"use client";

export default function Topbar({ currentView }: { currentView: string }) {
    const viewTitle = currentView.charAt(0).toUpperCase() + currentView.slice(1);
    
    return (
        <header className="topbar">
            <div className="greeting">
                <h1>{viewTitle === 'Market' ? 'Market Insights' : viewTitle === 'Transport' ? 'Transport & Logistics' : viewTitle}</h1>
                <p className="subtitle">Here is what you need to know today.</p>
            </div>
            <div className="topbar-actions">
                <div className="search-bar">
                    <i className="ph ph-magnifying-glass"></i>
                    <input type="text" placeholder="Search crops, orders..." />
                </div>
                <button className="icon-btn notification-btn">
                    <i className="ph ph-bell"></i>
                    <span className="badge">3</span>
                </button>
                <div className="user-profile-sm">
                    {/* Fixed string interpolation for Next.js */}
                    <img src={"https://i.pravatar.cc/150?img=11"} alt="User" className="avatar" />
                </div>
            </div>
        </header>
    );
}
