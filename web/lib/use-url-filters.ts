"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

/** Immediate input feedback; the current URL prevents fast interactions overwriting each other. */
export function useURLFilters() {
  const routeParams = useSearchParams(),
    routeValue = routeParams.toString();
  const [value, setValue] = useState(routeValue);
  useEffect(() => {
    setValue(new URLSearchParams(location.search).toString());
  }, [routeValue]);
  const params = useMemo(() => new URLSearchParams(value), [value]);
  function updateFilters(
    changes: Record<string, string>,
    hash = location.hash,
  ) {
    const next = new URLSearchParams(location.search);
    for (const [key, val] of Object.entries(changes)) {
      if (val && val !== "all") next.set(key, val.slice(0, 160));
      else next.delete(key);
    }
    setValue(next.toString());
    // Next copies its own history markers. Passing history.state would bypass its URL update.
    history.replaceState(
      null,
      "",
      location.pathname + (next.size ? `?${next}` : "") + hash,
    );
  }
  return { params, updateFilters };
}
