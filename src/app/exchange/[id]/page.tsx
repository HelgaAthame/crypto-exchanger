"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRequestById } from "@/lib/history-store";
import type { ExchangeRequest } from "@/types/exchange-request";

const STATUS_LABEL: Record<ExchangeRequest["status"], string> = {
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function ExchangeDetailsPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<ExchangeRequest | null | undefined>(undefined);

  useEffect(() => {
    function load() {
      setRequest(getRequestById(params.id) ?? null);
    }
    load();
    const interval = window.setInterval(load, 2000);
    return () => window.clearInterval(interval);
  }, [params.id]);

  if (request === undefined) {
    return <div className="mx-auto max-w-md px-4 py-8 text-sm text-muted">Loading…</div>;
  }

  if (request === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-8 flex flex-col gap-3">
        <p>Request not found.</p>
        <Link href="/" className="text-accent hover:underline text-sm">
          Back to calculator
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Exchange request</h1>
        <p className="text-sm text-muted mt-1">Demo request — no real funds move.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 text-sm flex flex-col gap-2">
        <Row label="Status" value={STATUS_LABEL[request.status]} />
        <Row label="ID" value={request.id} />
        <Row label="Created" value={new Date(request.createdAt).toLocaleString()} />
        <Row
          label="You give"
          value={`${request.giveAmount.toFixed(6)} ${request.giveCurrency}`}
        />
        <Row
          label="You receive"
          value={`${request.receiveAmount.toFixed(6)} ${request.receiveCurrency}`}
        />
        <Row
          label="Fee"
          value={`${request.feeAmount.toFixed(6)} ${request.receiveCurrency}`}
        />
        <Row label="Rate at creation" value={request.rateAtCreation.toFixed(6)} />
        <Row label="Contact" value={request.recipientContact} />
      </div>

      <Link href="/history" className="text-accent hover:underline text-sm">
        View all requests
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right break-all">{value}</span>
    </div>
  );
}
