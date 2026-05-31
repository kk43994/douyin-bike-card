import type { LatLng } from "./geo";

type RideNavigationUrlOptions = {
  origin?: LatLng | null;
  destination: LatLng;
  destinationName: string;
  sourceName?: string;
};

const DEFAULT_SOURCE = "RideSnap";

export function buildAmapRideRoutePlanScheme({
  origin,
  destination,
  destinationName,
  sourceName = DEFAULT_SOURCE,
}: RideNavigationUrlOptions): string {
  const params = new URLSearchParams({
    sourceApplication: sourceName,
    dlat: formatCoord(destination.lat),
    dlon: formatCoord(destination.lng),
    dname: destinationName,
    dev: "0",
    t: "3",
    rideType: "bike",
  });
  if (origin) {
    params.set("slat", formatCoord(origin.lat));
    params.set("slon", formatCoord(origin.lng));
    params.set("sname", "当前位置");
  }
  return `amapuri://route/plan/?${params.toString()}`;
}

function formatCoord(value: number): string {
  return Number.isFinite(value) ? value.toFixed(6) : "";
}
