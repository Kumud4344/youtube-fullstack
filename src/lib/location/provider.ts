export type ResolvedLocation = {
  city: string;
  state: string;
  country: string;
  source: "mock" | "ip" | "profile";
};

export interface LocationProvider {
  resolveFromIp(ip?: string | null): Promise<ResolvedLocation>;
}

class MockLocationProvider implements LocationProvider {
  async resolveFromIp(): Promise<ResolvedLocation> {
    return {
      city: process.env.MOCK_LOCATION_CITY ?? "Bengaluru",
      state: process.env.MOCK_LOCATION_STATE ?? "Karnataka",
      country: process.env.MOCK_LOCATION_COUNTRY ?? "India",
      source: "mock",
    };
  }
}

class IpLocationProvider implements LocationProvider {
  async resolveFromIp(ip?: string | null): Promise<ResolvedLocation> {
    // Production: integrate a geo-IP provider using LOCATION_API_KEY.
    // Fallback keeps the app usable when the provider is unavailable.
    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      return new MockLocationProvider().resolveFromIp();
    }

    return {
      city: "Unknown",
      state: "Unknown",
      country: "Unknown",
      source: "ip",
    };
  }
}

export function getLocationProvider(): LocationProvider {
  const mode = process.env.LOCATION_MODE ?? "mock";
  if (mode === "ip") {
    return new IpLocationProvider();
  }
  return new MockLocationProvider();
}
