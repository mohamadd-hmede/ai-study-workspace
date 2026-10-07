import { describe, expect, it } from "vitest";
import { classifyPuterError } from "./puter-errors";

describe("classifyPuterError", () => {
  it("classifies insufficient Puter balance", () => {
    const error = {
      code: "insufficient_funds",
      message:
        "No usage left for request. Upgrade at https://puter.com/#billing",
    };

    expect(classifyPuterError(error)).toMatchObject({
      category: "insufficient_balance",
      retryable: false,
    });
  });

  it("classifies rate limiting", () => {
    const error = {
      code: "too_many_requests",
      message: "Too many requests",
    };

    expect(classifyPuterError(error)).toMatchObject({
      category: "rate_limited",
      retryable: true,
    });
  });

  it("classifies storage limits", () => {
    const error = {
      code: "storage_limit_reached",
      message: "Storage limit reached",
    };

    expect(classifyPuterError(error)).toMatchObject({
      category: "storage_limit",
      retryable: false,
    });
  });

  it("classifies authentication cancellation", () => {
    expect(
      classifyPuterError({
        code: "cancelled",
        message: "Authentication cancelled",
      }),
    ).toMatchObject({
      category: "auth_cancelled",
      retryable: false,
    });
  });

  it("classifies network failures", () => {
    expect(classifyPuterError(new Error("Failed to fetch"))).toMatchObject({
      category: "network",
      retryable: true,
    });
  });

  it("classifies service unavailable errors", () => {
    expect(
      classifyPuterError({
        code: "service_unavailable",
        message: "Service unavailable",
      }),
    ).toMatchObject({
      category: "service_unavailable",
      retryable: true,
    });
  });

  it("falls back safely for an unknown error", () => {
    expect(classifyPuterError({ something: "unexpected" })).toMatchObject({
      category: "unknown",
      retryable: true,
    });
  });

  it("handles undefined errors safely", () => {
    expect(classifyPuterError(undefined)).toMatchObject({
      category: "unknown",
      retryable: true,
    });
  });
});
