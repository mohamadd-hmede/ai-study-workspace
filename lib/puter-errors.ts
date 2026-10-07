export type PuterErrorCategory =
  | "insufficient_balance"
  | "rate_limited"
  | "network"
  | "service_unavailable"
  | "storage_limit"
  | "auth_cancelled"
  | "auth_required"
  | "unknown";

export type ClassifiedPuterError = {
  category: PuterErrorCategory;
  retryable: boolean;
  originalError: unknown;
};

const getErrorCode = (error: unknown): string | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code.toLowerCase();
  }

  return null;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message.toLowerCase();
  }

  if (typeof error === "string") {
    return error.toLowerCase();
  }

  return "";
};

export const classifyPuterError = (error: unknown): ClassifiedPuterError => {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);

  if (code === "insufficient_funds" || message.includes("no usage left")) {
    return {
      category: "insufficient_balance",
      retryable: false,
      originalError: error,
    };
  }

  if (
    code === "too_many_requests" ||
    code === "rate_limit_exceeded" ||
    message.includes("too many requests") ||
    message.includes("rate limit")
  ) {
    return {
      category: "rate_limited",
      retryable: true,
      originalError: error,
    };
  }

  if (code === "storage_limit_reached" || message.includes("storage limit")) {
    return {
      category: "storage_limit",
      retryable: false,
      originalError: error,
    };
  }

  if (
    code === "unauthorized" ||
    code === "not_authenticated" ||
    code === "auth_required"
  ) {
    return {
      category: "auth_required",
      retryable: false,
      originalError: error,
    };
  }

  if (
    code === "cancelled" ||
    code === "canceled" ||
    code === "auth_cancelled" ||
    message.includes("cancelled") ||
    message.includes("canceled")
  ) {
    return {
      category: "auth_cancelled",
      retryable: false,
      originalError: error,
    };
  }

  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  ) {
    return {
      category: "network",
      retryable: true,
      originalError: error,
    };
  }

  if (
    code === "service_unavailable" ||
    message.includes("service unavailable")
  ) {
    return {
      category: "service_unavailable",
      retryable: true,
      originalError: error,
    };
  }

  return {
    category: "unknown",
    retryable: true,
    originalError: error,
  };
};
