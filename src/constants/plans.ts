import type { UserPlan } from "@/constants/app";

/**
 * Centralized plan configuration.
 * All watch limits, pricing, and download entitlements must read from here.
 */
export const PLAN_CONFIG = {
  FREE: {
    id: "FREE" as const,
    name: "Free",
    priceInPaise: 0,
    priceDisplay: "₹0",
    watchLimitSeconds: 5 * 60,
    watchLimitLabel: "5 minutes",
    dailyDownloadLimit: 1,
    features: [
      "Watch up to 5 minutes per video",
      "1 download per day",
      "Standard video quality",
      "Community comments",
    ],
  },
  BRONZE: {
    id: "BRONZE" as const,
    name: "Bronze",
    priceInPaise: 1000,
    priceDisplay: "₹10",
    watchLimitSeconds: 7 * 60,
    watchLimitLabel: "7 minutes",
    dailyDownloadLimit: null,
    features: [
      "Watch up to 7 minutes per video",
      "Unlimited downloads",
      "HD playback",
      "Priority support",
    ],
  },
  SILVER: {
    id: "SILVER" as const,
    name: "Silver",
    priceInPaise: 5000,
    priceDisplay: "₹50",
    watchLimitSeconds: 10 * 60,
    watchLimitLabel: "10 minutes",
    dailyDownloadLimit: null,
    features: [
      "Watch up to 10 minutes per video",
      "Unlimited downloads",
      "Full HD playback",
      "Early feature access",
    ],
  },
  GOLD: {
    id: "GOLD" as const,
    name: "Gold",
    priceInPaise: 10000,
    priceDisplay: "₹100",
    watchLimitSeconds: null,
    watchLimitLabel: "Unlimited",
    dailyDownloadLimit: null,
    features: [
      "Unlimited watch time",
      "Unlimited downloads",
      "Highest quality streaming",
      "Premium badge & priority support",
    ],
  },
} as const satisfies Record<
  UserPlan,
  {
    id: UserPlan;
    name: string;
    priceInPaise: number;
    priceDisplay: string;
    watchLimitSeconds: number | null;
    watchLimitLabel: string;
    dailyDownloadLimit: number | null;
    features: readonly string[];
  }
>;

export type PlanConfig = (typeof PLAN_CONFIG)[UserPlan];

export function getPlanConfig(plan: UserPlan): PlanConfig {
  return PLAN_CONFIG[plan];
}

export function getWatchLimitSeconds(plan: UserPlan): number | null {
  return PLAN_CONFIG[plan].watchLimitSeconds;
}

export function getDailyDownloadLimit(plan: UserPlan): number | null {
  return PLAN_CONFIG[plan].dailyDownloadLimit;
}

export function isUnlimitedWatch(plan: UserPlan): boolean {
  return PLAN_CONFIG[plan].watchLimitSeconds === null;
}
