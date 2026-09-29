import puter from "@heyputer/puter.js";

export const signIn = async () => {
  return await puter.auth.signIn();
};

export const signOut = () => {
  return puter.auth.signOut();
};

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
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
