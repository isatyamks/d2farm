"use client";
import { useState, useEffect, useRef } from 'react';
import { getCurrentPosition, getAccuracyLevel } from '@/lib/geolocation';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const window: any;

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<string>('');
  const [coords, setCoords] = useState({ lat: initialLat || 19.076, lng: initialLng || 72.8777 });
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet dynamically (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    const loadLeaflet = async () => {
      // Inject Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject Leaflet JS
      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      // Wait for L to be available
      await new Promise<void>((resolve) => {
        const check = () => {
          if (window.L) resolve();
          else setTimeout(check, 100);
        };
        check();
      });

      initMap();
    };

    const initMap = () => {
      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 15);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Custom green marker
      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: '',
      });

      const marker = L.marker([coords.lat, coords.lng], { icon, draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        onLocationSelect(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      setMapReady(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAutoLocate = async () => {
    setLoading(true);
    try {
      const pos = await getCurrentPosition();
      const level = getAccuracyLevel(pos.accuracy);
      setAccuracy(`${Math.round(pos.accuracy)}m (${level})`);
      setCoords({ lat: pos.latitude, lng: pos.longitude });
      onLocationSelect(pos.latitude, pos.longitude);


      if (mapInstanceRef.current && markerRef.current) {
        const map = mapInstanceRef.current as any;
        const marker = markerRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        map.setView([pos.latitude, pos.longitude], 17);
        marker.setLatLng([pos.latitude, pos.longitude]);

        // Add accuracy circle
        const L = window.L;
        L.circle([pos.latitude, pos.longitude], {
          radius: pos.accuracy,
          color: 'var(--primary)',
          fillColor: 'var(--primary)',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      }

    } catch (err) {
      const error = err as { message: string };
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <div ref={mapRef} className="map-container" style={{ marginBottom: '0.75rem' }}>
        {!mapReady && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-bg)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Loading map...
          </div>
        )}
      </div>

      <button
        className="btn-big btn-secondary"
        onClick={handleAutoLocate}
        disabled={loading}
        id="auto-locate-btn"
        style={{ marginBottom: '0.5rem' }}
      >
        {loading ? (
          <>
            <span className="spinner spinner-dark" />
            Detecting GPS...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M2 12h2" /><path d="M20 12h2" />
            </svg>
            Use My Current Location
          </>
        )}
      </button>

      {accuracy && (
        <div style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', marginBottom: '0.5rem' }}>
          GPS Accuracy: <strong style={{ color: accuracy.includes('excellent') ? '#16A34A' : accuracy.includes('good') ? '#D97706' : '#DC2626' }}>{accuracy}</strong>
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center' }}>
        📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
      </div>
    </div>
  );
}
