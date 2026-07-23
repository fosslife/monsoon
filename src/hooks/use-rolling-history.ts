import { useCallback, useState } from "react";

/**
 * Bounded sample buffer for rolling chart windows. Appending past capacity
 * drops the oldest sample, so chart state can never grow unbounded.
 */
export function useRollingHistory<T>(capacity = 60) {
  const [samples, setSamples] = useState<T[]>([]);

  const push = useCallback(
    (sample: T) => {
      setSamples((prev) => [...prev.slice(-(capacity - 1)), sample]);
    },
    [capacity],
  );

  return [samples, push] as const;
}
