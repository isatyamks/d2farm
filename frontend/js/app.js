// Views Configuration
const views = {
    dashboard: {
        title: "Overview",
        subtitle: "Here's what you need to know today.",
        render: () => `
            <div class="grid-cols-3 mb-6">
                <div class="card-glass">
                    <div class="card-header">
                        <span class="card-title">Next Delivery</span>
                        <i class="ph ph-truck text-green" style="font-size: 1.5rem;"></i>
                    </div>
                    <div class="metric-widget">
                        <div class="metric-icon" style="background: var(--success-light); color: var(--success);">
                            <i class="ph-fill ph-check-circle"></i>
                        </div>
                        <div class="metric-info">
                            <h4>Tomatoes 100kg</h4>
                            <div class="value" style="font-size: 1.2rem;">Tomorrow, 8 AM</div>
                            <span class="item-status status-track" style="display:inline-block; margin-top:0.5rem;">On Track</span>
                        </div>
                    </div>
                </div>

                <div class="card-glass">
                    <div class="card-header">
                        <span class="card-title">Weekly Demand</span>
                        <i class="ph ph-chart-bar" style="font-size: 1.5rem; color: var(--info);"></i>
                    </div>
                    <div class="metric-widget">
                        <div class="metric-icon" style="background: var(--info-light); color: var(--info);">
                            <i class="ph ph-basket"></i>
                        </div>
                        <div class="metric-info">
                            <h4>Total Ordered</h4>
                            <div class="value">850 kg</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top:0.25rem;">+12% from last week</div>
                        </div>
                    </div>
                </div>

                <div class="card-glass">
                    <div class="card-header">
                        <span class="card-title">Wallet Balance</span>
                        <i class="ph ph-wallet" style="font-size: 1.5rem; color: var(--warning);"></i>
                    </div>
                    <div class="metric-widget">
                        <div class="metric-icon" style="background: var(--warning-light); color: var(--warning);">
                            <i class="ph ph-currency-inr"></i>
                        </div>
                        <div class="metric-info">
                            <h4>Available</h4>
                            <div class="value">₹14,500</div>
                            <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-top:0.5rem;">Top Up</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid-main-side">
                <div>
                    <h3 style="margin-bottom: 1rem;">Active Orders</h3>
                    <div class="item-row">
                        <div class="item-main">
                            <div class="item-img"><i class="ph ph-package"></i></div>
                            <div>
                                <div class="item-title">Onions - 200kg</div>
                                <div class="item-sub">Order #4092 • Expected Today</div>
                            </div>
                        </div>
                        <div class="item-status status-track">In Transit (ETA 4 PM)</div>
                    </div>
                    <div class="item-row">
                        <div class="item-main">
                            <div class="item-img" style="background: var(--warning-light); color: var(--warning);"><i class="ph ph-package"></i></div>
                            <div>
                                <div class="item-title">Potatoes - 500kg</div>
                                <div class="item-sub">Order #4093 • Partially Fulfilled</div>
                            </div>
                        </div>
                        <button class="btn btn-outline" onclick="app.navigate('orders')" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Review (420kg max)</button>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">Crucial Alerts</h3>
                    <div class="alert alert-warning" style="flex-direction: column;">
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <i class="ph-fill ph-warning-circle"></i> <strong>Supply Tight</strong>
                        </div>
                        <p style="margin-top:0.25rem;">Onion supply limited next week. Secure your stock now.</p>
                        <button class="btn btn-primary" style="margin-top:0.75rem; width:100%; justify-content:center;" onclick="app.navigate('planner')">Review Demand Planner</button>
                    </div>
                    <div class="alert alert-danger" style="flex-direction: column;">
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <i class="ph-fill ph-trend-up"></i> <strong>Price Spike</strong>
                        </div>
                        <p style="margin-top:0.25rem;">Tomato prices up ₹4/kg. Lock in current prices.</p>
                    </div>
                </div>
            </div>
        `
    },
    planner: {
        title: "Smart Demand Planner",
        subtitle: "AI predicting what you need next week based on your kitchen usage.",
        render: () => `
            <div class="card-glass mb-6">
                <div class="grid-cols-3" style="align-items: center;">
                    <div>
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">CROP PREDICTION</div>
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <img src="https://img.icons8.com/color/48/000000/tomato.png" width="40" alt="Tomato">
                            <div>
                                <h2 style="font-size:1.5rem; font-weight:700;">Tomatoes</h2>
                                <span class="insight-tag tag-stable">Demand Steady</span>
                            </div>
                        </div>
                    </div>
                    <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;">
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.25rem;">Past 7 Days Usage</div>
                        <div style="font-size: 1.5rem; font-weight: 700;">100 kg / day</div>
                    </div>
                    <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;">
                        <div style="font-size: 0.9rem; color: var(--primary-dark); font-weight:600; margin-bottom: 0.25rem;">Expected Next Week</div>
                        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">110 kg / day</div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem; background: var(--surface-bg); padding: 1.5rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                        <h3 style="font-size: 1.1rem;">Recommended Action</h3>
                        <span style="font-weight: 600; font-size:1.1rem;">750 kg total</span>
                    </div>
                    
                    <div class="grid-cols-2">
                        <div class="form-group">
                            <label class="form-label">Adjust Quantity (kg)</label>
                            <input type="number" class="form-control" value="750">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Delivery Schedule</label>
                            <select class="form-control">
                                <option>Split: Everyday (107kg/day)</option>
                                <option>Split: Every 2 Days</option>
                                <option>Single Drop</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; justify-content:center;" onclick="app.navigate('orders')">Approve & Send to Orders</button>
                </div>
            </div>

            <h3 style="margin-bottom: 1rem;">AI Procurement Strategist (Tomatoes)</h3>
            <div class="card-glass mb-6">
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 1.5rem;">See your predicted intervals for need vs. expected market price to plan optimized bulk buying.</p>
                <div style="height: 300px; width: 100%; position: relative;">
                    <canvas id="procurementChart"></canvas>
                </div>
                <div class="alert alert-info" style="margin-top: 1.5rem; margin-bottom: 0;">
                    <div class="alert-icon"><i class="ph ph-lightbulb"></i></div>
                    <div class="alert-text">
                        <strong>Smart Insight</strong>
                        <p>Prices are expected to drop in Week 3 while your demand peaks. You should bulk order in Week 3 to save approximately ₹1,200.</p>
                    </div>
                </div>
            </div>

            <h3 style="margin-bottom: 1rem;">Other Top Ingredients</h3>
            <div class="grid-cols-2">
                <div class="item-row" style="cursor:pointer;">
                    <div class="item-main">
                        <img src="https://img.icons8.com/color/48/000000/onion.png" width="30" alt="Onion">
                        <div>
                            <div class="item-title">Onion (Nashik)</div>
                            <div class="item-sub">Suggested: 400kg/week</div>
                        </div>
                    </div>
                    <i class="ph ph-caret-right" style="color:var(--text-muted)"></i>
                </div>
                <div class="item-row" style="cursor:pointer;">
                    <div class="item-main">
                        <img src="https://img.icons8.com/color/48/000000/potato.png" width="30" alt="Potato">
                        <div>
                            <div class="item-title">Potato (Agra, Big)</div>
                            <div class="item-sub">Suggested: 600kg/week</div>
                        </div>
                    </div>
                    <i class="ph ph-caret-right" style="color:var(--text-muted)"></i>
                </div>
            </div>
        `,
        afterRender: () => {
            const ctx = document.getElementById('procurementChart');
            if (ctx) {
                new Chart(ctx, {
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
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: 'Need (kg)'
                                },
                                ticks: {
                                    stepSize: 50
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                grid: { drawOnChartArea: false },
                                title: {
                                    display: true,
                                    text: 'Price (₹/kg)'
                                },
                                min: 10,
                                max: 25,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    },
    orders: {
        title: "Order Placement & Fulfillment",
        subtitle: "Quick order with partial fulfillment tools if supply is short.",
        render: () => `
            <div class="grid-main-side">
                <div>
                    <div class="card-glass mb-6">
                        <h3 style="margin-bottom: 1.5rem;">New Order Request</h3>
                        <div class="form-group">
                            <label class="form-label">Select Crop</label>
                            <select class="form-control">
                                <option>Tomato (Hybrid)</option>
                                <option>Onion (Red Nashik)</option>
                                <option>Potato (Agra)</option>
                            </select>
                        </div>
                        <div class="grid-cols-2">
                            <div class="form-group">
                                <label class="form-label">Quantity Needed (kg)</label>
                                <input type="number" class="form-control" placeholder="e.g. 500">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Delivery Date</label>
                                <input type="date" class="form-control">
                            </div>
                        </div>
                        <div style="background: var(--info-light); padding: 1rem; border-radius: var(--border-radius-sm); margin: 1rem 0;">
                            <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
                                <span style="font-weight:600; color: #1D4ED8;">System Check</span>
                                <span style="font-weight:700; color: #1D4ED8;">90% Confidence</span>
                            </div>
                            <div style="font-size:0.85rem; color:#1E3A8A;">Estimated Availability: 450-500kg | Current Price: ₹18/kg</div>
                        </div>
                        <button class="btn btn-primary" style="width: 100%; justify-content: center;">Pay Deposit (10%) & Confirm</button>
                    </div>
                </div>

                <div>
                    <h3 style="margin-bottom: 1rem;">Action Required</h3>
                    <div class="card-glass" style="border: 1px solid var(--warning);">
                        <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom: 1rem; color:var(--warning); font-weight:600;">
                            <i class="ph-fill ph-warning"></i> Partial Fulfillment (Order #4093)
                        </div>
                        <p style="font-size: 0.9rem; margin-bottom: 1rem;">You requested <strong>500kg Potatoes</strong>. Only <strong>420kg</strong> is available from trusted farmers.</p>
                        
                        <div style="display:flex; flex-direction:column; gap:0.5rem;">
                            <label style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: var(--border-radius-sm); cursor:pointer; background: white; display:flex; align-items:center; gap:0.5rem;">
                                <input type="radio" name="partial" checked> Accept 420kg (Auto-refund rest)
                            </label>
                            <label style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: var(--border-radius-sm); cursor:pointer; background: white; display:flex; align-items:center; gap:0.5rem;">
                                <input type="radio" name="partial"> Accept 420kg + Delay 80kg by 1 day
                            </label>
                            <label style="border: 1px solid var(--border-color); padding: 0.75rem; border-radius: var(--border-radius-sm); cursor:pointer; background: white; display:flex; align-items:center; gap:0.5rem;">
                                <input type="radio" name="partial"> Cancel entirely
                            </label>
                        </div>
                        <button class="btn btn-outline" style="width:100%; margin-top:1rem; justify-content:center;">Submit Decision</button>
                    </div>
                </div>
            </div>
        `
    },
    tracking: {
        title: "Order Tracking",
        subtitle: "Real-time updates from farm to kitchen.",
        render: () => `
            <div class="card-glass mb-6">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 2rem;">
                    <div>
                        <h2 style="font-size: 1.2rem; font-weight: 700; margin-bottom:0.25rem;">Order #4092</h2>
                        <div style="color:var(--text-muted); font-size:0.9rem;">200kg Onions • Arriving Today</div>
                    </div>
                    <span class="insight-tag tag-stable" style="background:var(--primary-light); color:var(--primary-dark); font-size:0.9rem; padding:0.4rem 0.8rem;">ETA: 4:00 PM</span>
                </div>

                <div style="position:relative; padding-left: 2rem; margin-bottom: 2rem;">
                    <div style="position:absolute; left: 6px; top: 0; bottom: 0; width: 2px; background: var(--border-color);"></div>
                    <div style="position:absolute; left: 6px; top: 0; height: 60%; width: 2px; background: var(--primary);"></div>
                    
                    <div style="position:relative; margin-bottom: 2rem;">
                        <div style="position:absolute; left: -2.35rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: var(--primary); border: 3px solid white; box-shadow: 0 0 0 2px var(--primary);"></div>
                        <div style="font-weight:600;">Farm Pickup Confirmed</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">
                            Farmer: Rajesh Kumar <span style="color:var(--success); font-weight:600;">(95% Reliability Score)</span><br>
                            9:00 AM • Nashik Farms
                        </div>
                    </div>

                    <div style="position:relative; margin-bottom: 2rem;">
                        <div style="position:absolute; left: -2.4rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: var(--primary); border: 2px solid white; box-shadow: 0 0 4px var(--primary);"></div>
                        <div style="font-weight:600; color:var(--primary);">In Transit</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">
                            Vehicle: MH-15-AB-1234 • Driver: Amit<br>
                            Last Checkpoint: Highway Toll
                        </div>
                    </div>

                    <div style="position:relative;">
                        <div style="position:absolute; left: -2.35rem; top: 0; width: 14px; height: 14px; border-radius: 50%; background: white; border: 3px solid var(--border-color);"></div>
                        <div style="font-weight:600; color:var(--text-muted);">Delivery</div>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">
                            Expected at Your Warehouse
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; gap:1rem;">
                    <button class="btn btn-outline"><i class="ph ph-phone"></i> Call Driver</button>
                    <button class="btn btn-primary"><i class="ph ph-check"></i> Mark Received</button>
                </div>
            </div>
        `
    },
    market: {
        title: "Market Insights",
        subtitle: "Data-driven pricing trends for better procurement planning.",
        render: () => `
            <div class="grid-cols-3 mb-6">
                <div class="card-glass" style="border-top: 4px solid var(--danger);">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="font-weight:600;">Tomato</h4>
                        <span class="insight-tag tag-up"><i class="ph ph-trend-up"></i> +12%</span>
                    </div>
                    <div style="font-size:1.8rem; font-weight:700; margin:0.5rem 0;">₹18/kg</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Supply: <span style="color:var(--danger); font-weight:600;">Low</span></div>
                    <p style="font-size:0.85rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">Suggestion: Lock in orders now, prices likely to hit ₹20 by Friday.</p>
                </div>

                <div class="card-glass" style="border-top: 4px solid var(--success);">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="font-weight:600;">Onion</h4>
                        <span class="insight-tag tag-down"><i class="ph ph-trend-down"></i> -5%</span>
                    </div>
                    <div style="font-size:1.8rem; font-weight:700; margin:0.5rem 0;">₹24/kg</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Supply: <span style="color:var(--success); font-weight:600;">High</span></div>
                    <p style="font-size:0.85rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">Suggestion: Buy as needed. Stable supply expected.</p>
                </div>

                <div class="card-glass" style="border-top: 4px solid var(--info);">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="font-weight:600;">Potato</h4>
                        <span class="insight-tag tag-stable"><i class="ph ph-minus"></i> 0%</span>
                    </div>
                    <div style="font-size:1.8rem; font-weight:700; margin:0.5rem 0;">₹15/kg</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">Supply: <span style="color:var(--warning); font-weight:600;">Medium</span></div>
                    <p style="font-size:0.85rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">Suggestion: Normal ordering pattern recommended.</p>
                </div>
            </div>
        `
    },
    wallet: {
        title: "Payments & Wallet",
        subtitle: "Manage deposits, final payments, and ledger.",
        render: () => `
            <div class="grid-main-side">
                <div>
                    <div class="card-glass mb-6">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                            <div>
                                <div style="font-size:0.9rem; color:var(--text-muted);">Wallet Balance</div>
                                <div style="font-size:2.5rem; font-weight:700; color:var(--text-main);">₹14,500.00</div>
                            </div>
                            <button class="btn btn-primary">+ Add Funds</button>
                        </div>
                        <div class="progress-container mb-6">
                            <div class="progress-bar" style="width: 45%;"></div>
                        </div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">You have used ₹12,000 of your ₹25,000 monthly credit limit (Available for trusted buyers).</div>
                    </div>

                    <h3 style="margin-bottom: 1rem;">Recent Transactions</h3>
                    <div class="item-row">
                        <div class="item-main">
                            <div class="item-img" style="background:var(--danger-light); color:var(--danger);"><i class="ph ph-arrow-up-right"></i></div>
                            <div>
                                <div class="item-title">Deposit: Order #4092</div>
                                <div class="item-sub">Oct 24, 2023</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:var(--text-main);">- ₹1,800</div>
                    </div>
                    <div class="item-row">
                        <div class="item-main">
                            <div class="item-img" style="background:var(--success-light); color:var(--success);"><i class="ph ph-arrow-down-left"></i></div>
                            <div>
                                <div class="item-title">Wallet Top Up</div>
                                <div class="item-sub">Oct 22, 2023</div>
                            </div>
                        </div>
                        <div style="font-weight:700; color:var(--success);">+ ₹10,000</div>
                    </div>
                    <button class="btn btn-outline" style="width:100%; justify-content:center; margin-top:0.5rem;">View Full Ledger</button>
                </div>

                <div>
                    <div class="card-glass" style="background:#0F172A; color:white;">
                        <h3 style="margin-bottom:1rem; color:white;">Pending Payments</h3>
                        <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                                <span>Order #4089 (Delivered)</span>
                                <strong>₹8,200</strong>
                            </div>
                            <div style="font-size:0.8rem; color:rgba(255,255,255,0.6);">Due Today</div>
                        </div>
                        <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:1rem; margin-bottom:1rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                                <span>Order #4090 (Delivered)</span>
                                <strong>₹4,500</strong>
                            </div>
                            <div style="font-size:0.8rem; color:rgba(255,255,255,0.6);">Due in 2 days</div>
                        </div>
                        <button class="btn btn-primary" style="width:100%; justify-content:center; background:white; color:#0F172A;">Pay All Now (₹12,700)</button>
                    </div>
                </div>
            </div>
        `
    },
    profile: {
        title: "User Profile",
        subtitle: "Manage your business details and view trust metrics.",
        render: () => `
            <div class="card-glass" style="max-width: 600px; margin: 0 auto;">
                <div style="text-align:center; margin-bottom: 2rem;">
                    <img src="https://i.pravatar.cc/150?img=11" alt="User" style="width:100px; height:100px; border-radius:50%; margin-bottom:1rem; border:4px solid var(--primary-light);">
                    <h2 style="margin-bottom:0.25rem;">Grand Hotel Kitchens</h2>
                    <div style="color:var(--text-muted); font-size:0.9rem;">Joined Jan 2022 • Premium Buyer</div>
                </div>

                <div class="grid-cols-2 mb-6">
                    <div style="text-align:center; padding:1rem; background:var(--surface-bg); border-radius:var(--border-radius-md);">
                        <div style="font-size:2rem; font-weight:700; color:var(--success);">99.2%</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">Order Completion Rate</div>
                    </div>
                    <div style="text-align:center; padding:1rem; background:var(--surface-bg); border-radius:var(--border-radius-md);">
                        <div style="font-size:2rem; font-weight:700; color:var(--success);">0.8%</div>
                        <div style="font-size:0.85rem; color:var(--text-muted);">Cancellation Rate</div>
                    </div>
                </div>

                <p style="text-align:center; font-size:0.9rem; color:var(--text-muted); margin-bottom:2rem;">Your excellent trust score unlocks a ₹25,000 monthly credit limit and priority delivery routing.</p>
                
                <button class="btn btn-outline" style="width:100%; justify-content:center; margin-bottom:1rem;"><i class="ph ph-pencil-simple"></i> Edit Business Details</button>
                <button class="btn btn-outline" style="width:100%; justify-content:center; color:var(--danger);"><i class="ph ph-sign-out"></i> Sign Out</button>
            </div>
        `
    }
};

// Application State
const app = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.navigate('dashboard'); // Load initial view
    },

    cacheDOM() {
        this.sidebarItems = document.querySelectorAll('.nav-item');
        this.viewContainer = document.getElementById('view-container');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');
        this.notificationBtn = document.querySelector('.notification-btn');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.notificationModal = document.getElementById('notification-modal');
        this.closeModalBtns = document.querySelectorAll('.close-modal');
    },

    bindEvents() {
        // Navigation
        this.sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                if(view) this.navigate(view);
            });
        });

        // Modals
        this.notificationBtn.addEventListener('click', () => this.toggleModal(true));
        this.modalOverlay.addEventListener('click', () => this.toggleModal(false));
        this.closeModalBtns.forEach(btn => btn.addEventListener('click', () => this.toggleModal(false)));
    },

    navigate(viewKey) {
        if (!views[viewKey]) return;

        // Update active class in sidebar
        this.sidebarItems.forEach(item => {
            item.classList.remove('active');
            if(item.dataset.view === viewKey) {
                item.classList.add('active');
            }
        });

        // Update Topbar
        this.pageTitle.textContent = views[viewKey].title;
        this.pageSubtitle.textContent = views[viewKey].subtitle;

        // Render View with transition
        this.viewContainer.classList.remove('fade-in');
        
        // Reflow hack for animation reset
        void this.viewContainer.offsetWidth; 
        
        this.viewContainer.innerHTML = views[viewKey].render();
        this.viewContainer.classList.add('fade-in');
        
        // Execute afterRender if the view defines it (e.g. for charts)
        if (views[viewKey].afterRender) {
            setTimeout(views[viewKey].afterRender, 50);
        }
    },

    toggleModal(show) {
        if(show) {
            this.modalOverlay.classList.add('active');
            this.notificationModal.classList.add('active');
        } else {
            this.modalOverlay.classList.remove('active');
            this.notificationModal.classList.remove('active');
        }
    }
};

// Expose app to global window so inline onclicks work (for MVP demo purposes)
window.app = app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
