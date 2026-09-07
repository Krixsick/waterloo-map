import { useCallback, useEffect, useRef, useState } from "react";
import type { JourneyPlace } from "../interface/JourneyPlaceField";

export function useJourneyOrigin(enabled: boolean, autoLocate: boolean) {
  const [origin, setOrigin] = useState<JourneyPlace | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const requestId = useRef(0);

  // A late location response must never replace a manually chosen start.
  const cancelLocation = useCallback(() => {
    requestId.current += 1;
    setLocationMessage("");
  }, []);
  const chooseOrigin = useCallback((place: JourneyPlace | null) => {
    cancelLocation();
    setOrigin(place);
  }, [cancelLocation]);
  const locate = useCallback(() => {
    const id = ++requestId.current;
    if (!navigator.geolocation) {
      setLocationMessage("Location is unavailable. Search for a starting point or choose one on the map.");
      return;
    }
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId.current !== id) return;
        setOrigin({ name: "Your location", coordinates: [coords.longitude, coords.latitude] });
        setLocationMessage("");
      },
      (error) => {
        if (requestId.current !== id) return;
        setLocationMessage(`${error.code === 1 ? "Location access was denied." : "Couldn’t find your location."} Search for a starting point or choose one on the map.`);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    // Opening a requested trip subscribes to the browser’s location service.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled && autoLocate) locate();
    return () => { requestId.current += 1; };
  }, [enabled, autoLocate, locate]);

  return { origin, chooseOrigin, locate, cancelLocation, locationMessage };
}
