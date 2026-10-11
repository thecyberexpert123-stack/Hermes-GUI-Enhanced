/**
 * God's Eye View - Geospatial Intelligence & OSINT Integration Core
 * Controls connection, geocoding, URL hash coordinate building, and window launching
 * for ~/gods-eye-view (Cesium 3D Globe, Live ADS-B aircraft, AIS ships, Satellites).
 */

export interface GeoLocation {
  name: string;
  lat: number;
  lon: number;
  alt?: number;
  pitch?: number;
  heading?: number;
  formattedAddress?: string;
  category?: 'military' | 'chokepoint' | 'capital' | 'landmark' | 'maritime' | 'custom';
}

export const GODS_EYE_DEFAULT_URL = 'http://localhost:4173';

export const GODS_EYE_PRESETS: GeoLocation[] = [
  {
    name: 'Area 51, Nevada',
    lat: 37.2431,
    lon: -115.7930,
    alt: 2500,
    pitch: -45,
    formattedAddress: 'Groom Lake / Area 51, Nevada, United States',
    category: 'military',
  },
  {
    name: 'The Pentagon',
    lat: 38.8719,
    lon: -77.0563,
    alt: 850,
    pitch: -40,
    formattedAddress: 'The Pentagon, Arlington, Virginia, United States',
    category: 'military',
  },
  {
    name: 'Taiwan Strait',
    lat: 24.0,
    lon: 119.5,
    alt: 85000,
    pitch: -60,
    formattedAddress: 'Taiwan Strait, East Asia',
    category: 'chokepoint',
  },
  {
    name: 'Strait of Hormuz',
    lat: 26.5667,
    lon: 56.25,
    alt: 45000,
    pitch: -55,
    formattedAddress: 'Strait of Hormuz, Persian Gulf',
    category: 'chokepoint',
  },
  {
    name: 'Suez Canal',
    lat: 30.5852,
    lon: 32.2654,
    alt: 12000,
    pitch: -45,
    formattedAddress: 'Suez Canal, Egypt',
    category: 'chokepoint',
  },
  {
    name: 'The Kremlin, Moscow',
    lat: 55.7520,
    lon: 37.6175,
    alt: 750,
    pitch: -35,
    formattedAddress: 'Moscow Kremlin, Moscow, Russia',
    category: 'capital',
  },
  {
    name: 'Cape Canaveral Space Force Station',
    lat: 28.3922,
    lon: -80.6077,
    alt: 3500,
    pitch: -45,
    formattedAddress: 'Cape Canaveral, Florida, United States',
    category: 'military',
  },
  {
    name: 'Tokyo Tower, Minato City',
    lat: 35.6586,
    lon: 139.7454,
    alt: 650,
    pitch: -35,
    formattedAddress: 'Tokyo Tower, Tokyo, Japan',
    category: 'landmark',
  },
  {
    name: 'Eiffel Tower, Paris',
    lat: 48.8584,
    lon: 2.2945,
    alt: 600,
    pitch: -35,
    formattedAddress: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    category: 'landmark',
  },
  {
    name: 'United States',
    lat: 39.7837,
    lon: -100.4459,
    alt: 5000000,
    pitch: -85,
    formattedAddress: 'United States of America',
    category: 'country',
  },
  {
    name: 'New Delhi',
    lat: 28.6139,
    lon: 77.2090,
    alt: 25000,
    pitch: -55,
    formattedAddress: 'New Delhi, Delhi, India',
    category: 'capital',
  },
];

/**
 * Builds standard God's Eye View URL with hash coordinates
 */
export function buildGodsEyeUrl(
  lat?: number,
  lon?: number,
  alt = 1500,
  options: {
    pitch?: number;
    heading?: number;
    embed?: boolean;
    style?: string;
  } = {}
): string {
  const base = GODS_EYE_DEFAULT_URL;
  const embedParam = options.embed ? '?embed=1' : '';

  if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return `${base}/${embedParam}`;
  }

  const pitch = options.pitch ?? -45;
  const heading = options.heading ?? 0;
  const hash = `lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&alt=${Math.round(alt)}&pitch=${pitch}&heading=${heading}`;

  return `${base}/${embedParam}#${hash}`;
}

