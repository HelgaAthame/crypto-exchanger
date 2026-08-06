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

/**
 * Set once a row is claimed by an account. Rows created before signing in keep
 * only their session id, and logging in adopts them — so trying the demo first
 * and registering later does not lose anything.
 */
const userId = text("user_id");

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  /** scrypt output plus its salt — never the password itself. */
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authSessions = pgTable(
  "auth_sessions",
  {
    /** SHA-256 of the cookie token: a database leak hands over no live session. */
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("auth_sessions_user_idx").on(table.userId)]
);

/**
 * A registered passkey. The private half never leaves the authenticator, so
 * what is stored here cannot be replayed as a credential — it only verifies
 * signatures the device produces.
 */
export const passkeys = pgTable(
  "passkeys",
  {
    /** Base64url credential id, as the authenticator reports it. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    /** Replay guard: an authenticator increments this on every use. */
    counter: doublePrecision("counter").notNull().default(0),
    transports: text("transports"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    /** What the browser called the device, so a list of keys is readable. */
    label: text("label"),
  },
  (table) => [index("passkeys_user_idx").on(table.userId)]
);

/**
 * A challenge in flight. WebAuthn requires the server to issue a one-time
 * value and check the signature covers it, which is what stops a captured
 * response being replayed later.
 */
export const webauthnChallenges = pgTable("webauthn_challenges", {
  /** The anonymous session or user the challenge was issued to. */
  key: text("key").primaryKey(),
  challenge: text("challenge").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const exchangeRequests = pgTable(
  "exchange_requests",
  {
    id: text("id").primaryKey(),
    sessionId,
    userId,
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
    userId,
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
    userId,
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
    userId,
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    giveCurrency: text("give_currency").notNull(),
    receiveCurrency: text("receive_currency").notNull(),
    amount: doublePrecision("amount").notNull(),
    cadence: text("cadence").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    paused: boolean("paused").notNull().default(false),
    /** Set by the scheduler; the guard against executing a plan twice. */
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  },
  (table) => [index("recurring_plans_session_idx").on(table.sessionId, table.createdAt)]
);
