import React, { useState } from 'react';
import { MapPin, LocateFixed, Search, Loader2 } from 'lucide-react';

interface MapLocationPickerProps {
  onSelectLocation: (location: string, lat?: number, lng?: number) => void;
}

const DEFAULT_MAP = 'Quezon City, Metro Manila, Philippines';

/**
 * A Google Maps location picker for delivery.
 * Uses the free Google Maps Embed API (`output=embed`), which needs no API key.
 * The customer searches an address or pins their current location, and the map
 * refreshes to display that spot with a marker.
 */
export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [mapQuery, setMapQuery] = useState(DEFAULT_MAP);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed&hl=en`;

  const handleLocate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please type a place or address to pin on the map.');
      return;
    }
    setError('');
    setMapQuery(trimmed);
    onSelectLocation(trimmed);
  };

  const handleUseMyLocation = () => {
    setError('');
    setIsLocating(true);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setQuery(label);
        setMapQuery(`${lat},${lng}`);
        onSelectLocation(`Pinned location (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng);
        setIsLocating(false);
      },
      () => {
        setError('Could not get your location. Please type your address instead.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-700 h-56 bg-slate-950">
        <iframe
          title="Google Maps - Pin your location"
          src={mapSrc}
          className="w-full h-full"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-400 border border-slate-700/60 shadow">
          <MapPin className="w-3 h-3" /> Pin Your Delivery Location
        </div>
      </div>

      {/* Search / Current location controls */}
      <form onSubmit={handleLocate} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, baranggay, city..."
            className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" /> Locate
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5 text-amber-400" />}
          {isLocating ? 'Locating...' : 'My Location'}
        </button>
      </form>

      {error && <p className="text-xs font-medium text-red-400">{error}</p>}

      <p className="text-[10px] text-slate-500">
        Tip: type your full address then press <span className="text-amber-400 font-semibold">Locate</span>, or tap{" "}
        <span className="text-amber-400 font-semibold">My Location</span> to pin your current spot. The chosen place is
        saved as the delivery address.
      </p>
    </div>
  );
};
