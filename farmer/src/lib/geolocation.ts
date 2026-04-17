// ─────────────────────────────────────────────────────
// Geolocation Helper
// Auto-detect farmer's GPS position for farm-gate accuracy
// ─────────────────────────────────────────────────────

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  timestamp: number;
}

export interface GeoError {
  code: number;
  message: string;
}

/**
 * Get the farmer's current GPS position.
 * Uses high-accuracy mode for farm-gate precision.
 */
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 0, message: 'Geolocation is not supported by this device.' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = 'Unable to determine your location.';
        switch (error.code) {
          case 1: message = 'Location permission denied. Please enable GPS in settings.'; break;
          case 2: message = 'Location unavailable. Please check your GPS signal.'; break;
          case 3: message = 'Location request timed out. Please try again.'; break;
        }
        reject({ code: error.code, message });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Watch position continuously (for real-time map updates).
 */
export function watchPosition(
  onSuccess: (pos: GeoPosition) => void,
  onError: (err: GeoError) => void
): number {
  if (!navigator.geolocation) {
    onError({ code: 0, message: 'Geolocation not supported.' });
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      onError({ code: error.code, message: error.message });
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    }
  );
}

/**
 * Stop watching position.
 */
export function clearWatch(watchId: number): void {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Check if accuracy is good enough for farm-gate verification.
 * < 50m is good, < 100m is acceptable, > 100m is poor.
 */
export function getAccuracyLevel(accuracy: number): 'excellent' | 'good' | 'poor' {
  if (accuracy < 30) return 'excellent';
  if (accuracy < 100) return 'good';
  return 'poor';
}
