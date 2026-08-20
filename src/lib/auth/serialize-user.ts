import type { UserPlan, UserRole } from "@/constants/app";
import type { PublicUser } from "@/types/api";

export function toPublicUser(user: {
  _id: { toString(): string } | string;
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  bio?: string | null;
  role: string;
  plan: string;
  planExpiresAt?: Date | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  createdAt: Date;
}): PublicUser {
  return {
    id: typeof user._id === "string" ? user._id : user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone ?? undefined,
    avatar: user.avatar ?? undefined,
    bio: user.bio ?? undefined,
    role: user.role as UserRole,
    plan: user.plan as UserPlan,
    planExpiresAt: user.planExpiresAt
      ? user.planExpiresAt.toISOString()
      : null,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    city: user.city ?? undefined,
    state: user.state ?? undefined,
    country: user.country ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}
