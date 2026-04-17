"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Types ─── */
interface Metrics {
    totalConsumption: { value: number; unit: string; period: string; change: number };
    predictedNeed: { value: number; unit: string; period: string; seasonality: string };
    efficiency: { value: number; message: string };
    currentPrice: { value: number; unit: string };
}

interface WeeklyForecast {
    week: number;
    label: string;
    predictedNeedKg: number;
    expectedPricePerKg: number;
    confidence: number;
    supplyOutlook: string;
}

interface Recommendation {
    id: string;
    type: 'info' | 'warning' | 'success';
    title: string;
    icon: string;
    message: string;
    action: string | null;
    actionType: string | null;
    priority: string;
    savingsEstimate: number;
}

interface Supplier {
    name: string;
    location: string;
    rating: number;
    totalDeliveries: number;
    avgPrice: number;
    reliability: number;
}

interface DashboardData {
    success: boolean;
    timestamp: string;
    cropFilter: string;
    metrics: Metrics;
    weeklyForecast: WeeklyForecast[];
    recommendations: Recommendation[];
    suppliers: Supplier[];
    availableCrops: string[];
}

const API_BASE = 'http://localhost:4000';

export default function ProcurementAI({ setCurrentView }: any) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCrop, setSelectedCrop] = useState('Tomato');
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    /* ─── Fetch Data from API ─── */
    const fetchDashboard = useCallback(async (crop: string, isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        try {
            const res = await fetch(`${API_BASE}/api/procurement-ai/dashboard?crop=${encodeURIComponent(crop)}`);
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const json: DashboardData = await res.json();
            if (!json.success) throw new Error('API returned failure');
            setData(json);
            setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } catch (err: any) {
            console.error('Procurement AI fetch error:', err);
            setError(err.message || 'Failed to connect to API');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    /* ─── Initial fetch + auto-refresh every 10s ─── */
    useEffect(() => {
        fetchDashboard(selectedCrop);
        const interval = setInterval(() => fetchDashboard(selectedCrop, true), 10000);
        return () => clearInterval(interval);
    }, [selectedCrop, fetchDashboard]);

    /* ─── Chart.js rendering (reactive to data) ─── */
    useEffect(() => {
        if (!data || !chartRef.current) return;
        const Chart = (window as any).Chart;
        if (!Chart) return;

        // Destroy previous instance
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'line',
            data: {
                labels: data.weeklyForecast.map(w => w.label),
                datasets: [
                    {
                        label: 'Predicted Need (kg)',
                        data: data.weeklyForecast.map(w => w.predictedNeedKg),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        yAxisID: 'y',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 5,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#10B981',
                        pointBorderWidth: 2.5,
                    },
                    {
                        label: 'Expected Price (₹/kg)',
                        data: data.weeklyForecast.map(w => w.expectedPricePerKg),
                        borderColor: '#3B82F6',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        yAxisID: 'y1',
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 5,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#3B82F6',
                        pointBorderWidth: 2.5,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index' as const, intersect: false },
                plugins: {
                    legend: { position: 'top' as const, labels: { usePointStyle: true, font: { size: 12 } } },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { size: 13, weight: 'bold' as const },
                        bodyFont: { size: 12 },
                        callbacks: {
                            afterBody: (ctx: any) => {
                                const idx = ctx[0]?.dataIndex;
                                if (idx !== undefined && data.weeklyForecast[idx]) {
                                    const w = data.weeklyForecast[idx];
                                    return `Confidence: ${w.confidence}%  |  Supply: ${w.supplyOutlook}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear' as const, display: true, position: 'left' as const,
                        title: { display: true, text: 'Need (kg)', font: { size: 11 } },
                        grid: { color: 'rgba(0,0,0,0.04)' },
                    },
                    y1: {
                        type: 'linear' as const, display: true, position: 'right' as const,
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Price (₹/kg)', font: { size: 11 } },
                    }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [data]);

    /* ─── Recommendation icon mapping ─── */
    const getRecIcon = (icon: string) => {
        const map: Record<string, string> = {
            lightbulb: 'ph-fill ph-lightbulb',
            warning: 'ph-fill ph-warning-circle',
            thermometer: 'ph-fill ph-thermometer-hot',
            'check-circle': 'ph-fill ph-check-circle',
        };
        return map[icon] || 'ph-fill ph-info';
    };

    const getRecAlertClass = (type: string) => {
        const map: Record<string, string> = { info: 'alert-info', warning: 'alert-warning', success: 'alert-success' };
        return map[type] || 'alert-info';
    };

    const getRecActionColor = (type: string) => {
        const map: Record<string, string> = { info: '#1D4ED8', warning: '#B45309', success: '#15803D' };
        return map[type] || '#1D4ED8';
    };

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <div>
                <div className="grid-cols-3 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card-glass" style={{ minHeight: '120px' }}>
                            <div style={{ background: '#E2E8F0', height: '14px', width: '60%', borderRadius: '6px', marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                            <div style={{ background: '#E2E8F0', height: '28px', width: '40%', borderRadius: '6px', marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }}></div>
                            <div style={{ background: '#E2E8F0', height: '12px', width: '70%', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.4s' }}></div>
                        </div>
                    ))}
                </div>
                <div className="card-glass" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ph ph-spinner ph-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>Loading Procurement Intelligence...</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching live data from AI Engine on Port 4000</p>
                </div>
            </div>
        );
    }

    /* ─── Error State ─── */
    if (error || !data) {
        return (
            <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
                <i className="ph-fill ph-warning-circle" style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '1rem' }}></i>
                <h3 style={{ marginBottom: '0.5rem' }}>Connection Error</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px' }}>
                    Could not fetch data from the Procurement AI API.
                    {error && <><br /><code style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</code></>}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Make sure the backend server is running: <code style={{ background: '#F1F5F9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>cd backend && npm run dev</code>
                </p>
                <button className="btn btn-primary" onClick={() => fetchDashboard(selectedCrop)}>
                    <i className="ph ph-arrow-clockwise"></i> Retry Connection
                </button>
            </div>
        );
    }

    /* ─── Main Render ─── */
    const { metrics } = data;

    return (
        <div>
            {/* ─── Crop Selector & Live Status Bar ─── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Analyze Crop</label>
                        <select
                            className="form-control"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', minWidth: '160px' }}
                            value={selectedCrop}
                            onChange={e => setSelectedCrop(e.target.value)}
                        >
                            {data.availableCrops.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn btn-outline"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginTop: '1rem' }}
                        onClick={() => fetchDashboard(selectedCrop, true)}
                        disabled={refreshing}
                    >
                        <i className={`ph ${refreshing ? 'ph-spinner ph-spin' : 'ph-arrow-clockwise'}`}></i>
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: '#DCFCE7', color: '#16A34A', padding: '0.2rem 0.6rem',
                        borderRadius: '50px', fontSize: '0.72rem', fontWeight: 700
                    }}>
                        <span style={{
                            display: 'inline-block', width: '6px', height: '6px',
                            borderRadius: '50%', background: '#16A34A',
                        }}></span>
                        Live
                    </span>
                    {lastUpdated && <span>Updated: {lastUpdated}</span>}
                </div>
            </div>

            {/* ─── Top Metric Cards ─── */}
            <div className="grid-cols-3 mb-6">
                <div className="card-glass">
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Total Consumption ({metrics.totalConsumption.period})
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {metrics.totalConsumption.value.toLocaleString()} {metrics.totalConsumption.unit}
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: metrics.totalConsumption.change >= 0 ? 'var(--success)' : 'var(--danger)',
                        marginTop: '0.25rem'
                    }}>
                        <i className={`ph ${metrics.totalConsumption.change >= 0 ? 'ph-trend-up' : 'ph-trend-down'}`}></i>
                        {metrics.totalConsumption.change >= 0 ? '+' : ''}{metrics.totalConsumption.change}% vs previous
                    </div>
                </div>
                <div className="card-glass">
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Predicted Need ({metrics.predictedNeed.period})
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {metrics.predictedNeed.value.toLocaleString()} {metrics.predictedNeed.unit}
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: metrics.predictedNeed.seasonality === 'high' ? 'var(--danger)' : 'var(--text-muted)',
                        marginTop: '0.25rem'
                    }}>
                        <i className={`ph ${metrics.predictedNeed.seasonality === 'high' ? 'ph-warning' : 'ph-info'}`}></i>
                        {metrics.predictedNeed.seasonality === 'high' ? 'High' : metrics.predictedNeed.seasonality === 'medium' ? 'Medium' : 'Low'} seasonality expected
                    </div>
                </div>
                <div className="card-glass" style={{
                    background: metrics.efficiency.value >= 92 ? 'var(--info-light)' : 'var(--warning-light)',
                    borderColor: metrics.efficiency.value >= 92 ? 'var(--info)' : 'var(--warning)'
                }}>
                    <div style={{
                        fontSize: '0.9rem',
                        color: metrics.efficiency.value >= 92 ? '#1D4ED8' : '#B45309',
                        marginBottom: '0.5rem', fontWeight: 600
                    }}>Procurement Efficiency</div>
                    <div style={{
                        fontSize: '1.8rem', fontWeight: 700,
                        color: metrics.efficiency.value >= 92 ? '#1E3A8A' : '#92400E'
                    }}>
                        {metrics.efficiency.value}%
                    </div>
                    <div style={{
                        fontSize: '0.85rem',
                        color: metrics.efficiency.value >= 92 ? '#1D4ED8' : '#B45309',
                        marginTop: '0.25rem'
                    }}>{metrics.efficiency.message}</div>
                </div>
            </div>

            {/* ─── Chart + Recommendations ─── */}
            <div className="grid-main-side">
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>Need vs. Price Forecast ({data.cropFilter})</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            <i className="ph ph-brain"></i> ML Generated
                        </span>
                    </div>
                    <div className="card-glass mb-6">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            See your predicted intervals for need vs. expected market price to plan optimized bulk buying.
                        </p>

                        {/* Confidence indicators */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {data.weeklyForecast.map(w => (
                                <div key={w.week} style={{
                                    flex: 1, minWidth: '100px', padding: '0.5rem 0.6rem',
                                    background: '#F8FAFC', borderRadius: '8px', textAlign: 'center',
                                    border: `1px solid ${w.supplyOutlook === 'tight' ? 'var(--danger-light)' : w.supplyOutlook === 'surplus' ? 'var(--success-light)' : 'var(--border-color)'}`
                                }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>{w.label}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0.15rem 0' }}>₹{w.expectedPricePerKg}/kg</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                        <div style={{ width: '30px', height: '4px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${w.confidence}%`, height: '100%', borderRadius: '10px',
                                                background: w.confidence > 80 ? 'var(--success)' : 'var(--warning)',
                                            }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', color: w.confidence > 80 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{w.confidence}%</span>
                                    </div>
                                    <div style={{
                                        fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600,
                                        color: w.supplyOutlook === 'tight' ? 'var(--danger)' : w.supplyOutlook === 'surplus' ? 'var(--success)' : 'var(--text-muted)',
                                    }}>
                                        {w.supplyOutlook === 'tight' ? '⚠ Tight Supply' : w.supplyOutlook === 'surplus' ? '✓ Surplus' : '— Balanced'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>

                    {/* ─── Top Suppliers ─── */}
                    <h3 style={{ marginBottom: '1rem' }}>Top Suppliers for {data.cropFilter}</h3>
                    <div className="card-glass">
                        {data.suppliers.map((s, i) => (
                            <div key={i} className="item-row" style={{ marginBottom: i < data.suppliers.length - 1 ? '0.5rem' : 0 }}>
                                <div className="item-main">
                                    <div className="item-img" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                                        <i className="ph-fill ph-user-circle"></i>
                                    </div>
                                    <div>
                                        <div className="item-title">{s.name}</div>
                                        <div className="item-sub">{s.location} • {s.totalDeliveries} deliveries • ₹{s.avgPrice}/kg avg</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#F59E0B', fontSize: '0.8rem' }}>
                                            {[...Array(Math.floor(s.rating))].map((_, j) => <i key={j} className="ph-fill ph-star"></i>)}
                                            <span style={{ color: 'var(--text-main)', fontWeight: 600, marginLeft: '0.2rem' }}>{s.rating}</span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.reliability}% reliable</div>
                                    </div>
                                    <span className="item-status status-track">Verified</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── AI Recommendations ─── */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3>AI Recommendations</h3>
                        <span style={{
                            fontSize: '0.7rem', fontWeight: 700, background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                            color: 'white', padding: '0.2rem 0.5rem', borderRadius: '50px',
                        }}>
                            {data.recommendations.length} Active
                        </span>
                    </div>
                    <div className="card-glass">
                        {data.recommendations.map((rec, i) => (
                            <div
                                key={rec.id}
                                className={`alert ${getRecAlertClass(rec.type)}`}
                                style={{
                                    marginBottom: i < data.recommendations.length - 1 ? '1rem' : 0,
                                    flexDirection: 'column',
                                    ...(rec.type === 'success' ? { background: '#DCFCE7', color: '#166534' } : {}),
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <i className={getRecIcon(rec.icon)}></i>
                                    <strong>{rec.title}</strong>
                                    {rec.savingsEstimate > 0 && (
                                        <span style={{
                                            marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700,
                                            background: 'rgba(255,255,255,0.5)', padding: '0.15rem 0.4rem', borderRadius: '4px',
                                        }}>Save ₹{rec.savingsEstimate}</span>
                                    )}
                                </div>
                                <p style={{ marginTop: '0.5rem' }}>{rec.message}</p>
                                {rec.action && (
                                    <p style={{ marginTop: '0.5rem', fontWeight: 600, color: getRecActionColor(rec.type) }}>
                                        Action: {rec.action}
                                    </p>
                                )}
                                {rec.actionType === 'schedule_order' && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}
                                        onClick={() => setCurrentView('orders')}
                                    >
                                        <i className="ph ph-calendar-check"></i> Schedule Order Now
                                    </button>
                                )}
                                {rec.actionType === 'transport_settings' && (
                                    <button
                                        className="btn btn-outline"
                                        style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                                        onClick={() => setCurrentView('transport')}
                                    >
                                        <i className="ph ph-truck"></i> Configure Transport
                                    </button>
                                )}
                            </div>
                        ))}

                        {data.recommendations.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                <i className="ph ph-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block', color: 'var(--success)' }}></i>
                                No urgent recommendations at this time.
                            </div>
                        )}
                    </div>

                    {/* Current Price Card */}
                    <div className="card-glass" style={{ marginTop: '1rem', background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)', border: '1px solid rgba(22, 163, 74, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#15803D', fontWeight: 600 }}>
                                <i className="ph ph-tag"></i> Current {data.cropFilter} Price
                            </span>
                            <span style={{
                                fontSize: '0.7rem', background: 'rgba(255,255,255,0.6)', padding: '0.15rem 0.4rem',
                                borderRadius: '4px', color: '#15803D', fontWeight: 600
                            }}>LIVE</span>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#166534' }}>
                            ₹{metrics.currentPrice.value}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#15803D' }}>/kg</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: '0.25rem' }}>
                            Source: ML Pricing Engine • Updated {lastUpdated}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
