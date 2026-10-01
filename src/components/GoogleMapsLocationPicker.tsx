import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  Compass,
  RefreshCw,
  Crosshair,
  LocateFixed,
  Sparkles,
  Layers,
  Store,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { CustomerCoordinates } from '../types';

// Default Matcha Avenue Cafe HQ Location (Navarro, General Trias, Cavite)
export const AVENUE_CAFE_COORDINATES: CustomerCoordinates = {
  lat: 14.3857,
  lng: 120.8992,
  label: 'Matcha Avenue Cafe Flagship Store (Crimson Street, Navarro, General Trias)'
};

const POPULAR_LOCATIONS: Array<{ name: string; address: string; coords: CustomerCoordinates }> = [
  {
    name: 'Bonifacio Global City (BGC)',
    address: 'High Street, Bonifacio Global City, Taguig',
    coords: { lat: 14.5515, lng: 121.0510, label: 'BGC High Street, Taguig' }
  },
  {
    name: 'Makati CBD / Ayala',
    address: 'Ayala Avenue, Bel-Air, Makati City',
    coords: { lat: 14.5583, lng: 121.0244, label: 'Makati CBD, Ayala' }
  },
  {
    name: 'Ortigas Center',
    address: 'Emerald Ave, Ortigas Center, Pasig City',
    coords: { lat: 14.5866, lng: 121.0614, label: 'Ortigas Center, Pasig' }
  },
  {
    name: 'Tomas Morato (QC)',
    address: 'Tomas Morato Ave, Quezon City',
    coords: { lat: 14.6333, lng: 121.0367, label: 'Tomas Morato, Quezon City' }
  },
  {
    name: 'Alabang / Filinvest',
    address: 'Filinvest City, Alabang, Muntinlupa',
    coords: { lat: 14.4215, lng: 121.0422, label: 'Alabang Filinvest, Muntinlupa' }
  },
  {
    name: 'Eastwood City',
    address: 'Eastwood City, Libis, Quezon City',
    coords: { lat: 14.6105, lng: 121.0805, label: 'Eastwood City, Libis' }
  }
];

/** Fallback delivery point used before the customer pins anything. */
const DEFAULT_DELIVERY_COORDINATES: CustomerCoordinates = {
  lat: 14.3857,
  lng: 120.8992,
  label: 'Navarro, General Trias'
};

interface GoogleMapsLocationPickerProps {
  /** Current delivery pin (canonical prop). */
  coordinates?: CustomerCoordinates;
  /** Legacy alias kept for backwards compatibility with older call sites. */
  value?: CustomerCoordinates;
  address?: string;
  /** Fired whenever the pin moves (canonical prop). */
  onChangeLocation?: (coords: CustomerCoordinates, suggestedAddress?: string) => void;
  /** Legacy alias kept for backwards compatibility with older call sites. */
  onLocationChange?: (coords: CustomerCoordinates, suggestedAddress?: string) => void;
  /** Read-only display mode (canonical prop). */
  isReadOnly?: boolean;
  /** Legacy alias kept for backwards compatibility with older call sites. */
  readOnly?: boolean;
  showRouteToStore?: boolean;
  /** Zoom level applied when the map is created. */
  defaultZoom?: number;
  /** Explicit CSS height of the map canvas (e.g. "280px"). */
  height?: string;
  className?: string;
}

