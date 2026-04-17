"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────
   TYPES & INTERFACES
   ───────────────────────────────────────────────────────────── */
interface Vehicle {
    id: string;
    type: string;
    capacity: number;
    estimatedTime: string;
    estimatedMinutes: number;
    cost: number;
    driverRating: number;
    refrigeration: boolean;
    fuelCost: number;
    tollCharges: number;
    transporter: string;
    spoilageRisk: 'Low' | 'Medium' | 'High';
    recommended?: boolean;
    icon: string;
}

interface Transporter {
    rank: number;
    name: string;
    vehicleType: string;
    pricePerKm: number;
    refrigeration: boolean;
    availability: 'Available' | 'Busy' | 'Offline';
    rating: number;
    distanceFromPickup: number;
}

interface TrackingStep {
    id: number;
    label: string;
    time: string;
    status: 'completed' | 'active' | 'pending';
    icon: string;
}

interface FarmerPickup {
    name: string;
    quantity: number;
    location: string;
    distanceFromPrev: number;
}

/* ─────────────────────────────────────────────────────────────
   DUMMY DATA
   ───────────────────────────────────────────────────────────── */
const ORDER_DATA = {
    crop: 'Tomato',
    variety: 'Hybrid',
    quantity: 500,
    unit: 'kg',
    farmerName: 'Rajesh Kumar',
    pickupLocation: 'Lucknow',
    deliveryLocation: 'Kanpur',
    deliveryDeadline: 'Today, 6:00 PM',
    shelfLifeRemaining: '2 days',
    refrigerationRequired: true,
    orderId: '#ORD-7842',
    orderDate: 'Apr 17, 2026',
};

const VEHICLES: Vehicle[] = [
    {
        id: 'v1', type: 'Refrigerated Mini Truck', capacity: 1000,
        estimatedTime: '1 hr 40 min', estimatedMinutes: 100, cost: 850,
        driverRating: 4.8, refrigeration: true, fuelCost: 300, tollCharges: 120,
        transporter: 'Sharma Logistics', spoilageRisk: 'Low', recommended: true,
        icon: 'ph-truck',
    },
    {
        id: 'v2', type: 'Mini Truck', capacity: 800,
        estimatedTime: '2 hrs', estimatedMinutes: 120, cost: 650,
        driverRating: 4.4, refrigeration: false, fuelCost: 250, tollCharges: 120,
        transporter: 'Green Transport', spoilageRisk: 'Medium',
        icon: 'ph-van',
    },
    {
        id: 'v3', type: 'Pickup Van', capacity: 400,
        estimatedTime: '3 hrs', estimatedMinutes: 180, cost: 500,
        driverRating: 4.1, refrigeration: false, fuelCost: 200, tollCharges: 80,
        transporter: 'QuickHaul', spoilageRisk: 'High',
        icon: 'ph-jeep',
    },
    {
        id: 'v4', type: 'Refrigerated Truck', capacity: 2000,
        estimatedTime: '1 hr 30 min', estimatedMinutes: 90, cost: 950,
        driverRating: 4.7, refrigeration: true, fuelCost: 320, tollCharges: 150,
        transporter: 'Fresh Move', spoilageRisk: 'Low',
        icon: 'ph-truck',
    },
];

const TRANSPORTERS: Transporter[] = [
    { rank: 1, name: 'Sharma Logistics', vehicleType: 'Refrigerated Truck', pricePerKm: 18, refrigeration: true, availability: 'Available', rating: 4.8, distanceFromPickup: 5 },
    { rank: 2, name: 'Green Transport', vehicleType: 'Mini Truck', pricePerKm: 14, refrigeration: false, availability: 'Available', rating: 4.4, distanceFromPickup: 3 },
    { rank: 3, name: 'Fresh Move', vehicleType: 'Refrigerated Van', pricePerKm: 20, refrigeration: true, availability: 'Busy', rating: 4.7, distanceFromPickup: 8 },
    { rank: 4, name: 'AgriHaul Express', vehicleType: 'Full Truck', pricePerKm: 12, refrigeration: false, availability: 'Available', rating: 4.2, distanceFromPickup: 12 },
    { rank: 5, name: 'ColdChain India', vehicleType: 'Refrigerated Truck', pricePerKm: 22, refrigeration: true, availability: 'Offline', rating: 4.9, distanceFromPickup: 15 },
];

const TRACKING_STEPS: TrackingStep[] = [
    { id: 1, label: 'Pickup Scheduled', time: '2:15 PM', status: 'completed', icon: 'ph-calendar-check' },
    { id: 2, label: 'Driver Assigned', time: '2:20 PM', status: 'completed', icon: 'ph-user-check' },
    { id: 3, label: 'Vehicle Reached Farmer', time: '2:45 PM', status: 'completed', icon: 'ph-map-pin' },
    { id: 4, label: 'Crop Loaded', time: '3:10 PM', status: 'active', icon: 'ph-package' },
    { id: 5, label: 'In Transit', time: '—', status: 'pending', icon: 'ph-path' },
    { id: 6, label: 'Reached Buyer', time: '—', status: 'pending', icon: 'ph-flag-checkered' },
    { id: 7, label: 'Delivered', time: '—', status: 'pending', icon: 'ph-check-circle' },
];

const MULTI_FARMERS: FarmerPickup[] = [
    { name: 'Farmer A — Suresh Patel', quantity: 300, location: 'Unnao', distanceFromPrev: 0 },
    { name: 'Farmer B — Meena Devi', quantity: 400, location: 'Kanpur Dehat', distanceFromPrev: 18 },
    { name: 'Farmer C — Vikram Singh', quantity: 300, location: 'Bithoor', distanceFromPrev: 12 },
];

