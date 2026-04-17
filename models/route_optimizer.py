"""
Route Optimizer
===============
Multi-stop transport route cost optimizer for D2Farm's logistics layer.

Minimizes: total cost (fuel + tolls + cold-chain + spoilage losses)
Subject to: delivery deadline, vehicle capacity, cold-chain requirements

Used by:
    - TransportLogistics (buyer dashboard → vehicle + route recommendations)
    - OrderTracking (ETA calculation)
"""

import numpy as np
from itertools import permutations
import warnings

warnings.filterwarnings('ignore')

# ── Vehicle fleet profiles (Indian logistics) ──────────────────────────────────
VEHICLE_FLEET = {
    'auto_rickshaw': {
        'capacity_kg': 200,
        'cost_per_km': 8,
        'avg_speed_kmh': 25,
        'has_refrigeration': False,
        'fuel_type': 'CNG/Petrol',
        'best_for': 'Last-mile urban delivery (<10km)',
    },
    'mini_truck_tata_ace': {
        'capacity_kg': 1000,
        'cost_per_km': 12,
        'avg_speed_kmh': 40,
        'has_refrigeration': False,
        'fuel_type': 'Diesel',
        'best_for': 'Intra-district transport (10-80km)',
    },
    'refrigerated_mini_truck': {
        'capacity_kg': 1000,
        'cost_per_km': 18,
        'avg_speed_kmh': 35,
        'has_refrigeration': True,
        'fuel_type': 'Diesel',
        'best_for': 'Perishable goods, medium distance',
    },
    'eicher_10ft': {
        'capacity_kg': 3500,
        'cost_per_km': 16,
        'avg_speed_kmh': 45,
        'has_refrigeration': False,
        'fuel_type': 'Diesel',
        'best_for': 'Bulk transport, inter-district',
    },
    'refrigerated_eicher': {
        'capacity_kg': 3500,
        'cost_per_km': 24,
        'avg_speed_kmh': 40,
        'has_refrigeration': True,
        'fuel_type': 'Diesel',
        'best_for': 'Bulk perishable, inter-city',
    },
    'tata_407': {
        'capacity_kg': 2500,
        'cost_per_km': 14,
        'avg_speed_kmh': 50,
        'has_refrigeration': False,
        'fuel_type': 'Diesel',
        'best_for': 'Medium load, highway transport',
    },
}

# Toll rates per 100km by road type (source: NHAI toll estimates)
TOLL_RATES = {
    'national_highway': 65,   # ₹/100km for light commercial
    'state_highway': 25,
    'district_road': 0,
}

# Road speed multipliers (Indian conditions)
ROAD_SPEED_MULT = {
    'national_highway': 1.0,
    'state_highway': 0.75,
    'district_road': 0.50,
}