interface SearchSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const GoogleMapsLocationPicker: React.FC<GoogleMapsLocationPickerProps> = ({
  coordinates,
  value,
  address = '',
  onChangeLocation,
  onLocationChange,
  isReadOnly = false,
  readOnly = false,
  showRouteToStore = true,
  defaultZoom = 15,
  height,
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Canonical values (the legacy prop names are still accepted).
  const activeCoordinates = coordinates ?? value ?? DEFAULT_DELIVERY_COORDINATES;
  const readOnlyMode = isReadOnly || readOnly;

  /**
   * Leaflet event handlers are created once when the map mounts, so they must
   * read the latest props through this ref. Without it a map click/drag could
   * call a missing callback (e.g. "onChangeLocation is not a function") and the
   * delivery address would silently never update.
   */
  const latestRef = useRef<{
    notify: (coords: CustomerCoordinates, suggestedAddress?: string) => void;
    address: string;
    readOnlyMode: boolean;
    showRouteToStore: boolean;
    defaultZoom: number;
  }>({
    notify: () => {},
    address,
    readOnlyMode,
    showRouteToStore,
    defaultZoom
  });

  latestRef.current = {
    notify: onChangeLocation ?? onLocationChange ?? (() => {}),
    address,
    readOnlyMode,
    showRouteToStore,
    defaultZoom
  };

  /** Always notifies the newest callback supplied by the parent. */
  const notifyChange = (coords: CustomerCoordinates, suggestedAddress?: string) => {
    latestRef.current.notify(coords, suggestedAddress);
  };

  const [currentCoords, setCurrentCoords] = useState<CustomerCoordinates>(activeCoordinates);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapLayer, setMapLayer] = useState<'google_streets' | 'google_sat' | 'osm'>('google_streets');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync the pin whenever the parent supplies new coordinates
  useEffect(() => {
    if (typeof activeCoordinates.lat !== 'number' || typeof activeCoordinates.lng !== 'number') return;
    setCurrentCoords(activeCoordinates);
    if (mapInstanceRef.current && customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([activeCoordinates.lat, activeCoordinates.lng]);
      updateRouteLine(activeCoordinates.lat, activeCoordinates.lng);
    }
  }, [activeCoordinates.lat, activeCoordinates.lng]);

  // Distance calculation helper
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const distanceKm = calculateDistanceKm(
    AVENUE_CAFE_COORDINATES.lat,
    AVENUE_CAFE_COORDINATES.lng,
    currentCoords.lat,
    currentCoords.lng
  );

  // Estimated delivery time
  const estimatedMins = Math.max(15, Math.round(Number(distanceKm) * 3.5 + 10));

  // Reverse Geocoding helper
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
        const suburb = addr.suburb || addr.district || addr.quarter || '';
        const city = addr.city || addr.town || addr.municipality || 'Metro Manila';
        const parts = [road, suburb, city].filter(Boolean);
        if (parts.length > 0) {
          return parts.join(', ');
        }
        return data.display_name?.split(',').slice(0, 3).join(',') || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Helper to update dashed route polyline
  const updateRouteLine = (targetLat: number, targetLng: number) => {
    if (!mapInstanceRef.current || !showRouteToStore) return;
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        [AVENUE_CAFE_COORDINATES.lat, AVENUE_CAFE_COORDINATES.lng],
        [targetLat, targetLng]
      ]);
    }
  };

  // Tile layer URL resolver
  const getTileUrl = (layer: typeof mapLayer) => {
    switch (layer) {
      case 'google_sat':
        // Google hybrid imagery (satellite + road labels)
        return 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=en';
      case 'osm':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'google_streets':
      default:
        return 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en';
    }
  };

  /** Google tiles are served from mt0-mt3; OSM uses a/b/c. */
  const getTileSubdomains = (layer: typeof mapLayer) =>
    layer === 'osm' ? ['a', 'b', 'c'] : ['mt0', 'mt1', 'mt2', 'mt3'];

  /** Creates (or swaps) the tile layer for the selected map style. */
  const applyTileLayer = (map: L.Map, layer: typeof mapLayer) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    tileLayerRef.current = L.tileLayer(getTileUrl(layer), {
      maxZoom: 20,
      subdomains: getTileSubdomains(layer)
    }).addTo(map);
  };

  // Initialize the Leaflet map with Google Maps tile layers
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const initialLat = currentCoords.lat || AVENUE_CAFE_COORDINATES.lat;
    const initialLng = currentCoords.lng || AVENUE_CAFE_COORDINATES.lng;
    const isEditable = !readOnlyMode;

    const map = L.map(container, {
      center: [initialLat, initialLng],
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom SVG Customer Delivery Pin Icon (Amber/Red pin)
    const customerIcon = L.divIcon({
      className: 'custom-customer-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="background: linear-gradient(135deg, #f59e0b, #ef4444); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold; color: white;">📍</span>
          </div>
          <div style="background: rgba(0,0,0,0.85); color: #fbbf24; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; margin-top: 4px; border: 1px solid rgba(245,158,11,0.4); white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
            Delivery Pin
          </div>
        </div>
      `,
      iconSize: [34, 52],
      iconAnchor: [17, 34]
    });

    // Custom Store Pin Icon (Gold Store Badge)
    const storeIcon = L.divIcon({
      className: 'custom-store-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold; color: white;">🍵</span>
          </div>
          <div style="background: rgba(0,0,0,0.85); color: #34d399; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; margin-top: 4px; border: 1px solid rgba(16,185,129,0.4); white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.6);">
            Matcha Avenue Cafe Navarro
          </div>
        </div>
      `,
      iconSize: [34, 52],
      iconAnchor: [17, 34]
    });

    // Add Store Marker
    if (showRouteToStore) {
      const storeMarker = L.marker([AVENUE_CAFE_COORDINATES.lat, AVENUE_CAFE_COORDINATES.lng], {
        icon: storeIcon
      })
        .addTo(map)
        .bindPopup('<b>Matcha Avenue Cafe Flagship Store</b><br>Crimson Street, Navarro, General Trias');
      storeMarkerRef.current = storeMarker;

      // Add Dashed Route Line
      const routeLine = L.polyline(
        [
          [AVENUE_CAFE_COORDINATES.lat, AVENUE_CAFE_COORDINATES.lng],
          [initialLat, initialLng]
        ],
        {
          color: '#f59e0b',
          weight: 3.5,
          opacity: 0.8,
          dashArray: '6, 8',
          lineCap: 'round'
        }
      ).addTo(map);
      routeLineRef.current = routeLine;
    }

    // Add Customer Draggable Marker
    const customerMarker = L.marker([initialLat, initialLng], {
      icon: customerIcon,
      draggable: isEditable
    }).addTo(map);
    customerMarkerRef.current = customerMarker;

    /** Applies a pin dropped by click/drag and resolves its street address. */
    const applyPin = async (lat: number, lng: number, pinAction: 'placed' | 'moved') => {
      updateRouteLine(lat, lng);
      const reverseName = await reverseGeocode(lat, lng);
      const resolvedCoords: CustomerCoordinates = {
        lat,
        lng,
        label: reverseName || `Pin at (${lat}, ${lng})`
      };

      setCurrentCoords(resolvedCoords);
      notifyChange(resolvedCoords, reverseName || undefined);
      setGeoSuccess(`Pin ${pinAction} at: ${resolvedCoords.label}`);
      setTimeout(() => setGeoSuccess(null), 3500);
    };

    // Handle Marker Drag End
    if (isEditable) {
      customerMarker.on('dragend', (e) => {
        if (latestRef.current.readOnlyMode) return;
        const latLng = (e.target as L.Marker).getLatLng();
        void applyPin(Number(latLng.lat.toFixed(5)), Number(latLng.lng.toFixed(5)), 'moved');
      });

      // Handle Map Click to Drop Pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (latestRef.current.readOnlyMode) return;
        const lat = Number(e.latlng.lat.toFixed(5));
        const lng = Number(e.latlng.lng.toFixed(5));
        customerMarker.setLatLng([lat, lng]);
        void applyPin(lat, lng, 'placed');
      });
    }

    mapInstanceRef.current = map;

    /**
     * Leaflet caches the container size, so a map created inside a modal (or one
     * that was hidden while its animation ran) paints blank tiles until it
     * recalculates the size.
     */
    const invalidate = () => map.invalidateSize({ animate: false });
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(invalidate);
      resizeObserver.observe(container);
    }
    const sizeTimer = window.setTimeout(invalidate, 250);

    // Full teardown: reopening the modal must always build a fresh, working map.
    return () => {
      window.clearTimeout(sizeTimer);
      if (resizeObserver) resizeObserver.disconnect();
      map.off();
      map.remove();
      mapInstanceRef.current = null;
      customerMarkerRef.current = null;
      storeMarkerRef.current = null;
      routeLineRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Swap the tile layer whenever the user selects a different map style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyTileLayer(map, mapLayer);
  }, [mapLayer]);

  // Keep Leaflet in sync while the map expands/collapses
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => map.invalidateSize({ animate: false }), 220);
    return () => window.clearTimeout(timer);
  }, [isExpanded]);

  // Use Current Location Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);
    setGeoSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const accuracy = Math.round(pos.coords.accuracy || 15);

        const reverseName = await reverseGeocode(lat, lng);
        const resolvedLabel = reverseName || `GPS: ${lat}, ${lng}`;

        const detected: CustomerCoordinates = {
          lat,
          lng,
          label: resolvedLabel
        };

        setCurrentCoords(detected);
        notifyChange(detected, reverseName || address || `Current Location (${lat}, ${lng})`);

        // Fly map smoothly to current location
        if (mapInstanceRef.current && customerMarkerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          customerMarkerRef.current.setLatLng([lat, lng]);
          updateRouteLine(lat, lng);
        }

        setIsLocating(false);
        setGeoSuccess(`Current location locked! (~${accuracy}m precision)`);
        setTimeout(() => setGeoSuccess(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve GPS location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please enable browser location permissions.';
        } else if (err.code === 2) {
          msg = 'Position unavailable. Please search or tap on the map.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Autocomplete Suggestion Query
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = `${searchQuery.trim()}, Philippines`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=ph&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data: SearchSuggestion[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (sug: SearchSuggestion) => {
    const lat = Number(Number(sug.lat).toFixed(5));
    const lng = Number(Number(sug.lon).toFixed(5));
    const cleanLabel = sug.display_name.split(',').slice(0, 3).join(', ');

    const newCoords: CustomerCoordinates = {
      lat,
      lng,
      label: cleanLabel
    };

    setCurrentCoords(newCoords);
    notifyChange(newCoords, cleanLabel);
    setSearchQuery('');
    setShowSuggestions(false);

    if (mapInstanceRef.current && customerMarkerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      customerMarkerRef.current.setLatLng([lat, lng]);
      updateRouteLine(lat, lng);
    }
  };

  const handleSelectPreset = (preset: (typeof POPULAR_LOCATIONS)[0]) => {
    setCurrentCoords(preset.coords);
    notifyChange(preset.coords, preset.address);
    setGeoError(null);
    setGeoSuccess(null);

    if (mapInstanceRef.current && customerMarkerRef.current) {
      mapInstanceRef.current.flyTo([preset.coords.lat, preset.coords.lng], 16, {
        animate: true,
        duration: 1.2
      });
      customerMarkerRef.current.setLatLng([preset.coords.lat, preset.coords.lng]);
      updateRouteLine(preset.coords.lat, preset.coords.lng);
    }
  };

  // Google Maps Direct URLs
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentCoords.lat},${currentCoords.lng}`;
  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${AVENUE_CAFE_COORDINATES.lat},${AVENUE_CAFE_COORDINATES.lng}&destination=${currentCoords.lat},${currentCoords.lng}`;

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden space-y-3 p-3 sm:p-4 text-stone-900">
      
      {/* 1. Primary "Use Current Location" GPS Action Banner */}
      {!readOnlyMode && (
        <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
              <LocateFixed className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                <span>Google Maps GPS Location</span>
                <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded font-mono font-medium">
                  Pin Drop
                </span>
              </span>
              <span className="text-[11px] text-stone-600 block">
                Auto-detect your location or drag the pin on the map.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-75 shadow-xs"
          >
            {isLocating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5 text-white" />
                <span>Use Current Location</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 2. Map Header & Distance Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
            <MapPin className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
              <span>Delivery Coordinates</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-semibold">
                {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
              </span>
            </h4>
            <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <span>~{distanceKm} km from Flagship</span>
              <span className="text-stone-300">•</span>
              <span className="text-amber-800 font-semibold">~{estimatedMins} mins dispatch</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <a
            href={showRouteToStore ? googleMapsDirectionsUrl : googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            title="Open in Google Maps"
          >
            <span>Open Maps</span>
            <ExternalLink className="w-3 h-3 text-amber-700" />
          </a>
        </div>
      </div>

      {/* 3. Feedback Alerts */}
      {geoSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{geoSuccess}</span>
        </div>
      )}

      {geoError && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {/* 4. Live Search Input with Instant Autocomplete */}
      {!readOnlyMode && (
        <div className="relative">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search any place in Metro Manila (e.g. Greenbelt, Ortigas)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="w-full bg-white text-xs text-stone-900 placeholder-stone-400 pl-8 pr-8 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-600"
              />
              {isSearching && (
                <RefreshCw className="w-3 h-3 absolute right-3 top-2.5 text-amber-600 animate-spin" />
              )}
            </div>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
              {suggestions.map((sug) => (
                <button
                  key={sug.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-amber-50 hover:text-amber-900 border-b border-stone-100 last:border-0 flex items-start gap-2 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="truncate">{sug.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Interactive Leaflet map canvas with Google Maps tile layers */}
      <div className={`relative w-full rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-xs ${className}`}>
        <div
          ref={mapContainerRef}
          className={`w-full transition-all duration-300 ${
            height ? '' : isExpanded ? 'h-96' : 'h-64 sm:h-72'
          }`}
          style={{ zIndex: 1, ...(height ? { height } : {}) }}
        />

        {/* Top-Left: Live Location Status & Distance Overlay */}
        <div className="absolute top-2 left-2 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200 shadow-md text-[11px] flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-stone-900 max-w-[140px] sm:max-w-[200px] truncate">
            {currentCoords.label || (address ? address.slice(0, 30) : 'Delivery Pin')}
          </span>
          <span className="text-amber-800 font-mono font-bold bg-amber-50 px-1 py-0.5 rounded text-[10px]">
            ~{distanceKm} km
          </span>
        </div>

        {/* Top-Right: Map Layer Selector & Expand Button */}
        <div className="absolute top-2 right-12 z-20 flex items-center gap-1">
          <div className="bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200 flex gap-0.5 shadow-md">
            <button
              type="button"
              onClick={() => setMapLayer('google_streets')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                mapLayer === 'google_streets'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('google_sat')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                mapLayer === 'google_sat'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapLayer('osm')}
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                mapLayer === 'osm'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              OSM
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-white/95 backdrop-blur-xs hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200 shadow-md text-[10px]"
            title={isExpanded ? 'Collapse Map' : 'Expand Map'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Floating Quick GPS Button directly inside Map */}
        {!readOnlyMode && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="absolute bottom-3 right-3 z-20 bg-amber-600 hover:bg-amber-700 text-white p-2.5 rounded-full shadow-lg border border-white transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            title="Snap to Current GPS Location"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* Bottom-Left Instruction Badge + Map data attribution */}
        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 pointer-events-none">
          {!readOnlyMode && (
            <span className="bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-stone-200 text-[10px] text-stone-600 shadow-xs">
              Click or drag the pin to your delivery address
            </span>
          )}
          <span className="bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-stone-200 text-[9px] text-stone-500 shadow-xs">
            {mapLayer === 'osm' ? '© OpenStreetMap' : '© Google'}
          </span>
        </div>
      </div>

      {/* 6. Quick Delivery Hub Presets */}
      {!readOnlyMode && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-700" /> Quick Pin Popular Hubs:
          </span>
          <div className="flex flex-wrap gap-1">
            {POPULAR_LOCATIONS.map((preset) => {
              const isSelected =
                Math.abs(currentCoords.lat - preset.coords.lat) < 0.001 &&
                Math.abs(currentCoords.lng - preset.coords.lng) < 0.001;

              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
