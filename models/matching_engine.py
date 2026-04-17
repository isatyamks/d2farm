"""
Matching Engine
===============
Demand ↔ Supply matching with risk-aware multi-farmer allocation.

Core algorithm:
    1. Score all available farmer listings against a buyer order
    2. Allocate across multiple farmers (no single point of failure)
    3. Apply over-allocation buffer (120-130%) based on reliability
    4. Re-balance in real-time if a farmer defaults

Used by:
    - proposalRoutes (backend → automated proposal generation)
    - matchRoutes (backend → buyer-farmer matching API)
    - FarmerProposals (buyer dashboard → proposal review)
    - ProposalCenter (farmer app → incoming matches)
"""

import numpy as np
from typing import List, Dict


class MatchingEngine:
    """
    Multi-variable matching optimizer that allocates buyer demand
    across multiple farmers while minimizing total risk.

    Matching Variables:
        - Crop compatibility (exact match required)
        - Quantity fit (farmer capacity vs order need)
        - Location proximity (distance to buyer)
        - Farmer reliability (supply confidence tier)
        - Price competitiveness (farmer price vs market rate)
        - Quality grade (A/B/C mapping to buyer requirements)
        - Delivery timeline (harvest date vs buyer deadline)

    Constraints:
        - Total allocation = 120-130% of order quantity (buffer)
        - No single farmer > 60% of order (de-risk)
        - Minimum 2 farmers per order (redundancy)
    """

    def __init__(self, buffer_pct=25, max_single_farmer_pct=60,
                 min_farmers=2):
        self.buffer_pct = buffer_pct
        self.max_single_farmer_pct = max_single_farmer_pct
        self.min_farmers = min_farmers

    def _compute_match_score(self, order, listing):
        """
        Compute a composite match score between a buyer order
        and a farmer listing.

        Returns: score (0-100), higher = better match
        """
        score = 0
        weights = {
            'crop': 25,       # Must match
            'quantity': 20,    # Capacity fit
            'distance': 15,   # Proximity
            'reliability': 15, # Farmer tier
            'price': 15,      # Competitiveness
            'quality': 10,    # Grade match
        }

        # 1. Crop match (binary — hard constraint)
        if order['crop'].lower() != listing['crop'].lower():
            return 0  # No match
        score += weights['crop']

        # 2. Quantity fit (penalize if farmer can't cover at least 15%)
        coverage = listing['available_kg'] / order['quantity_kg']
        if coverage < 0.15:
            return 0  # Too small to matter
        quantity_score = min(1.0, coverage) * weights['quantity']
        score += quantity_score

        # 3. Distance (closer = better, exponential decay)
        dist = listing.get('distance_km', 100)
        distance_score = max(0, (1 - dist / 500)) * weights['distance']
        score += distance_score

        # 4. Reliability (farmer confidence tier)
        reliability_map = {'HIGH': 1.0, 'MODERATE': 0.6, 'LOW': 0.3}
        reliability = reliability_map.get(listing.get('reliability_tier', 'MODERATE'), 0.5)
        score += reliability * weights['reliability']

        # 5. Price competitiveness (lower farmer price = better for buyer)
        if listing.get('price_per_kg') and order.get('max_price_per_kg'):
            price_ratio = listing['price_per_kg'] / order['max_price_per_kg']
            price_score = max(0, (1.2 - price_ratio)) * weights['price']
            score += price_score
        else:
            score += weights['price'] * 0.5  # Neutral if no price data

        # 6. Quality grade
        grade_map = {'A': 1.0, 'B': 0.7, 'C': 0.4, 'Rejected': 0}
        quality = grade_map.get(listing.get('quality_grade', 'B'), 0.5)
        min_grade = grade_map.get(order.get('min_quality', 'C'), 0.4)
        if quality < min_grade:
            return 0  # Below minimum quality
        score += quality * weights['quality']

        return round(score, 1)

    def match(self, order: Dict, listings: List[Dict]) -> Dict:
        """
        Match a buyer order against available farmer listings.

        Args:
            order: {crop, quantity_kg, max_price_per_kg, min_quality, deadline}
            listings: [{farmer_id, crop, available_kg, price_per_kg,
                       distance_km, reliability_tier, quality_grade}]

        Returns:
            dict with matched_farmers, allocation, buffer, risk_assessment
        """
        target_qty = order['quantity_kg']
        buffer_qty = target_qty * (1 + self.buffer_pct / 100)
        max_per_farmer = target_qty * (self.max_single_farmer_pct / 100)

        # Score all listings
        scored = []
        for listing in listings:
            score = self._compute_match_score(order, listing)
            if score > 0:
                scored.append({**listing, '_match_score': score})

        # Sort by score (best first)
        scored.sort(key=lambda x: x['_match_score'], reverse=True)

        if len(scored) < self.min_farmers:
            return {
                'status': 'INSUFFICIENT_SUPPLY',
                'matched_count': len(scored),
                'message': f"Need at least {self.min_farmers} farmers, found {len(scored)}",
                'available_farmers': scored,
            }

        # Greedy allocation with constraints
        allocations = []
        remaining = buffer_qty

        for farmer in scored:
            if remaining <= 0:
                break

            # Cap allocation per farmer
            alloc = min(
                farmer['available_kg'],
                max_per_farmer,
                remaining
            )

            if alloc < target_qty * 0.05:  # Skip if less than 5% of order
                continue

            allocations.append({
                'farmer_id': farmer['farmer_id'],
                'farmer_name': farmer.get('farmer_name', 'Unknown'),
                'allocated_kg': round(alloc),
                'price_per_kg': farmer.get('price_per_kg', 0),
                'match_score': farmer['_match_score'],
                'reliability': farmer.get('reliability_tier', 'MODERATE'),
                'quality_grade': farmer.get('quality_grade', 'B'),
                'distance_km': farmer.get('distance_km', 0),
            })

            remaining -= alloc

        total_allocated = sum(a['allocated_kg'] for a in allocations)

        # Risk assessment
        high_reliability = sum(1 for a in allocations if a['reliability'] == 'HIGH')
        avg_score = np.mean([a['match_score'] for a in allocations]) if allocations else 0

        fulfillment_probability = min(98, (
            (total_allocated / target_qty) * 30
            + (high_reliability / max(len(allocations), 1)) * 30
            + avg_score * 0.4
        ))

        return {
            'status': 'MATCHED' if total_allocated >= target_qty else 'PARTIAL_MATCH',
            'order_quantity_kg': target_qty,
            'total_allocated_kg': round(total_allocated),
            'buffer_pct': round((total_allocated / target_qty - 1) * 100, 1),
            'num_farmers': len(allocations),
            'allocations': allocations,
            'fulfillment_probability': round(fulfillment_probability, 1),
            'risk_level': (
                'LOW' if fulfillment_probability > 85
                else 'MEDIUM' if fulfillment_probability > 65
                else 'HIGH'
            ),
            'weighted_avg_price': round(
                sum(a['allocated_kg'] * a['price_per_kg'] for a in allocations)
                / max(total_allocated, 1), 2
            ),
            'fallback': 'Mandi spot purchase' if total_allocated < target_qty else None,
        }

    def rebalance(self, current_allocations, defaulted_farmer_id, order):
        """
        Re-allocate when a farmer defaults.

        Redistributes the defaulted farmer's share across remaining
        HIGH-reliability farmers.
        """
        defaulted = [a for a in current_allocations if a['farmer_id'] == defaulted_farmer_id]
        if not defaulted:
            return current_allocations

        shortfall = defaulted[0]['allocated_kg']
        remaining = [a for a in current_allocations if a['farmer_id'] != defaulted_farmer_id]

        # Distribute proportionally to reliability-weighted capacity
        high_rel = [a for a in remaining if a['reliability'] == 'HIGH']
        targets = high_rel if high_rel else remaining

        total_capacity = sum(a['allocated_kg'] for a in targets)

        for alloc in targets:
            extra = shortfall * (alloc['allocated_kg'] / max(total_capacity, 1))
            alloc['allocated_kg'] = round(alloc['allocated_kg'] + extra)
            alloc['rebalanced'] = True

        return {
            'status': 'REBALANCED',
            'defaulted_farmer': defaulted_farmer_id,
            'shortfall_kg': shortfall,
            'redistributed_to': len(targets),
            'updated_allocations': remaining,
        }


