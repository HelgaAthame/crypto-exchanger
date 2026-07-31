"use client";

import { useEffect } from "react";
import { hydrateFromServer } from "@/lib/sync";

/**
 * Pulls server-side rows into local storage once per page load.
 *
 * Without this the database would only ever be written to — the point of
 * persisting is that a cleared cache, or the same browser a month later, gets
 * its requests back. Runs after paint and fails silently: the UI has already
 * rendered whatever was local.
 */
export function SyncBoot() {
  useEffect(() => {
    void hydrateFromServer();
  }, []);

  return null;
}
