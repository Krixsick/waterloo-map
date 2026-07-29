import { LoaderCircle, MapPinned } from "lucide-react";
import { useEffect, useState } from "react";

const MINIMUM_VISIBLE_MS = 1000;
const FADE_DURATION_MS = 400;

type LoadingScreenProps = {
  isComplete: boolean;
};

export function LoadingScreen({ isComplete }: LoadingScreenProps) {
  const [hasMinimumElapsed, setHasMinimumElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const shouldLeave = isComplete && hasMinimumElapsed;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setHasMinimumElapsed(true),
      MINIMUM_VISIBLE_MS,
    );

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!shouldLeave) return;

    const timeout = window.setTimeout(
      () => setIsVisible(false),
      FADE_DURATION_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [shouldLeave]);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center bg-white text-[#135f49] transition-opacity duration-400 ${
        shouldLeave ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="font-heading text-3xl font-semibold tracking-normal sm:text-4xl">
          WaterlooMap
        </span>
      </div>

      <LoaderCircle
        aria-hidden="true"
        className="absolute bottom-[14%] size-8 animate-spin text-[#135f49]/80"
        strokeWidth={1.8}
      />

      <span className="sr-only">Loading WaterlooMap</span>
    </div>
  );
}
