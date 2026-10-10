import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  BookOpen,
  Layers,
  Award,
  RefreshCw,
  Gift,
} from 'lucide-react';
import {
  getMembershipStatus,
  redeemActivationCode,
  revokeMembership,
  logProMetric,
  getDailyParseUsage,
} from '../utils/proStorage';
import { MembershipStatus } from '../types';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string; // Optional reason for paywall triggering
}

export const ProModal: React.FC<ProModalProps> = ({ isOpen, onClose, reason }) => {
  const [membership, setMembership] = useState<MembershipStatus>(getMembershipStatus());
  const [activePlan, setActivePlan] = useState<'lifetime' | 'annual' | 'monthly' | 'pack'>('lifetime');
  const [activationInput, setActivationInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setMembership(getMembershipStatus());
      setFeedback(null);
      setActivationInput('');
      logProMetric('paywall_view');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const usage = getDailyParseUsage();

  const handleRedeem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activationInput.trim()) {
      setFeedback({ type: 'error', text: '请输入激活码或兑换码' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    setTimeout(() => {
      const result = redeemActivationCode(activationInput);
      setIsSubmitting(false);
      if (result.success) {
        setFeedback({ type: 'success', text: result.message });
        setMembership(getMembershipStatus());
        setActivationInput('');
      } else {
        setFeedback({ type: 'error', text: result.message });
      }
    }, 300);
  };

  const handleQuickFillCode = (code: string) => {
    setActivationInput(code);
    setFeedback(null);
  };

  const handleResetForTesting = () => {
    revokeMembership();
    setMembership(getMembershipStatus());
    setFeedback({ type: 'success', text: '已重置为免费版测试状态' });
  };

  const plans = [
    {
      id: 'lifetime' as const,
      tag: '🔥 早期特惠 · 强烈推荐',
      name: '终身买断',
      price: '¥39',
      originalPrice: '¥99',
      period: '一次付费 · 永久解锁',
      highlight: true,
      desc: '获得终身全部 Pro 权益及未来大版本更新',
    },
    {
      id: 'annual' as const,
      tag: '备考首选',
      name: '年度畅享',
      price: '¥69',
      originalPrice: '¥118',
      period: '¥5.75 / 月 · 畅学一年',
      highlight: false,
      desc: '适合四六级、考研与雅思完整备考周期',
    },
    {
      id: 'monthly' as const,
      tag: '轻量尝鲜',
      name: '月度会员',
      price: '¥9.9',
      originalPrice: '¥19',
      period: '按月订阅 · 随时取消',
      highlight: false,
      desc: '适合短期集训或冲刺复习',
    },
    {
      id: 'pack' as const,
      tag: '按需加量',
      name: '解析加油包',
      price: '¥19',
      originalPrice: '¥30',
      period: '50 次文章解析 · 永久有效',
      highlight: false,
      desc: '仅扩充解析次数，不绑定会员期限',
    },
  ];

  const comparisonFeatures = [
    { name: '每日文章解析额度', free: '3 篇 / 天', pro: '无限次解析 (不限篇数与长度)' },
    { name: '官方完整词库', free: '精选高频组', pro: '完整版 (CET-4/6/考研/牛津5000+)' },
    { name: '真题高频与大纲标注', free: '基础词性释义', pro: '★ 真题高频词星标与核心提示' },
    { name: 'AI 专属词库拓展', free: '基础限额体验', pro: '深度生成 + 专属题库定制' },
    { name: '生词本与专项攻克', free: '本地基础收录', pro: '无限容量 + 智能掌握度 + TXT/JSON导出' },
    { name: '打字音效与高级连读', free: '基础发音', pro: '0.8x~1.2x语速 + 自动连读2遍' },
    { name: '打字效率与趋势分析', free: '实时 WPM/准确率', pro: '任务里程碑趋势图 + 历史数据对比' },
    { name: '专属身份标识', free: '标准版', pro: '👑 尊贵 Pro 金色徽章 + 纯净体验' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#161b26] rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Hero Banner */}
        <div className="relative px-6 py-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white overflow-hidden border-b border-indigo-800/40">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  WordKey Pro 专业版
                </h2>
                {membership.isPro && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> 已激活
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                文章解析无限畅享 · 考试真题高频标注 · 深度词库拓展
              </p>
            </div>
          </div>

          {/* Trigger Alert Reason if any */}
          {reason && !membership.isPro && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{reason}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* If already Pro */}
          {membership.isPro ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    👑 您当前已是 WordKey Pro 会员
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    授权方案：{membership.tier === 'lifetime' ? '终身买断永久授权' : '年度/月度畅享授权'}
                    {membership.activationCode && ` · 凭证码: ${membership.activationCode}`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetForTesting}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1"
                title="用于测试免费版与付费墙切换体验"
              >
                <RefreshCw className="w-3 h-3" /> 重置为免费版测试
              </button>
            </div>
          ) : (
            <>
              {/* Daily Quota Progress Bar for Free Users */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    今日文章解析额度状态
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                    剩余可用：
                    <span className={usage.totalAvailable > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}>
                      {usage.totalAvailable}
                    </span>{' '}
                    / {usage.dailyLimit} 篇
                    {membership.extraParseQuota > 0 && ` (含加量包 ${membership.extraParseQuota} 次)`}
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                  每日 00:00 自动刷新
                </span>
              </div>

              {/* Pricing Cards */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    选择最适合您的解锁方案
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 纯净无广告 · 专注高效
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {plans.map((p) => {
                    const isSelected = activePlan === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setActivePlan(p.id)}
                        className={`relative p-3 rounded-2xl cursor-pointer border transition-all text-center flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-400/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {p.tag && (
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                            {p.tag}
                          </div>
                        )}
                        <div className="pt-1">
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {p.name}
                          </div>
                          <div className="mt-1.5 flex items-baseline justify-center gap-1">
                            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                              {p.price}
                            </span>
                            <span className="text-[10px] text-slate-400 line-through">
                              {p.originalPrice}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.period}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Feature Comparison Table */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                免费版 vs Pro 专业版 权益对比
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">功能模块</th>
                    <th className="py-2.5 px-3 text-slate-500 dark:text-slate-400">免费版</th>
                    <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5">
                      WordKey Pro 👑
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {comparisonFeatures.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900/30' : 'bg-slate-50/40 dark:bg-slate-900/10'}
                    >
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {row.name}
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                        {row.free}
                      </td>
                      <td className="py-2 px-3 text-amber-700 dark:text-amber-300 font-medium bg-amber-500/5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{row.pro}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activation Code / Voucher Section */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>兑换码 / 授权激活码验证</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                支持终身激活码与加油包
              </span>
            </div>

            <form onSubmit={handleRedeem} className="flex gap-2">
              <input
                type="text"
                value={activationInput}
                onChange={(e) => setActivationInput(e.target.value)}
                placeholder="输入激活码，如 WORDKEY-PRO 或 WK-XXXX-XXXX"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? '验证中...' : '立即激活'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Test Codes */}
            <div className="mt-2.5 flex items-center flex-wrap gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <span>快捷测试体验码：</span>
              {['WORDKEY-PRO', 'CET4PASS', 'PACK50'].map((testCode) => (
                <button
                  key={testCode}
                  type="button"
                  onClick={() => handleQuickFillCode(testCode)}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 transition-colors font-mono"
                >
                  {testCode}
                </button>
              ))}
            </div>

            {/* Feedback message */}
            {feedback && (
              <div
                className={`mt-2.5 p-2 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            支持离线激活 · 一次购买持久生效 · 随时备份
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              稍后再说
            </button>
            {!membership.isPro && (
              <button
                onClick={() => handleQuickFillCode('WORDKEY-PRO')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>免费试用 Pro 权益</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