if __name__ == "__main__":
    engine = MatchingEngine(buffer_pct=25, max_single_farmer_pct=60)

    order = {
        'crop': 'Tomato',
        'quantity_kg': 1000,
        'max_price_per_kg': 22,
        'min_quality': 'B',
    }

    listings = [
        {'farmer_id': 'F001', 'farmer_name': 'Rajesh Kumar', 'crop': 'Tomato',
         'available_kg': 400, 'price_per_kg': 18, 'distance_km': 45,
         'reliability_tier': 'HIGH', 'quality_grade': 'A'},
        {'farmer_id': 'F002', 'farmer_name': 'Sunil Yadav', 'crop': 'Tomato',
         'available_kg': 600, 'price_per_kg': 20, 'distance_km': 80,
         'reliability_tier': 'MODERATE', 'quality_grade': 'B'},
        {'farmer_id': 'F003', 'farmer_name': 'Mohan Singh', 'crop': 'Tomato',
         'available_kg': 350, 'price_per_kg': 16, 'distance_km': 30,
         'reliability_tier': 'HIGH', 'quality_grade': 'A'},
        {'farmer_id': 'F004', 'farmer_name': 'Akhilesh Patel', 'crop': 'Tomato',
         'available_kg': 200, 'price_per_kg': 21, 'distance_km': 120,
         'reliability_tier': 'LOW', 'quality_grade': 'B'},
        {'farmer_id': 'F005', 'farmer_name': 'Vijay Sharma', 'crop': 'Onion',
         'available_kg': 800, 'price_per_kg': 22, 'distance_km': 50,
         'reliability_tier': 'HIGH', 'quality_grade': 'A'},
    ]

    print("=== MATCHING: 1000kg Tomato Order ===")
    result = engine.match(order, listings)
    print(f"   Status: {result['status']}")
    print(f"   Allocated: {result['total_allocated_kg']}kg ({result['buffer_pct']}% buffer)")
    print(f"   Farmers: {result['num_farmers']}")
    print(f"   Fulfillment probability: {result['fulfillment_probability']}%")
    print(f"   Risk: {result['risk_level']}")
    print(f"   Avg price: ₹{result['weighted_avg_price']}/kg")

    for a in result['allocations']:
        print(f"     → {a['farmer_name']}: {a['allocated_kg']}kg "
              f"(score: {a['match_score']}, {a['reliability']}, Grade {a['quality_grade']})")

    print("\n=== REBALANCE: F002 defaults ===")
    rebalanced = engine.rebalance(result['allocations'], 'F002', order)
    print(f"   Shortfall: {rebalanced['shortfall_kg']}kg → redistributed to {rebalanced['redistributed_to']} farmers")
    for a in rebalanced['updated_allocations']:
        extra = " [REBALANCED]" if a.get('rebalanced') else ""
        print(f"     → {a['farmer_name']}: {a['allocated_kg']}kg{extra}")
