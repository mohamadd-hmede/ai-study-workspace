import puter from "@heyputer/puter.js";

type SignInResult = Awaited<ReturnType<typeof puter.auth.signIn>>;

let signInInFlight: Promise<SignInResult> | null = null;
let authPopup: Window | null = null;
let popupExpiryTimer: ReturnType<typeof setTimeout> | null = null;

const clearPopupReference = () => {
  if (popupExpiryTimer !== null) {
    clearTimeout(popupExpiryTimer);
    popupExpiryTimer = null;
  }

  authPopup = null;
};

export const cleanupAuthPopup = () => {
  const popup = authPopup;
  clearPopupReference();

  try {
    if (popup && !popup.closed) {
      popup.close();
    }
  } catch (error) {
    console.warn("Could not close Puter authentication window:", error);
  }
};

const isPuterAuthUrl = (url?: string | URL): boolean => {
  if (!url) return false;

  try {
    const parsed = new URL(String(url), window.location.href);

    return (
      parsed.origin === "https://puter.com" &&
      parsed.pathname === "/action/sign-in" &&
      parsed.searchParams.get("embedded_in_popup") === "true"
    );
  } catch {
    return false;
  }
};

export const signIn = (): Promise<SignInResult> => {
  if (signInInFlight) {
    try {
      if (authPopup && !authPopup.closed) {
        authPopup.focus();
      }
    } catch {
      // Some browsers do not allow focusing popup windows.
    }

    return signInInFlight;
  }

  const attempt = async (): Promise<SignInResult> => {
    if (typeof window === "undefined") {
      return puter.auth.signIn();
    }

    clearPopupReference();

    const originalOpen = window.open;
    let popupCaptured = false;
    let captureTimeout: ReturnType<typeof setTimeout> | null = null;

    const restoreOpen = () => {
      if (captureTimeout !== null) {
        clearTimeout(captureTimeout);
        captureTimeout = null;
      }

      if (window.open === patchedOpen) {
        window.open = originalOpen;
      }
    };

    const patchedOpen: typeof window.open = (...args) => {
      const popup = originalOpen.apply(window, args);

      if (isPuterAuthUrl(args[0])) {
        popupCaptured = popup !== null;
        authPopup = popup;

        if (popup) {
          popupExpiryTimer = setTimeout(() => {
            if (authPopup === popup) {
              clearPopupReference();
            }
          }, 60_000);
        }

        restoreOpen();
      }

      return popup;
    };

    window.open = patchedOpen;
    captureTimeout = setTimeout(restoreOpen, 10_000);

    try {
      const result = await puter.auth.signIn();

      console.debug("Puter auth popup captured:", popupCaptured);
      cleanupAuthPopup();

      return result;
    } catch (error) {
      console.debug("Puter auth popup captured:", popupCaptured);
      cleanupAuthPopup();
      throw error;
    } finally {
      restoreOpen();
    }
  };

  const promise = attempt();
  signInInFlight = promise;

  void promise.then(
    () => {
      if (signInInFlight === promise) {
        signInInFlight = null;
      }
    },
    () => {
      if (signInInFlight === promise) {
        signInInFlight = null;
      }
    },
  );

  return promise;
};

export const signOut = () => {
  return puter.auth.signOut();
};

export const getCurrentUser = async () => {
  return await puter.auth.getUser();
};

export const requestPlanUpgrade = async () => {
  return await puter.ui.requestUpgrade();
};

export const getMonthlyUsage = async () => {
  return await puter.auth.getMonthlyUsage();
};

export const getStorageSpace = async () => {
  return await puter.fs.space();
};

export const getDisplayName = async () => {
  const displayName = await puter.kv.get("profile:displayName");

  return typeof displayName === "string" ? displayName : null;
};

export const setDisplayName = async (displayName: string) => {
  await puter.kv.set("profile:displayName", displayName.trim());
};
