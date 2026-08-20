import type { UserPlan, UserRole } from "@/constants/app";

export type PublicUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  plan: UserPlan;
  planExpiresAt?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  city?: string;
  state?: string;
  country?: string;
  createdAt: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;
