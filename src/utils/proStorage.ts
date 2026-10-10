import { MembershipStatus, DailyQuotaUsage, ProMetrics, ProTier } from '../types';

const MEMBERSHIP_STORAGE_KEY = 'wordkey_pro_membership_v1';
const DAILY_USAGE_STORAGE_KEY = 'wordkey_daily_parse_v1';
const METRICS_STORAGE_KEY = 'wordkey_pro_metrics_v1';

export const FREE_DAILY_PARSE_LIMIT = 3;

// Preset recognized activation codes for trial and purchase verification
const PRESET_CODES: Record<string, { tier: ProTier; desc: string; extraQuota?: number }> = {
  'WORDKEY-PRO': { tier: 'lifetime', desc: 'WordKey 终身永久授权' },
  'VIP888': { tier: 'lifetime', desc: 'VIP 尊享终身会员' },
  'CET4PASS': { tier: 'lifetime', desc: '四六级备考专项终身授权' },
  'PRO2026': { tier: 'annual', desc: '2026 年度畅享会员' },
  'MONTHLY9': { tier: 'monthly', desc: '月度体验会员' },
  'PACK50': { tier: 'free', desc: '50次文章解析加量包', extraQuota: 50 },
};

/**
 * Get current date string in local YYYY-MM-DD
 */
function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Dispatch an event when Pro status or quota changes
 */
function notifyProChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wordkey_pro_updated'));
  }
}

/**
 * Get current user membership status
 */
export function getMembershipStatus(): MembershipStatus {
  if (typeof window === 'undefined') {
    return { isPro: false, tier: 'free', extraParseQuota: 0 };
  }

  try {
    const raw = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
    if (!raw) {
      return { isPro: false, tier: 'free', extraParseQuota: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      isPro: Boolean(parsed.isPro),
      tier: parsed.tier || 'free',
      activatedAt: parsed.activatedAt,
      activationCode: parsed.activationCode,
      extraParseQuota: Number(parsed.extraParseQuota || 0),
    };
  } catch (err) {
    console.error('Failed to load membership status:', err);
    return { isPro: false, tier: 'free', extraParseQuota: 0 };
  }
}

/**
 * Save user membership status
 */
export function saveMembershipStatus(status: MembershipStatus) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(status));
    notifyProChange();
  } catch (err) {
    console.error('Failed to save membership status:', err);
  }
}

/**
 * Get today's article parse usage & remaining quota
 */
export function getDailyParseUsage(): DailyQuotaUsage {
  const membership = getMembershipStatus();
  if (typeof window === 'undefined') {
    return {
      usedToday: 0,
      dailyLimit: FREE_DAILY_PARSE_LIMIT,
      remainingToday: FREE_DAILY_PARSE_LIMIT,
      isPro: membership.isPro,
      totalAvailable: FREE_DAILY_PARSE_LIMIT,
    };
  }

  const today = getLocalDateString();
  let usedToday = 0;

  try {
    const raw = localStorage.getItem(DAILY_USAGE_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today) {
        usedToday = Number(data.count) || 0;
      }
    }
  } catch (err) {
    console.error('Failed to parse daily usage:', err);
  }

  const dailyLimit = FREE_DAILY_PARSE_LIMIT;
  const remainingToday = Math.max(0, dailyLimit - usedToday);
  const totalAvailable = membership.isPro
    ? 999999
    : remainingToday + (membership.extraParseQuota || 0);

  return {
    usedToday,
    dailyLimit,
    remainingToday,
    isPro: membership.isPro,
    totalAvailable,
  };
}

/**
 * Check if the user is allowed to parse an article right now
 */
export function canUserParseArticle(): { allowed: boolean; reason?: string } {
  const usage = getDailyParseUsage();
  if (usage.isPro) {
    return { allowed: true };
  }

  if (usage.totalAvailable > 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `今日免费文章解析额度（${usage.dailyLimit} 篇/日）已用尽。升级 Pro 会员解锁无限解析，或使用激活码兑换！`,
  };
}

/**
 * Consume 1 parse quota when an article is successfully parsed
 */