/**
 * Route God's Eye strictly to the In-UI Cybernetic Window with Earth-to-Location tracing
 * (Never open external popups or standalone browser windows)
 */
export function openGodsEyeExternalWindow(targetOrUrl?: any): Window | null {
  if (typeof window === 'undefined') return null;
  const detail = typeof targetOrUrl === 'object' ? targetOrUrl : { name: 'OSINT Target' };
  window.dispatchEvent(new CustomEvent('hermes:open-godseye', { detail: { target: detail } }));
  return null;
}

export interface ResolvedTarget {
  name: string;
  lat: number;
  lon: number;
  alt: number;
  pitch: number;
  heading: number;
  formattedAddress: string;
  source: 'preset' | 'gods-eye-local' | 'nominatim' | 'photon';
  category?: 'country' | 'city' | 'capital' | 'landmark' | 'chokepoint' | 'military' | 'custom';
  details?: string;
  externalUrl: string;
  embedUrl: string;
}

/**
 * Strips conversational filler, prefixes, and suffixes from geospatial queries
 */
export function cleanGeographicQuery(input: string): string {
  if (!input) return '';
  let q = input.trim();
  // Strip trailing punctuation like ?, !, .
  q = q.replace(/[?.!]+$/, '').trim();
  // Strip conversational suffixes like "using gods eye", "on gods eye", "in gods eye", "with gods eye", "via gods eye", "in godseye", "gods eye view"
  q = q.replace(/\s+(?:using|on|in|with|via)\s+god'?s\s*eye(?:\s*view)?.*$/i, '').trim();
  q = q.replace(/\s+god'?s\s*eye(?:\s*view)?.*$/i, '').trim();
  // Strip leading conversational phrases
  q = q.replace(/^(?:where\s+is|locate|find|show\s+me(?:\s+the\s+location\s+of)?|now\s+show(?:\s+me)?|show\s+the\s+entire|show\s+the|show|fly\s+to|take\s+me\s+to|navigate\s+to|coordinates\s+of|search\s+for|view)\s+/i, '').trim();
  // Strip quotes
  q = q.replace(/^["'`]|["'`]$/g, '').trim();

  // Normalize common country aliases to canonical names
  const lower = q.toLowerCase();
  const COUNTRY_ALIASES: Record<string, string> = {
    'usa': 'United States',
    'us': 'United States',
    'u.s.a.': 'United States',
    'u.s.': 'United States',
    'america': 'United States',
    'uk': 'United Kingdom',
    'u.k.': 'United Kingdom',
    'uae': 'United Arab Emirates',
  };
  if (COUNTRY_ALIASES[lower]) {
    return COUNTRY_ALIASES[lower];
  }
  return q;
}

/**
 * Resolves location name to 3D coordinates, altitudes, addresses, and God's Eye URLs
 */
export async function resolveLocationCoordinates(query: string): Promise<ResolvedTarget> {
  const clean = cleanGeographicQuery(query);
  const lower = clean.toLowerCase();

  // 1. Check curated presets first (exact or base name match)
  const presetMatch = GODS_EYE_PRESETS.find((p) => {
    const pName = p.name.toLowerCase();
    const pBase = pName.split(',')[0].trim();
    return pName === lower || pBase === lower || lower === pName;
  });

  if (presetMatch) {
    const lat = presetMatch.lat;
    const lon = presetMatch.lon;
    const alt = presetMatch.alt || 1800;
    const pitch = presetMatch.pitch || -45;
    const heading = presetMatch.heading || 0;
    return {
      name: presetMatch.name,
      lat,
      lon,
      alt,
      pitch,
      heading,
      formattedAddress: presetMatch.formattedAddress || presetMatch.name,
      category: presetMatch.category || 'landmark',
      source: 'preset',
      details: `Preset location verified. Cesium 3D camera vector locked.`,
      externalUrl: buildGodsEyeUrl(lat, lon, alt, { pitch, heading, embed: false }),
      embedUrl: buildGodsEyeUrl(lat, lon, alt, { pitch, heading, embed: true }),
    };
  }

  // 2. Query OpenStreetMap Nominatim with bounding box inspection
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(clean)}&format=json&addressdetails=1&limit=1`,
      {
        headers: { 'User-Agent': 'GodsEyeOSINT/2.0 (Hermes Studio Geospatial Engine)' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (osmRes.ok) {
      const results = await osmRes.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);

        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const type = (item.type || '').toLowerCase();
          const placeClass = (item.class || '').toLowerCase();
          const bbox = item.boundingbox;

          let alt = 1800;
          let pitch = -45;
          let category: ResolvedTarget['category'] = 'landmark';

          if (Array.isArray(bbox) && bbox.length === 4) {
            const minLat = parseFloat(bbox[0]);
            const maxLat = parseFloat(bbox[1]);
            const minLon = parseFloat(bbox[2]);
            const maxLon = parseFloat(bbox[3]);

            const latSpan = Math.abs(maxLat - minLat);
            const lonSpan = Math.abs(maxLon - minLon);
            const maxSpan = Math.max(latSpan, lonSpan);

            if (type === 'country' || (placeClass === 'boundary' && maxSpan > 7.0)) {
              alt = Math.min(5500000, Math.max(1200000, Math.round(maxSpan * 111000 * 1.5)));
              pitch = -85;
              category = 'country';
            } else if (maxSpan > 1.2 || type === 'state' || type === 'province') {
              alt = Math.min(1200000, Math.max(180000, Math.round(maxSpan * 111000 * 1.3)));
              pitch = -70;
              category = 'custom';
            } else if (maxSpan > 0.08 || type === 'city' || type === 'administrative' || type === 'town') {
              alt = Math.min(75000, Math.max(16000, Math.round(maxSpan * 111000 * 1.1)));
              pitch = -55;
              category = 'city';
            } else {
              alt = 1800;
              pitch = -45;
              category = 'landmark';
            }
          }

          let cleanAddress = item.display_name || clean;
          if (item.address) {
            const parts = [
              item.address.attraction || item.address.building || item.address.suburb || item.address.city || item.address.town,
              item.address.state || item.address.region,
              item.address.country,
            ].filter(Boolean);
            if (parts.length > 0) cleanAddress = parts.join(', ');
          }

          return {
            name: item.name || clean,
            lat,
            lon,
            alt,
            pitch,
            heading: 0,
            formattedAddress: cleanAddress,
            category,
            source: 'nominatim',
            details: `Geocoded via OpenStreetMap. Extent: ${category.toUpperCase()} scale.`,
            externalUrl: buildGodsEyeUrl(lat, lon, alt, { pitch, embed: false }),
            embedUrl: buildGodsEyeUrl(lat, lon, alt, { pitch, embed: true }),
          };
        }
      }
    }
  } catch {}

  // 3. Fallback to Photon
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const photonRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (photonRes.ok) {
      const data = await photonRes.json();
      const feature = data?.features?.[0];
      if (feature?.geometry?.coordinates) {
        const [lon, lat] = feature.geometry.coordinates;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const props = feature.properties || {};
          const name = props.name || clean;
          const cleanAddress = [name, props.state, props.country].filter(Boolean).join(', ');
          return {
            name,
            lat,
            lon,
            alt: 2500,
            pitch: -50,
            heading: 0,
            formattedAddress: cleanAddress,
            category: 'custom',
            source: 'photon',
            details: `Geocoded via Photon OpenStreetMap database.`,
            externalUrl: buildGodsEyeUrl(lat, lon, 2500, { embed: false }),
            embedUrl: buildGodsEyeUrl(lat, lon, 2500, { embed: true }),
          };
        }
      }
    }
  } catch {}

  // 4. NEVER RETURN FAKE FALLBACK COORDINATES!
  throw new Error(`Location "${clean}" could not be resolved on the global map.`);
}
