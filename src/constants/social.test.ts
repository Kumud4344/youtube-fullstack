import { describe, expect, it } from "vitest";
import { CALL_STATUS, FRIEND_REQUEST_STATUS } from "@/constants/social";

describe("friends & calls constants", () => {
  it("defines friend request lifecycle statuses", () => {
    expect(FRIEND_REQUEST_STATUS.PENDING).toBe("pending");
    expect(FRIEND_REQUEST_STATUS.ACCEPTED).toBe("accepted");
    expect(FRIEND_REQUEST_STATUS.REJECTED).toBe("rejected");
  });

  it("defines call state machine statuses", () => {
    expect(CALL_STATUS.CALLING).toBe("calling");
    expect(CALL_STATUS.RINGING).toBe("ringing");
    expect(CALL_STATUS.CONNECTED).toBe("connected");
    expect(CALL_STATUS.ENDED).toBe("ended");
    expect(CALL_STATUS.FAILED).toBe("failed");
  });
});