const COST_BREAKDOWN = [
    { label: 'Distance Cost', amount: 450, icon: 'ph-road-horizon' },
    { label: 'Loading Charges', amount: 100, icon: 'ph-barbell' },
    { label: 'Refrigeration Charges', amount: 200, icon: 'ph-snowflake' },
    { label: 'Toll Charges', amount: 50, icon: 'ph-flag-banner' },
    { label: 'Fuel Surcharge', amount: 75, icon: 'ph-gas-pump' },
];

const SPOILAGE_DATA = {
    temperature: 37,
    humidity: 58,
    travelTime: '2 hrs',
    cropType: 'Tomato',
    refrigerationSupport: true,
    shelfLifeRemaining: '2 days',
    spoilageRisk: 'Low' as const,
    factors: [
        { name: 'Temperature', value: 37, unit: '°C', status: 'warning' as const, threshold: '< 30°C ideal' },
        { name: 'Humidity', value: 58, unit: '%', status: 'ok' as const, threshold: '50-70% ideal' },
        { name: 'Travel Duration', value: '2 hrs', unit: '', status: 'ok' as const, threshold: '< 4 hrs safe' },
        { name: 'Refrigeration', value: 'Active', unit: '', status: 'ok' as const, threshold: 'Required for perishables' },
    ],
};

/* ─────────────────────────────────────────────────────────────
   RECOMMENDATION ENGINE (Rule-based + Weighted Scoring)
   ───────────────────────────────────────────────────────────── */
