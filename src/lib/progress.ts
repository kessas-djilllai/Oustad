import { supabase } from "./supabase";

export const getUserId = async () => {
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user?.id) {
    return session.user.id;
  }
  return null;
};

// Simple global cache to avoid waiting on every re-render
let progressCache: Record<string, number> = {};
let isProgressLoaded = false;

export const loadUserProgress = async () => {
  if (!supabase) return;
  const userId = await getUserId();
  if (!userId) return;

  try {
    const { data, error } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      progressCache = {};
      data.forEach((p) => {
        progressCache[`${p.item_type}_${p.item_id}`] = p.progress_value;
      });
      isProgressLoaded = true;
      window.dispatchEvent(new Event("progress_updated"));
    }
  } catch (e) {
    console.error("Could not load user progress", e);
  }
};

export const getProgressSync = (itemType: string, itemId: string): number => {
  if (isProgressLoaded) {
    return progressCache[`${itemType}_${itemId}`] || 0;
  }
  return 0;
};

export const saveProgress = async (
  itemType: string,
  itemId: string,
  progressValue: number = 1,
) => {
  progressCache[`${itemType}_${itemId}`] = progressValue;

  // Dispatch event so UI updates immediately
  window.dispatchEvent(new Event("progress_updated"));

  if (!supabase) return;

  try {
    const userId = await getUserId();
    if (!userId) return;

    const { data } = await supabase
      .from("user_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle();

    if (data) {
      await supabase
        .from("user_progress")
        .update({ progress_value: progressValue })
        .eq("id", data.id);
    } else {
      await supabase.from("user_progress").insert({
        user_id: userId,
        item_type: itemType,
        item_id: itemId,
        progress_value: progressValue,
      });
    }
  } catch (e) {
    console.error("Could not save progress to DB", e);
  }
};

export const addXP = async (amount: number) => {
  const currentXp = getProgressSync("gamification", "xp");
  await saveProgress("gamification", "xp", currentXp + amount);
};

export const getXP = () => {
  return getProgressSync("gamification", "xp");
};

export const getStreak = () => {
  return getProgressSync("gamification", "streak");
};

export const getLeaderboard = async () => {
  if (!supabase) return [];
  try {
    // Try to fetch via secure RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_public_leaderboard",
    );

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData.map((d: any) => ({
        user_id: d.user_id,
        progress_value: d.progress_value,
        user_meta: { full_name: d.full_name },
      }));
    }

    // Fallback if RPC is not defined or returns error
    const { data, error } = await supabase
      .from("user_progress")
      .select("user_id, progress_value")
      .eq("item_type", "gamification")
      .eq("item_id", "xp")
      .order("progress_value", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching leaderboard fallback", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((d) => ({
      ...d,
      user_meta: null,
    }));
  } catch (e) {
    console.error("Could not fetch leaderboard", e);
    return [];
  }
};

export const checkDailyLogin = async () => {
  const today = new Date();
  const dateInt =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayInt =
    yesterday.getFullYear() * 10000 +
    (yesterday.getMonth() + 1) * 100 +
    yesterday.getDate();

  const lastLogin = getProgressSync("gamification", "last_login_date");
  const currentStreak = getProgressSync("gamification", "streak");

  if (lastLogin === dateInt) {
    return; // already logged in today
  }

  if (lastLogin === yesterdayInt) {
    await saveProgress("gamification", "streak", currentStreak + 1);
  } else {
    await saveProgress("gamification", "streak", 1);
  }

  await saveProgress("gamification", "last_login_date", dateInt);
  await addXP(5); // Login bonus
};
