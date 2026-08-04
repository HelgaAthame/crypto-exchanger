import {
  boolean,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { PaymentDetails } from "@/types/exchange-request";

/**
 * There are no user accounts, so rows are grouped by an anonymous session id
 * held in a cookie. That keeps the current "requests belong to this browser"
 * model, while moving the data somewhere it survives a cleared cache — and it
 * leaves an obvious seam to swap for a real user id if auth ever arrives.
 */
const sessionId = text("session_id").notNull();

export const exchangeRequests = pgTable(
  "exchange_requests",
  {
    id: text("id").primaryKey(),
    sessionId,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    status: text("status").notNull(),
    step: text("step").notNull(),
    stage: text("stage"),
    mode: text("mode"),

    giveCurrency: text("give_currency").notNull(),
    receiveCurrency: text("receive_currency").notNull(),
    // Rates and crypto amounts span many orders of magnitude, and these are
    // display values in a demo, not ledger entries — so float, not numeric.
    giveAmount: doublePrecision("give_amount").notNull(),
    receiveAmount: doublePrecision("receive_amount").notNull(),
    feeAmount: doublePrecision("fee_amount").notNull(),
    rateAtCreation: doublePrecision("rate_at_creation").notNull(),

    recipientContact: text("recipient_contact").notNull(),
    paymentMethod: text("payment_method"),
    // Shape varies by method (card / bank / crypto), so it stays a document.
    paymentDetails: jsonb("payment_details").$type<PaymentDetails>(),
    txHash: text("tx_hash"),
  },
  (table) => [index("exchange_requests_session_idx").on(table.sessionId, table.createdAt)]
);

export const rateAlerts = pgTable(
  "rate_alerts",
  {
    id: text("id").primaryKey(),
    sessionId,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    giveCurrency: text("give_currency").notNull(),
    receiveCurrency: text("receive_currency").notNull(),
    direction: text("direction").notNull(),
    targetRate: doublePrecision("target_rate").notNull(),
    rateAtCreation: doublePrecision("rate_at_creation").notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  },
  (table) => [index("rate_alerts_session_idx").on(table.sessionId, table.createdAt)]
);

export const limitOrders = pgTable(
  "limit_orders",
  {
    id: text("id").primaryKey(),
    sessionId,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    giveCurrency: text("give_currency").notNull(),
    receiveCurrency: text("receive_currency").notNull(),
    giveAmount: doublePrecision("give_amount").notNull(),
    targetRate: doublePrecision("target_rate").notNull(),
    direction: text("direction").notNull(),
    rateAtCreation: doublePrecision("rate_at_creation").notNull(),
    status: text("status").notNull(),
    filledAt: timestamp("filled_at", { withTimezone: true }),
    /** The rate it actually filled at, which is rarely the target. */
    filledRate: doublePrecision("filled_rate"),
  },
  (table) => [index("limit_orders_session_idx").on(table.sessionId, table.createdAt)]
);

export const recurringPlans = pgTable(
  "recurring_plans",
  {
    id: text("id").primaryKey(),
    sessionId,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    giveCurrency: text("give_currency").notNull(),
    receiveCurrency: text("receive_currency").notNull(),
    amount: doublePrecision("amount").notNull(),
    cadence: text("cadence").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    paused: boolean("paused").notNull().default(false),
  },
  (table) => [index("recurring_plans_session_idx").on(table.sessionId, table.createdAt)]
);
