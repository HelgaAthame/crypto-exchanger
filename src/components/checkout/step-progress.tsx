import Link from "next/link";
import { Check } from "lucide-react";
import { stepIndex, stepsForMethod } from "@/lib/checkout-flow";
import type { ExchangeStep, PaymentMethod } from "@/types/exchange-request";

const LABEL: Record<ExchangeStep, string> = {
  method: "Method",
  details: "Details",
  confirm: "Confirm",
  otp: "Authorise",
  deposit: "Deposit",
  status: "Status",
};

const PATH: Record<ExchangeStep, string> = {
  method: "method",
  details: "details",
  confirm: "confirm",
  otp: "otp",
  deposit: "deposit",
  status: "",
};

type Props = {
  requestId: string;
  current: ExchangeStep;
  reached: ExchangeStep;
  method: PaymentMethod | undefined;
};

export function StepProgress({ requestId, current, reached, method }: Props) {
  const steps = stepsForMethod(method);

  return (
    <ol className="mb-6 flex items-center gap-1.5 text-xs">
      {steps.map((step, i) => {
        const isCurrent = step === current;
        const isDone = stepIndex(step) < stepIndex(reached);
        const isReachable = stepIndex(step) <= stepIndex(reached);
        const href = `/exchange/${requestId}${PATH[step] ? `/${PATH[step]}` : ""}`;

        const content = (
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
              isCurrent
                ? "border-accent/50 bg-accent/10 font-medium text-accent"
                : isDone
                  ? "border-border text-muted hover:border-accent/40 hover:text-foreground"
                  : "border-border/60 text-muted/60"
            }`}
          >
            {isDone ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <span className="tabular-nums">{i + 1}</span>
            )}
            {LABEL[step]}
          </span>
        );

        return (
          <li key={step} className="flex items-center gap-1.5">
            {isReachable && !isCurrent ? <Link href={href}>{content}</Link> : content}
            {i < steps.length - 1 && (
              <span className="text-muted/40" aria-hidden>
                ·
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
