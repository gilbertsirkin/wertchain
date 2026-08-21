/**
 * GET /api/email/preview?template=<name>&secret=<CRON_SECRET>
 *
 * Renders any email template as HTML in the browser for visual QA.
 * Protected by the same CRON_SECRET used for cron jobs.
 *
 * Usage: https://yourdomain.com/api/email/preview?template=welcome&secret=xxx
 *
 * Available templates:
 *   welcome | depositReceived | depositApproved | depositRejected
 *   contractCreated | profitCredited | withdrawalRequested
 *   withdrawalApproved | withdrawalRejected | migrationRequested
 *   migrationApproved | securityAlert
 */

import { NextRequest, NextResponse } from "next/server";
import {
  welcomeEmail,
  depositReceivedEmail,
  depositApprovedEmail,
  depositRejectedEmail,
  contractCreatedEmail,
  profitCreditedEmail,
  withdrawalRequestedEmail,
  withdrawalApprovedEmail,
  withdrawalRejectedEmail,
  migrationRequestedEmail,
  migrationApprovedEmail,
  securityAlertEmail,
} from "@/lib/email/templates";

const SECRET = process.env.CRON_SECRET;

// ── Sample data ────────────────────────────────────────────────────────────
const SAMPLES: Record<string, () => string> = {
  welcome: () =>
    welcomeEmail({
      fullName: "Alexandra Müller",
      email: "alex@example.com",
    }),

  depositReceived: () =>
    depositReceivedEmail({
      fullName: "Alexandra Müller",
      amount: 25000,
      currency: "USDT_TRC20",
      txHash: "0xa3f1b2c9e8d7f6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5",
      depositId: "dep_01j9k2m3n4p5q6r7s8t9u0v1",
      submittedAt: "11 Aug 2026, 14:32",
    }),

  depositApproved: () =>
    depositApprovedEmail({
      fullName: "Alexandra Müller",
      amount: 25000,
      currency: "USDT_TRC20",
      newBalance: 37500,
      depositId: "dep_01j9k2m3n4p5q6r7s8t9u0v1",
    }),

  depositRejected: () =>
    depositRejectedEmail({
      fullName: "Alexandra Müller",
      amount: 25000,
      currency: "USDT_TRC20",
      depositId: "dep_01j9k2m3n4p5q6r7s8t9u0v1",
      reason: "Transaction hash not found on-chain. Please verify and resubmit.",
    }),

  contractCreated: () =>
    contractCreatedEmail({
      fullName: "Alexandra Müller",
      planTier: "WERTCHAIN_PROFESSIONAL",
      principal: 25000,
      profitRate: 0.18,
      expectedProfit: 4500,
      duration: 180,
      activatedAt: "11 Aug 2026",
      maturityDate: "07 Feb 2027",
      contractId: "ctr_01j9k2m3n4p5q6r7s8t9u0v1",
      autoReinvest: false,
    }),

  profitCredited: () =>
    profitCreditedEmail({
      fullName: "Alexandra Müller",
      planTier: "WERTCHAIN_PROFESSIONAL",
      principal: 25000,
      profitAmount: 4500,
      totalCredited: 29500,
      contractId: "ctr_01j9k2m3n4p5q6r7s8t9u0v1",
      autoReinvest: false,
    }),

  withdrawalRequested: () =>
    withdrawalRequestedEmail({
      fullName: "Alexandra Müller",
      amount: 4500,
      withdrawalType: "PROFIT",
      destination: "TQsygH3RrP3vk7s2QT7M1B2a3c4d5e6f7g",
      requestedAt: "11 Aug 2026, 15:00",
      withdrawalId: "wdr_01j9k2m3n4p5q6r7s8t9u0v1",
    }),

  withdrawalApproved: () =>
    withdrawalApprovedEmail({
      fullName: "Alexandra Müller",
      amount: 4500,
      withdrawalType: "PROFIT",
      destination: "TQsygH3RrP3vk7s2QT7M1B2a3c4d5e6f7g",
      withdrawalId: "wdr_01j9k2m3n4p5q6r7s8t9u0v1",
      approvedAt: "11 Aug 2026, 17:45",
      txHash: "0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    }),

  withdrawalRejected: () =>
    withdrawalRejectedEmail({
      fullName: "Alexandra Müller",
      amount: 4500,
      withdrawalType: "PROFIT",
      withdrawalId: "wdr_01j9k2m3n4p5q6r7s8t9u0v1",
      reason: "Destination address failed AML screening. Please update your withdrawal address.",
    }),

  migrationRequested: () =>
    migrationRequestedEmail({
      fullName: "Alexandra Müller",
      sourcePlan: "WERTCHAIN_GROWTH",
      targetPlan: "WERTCHAIN_ELITE",
      capitalAmount: 25000,
      topupAmount: 75000,
      migrationId: "mig_01j9k2m3n4p5q6r7s8t9u0v1",
      requestedAt: "11 Aug 2026, 09:15",
    }),

  migrationApproved: () =>
    migrationApprovedEmail({
      fullName: "Alexandra Müller",
      sourcePlan: "WERTCHAIN_GROWTH",
      targetPlan: "WERTCHAIN_ELITE",
      newPrincipal: 100000,
      newProfitRate: 0.24,
      newMaturityDate: "11 Feb 2027",
      newContractId: "ctr_01j9k2m3n4p5q6r7s8t9u0v2",
      migrationId: "mig_01j9k2m3n4p5q6r7s8t9u0v1",
    }),

  securityAlert: () =>
    securityAlertEmail({
      fullName: "Alexandra Müller",
      ip: "41.189.104.22",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) AppleWebKit/605.1.15",
      location: "Lagos, Nigeria",
      signedInAt: "11 Aug 2026, 22:11",
    }),
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const template = searchParams.get("template") ?? "welcome";

  // In production require secret; in dev allow freely
  if (process.env.NODE_ENV === "production") {
    if (!SECRET || secret !== SECRET) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const render = SAMPLES[template];
  if (!render) {
    const list = Object.keys(SAMPLES).join(", ");
    return new NextResponse(
      `Unknown template "${template}". Available: ${list}`,
      { status: 400, headers: { "Content-Type": "text/plain" } },
    );
  }

  return new NextResponse(render(), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