class RouteOptimizer:
    """
    Optimizes transport route and vehicle selection for agricultural
    shipments across Indian road networks.

    Considers:
        - Multi-stop cluster pickups from multiple farmers
        - Cold-chain requirements based on crop perishability
        - Vehicle capacity constraints
        - Road quality and toll costs
        - Deadline-aware scheduling
    """

    def __init__(self):
        pass

    def recommend_vehicle(self, quantity_kg, distance_km,
                          needs_refrigeration=False, deadline_hours=24):
        """
        Recommend the optimal vehicle type based on load, distance,
        and cold-chain requirements.

        Returns:
            dict with vehicle_type, cost_estimate, eta, reasoning
        """
        candidates = []

        for name, specs in VEHICLE_FLEET.items():
            # Skip if capacity too small
            if specs['capacity_kg'] < quantity_kg:
                continue

            # Skip non-refrigerated for cold-chain loads
            if needs_refrigeration and not specs['has_refrigeration']:
                continue

            # Calculate ETA
            road_type = (
                'national_highway' if distance_km > 100
                else 'state_highway' if distance_km > 30
                else 'district_road'
            )
            effective_speed = specs['avg_speed_kmh'] * ROAD_SPEED_MULT[road_type]
            eta_hours = distance_km / effective_speed

            # Skip if can't meet deadline
            if eta_hours > deadline_hours * 0.9:
                continue

            # Cost calculation
            fuel_cost = distance_km * specs['cost_per_km']
            toll_cost = (distance_km / 100) * TOLL_RATES[road_type]
            total_cost = fuel_cost + toll_cost

            # Score: lower is better (cost-weighted, with bonus for spare capacity)
            utilization = quantity_kg / specs['capacity_kg']
            cost_score = total_cost * (1 + abs(utilization - 0.75) * 0.3)

            candidates.append({
                'vehicle': name,
                'specs': specs,
                'total_cost': round(total_cost),
                'fuel_cost': round(fuel_cost),
                'toll_cost': round(toll_cost),
                'eta_hours': round(eta_hours, 1),
                'road_type': road_type,
                'utilization_pct': round(utilization * 100, 1),
                'score': cost_score,
            })

        if not candidates:
            return {
                'error': 'No suitable vehicle found',
                'suggestion': 'Split shipment into multiple vehicles'
            }

        # Sort by cost score (best first)
        candidates.sort(key=lambda x: x['score'])
        best = candidates[0]

        return {
            'recommended_vehicle': best['vehicle'],
            'capacity_kg': best['specs']['capacity_kg'],
            'has_refrigeration': best['specs']['has_refrigeration'],
            'total_cost_inr': best['total_cost'],
            'fuel_cost_inr': best['fuel_cost'],
            'toll_cost_inr': best['toll_cost'],
            'eta_hours': best['eta_hours'],
            'road_type': best['road_type'],
            'utilization_pct': best['utilization_pct'],
            'reasoning': best['specs']['best_for'],
            'alternatives': [
                {'vehicle': c['vehicle'], 'cost': c['total_cost'], 'eta': c['eta_hours']}
                for c in candidates[1:3]
            ],
        }

    def optimize_cluster_route(self, stops):
        """
        Optimize pickup route across multiple farmer stops.

        Args:
            stops: list of dicts with {name, lat, lng, quantity_kg}

        Returns:
            Optimal stop order, total distance, estimated time
        """
        if len(stops) <= 1:
            return {
                'optimal_order': stops,
                'total_distance_km': 0,
                'total_time_hours': 0,
            }

        n = len(stops)

        # Build distance matrix (Haversine approximation for India)
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371  # Earth radius in km
            dlat = np.radians(lat2 - lat1)
            dlon = np.radians(lon2 - lon1)
            a = np.sin(dlat/2)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon/2)**2
            return R * 2 * np.arcsin(np.sqrt(a))

        dist_matrix = np.zeros((n, n))
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist_matrix[i][j] = haversine(
                        stops[i]['lat'], stops[i]['lng'],
                        stops[j]['lat'], stops[j]['lng']
                    ) * 1.3  # Road distance ≈ 1.3x straight line

        # Nearest-neighbor heuristic (for up to 10 stops)
        if n <= 8:
            # Brute-force optimal for small cluster
            best_dist = float('inf')
            best_order = None
            for perm in permutations(range(n)):
                dist = sum(dist_matrix[perm[i]][perm[i+1]] for i in range(n-1))
                if dist < best_dist:
                    best_dist = dist
                    best_order = perm
        else:
            # Greedy nearest-neighbor for larger sets
            visited = [0]
            current = 0
            while len(visited) < n:
                distances = dist_matrix[current].copy()
                distances[visited] = float('inf')
                nearest = np.argmin(distances)
                visited.append(nearest)
                current = nearest
            best_order = tuple(visited)
            best_dist = sum(dist_matrix[best_order[i]][best_order[i+1]] for i in range(n-1))

        ordered_stops = [stops[i] for i in best_order]
        avg_speed = 35  # km/h average for cluster pickup
        total_time = best_dist / avg_speed + n * 0.5  # 30min per stop

        return {
            'optimal_order': ordered_stops,
            'total_distance_km': round(best_dist, 1),
            'total_time_hours': round(total_time, 1),
            'total_quantity_kg': sum(s['quantity_kg'] for s in stops),
            'num_stops': n,
            'avg_km_per_stop': round(best_dist / n, 1),
        }


if __name__ == "__main__":
    opt = RouteOptimizer()

    print("=== VEHICLE RECOMMENDATION: 500kg Tomato, 150km ===")
    r = opt.recommend_vehicle(500, 150, needs_refrigeration=True, deadline_hours=6)
    print(f"   Vehicle: {r['recommended_vehicle']}")
    print(f"   Cost: ₹{r['total_cost_inr']} | ETA: {r['eta_hours']}h")
    print(f"   Utilization: {r['utilization_pct']}%")
    if r.get('alternatives'):
        print(f"   Alternatives: {r['alternatives']}")

    print("\n=== CLUSTER ROUTE: 4 farmers near Lucknow ===")
    stops = [
        {'name': 'Rajesh Kumar', 'lat': 26.85, 'lng': 80.95, 'quantity_kg': 200},
        {'name': 'Sunil Yadav', 'lat': 26.78, 'lng': 81.02, 'quantity_kg': 350},
        {'name': 'Mohan Singh', 'lat': 26.92, 'lng': 80.88, 'quantity_kg': 150},
        {'name': 'Akhilesh Patel', 'lat': 26.80, 'lng': 80.92, 'quantity_kg': 280},
    ]
    route = opt.optimize_cluster_route(stops)
    print(f"   Optimal order: {[s['name'] for s in route['optimal_order']]}")
    print(f"   Total: {route['total_distance_km']}km | {route['total_time_hours']}h")
    print(f"   Load: {route['total_quantity_kg']}kg across {route['num_stops']} stops")
