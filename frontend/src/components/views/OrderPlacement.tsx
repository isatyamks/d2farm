"use client";
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';


const CROP_DATA: Record<string, string[]> = {
    "Tomato": ["Hybrid", "Cherry", "Roma", "Desi"],
    "Onion": ["Red Nashik", "White", "Yellow", "Spring Onion"],
    "Potato": ["Agra Big", "Kufri Jyoti", "Sweet Potato", "Baby Potato"],
    "Wheat": ["Sharbati", "Durum", "Lokwan", "Sujata"],
    "Rice": ["Basmati", "Sona Masuri", "Kolam", "Indrayani"],
    "Carrot": ["Ooty", "Delhi Red", "Orange", "Black Carrot"],
    "Garlic": ["Ooty Single Clove", "Mandsaur", "Jamnagar", "Desi Garlic"],
    "Ginger": ["Kochi", "Assam", "Bangalore", "Himalayan"],
    "Capsicum": ["Green", "Red", "Yellow", "Simla Big"],
    "Cabbage": ["Green", "Purple", "Savoy"]
};

export default function OrderPlacement() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<any>(null); 
    
    const [crop, setCrop] = useState("Wheat");
    const [variety, setVariety] = useState(CROP_DATA["Wheat"][0]);
    const [quantity, setQuantity] = useState("500");
    const [deliveryDate, setDeliveryDate] = useState("");

    const handleCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCrop = e.target.value;
        setCrop(selectedCrop);
        // Automatically default variety to the first one in the new crop's array
        setVariety(CROP_DATA[selectedCrop][0]);
    };

    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [fetchingPrice, setFetchingPrice] = useState(false);

    useEffect(() => {
        const getPrice = async () => {
            setFetchingPrice(true);
            try {
                const res = await fetch(`${API_BASE}/api/ml/farmer-forecast?crop=${crop}`);
                const data = await res.json();
                if (data.success) setMarketPrice(data.farmerPrice);
            } catch (e) {
                setMarketPrice(20); // fallback
            } finally {
                setFetchingPrice(false);
            }
        };
        getPrice();
    }, [crop]);

    const placeOrder = async () => {
        if (!quantity) {
            alert('Please fill in the quantity.');
            return;
        }

        setLoading(true);
        setStatus(null);
        try {
            const response = await fetch(`${API_BASE}/api/orders/deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    crop,
                    variety,
                    quantity: parseInt(quantity),
                    ...(deliveryDate ? { deliveryDate } : {}),
                })
            });

            const data = await response.json();

            if (data.success) {
                setStatus({ type: 'success', message: data.message, orderId: data.orderId, pricePerKg: data.pricePerKg, totalValue: data.totalValue });
            } else {
                setStatus({ type: 'error', message: data.message || 'Order could not be saved.' });
            }
        } catch (error) {
            console.error('API Error:', error);
            setStatus({ type: 'error', message: 'Cannot reach backend. Make sure the server is running.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {status && status.type === 'success' && (
                <div className="modal-overlay active">
                    <div className="modal active">
                        <div className="modal-header">
                            <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ph-fill ph-check-circle"></i> Order Placed!
                            </h3>
                            <button className="close-modal" onClick={() => setStatus(null)}><i className="ph ph-x"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '0' }}>
                            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>{status.message}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                {status.pricePerKg && (
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rate / kg</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>₹{status.pricePerKg}</div>
                                    </div>
                                )}
                                {status.totalValue && (
                                    <div style={{ background: 'var(--surface-bg)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Value</div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{status.totalValue?.toLocaleString('en-IN')}</div>
                                    </div>
                                )}
                            </div>
                            <div style={{ background: 'var(--surface-bg)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--border-color)' }}>
                                <strong>Order ID:</strong> <span style={{ float: 'right', fontFamily: 'monospace', fontSize: '0.85rem' }}>{status.orderId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {status && status.type === 'error' && (
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                    <span className="alert-icon"><i className="ph ph-warning"></i></span>
                    <div className="alert-text"><strong>Order Failed</strong><p>{status.message}</p></div>
                </div>
            )}

            <div className="grid-main-side">
                <div>
                    <div className="card-glass mb-6">
                        <h3 style={{ marginBottom: '1.5rem' }}>New Order Request</h3>
                        
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Select Crop</label>
                                <select className="form-control" value={crop} onChange={handleCropChange}>
                                    {Object.keys(CROP_DATA).map((cropName) => (
                                        <option key={cropName} value={cropName}>{cropName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Crop Variety</label>
                                <select className="form-control" value={variety} onChange={e => setVariety(e.target.value)}>
                                    {CROP_DATA[crop].map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label className="form-label">Quantity Needed (kg)</label>
                                <input 
                                    type="number" 
                                    className="form-control" 
                                    placeholder="e.g. 500" 
                                    value={quantity} 
                                    onChange={e => setQuantity(e.target.value)} 
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Delivery Date</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    value={deliveryDate} 
                                    onChange={e => setDeliveryDate(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* Predictive Market Check */}
                        <div style={{ background: 'var(--info-light)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', margin: '1rem 0', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ph ph-sparkle"></i> AI Pricing Check
                                </span>
                                <span style={{ fontWeight: 700, color: '#1D4ED8' }}>Live AGMARKNET modal</span>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#1E3A8A', fontWeight: 500 }}>
                                Verified Market Rate: <strong>₹{marketPrice || '...'} / kg</strong> 
                                {fetchingPrice && <i className="ph ph-spinner ph-spin" style={{ marginLeft: '4px' }}></i>}
                                <span style={{ marginLeft: '10px', opacity: 0.7 }}>•</span>
                                <span style={{ marginLeft: '10px' }}>Deposit (10%): ₹{( (marketPrice || 20) * parseInt(quantity || "0") * 0.1).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <button 
                            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`} 
                            style={{ 
                                width: '100%', 
                                justifyContent: 'center', 
                                background: status?.type === 'success' ? 'var(--success)' : '',
                                borderColor: status?.type === 'success' ? 'var(--success)' : ''
                            }} 
                            onClick={placeOrder}
                            disabled={loading}
                        >
                            {loading ? <><i className="ph ph-spinner"></i> Securing Price...</> : 
                             status?.type === 'success' ? <><i className="ph ph-check"></i> Order Confirmed!</> :
                             status?.type === 'error' ? <><i className="ph ph-warning"></i> Error (Retry)</> :
                             'Pay Deposit (10%) & Confirm'}
                        </button>
                    </div>
                </div>

                <div>
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>Fulfillment Alerts</h3>
                    <div className="card-glass" style={{ border: '1px solid var(--border-color)', opacity: 0.8 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            <i className="ph ph-check-circle"></i> Pipeline Status
                        </div>
                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                            System-wide supply is stable. Local clusters in your region report 95%+ fulfillment capacity for requested commodities.
                        </p>
                        
                        <div style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'var(--surface-bg)', border: '1px dashed var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <i className="ph ph-info" style={{ marginRight: '4px' }}></i> No manual decisions required for your active orders at this time.
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