export function consumeParseQuota(): boolean {
  const membership = getMembershipStatus();
  if (membership.isPro) {
    return true; // Unlimited for Pro members
  }

  const today = getLocalDateString();
  let usedToday = 0;

  try {
    const raw = localStorage.getItem(DAILY_USAGE_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today) {
        usedToday = Number(data.count) || 0;
      }
    }
  } catch (err) {
    console.error('Error reading parse quota:', err);
  }

  if (usedToday < FREE_DAILY_PARSE_LIMIT) {
    // Consume daily free quota
    try {
      localStorage.setItem(
        DAILY_USAGE_STORAGE_KEY,
        JSON.stringify({ date: today, count: usedToday + 1 })
      );
      notifyProChange();
      return true;
    } catch {
      return false;
    }
  } else if (membership.extraParseQuota > 0) {
    // Consume extra package quota
    saveMembershipStatus({
      ...membership,
      extraParseQuota: membership.extraParseQuota - 1,
    });
    return true;
  }

  return false;
}

/**
 * Redeem activation code / license key
 */
export function redeemActivationCode(code: string): {
  success: boolean;
  message: string;
  tier?: ProTier;
} {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { success: false, message: '请输入有效的激活码' };
  }

  // 1. Check preset codes
  if (PRESET_CODES[normalized]) {
    const preset = PRESET_CODES[normalized];
    if (preset.extraQuota) {
      // Top-up quota package
      const current = getMembershipStatus();
      saveMembershipStatus({
        ...current,
        extraParseQuota: (current.extraParseQuota || 0) + preset.extraQuota,
      });
      logProMetric('unlock_success');
      return {
        success: true,
        message: `兑换成功！已为您增加 ${preset.extraQuota} 次文章解析额度。`,
        tier: current.tier,
      };
    } else {
      // Pro membership unlock
      saveMembershipStatus({
        isPro: true,
        tier: preset.tier,
        activatedAt: Date.now(),
        activationCode: normalized,
        extraParseQuota: 0,
      });
      logProMetric('unlock_success');
      return {
        success: true,
        message: `恭喜！已成功激活 ${preset.desc}，全功能已解锁！`,
        tier: preset.tier,
      };
    }
  }

  // 2. Check algorithmic key pattern: WK-XXXX-XXXX (e.g. WK-ABCD-1234)
  const pattern = /^WK-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (pattern.test(normalized)) {
    saveMembershipStatus({
      isPro: true,
      tier: 'lifetime',
      activatedAt: Date.now(),
      activationCode: normalized,
      extraParseQuota: 0,
    });
    logProMetric('unlock_success');
    return {
      success: true,
      message: '恭喜！专属买断激活码验证成功，已升级为 WordKey Pro 终身会员！',
      tier: 'lifetime',
    };
  }

  return {
    success: false,
    message: '激活码无效或已过期，请核对后再试。可输入 WORDKEY-PRO 体验测试。',
  };
}

/**
 * Revoke Pro membership (for testing / reset)
 */
export function revokeMembership() {
  saveMembershipStatus({
    isPro: false,
    tier: 'free',
    extraParseQuota: 0,
  });
}

/**
 * Reset today's usage (for testing)
 */
export function resetTodayUsage() {
  if (typeof window === 'undefined') return;
  const today = getLocalDateString();
  localStorage.setItem(DAILY_USAGE_STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
  notifyProChange();
}

/**
 * Track conversion metrics locally
 */
export function logProMetric(type: 'paywall_view' | 'quota_hit' | 'unlock_success') {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    const metrics: ProMetrics = raw
      ? JSON.parse(raw)
      : { paywallViews: 0, quotaHits: 0, unlockSuccesses: 0 };

    if (type === 'paywall_view') metrics.paywallViews += 1;
    if (type === 'quota_hit') metrics.quotaHits += 1;
    if (type === 'unlock_success') metrics.unlockSuccesses += 1;

    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
  } catch (err) {
    console.error('Failed to log pro metric:', err);
  }
}

/**
 * Get conversion metrics summary
 */
export function getProMetrics(): ProMetrics {
  if (typeof window === 'undefined') {
    return { paywallViews: 0, quotaHits: 0, unlockSuccesses: 0 };
  }
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { paywallViews: 0, quotaHits: 0, unlockSuccesses: 0 };
  } catch {
    return { paywallViews: 0, quotaHits: 0, unlockSuccesses: 0 };
  }
}
