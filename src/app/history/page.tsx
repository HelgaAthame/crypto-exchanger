"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllRequests } from "@/lib/history-store";
import type { ExchangeRequest } from "@/types/exchange-request";

export default function HistoryPage() {
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);

  useEffect(() => {
    function load() {
      setRequests(getAllRequests());
    }
    load();
    const interval = window.setInterval(load, 2000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-md w-full px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">History</h1>
        <p className="text-sm text-muted mt-1">
          Requests stored locally in this browser only.
        </p>
      </div>

      {requests.length === 0 && (
        <p className="text-sm text-muted">
          No requests yet.{" "}
          <Link href="/" className="text-accent hover:underline">
            Create one
          </Link>
          .
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Link
              href={`/exchange/${r.id}`}
              className="block bg-card border border-border rounded-lg p-4 text-sm hover:border-accent"
            >
              <div className="flex justify-between">
                <span>
                  {r.giveAmount.toFixed(4)} {r.giveCurrency} → {r.receiveAmount.toFixed(4)}{" "}
                  {r.receiveCurrency}
                </span>
                <span className="text-muted capitalize">{r.status}</span>
              </div>
              <div className="text-muted text-xs mt-1">
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