function getRecommendationReason(crop: string, qty: number, refrigRequired: boolean): string {
    const perishables = ['Tomato', 'Flowers', 'Milk', 'Fruits', 'Mango', 'Strawberry', 'Banana'];
    const reasons: string[] = [];

    if (perishables.includes(crop)) {
        reasons.push(`${crop} is perishable → Refrigerated vehicle preferred`);
    }
    if (refrigRequired) {
        reasons.push('Cold-chain required to maintain freshness');
    }
    if (qty <= 100) {
        reasons.push('Quantity ≤ 100kg → Pickup Van recommended');
    } else if (qty <= 1000) {
        reasons.push(`Quantity ${qty}kg → Mini Truck class optimal`);
    } else {
        reasons.push(`Quantity ${qty}kg → Full Truck required`);
    }
    reasons.push('Best cost-to-speed ratio with lowest spoilage risk');
    return reasons.join(' • ');
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────── */
export default function TransportLogistics() {
    const [selectedVehicle, setSelectedVehicle] = useState<string>('v1');
    const [transportConfirmed, setTransportConfirmed] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'analytics'>('overview');
    const [animateMap, setAnimateMap] = useState(false);
    const [driverContactOpen, setDriverContactOpen] = useState(false);

    // Charts
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const lineChartRef = useRef<HTMLCanvasElement>(null);
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const spoilageChartRef = useRef<HTMLCanvasElement>(null);
    const dailyChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstancesRef = useRef<any[]>([]);

    // Map vehicle animation
    useEffect(() => {
        if (transportConfirmed) {
            setAnimateMap(true);
        }
    }, [transportConfirmed]);

    // Chart.js initialization
    const initCharts = useCallback(() => {
        // Clean up previous chart instances
        chartInstancesRef.current.forEach(c => c?.destroy());
        chartInstancesRef.current = [];

        const Chart = (window as any).Chart;
        if (!Chart) return;

        // --- Delivery Status Pie ---
        if (pieChartRef.current) {
            const ctx = pieChartRef.current.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Delivered', 'In Transit', 'Pending', 'Cancelled'],
                        datasets: [{
                            data: [45, 25, 22, 8],
                            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
                            borderWidth: 0,
                            borderRadius: 4,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '68%',
                        plugins: {
                            legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, font: { size: 12 } } },
                        },
                    },
                });
                chartInstancesRef.current.push(chart);
            }
        }

        // --- Transport Cost Trend Line ---
        if (lineChartRef.current) {
            const ctx = lineChartRef.current.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Avg Cost (₹)',
                            data: [720, 680, 850, 790, 920, 750, 875],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.08)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 4,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#10B981',
                            pointBorderWidth: 2,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
                            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                        },
                    },
                });
                chartInstancesRef.current.push(chart);
            }
        }

        // --- Vehicle Usage Bar ---
        if (barChartRef.current) {
            const ctx = barChartRef.current.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Refrig. Truck', 'Mini Truck', 'Pickup Van', 'Full Truck', 'Refrig. Van'],
                        datasets: [{
                            label: 'Trips This Week',
                            data: [18, 32, 12, 8, 14],
                            backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#06B6D4'],
                            borderRadius: 8,
                            borderSkipped: false,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
                            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                        },
                    },
                });
                chartInstancesRef.current.push(chart);
            }
        }

        // --- Spoilage Risk Distribution ---
        if (spoilageChartRef.current) {
            const ctx = spoilageChartRef.current.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
                        datasets: [{
                            data: [62, 28, 10],
                            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                            borderWidth: 0,
                            borderRadius: 4,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '68%',
                        plugins: { legend: { position: 'bottom' as const, labels: { padding: 16, usePointStyle: true, font: { size: 12 } } } },
                    },
                });
                chartInstancesRef.current.push(chart);
            }
        }

        // --- Daily Orders ---
        if (dailyChartRef.current) {
            const ctx = dailyChartRef.current.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
                        datasets: [{
                            label: 'Orders',
                            data: [14, 18, 22, 16, 28, 24, 20],
                            backgroundColor: 'rgba(59, 130, 246, 0.7)',
                            borderRadius: 6,
                            borderSkipped: false,
                        }, {
                            label: 'Deliveries',
                            data: [12, 16, 20, 14, 25, 22, 17],
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderRadius: 6,
                            borderSkipped: false,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' as const, labels: { usePointStyle: true, font: { size: 11 } } } },
                        scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } },
                            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                        },
                    },
                });
                chartInstancesRef.current.push(chart);
            }
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'analytics') {
            // Tiny delay to let DOM render canvas elements
            const t = setTimeout(initCharts, 100);
            return () => clearTimeout(t);
        }
    }, [activeTab, initCharts]);

    // Cleanup charts on unmount
    useEffect(() => {
        return () => {
            chartInstancesRef.current.forEach(c => c?.destroy());
        };
    }, []);

    const selected = VEHICLES.find(v => v.id === selectedVehicle) || VEHICLES[0];
    const totalCost = COST_BREAKDOWN.reduce((sum, item) => sum + item.amount, 0);

    /* ─── Spoilage Risk Badge Renderer ─── */
    const renderRiskBadge = (risk: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            Low: { bg: '#DCFCE7', color: '#16A34A' },
            Medium: { bg: '#FEF3C7', color: '#D97706' },
            High: { bg: '#FEE2E2', color: '#DC2626' },
        };
        const style = map[risk] || map.Medium;
        return (
            <span className="tl-risk-badge" style={{ background: style.bg, color: style.color }}>
                <i className={`ph-fill ${risk === 'Low' ? 'ph-shield-check' : risk === 'High' ? 'ph-warning' : 'ph-warning-circle'}`}></i>
                {risk} Risk
            </span>
        );
    };

    /* ─── Availability Badge ─── */
    const renderAvailBadge = (avail: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            Available: { bg: '#DCFCE7', color: '#16A34A' },
            Busy: { bg: '#FEF3C7', color: '#D97706' },
            Offline: { bg: '#FEE2E2', color: '#DC2626' },
        };
        const style = map[avail] || map.Busy;
        return <span className="tl-risk-badge" style={{ background: style.bg, color: style.color }}>{avail}</span>;
    };

    /* ─── Star Rating ─── */
    const renderStars = (rating: number) => {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5;
        return (
            <span className="tl-stars">
                {[...Array(full)].map((_, i) => <i key={i} className="ph-fill ph-star"></i>)}
                {half && <i className="ph-fill ph-star-half"></i>}
                <span className="tl-rating-num">{rating}</span>
            </span>
        );
    };

    /* ═══════════════════════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════════════════════ */
    return (
        <div className="tl-module">
            {/* ─── Driver Contact Modal ─── */}
            {driverContactOpen && (
                <>
                    <div className="modal-overlay active" onClick={() => setDriverContactOpen(false)}></div>
                    <div className="modal active">
                        <div className="modal-header">
                            <h3>Contact Driver</h3>
                            <button className="close-modal" onClick={() => setDriverContactOpen(false)}><i className="ph ph-x"></i></button>
                        </div>
                        <div className="tl-driver-contact-body">
                            <div className="tl-driver-avatar-big">
                                <i className="ph-fill ph-user-circle"></i>
                            </div>
                            <h4>Ramesh Sharma</h4>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sharma Logistics • Refrigerated Mini Truck</p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-primary"><i className="ph ph-phone"></i> Call Driver</button>
                                <button className="btn btn-outline"><i className="ph ph-chat-circle-text"></i> Message</button>
                            </div>
                            <div className="tl-driver-stats">
                                <div><span className="tl-driver-stat-val">4.8</span><span className="tl-driver-stat-lbl">Rating</span></div>
                                <div><span className="tl-driver-stat-val">342</span><span className="tl-driver-stat-lbl">Trips</span></div>
                                <div><span className="tl-driver-stat-val">98%</span><span className="tl-driver-stat-lbl">On-Time</span></div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ─── Header with Tabs ─── */}
            <div className="tl-header">
                <div className="tl-header-left">
                    <div className="tl-header-icon">
                        <i className="ph-fill ph-truck"></i>
                    </div>
                    <div>
                        <h2 className="tl-title">Transport & Logistics</h2>
                        <p className="tl-subtitle">AI-powered route & vehicle recommendation for Order {ORDER_DATA.orderId}</p>
                    </div>
                </div>
                <div className="tl-tabs">
                    {(['overview', 'tracking', 'analytics'] as const).map(tab => (
                        <button
                            key={tab}
                            className={`tl-tab ${activeTab === tab ? 'tl-tab-active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            <i className={`ph ${tab === 'overview' ? 'ph-layout' : tab === 'tracking' ? 'ph-map-trifold' : 'ph-chart-pie-slice'}`}></i>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                TAB: OVERVIEW
               ══════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
                <div className="tl-fade-in">
                    {/* ─── 1. ORDER SUMMARY + RECOMMENDED VEHICLE ─── */}
                    <div className="tl-grid-2">
                        {/* Order Summary Card */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-blue"><i className="ph-fill ph-package"></i></div>
                                <h3>Order Summary</h3>
                                <span className="tl-order-badge">{ORDER_DATA.orderId}</span>
                            </div>
                            <div className="tl-summary-grid">
                                <div className="tl-summary-item">
                                    <i className="ph ph-plant"></i>
                                    <div><span className="tl-sum-label">Crop</span><span className="tl-sum-value">{ORDER_DATA.crop} ({ORDER_DATA.variety})</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-scales"></i>
                                    <div><span className="tl-sum-label">Quantity</span><span className="tl-sum-value">{ORDER_DATA.quantity} {ORDER_DATA.unit}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-user"></i>
                                    <div><span className="tl-sum-label">Farmer</span><span className="tl-sum-value">{ORDER_DATA.farmerName}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-map-pin-line"></i>
                                    <div><span className="tl-sum-label">Pickup</span><span className="tl-sum-value">{ORDER_DATA.pickupLocation}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-navigation-arrow"></i>
                                    <div><span className="tl-sum-label">Delivery</span><span className="tl-sum-value">{ORDER_DATA.deliveryLocation}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-clock-countdown"></i>
                                    <div><span className="tl-sum-label">Deadline</span><span className="tl-sum-value tl-text-danger">{ORDER_DATA.deliveryDeadline}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-timer"></i>
                                    <div><span className="tl-sum-label">Shelf Life</span><span className="tl-sum-value">{ORDER_DATA.shelfLifeRemaining}</span></div>
                                </div>
                                <div className="tl-summary-item">
                                    <i className="ph ph-snowflake"></i>
                                    <div>
                                        <span className="tl-sum-label">Refrigeration</span>
                                        <span className="tl-sum-value">
                                            {ORDER_DATA.refrigerationRequired
                                                ? <span className="tl-refrig-yes"><i className="ph-fill ph-check-circle"></i> Required</span>
                                                : <span>Not Required</span>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Recommended Vehicle Card */}
                        <div className="card-glass tl-card tl-recommended-card">
                            <div className="tl-recommended-badge">
                                <i className="ph-fill ph-star"></i> Best Recommended
                            </div>
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-green"><i className="ph-fill ph-truck"></i></div>
                                <h3>Recommended Vehicle</h3>
                            </div>
                            <div className="tl-rec-vehicle-hero">
                                <div className="tl-rec-vehicle-icon">
                                    <i className="ph-fill ph-truck"></i>
                                </div>
                                <div>
                                    <h4>{VEHICLES[0].type}</h4>
                                    <p className="tl-rec-transporter">{VEHICLES[0].transporter}</p>
                                </div>
                            </div>

                            <div className="tl-rec-stats">
                                <div className="tl-rec-stat">
                                    <span className="tl-rec-stat-val">₹{VEHICLES[0].cost}</span>
                                    <span className="tl-rec-stat-lbl">Est. Cost</span>
                                </div>
                                <div className="tl-rec-stat">
                                    <span className="tl-rec-stat-val">{VEHICLES[0].estimatedTime}</span>
                                    <span className="tl-rec-stat-lbl">ETA</span>
                                </div>
                                <div className="tl-rec-stat">
                                    <span className="tl-rec-stat-val">{VEHICLES[0].capacity} kg</span>
                                    <span className="tl-rec-stat-lbl">Capacity</span>
                                </div>
                                <div className="tl-rec-stat">
                                    <span className="tl-rec-stat-val">{VEHICLES[0].driverRating}/5</span>
                                    <span className="tl-rec-stat-lbl">Rating</span>
                                </div>
                            </div>

                            <div className="tl-rec-details">
                                <div className="tl-rec-detail-row">
                                    <span><i className="ph ph-snowflake"></i> Refrigeration</span>
                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}><i className="ph-fill ph-check-circle"></i> Yes</span>
                                </div>
                                <div className="tl-rec-detail-row">
                                    <span><i className="ph ph-gas-pump"></i> Fuel Cost</span>
                                    <span>₹{VEHICLES[0].fuelCost}</span>
                                </div>
                                <div className="tl-rec-detail-row">
                                    <span><i className="ph ph-flag-banner"></i> Toll Charges</span>
                                    <span>₹{VEHICLES[0].tollCharges}</span>
                                </div>
                                <div className="tl-rec-detail-row">
                                    <span><i className="ph ph-shield-check"></i> Spoilage Risk</span>
                                    {renderRiskBadge(VEHICLES[0].spoilageRisk)}
                                </div>
                            </div>

                            {/* AI Reasoning */}
                            <div className="tl-ai-reason">
                                <i className="ph-fill ph-brain"></i>
                                <span>{getRecommendationReason(ORDER_DATA.crop, ORDER_DATA.quantity, ORDER_DATA.refrigerationRequired)}</span>
                            </div>
                        </div>
                    </div>

                    {/* ─── 3. ALTERNATIVE VEHICLES ─── */}
                    <div className="card-glass tl-card" style={{ marginTop: '1.5rem' }}>
                        <div className="tl-card-head">
                            <div className="tl-card-icon tl-icon-purple"><i className="ph-fill ph-list-dashes"></i></div>
                            <h3>Alternative Vehicle Options</h3>
                            <button className="btn btn-outline" style={{ marginLeft: 'auto', fontSize: '0.8rem' }} onClick={() => setShowComparison(!showComparison)}>
                                <i className={`ph ${showComparison ? 'ph-eye-slash' : 'ph-arrows-horizontal'}`}></i>
                                {showComparison ? 'Hide Comparison' : 'Compare All'}
                            </button>
                        </div>
                        <div className="tl-vehicles-grid">
                            {VEHICLES.map(v => (
                                <div
                                    key={v.id}
                                    className={`tl-vehicle-card ${selectedVehicle === v.id ? 'tl-vehicle-selected' : ''} ${v.recommended ? 'tl-vehicle-recommended' : ''}`}
                                    onClick={() => setSelectedVehicle(v.id)}
                                >
                                    {v.recommended && <div className="tl-vehicle-rec-tag"><i className="ph-fill ph-medal"></i> Best</div>}
                                    <div className="tl-vehicle-icon-wrap">
                                        <i className={`ph-fill ${v.icon}`}></i>
                                    </div>
                                    <h4>{v.type}</h4>
                                    <p className="tl-vehicle-transporter">{v.transporter}</p>
                                    <div className="tl-vehicle-price">₹{v.cost}</div>
                                    <div className="tl-vehicle-meta">
                                        <span><i className="ph ph-clock"></i> {v.estimatedTime}</span>
                                        <span><i className="ph ph-star"></i> {v.driverRating}</span>
                                    </div>
                                    <div className="tl-vehicle-footer">
                                        <span>{v.refrigeration ? <><i className="ph-fill ph-snowflake" style={{ color: '#3B82F6' }}></i> Cooled</> : <><i className="ph ph-sun" style={{ color: '#F59E0B' }}></i> Open</>}</span>
                                        {renderRiskBadge(v.spoilageRisk)}
                                    </div>
                                    {showComparison && (
                                        <div className="tl-vehicle-compare">
                                            <div><span>Capacity:</span><strong>{v.capacity} kg</strong></div>
                                            <div><span>Fuel:</span><strong>₹{v.fuelCost}</strong></div>
                                            <div><span>Toll:</span><strong>₹{v.tollCharges}</strong></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── 4. ROUTE + 5. MAP + 6. COST BREAKDOWN ─── */}
                    <div className="tl-grid-3" style={{ marginTop: '1.5rem' }}>
                        {/* Route Recommendation */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-blue"><i className="ph-fill ph-path"></i></div>
                                <h3>Route Details</h3>
                            </div>
                            <div className="tl-route-visual">
                                <div className="tl-route-point tl-route-start">
                                    <div className="tl-route-dot tl-dot-green"></div>
                                    <div>
                                        <strong>Lucknow</strong>
                                        <span>Farmer Pickup</span>
                                    </div>
                                </div>
                                <div className="tl-route-line">
                                    <div className="tl-route-highway"><i className="ph ph-road-horizon"></i> NH27</div>
                                </div>
                                <div className="tl-route-point tl-route-end">
                                    <div className="tl-route-dot tl-dot-red"></div>
                                    <div>
                                        <strong>Kanpur</strong>
                                        <span>Buyer Delivery</span>
                                    </div>
                                </div>
                            </div>
                            <div className="tl-route-stats">
                                <div className="tl-route-stat">
                                    <i className="ph ph-ruler"></i>
                                    <div><span className="tl-rs-label">Distance</span><span className="tl-rs-value">72 km</span></div>
                                </div>
                                <div className="tl-route-stat">
                                    <i className="ph ph-clock"></i>
                                    <div><span className="tl-rs-label">ETA</span><span className="tl-rs-value">1 hr 40 min</span></div>
                                </div>
                                <div className="tl-route-stat">
                                    <i className="ph ph-traffic-signal"></i>
                                    <div><span className="tl-rs-label">Traffic</span><span className="tl-rs-value tl-text-warning">Moderate</span></div>
                                </div>
                                <div className="tl-route-stat">
                                    <i className="ph ph-flag-banner"></i>
                                    <div><span className="tl-rs-label">Toll</span><span className="tl-rs-value">₹120</span></div>
                                </div>
                                <div className="tl-route-stat">
                                    <i className="ph ph-gas-pump"></i>
                                    <div><span className="tl-rs-label">Fuel Est.</span><span className="tl-rs-value">₹300</span></div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Map Visualization */}
                        <div className="card-glass tl-card tl-map-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-green"><i className="ph-fill ph-map-trifold"></i></div>
                                <h3>Route Map</h3>
                                <span className="tl-live-dot"></span>
                            </div>
                            <div className="tl-map-container">
                                <svg viewBox="0 0 400 280" className="tl-map-svg">
                                    {/* Background grid */}
                                    <defs>
                                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                                        </pattern>
                                        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10B981" />
                                            <stop offset="100%" stopColor="#3B82F6" />
                                        </linearGradient>
                                        <filter id="glow">
                                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                        </filter>
                                    </defs>
                                    <rect width="400" height="280" fill="url(#grid)" />

                                    {/* Decorative roads */}
                                    <path d="M 0 140 Q 100 130, 200 140 Q 300 150, 400 140" stroke="rgba(0,0,0,0.06)" strokeWidth="12" fill="none" />
                                    <path d="M 200 0 Q 190 70, 200 140 Q 210 210, 200 280" stroke="rgba(0,0,0,0.04)" strokeWidth="8" fill="none" />

                                    {/* Main route path */}
                                    <path
                                        d="M 60 200 C 100 180, 130 100, 180 120 C 230 140, 260 60, 340 80"
                                        stroke="url(#routeGrad)"
                                        strokeWidth="4"
                                        fill="none"
                                        strokeDasharray="8 4"
                                        filter="url(#glow)"
                                        className="tl-route-path"
                                    />
                                    {/* Highlighted best route */}
                                    <path
                                        d="M 60 200 C 100 180, 130 100, 180 120 C 230 140, 260 60, 340 80"
                                        stroke="url(#routeGrad)"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeLinecap="round"
                                        opacity="0.6"
                                    />

                                    {/* Pickup pin - Lucknow */}
                                    <g transform="translate(60, 188)">
                                        <circle r="16" fill="rgba(16, 185, 129, 0.15)" />
                                        <circle r="8" fill="#10B981" stroke="white" strokeWidth="2.5" />
                                        <text y="28" textAnchor="middle" fill="#0F172A" fontSize="10" fontWeight="600">Lucknow</text>
                                        <text y="39" textAnchor="middle" fill="#64748B" fontSize="8">Pickup</text>
                                    </g>

                                    {/* Delivery pin - Kanpur */}
                                    <g transform="translate(340, 68)">
                                        <circle r="16" fill="rgba(239, 68, 68, 0.15)" />
                                        <circle r="8" fill="#EF4444" stroke="white" strokeWidth="2.5" />
                                        <text y="28" textAnchor="middle" fill="#0F172A" fontSize="10" fontWeight="600">Kanpur</text>
                                        <text y="39" textAnchor="middle" fill="#64748B" fontSize="8">Delivery</text>
                                    </g>

                                    {/* NH27 label */}
                                    <g transform="translate(200, 105)">
                                        <rect x="-22" y="-9" width="44" height="18" rx="4" fill="white" stroke="#10B981" strokeWidth="1" />
                                        <text textAnchor="middle" y="4" fill="#059669" fontSize="9" fontWeight="700">NH27</text>
                                    </g>

                                    {/* Moving vehicle */}
                                    {animateMap && (
                                        <g className="tl-vehicle-animate">
                                            <circle r="10" fill="white" stroke="#3B82F6" strokeWidth="2" filter="url(#glow)" />
                                            <text textAnchor="middle" y="4" fontSize="10">🚛</text>
                                        </g>
                                    )}

                                    {/* Distance label */}
                                    <g transform="translate(200, 250)">
                                        <rect x="-40" y="-10" width="80" height="20" rx="10" fill="rgba(15, 23, 42, 0.75)" />
                                        <text textAnchor="middle" y="4" fill="white" fontSize="10" fontWeight="600">72 km • 1h 40m</text>
                                    </g>
                                </svg>
                            </div>
                        </div>

                        {/* 6. Cost Breakdown */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-orange"><i className="ph-fill ph-receipt"></i></div>
                                <h3>Cost Breakdown</h3>
                            </div>
                            <div className="tl-cost-list">
                                {COST_BREAKDOWN.map((item, i) => (
                                    <div key={i} className="tl-cost-row">
                                        <span className="tl-cost-label"><i className={`ph ${item.icon}`}></i> {item.label}</span>
                                        <span className="tl-cost-amount">₹{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="tl-cost-total">
                                <span>Total Final Cost</span>
                                <span className="tl-cost-total-val">₹{totalCost}</span>
                            </div>
                            <div className="tl-savings-badge">
                                <i className="ph-fill ph-piggy-bank"></i>
                                Save ₹125 with multi-farmer pickup optimization
                            </div>
                        </div>
                    </div>

                    {/* ─── 7. SPOILAGE RISK + 8. TRANSPORTERS TABLE ─── */}
                    <div className="tl-grid-2" style={{ marginTop: '1.5rem' }}>
                        {/* 7. Spoilage Risk Analysis */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-red"><i className="ph-fill ph-thermometer-hot"></i></div>
                                <h3>Spoilage Risk Analysis</h3>
                                {renderRiskBadge(SPOILAGE_DATA.spoilageRisk)}
                            </div>

                            <div className="tl-spoilage-grid">
                                {SPOILAGE_DATA.factors.map((f, i) => (
                                    <div key={i} className="tl-spoilage-factor">
                                        <div className="tl-spoilage-header">
                                            <span className="tl-spoilage-name">{f.name}</span>
                                            <span className={`tl-spoilage-status tl-status-${f.status}`}>
                                                <i className={`ph-fill ${f.status === 'ok' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i>
                                                {f.status === 'ok' ? 'Normal' : 'Warning'}
                                            </span>
                                        </div>
                                        <div className="tl-spoilage-value">{f.value}{f.unit}</div>
                                        <div className="tl-spoilage-threshold">{f.threshold}</div>
                                        {typeof f.value === 'number' && (
                                            <div className="tl-spoilage-bar">
                                                <div
                                                    className="tl-spoilage-bar-fill"
                                                    style={{
                                                        width: `${Math.min((f.value / (f.name === 'Temperature' ? 50 : 100)) * 100, 100)}%`,
                                                        background: f.status === 'ok' ? 'var(--success)' : 'var(--warning)',
                                                    }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="tl-spoilage-summary">
                                <i className="ph-fill ph-info"></i>
                                <span>With refrigeration active, {ORDER_DATA.crop} can safely travel up to <strong>4 hours</strong> at current conditions. Your ETA of <strong>1h 40m</strong> is well within safe limits.</span>
                            </div>
                        </div>

                        {/* 8. Best Transporters Table */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-purple"><i className="ph-fill ph-ranking"></i></div>
                                <h3>Best Transporters</h3>
                            </div>
                            <div className="tl-table-wrap">
                                <table className="tl-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Transporter</th>
                                            <th>Vehicle</th>
                                            <th>₹/km</th>
                                            <th>Refrig.</th>
                                            <th>Status</th>
                                            <th>Rating</th>
                                            <th>Dist.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TRANSPORTERS.map(t => (
                                            <tr key={t.rank} className={t.rank === 1 ? 'tl-table-highlight' : ''}>
                                                <td><span className="tl-rank">{t.rank}</span></td>
                                                <td><strong>{t.name}</strong></td>
                                                <td>{t.vehicleType}</td>
                                                <td>₹{t.pricePerKm}</td>
                                                <td>
                                                    {t.refrigeration
                                                        ? <i className="ph-fill ph-snowflake" style={{ color: '#3B82F6' }}></i>
                                                        : <i className="ph ph-x" style={{ color: '#94A3B8' }}></i>
                                                    }
                                                </td>
                                                <td>{renderAvailBadge(t.availability)}</td>
                                                <td>{renderStars(t.rating)}</td>
                                                <td>{t.distanceFromPickup} km</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ─── 9. MULTI-FARMER PICKUP ─── */}
                    <div className="card-glass tl-card" style={{ marginTop: '1.5rem' }}>
                        <div className="tl-card-head">
                            <div className="tl-card-icon tl-icon-teal"><i className="ph-fill ph-git-merge"></i></div>
                            <h3>Multi-Farmer Pickup Optimization</h3>
                            <span className="tl-savings-pill"><i className="ph-fill ph-lightning"></i> AI Optimized</span>
                        </div>

                        <div className="tl-multi-grid">
                            <div className="tl-multi-left">
                                <div className="tl-multi-requirement">
                                    <span>Buyer Requirement</span>
                                    <strong>1000 kg Tomato</strong>
                                </div>

                                <h4 style={{ margin: '1rem 0 0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Matched Farmers</h4>
                                {MULTI_FARMERS.map((f, i) => (
                                    <div key={i} className="tl-farmer-card">
                                        <div className="tl-farmer-avatar">
                                            <i className="ph-fill ph-user-circle"></i>
                                        </div>
                                        <div className="tl-farmer-info">
                                            <strong>{f.name}</strong>
                                            <span>{f.location} • {f.quantity} kg</span>
                                        </div>
                                        <span className="tl-farmer-qty">{f.quantity} kg</span>
                                    </div>
                                ))}
                            </div>

                            <div className="tl-multi-right">
                                <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}><i className="ph ph-path"></i> Optimized Route</h4>
                                <div className="tl-multi-route">
                                    <div className="tl-multi-stop">
                                        <div className="tl-multi-dot" style={{ background: '#10B981' }}></div>
                                        <div>
                                            <strong>Farmer A — Unnao</strong>
                                            <span>300 kg pickup</span>
                                        </div>
                                    </div>
                                    <div className="tl-multi-connector"><span>18 km</span></div>
                                    <div className="tl-multi-stop">
                                        <div className="tl-multi-dot" style={{ background: '#3B82F6' }}></div>
                                        <div>
                                            <strong>Farmer B — Kanpur Dehat</strong>
                                            <span>400 kg pickup</span>
                                        </div>
                                    </div>
                                    <div className="tl-multi-connector"><span>12 km</span></div>
                                    <div className="tl-multi-stop">
                                        <div className="tl-multi-dot" style={{ background: '#8B5CF6' }}></div>
                                        <div>
                                            <strong>Farmer C — Bithoor</strong>
                                            <span>300 kg pickup</span>
                                        </div>
                                    </div>
                                    <div className="tl-multi-connector"><span>8 km</span></div>
                                    <div className="tl-multi-stop">
                                        <div className="tl-multi-dot" style={{ background: '#EF4444' }}></div>
                                        <div>
                                            <strong>Buyer — Kanpur</strong>
                                            <span>Final delivery</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="tl-multi-savings">
                                    <div className="tl-multi-saving-item">
                                        <i className="ph-fill ph-currency-inr" style={{ color: 'var(--success)' }}></i>
                                        <div><span>Transport Saved</span><strong>₹350</strong></div>
                                    </div>
                                    <div className="tl-multi-saving-item">
                                        <i className="ph-fill ph-clock" style={{ color: 'var(--info)' }}></i>
                                        <div><span>Time Saved</span><strong>40 min</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── 12. ACTION BUTTONS ─── */}
                    <div className="tl-actions" style={{ marginTop: '1.5rem' }}>
                        <button
                            className={`btn tl-btn-confirm ${transportConfirmed ? 'tl-btn-confirmed' : ''}`}
                            onClick={() => setTransportConfirmed(true)}
                            disabled={transportConfirmed}
                        >
                            {transportConfirmed
                                ? <><i className="ph-fill ph-check-circle"></i> Transport Confirmed!</>
                                : <><i className="ph-fill ph-truck"></i> Confirm Transport</>
                            }
                        </button>
                        <button className="btn btn-outline tl-action-btn" onClick={() => setShowComparison(!showComparison)}>
                            <i className="ph ph-arrows-horizontal"></i> Compare Routes
                        </button>
                        <button className="btn btn-outline tl-action-btn" onClick={() => setSelectedVehicle(VEHICLES[1].id)}>
                            <i className="ph ph-swap"></i> Change Vehicle
                        </button>
                        <button className="btn btn-outline tl-action-btn" onClick={() => setDriverContactOpen(true)}>
                            <i className="ph ph-phone"></i> Contact Driver
                        </button>
                        <button className="btn tl-btn-cancel">
                            <i className="ph ph-x-circle"></i> Cancel Transport
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: TRACKING
               ══════════════════════════════════════════════ */}
            {activeTab === 'tracking' && (
                <div className="tl-fade-in">
                    <div className="tl-grid-2">
                        {/* 10. Tracking Timeline */}
                        <div className="card-glass tl-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-blue"><i className="ph-fill ph-path"></i></div>
                                <h3>Delivery Progress</h3>
                                <span className="tl-live-indicator"><span className="tl-live-dot-sm"></span> Live Tracking</span>
                            </div>

                            <div className="tl-timeline">
                                {TRACKING_STEPS.map((step, i) => (
                                    <div key={step.id} className={`tl-timeline-step tl-step-${step.status}`}>
                                        <div className="tl-timeline-marker">
                                            <div className={`tl-timeline-dot tl-dot-${step.status}`}>
                                                <i className={`ph-fill ${step.icon}`}></i>
                                            </div>
                                            {i < TRACKING_STEPS.length - 1 && <div className={`tl-timeline-line tl-line-${step.status}`}></div>}
                                        </div>
                                        <div className="tl-timeline-content">
                                            <strong>{step.label}</strong>
                                            <span className="tl-timeline-time">{step.time}</span>
                                            {step.status === 'active' && (
                                                <span className="tl-timeline-active-badge"><i className="ph ph-spinner ph-spin"></i> In Progress</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Live Map + Driver Info */}
                        <div>
                            <div className="card-glass tl-card" style={{ marginBottom: '1.5rem' }}>
                                <div className="tl-card-head">
                                    <div className="tl-card-icon tl-icon-green"><i className="ph-fill ph-map-pin"></i></div>
                                    <h3>Live Location</h3>
                                </div>
                                <div className="tl-map-container tl-map-sm">
                                    <svg viewBox="0 0 400 200" className="tl-map-svg">
                                        <defs>
                                            <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
                                            </pattern>
                                        </defs>
                                        <rect width="400" height="200" fill="url(#grid2)" />
                                        <path d="M 50 150 C 100 120, 150 60, 200 80 C 250 100, 300 30, 350 50" stroke="#10B981" strokeWidth="3" fill="none" strokeDasharray="6 3" />
                                        {/* Completed portion */}
                                        <path d="M 50 150 C 100 120, 150 60, 175 72" stroke="#10B981" strokeWidth="4" fill="none" />
                                        <g transform="translate(50, 150)">
                                            <circle r="6" fill="#10B981" stroke="white" strokeWidth="2" />
                                        </g>
                                        <g transform="translate(175, 72)">
                                            <circle r="12" fill="rgba(59, 130, 246, 0.2)" className="tl-pulse-ring" />
                                            <circle r="6" fill="#3B82F6" stroke="white" strokeWidth="2" />
                                            <text y="-14" textAnchor="middle" fontSize="14">🚛</text>
                                        </g>
                                        <g transform="translate(350, 50)">
                                            <circle r="6" fill="#EF4444" stroke="white" strokeWidth="2" />
                                        </g>
                                    </svg>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span><i className="ph-fill ph-circle" style={{ color: '#10B981', fontSize: '0.6rem' }}></i> Lucknow (Pickup)</span>
                                    <span><i className="ph-fill ph-circle" style={{ color: '#3B82F6', fontSize: '0.6rem' }}></i> Vehicle</span>
                                    <span><i className="ph-fill ph-circle" style={{ color: '#EF4444', fontSize: '0.6rem' }}></i> Kanpur (Drop)</span>
                                </div>
                            </div>

                            {/* Driver Card */}
                            <div className="card-glass tl-card tl-driver-card">
                                <div className="tl-card-head">
                                    <div className="tl-card-icon tl-icon-orange"><i className="ph-fill ph-steering-wheel"></i></div>
                                    <h3>Driver Details</h3>
                                </div>
                                <div className="tl-driver-info">
                                    <div className="tl-driver-avatar-sm">
                                        <i className="ph-fill ph-user-circle"></i>
                                    </div>
                                    <div>
                                        <strong>Ramesh Sharma</strong>
                                        <p>UP 32 AB 1234 • Refrig. Mini Truck</p>
                                        <div className="tl-driver-rating">
                                            {renderStars(4.8)}
                                            <span className="tl-driver-trips">342 trips</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="tl-driver-actions">
                                    <button className="btn btn-primary" onClick={() => setDriverContactOpen(true)}>
                                        <i className="ph ph-phone"></i> Call
                                    </button>
                                    <button className="btn btn-outline">
                                        <i className="ph ph-chat-circle-text"></i> Chat
                                    </button>
                                    <button className="btn btn-outline">
                                        <i className="ph ph-share-network"></i> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════
                TAB: ANALYTICS
               ══════════════════════════════════════════════ */}
            {activeTab === 'analytics' && (
                <div className="tl-fade-in">
                    {/* 11. Charts Section */}
                    <div className="tl-grid-2">
                        <div className="card-glass tl-card tl-chart-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-blue"><i className="ph-fill ph-chart-pie-slice"></i></div>
                                <h3>Delivery Status</h3>
                            </div>
                            <div className="tl-chart-wrap"><canvas ref={pieChartRef}></canvas></div>
                        </div>
                        <div className="card-glass tl-card tl-chart-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-green"><i className="ph-fill ph-chart-line-up"></i></div>
                                <h3>Transport Cost Trend</h3>
                            </div>
                            <div className="tl-chart-wrap"><canvas ref={lineChartRef}></canvas></div>
                        </div>
                    </div>
                    <div className="tl-grid-3" style={{ marginTop: '1.5rem' }}>
                        <div className="card-glass tl-card tl-chart-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-purple"><i className="ph-fill ph-chart-bar"></i></div>
                                <h3>Vehicle Usage</h3>
                            </div>
                            <div className="tl-chart-wrap"><canvas ref={barChartRef}></canvas></div>
                        </div>
                        <div className="card-glass tl-card tl-chart-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-red"><i className="ph-fill ph-warning-circle"></i></div>
                                <h3>Spoilage Risk Dist.</h3>
                            </div>
                            <div className="tl-chart-wrap"><canvas ref={spoilageChartRef}></canvas></div>
                        </div>
                        <div className="card-glass tl-card tl-chart-card">
                            <div className="tl-card-head">
                                <div className="tl-card-icon tl-icon-orange"><i className="ph-fill ph-calendar-dots"></i></div>
                                <h3>Daily Orders</h3>
                            </div>
                            <div className="tl-chart-wrap"><canvas ref={dailyChartRef}></canvas></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
