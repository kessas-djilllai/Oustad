import { supabase } from './supabase';

export const getDeviceId = async () => {
    // If logged in, preferred way:
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
          return session.user.id;
      }
    }
    
    let id = localStorage.getItem('device_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('device_id', id);
    }
    return id;
};

// Simple global cache to avoid waiting on every re-render
let progressCache: Record<string, number> = {};
let isProgressLoaded = false;

export const loadUserProgress = async () => {
    if (!supabase) return;
    const deviceId = await getDeviceId();
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('device_id', deviceId);
            
        if (!error && data) {
            progressCache = {};
            data.forEach(p => {
                progressCache[`${p.item_type}_${p.item_id}`] = p.progress_value;
            });
            isProgressLoaded = true;
        }
    } catch (e) {
        console.error("Could not load user progress", e);
    }
};

export const getProgressSync = (itemType: string, itemId: string): number => {
    // If not loaded yet via DB, fallback to localStorage to prevent unmounting flickers
    if (isProgressLoaded) {
        return progressCache[`${itemType}_${itemId}`] || 0;
    }
    
    // Fallback for boolean-like ones ('true' -> 1)
    const val = localStorage.getItem(`${itemType}_${itemId}`);
    if (val === 'true') return 1;
    if (val === 'false') return 0;
    
    return parseInt(val || '0', 10);
};

export const saveProgress = async (itemType: string, itemId: string, progressValue: number = 1) => {
    // Fallback sync to localStorage so UI works immediately / offline
    localStorage.setItem(`${itemType}_${itemId}`, progressValue === 1 && itemType.startsWith('completed_') ? 'true' : progressValue.toString());
    progressCache[`${itemType}_${itemId}`] = progressValue;
    
    // Dispatch event so UI updates immediately
    window.dispatchEvent(new Event('progress_updated'));
    
    if (!supabase) return;
    
    try {
        const deviceId = await getDeviceId();
        const { data } = await supabase
            .from('user_progress')
            .select('id')
            .eq('device_id', deviceId)
            .eq('item_type', itemType)
            .eq('item_id', itemId)
            .maybeSingle();
            
        if (data) {
            await supabase
                .from('user_progress')
                .update({ progress_value: progressValue })
                .eq('id', data.id);
        } else {
            await supabase
                .from('user_progress')
                .insert({
                    device_id: deviceId,
                    item_type: itemType,
                    item_id: itemId,
                    progress_value: progressValue
                });
        }
    } catch (e) {
        console.error("Could not save progress to DB", e);
    }
};

export const addXP = async (amount: number) => {
    const currentXp = getProgressSync('gamification', 'xp');
    await saveProgress('gamification', 'xp', currentXp + amount);
}

export const getXP = () => {
    return getProgressSync('gamification', 'xp');
}

export const getStreak = () => {
    return getProgressSync('gamification', 'streak');
}

export const checkDailyLogin = async () => {
    const today = new Date();
    const dateInt = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayInt = yesterday.getFullYear() * 10000 + (yesterday.getMonth() + 1) * 100 + yesterday.getDate();

    const lastLogin = getProgressSync('gamification', 'last_login_date');
    const currentStreak = getProgressSync('gamification', 'streak');

    if (lastLogin === dateInt) {
        return; // already logged in today
    }

    if (lastLogin === yesterdayInt) {
        await saveProgress('gamification', 'streak', currentStreak + 1);
    } else {
        await saveProgress('gamification', 'streak', 1);
    }
    
    await saveProgress('gamification', 'last_login_date', dateInt);
    await addXP(5); // Login bonus
}
