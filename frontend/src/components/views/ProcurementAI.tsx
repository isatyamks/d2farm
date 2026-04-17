"use client";
import { useEffect, useRef } from 'react';

export default function ProcurementAI({ setCurrentView }: any) {
    const chartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let chartInstance: any = null;
        if (chartRef.current && (window as any).Chart) {
            chartInstance = new (window as any).Chart(chartRef.current, {
                type: 'line',
                data: {
                    labels: ['Current Week', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Predicted Need (kg)',
                            data: [750, 780, 850, 810],
                            borderColor: '#10B981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            yAxisID: 'y',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Expected Price (₹/kg)',
                            data: [18, 19, 15, 16],
                            borderColor: '#3B82F6',
                            backgroundColor: 'transparent',
                            borderDash: [5, 5],
                            yAxisID: 'y1',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Need (kg)' }, ticks: { stepSize: 50 } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Price (₹/kg)' }, min: 10, max: 25 }
                    }
                }
            });
        }
        return () => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    }, []);

    return (
        <div>
            <div className="grid-cols-3 mb-6">
                <div className="card-glass">
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Consumption (30 Days)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>3,420 kg</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.25rem' }}><i className="ph ph-trend-up"></i> +4% vs previous</div>
                </div>
                <div className="card-glass">
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Predicted Need (Next 30 Days)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>4,100 kg</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.25rem' }}><i className="ph ph-warning"></i> High seasonality expected</div>
                </div>
                <div className="card-glass" style={{ background: 'var(--info-light)', borderColor: 'var(--info)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#1D4ED8', marginBottom: '0.5rem', fontWeight: 600 }}>Procurement Efficiency</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1E3A8A' }}>94%</div>
                    <div style={{ fontSize: '0.85rem', color: '#1D4ED8', marginTop: '0.25rem' }}>You are buying at good times.</div>
                </div>
            </div>

            <div className="grid-main-side">
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Need vs. Price Forecast (Tomatoes)</h3>
                    <div className="card-glass mb-6">
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>See your predicted intervals for need vs. expected market price to plan optimized bulk buying.</p>
                        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>AI Recommendations</h3>
                    <div className="card-glass">
                        <div className="alert alert-info" style={{ marginBottom: '1rem', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <i className="ph-fill ph-lightbulb"></i> <strong>Bulk Order Opportunity</strong>
                            </div>
                            <p style={{ marginTop: '0.5rem' }}>Prices are expected to drop to ₹15/kg in Week 3 while your demand peaks at 850kg.</p>
                            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: '#1D4ED8' }}>Action: Procure 600kg in Week 3 to save ₹1,200.</p>
                            <button className="btn btn-primary" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }} onClick={() => setCurrentView('orders')}>Schedule Order Now</button>
                        </div>

                        <div className="alert alert-warning" style={{ marginBottom: 0, flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <i className="ph-fill ph-warning-circle"></i> <strong>Hold Off Buying</strong>
                            </div>
                            <p style={{ marginTop: '0.5rem' }}>Next week's price may spike to ₹19/kg temporarily. We suggest using your current inventory of tomatoes until Week 3.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
