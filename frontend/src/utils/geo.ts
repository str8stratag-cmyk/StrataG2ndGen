const R = 3959; // Earth radius in miles

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateEtaMinutes(distanceMiles: number, speedMph = 25): number {
  return Math.round((distanceMiles / speedMph) * 60);
}

export function generateRouteCoordinates(lat1: number, lng1: number, lat2: number, lng2: number, points = 10): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    coords.push([lat, lng]);
  }
  return coords;
}

export function cn(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
