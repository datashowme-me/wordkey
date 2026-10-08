import React from 'react';
import { TrendingUp } from 'lucide-react';
import { TypingStats } from '../types';

interface StatsFooterProps {
  stats: TypingStats;
  onOpenTrend?: () => void;
}

export const StatsFooter: React.FC<StatsFooterProps> = ({ stats, onOpenTrend }) => {
  // Format seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="w-full pb-8 pt-2 px-4 flex flex-col items-center justify-center gap-2">
      {/* Floating White Card (Screenshot layout) */}
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/40 border border-slate-100 dark:border-slate-700/80 px-8 py-5 max-w-2xl w-full grid grid-cols-5 divide-x divide-slate-100 dark:divide-slate-700/60 transition-all duration-200">
        {/* Metric 1: 时间 (Time) */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="font-mono-code font-bold text-2xl sm:text-3xl text-slate-700 dark:text-slate-200 tracking-tight">
            {formatTime(stats.elapsedSeconds)}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            时间
          </div>
        </div>

        {/* Metric 2: 输入数 (Input count) */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="font-mono-code font-bold text-2xl sm:text-3xl text-slate-700 dark:text-slate-200 tracking-tight">
            {stats.totalKeystrokes}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            输入数
          </div>
        </div>

        {/* Metric 3: WPM (Words per minute) */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="font-mono-code font-bold text-2xl sm:text-3xl text-slate-700 dark:text-slate-200 tracking-tight">
            {stats.wpm}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            WPM
          </div>
        </div>

        {/* Metric 4: 正确数 (Correct count) */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="font-mono-code font-bold text-2xl sm:text-3xl text-slate-700 dark:text-slate-200 tracking-tight">
            {stats.correctKeystrokes}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            正确数
          </div>
        </div>

        {/* Metric 5: 正确率 (Accuracy %) */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="font-mono-code font-bold text-2xl sm:text-3xl text-slate-700 dark:text-slate-200 tracking-tight">
            {stats.accuracy}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            正确率
          </div>
        </div>
      </div>

      {/* Optional Trend Quick-View Pill */}
      {onOpenTrend && (
        <button
          type="button"
          onClick={onOpenTrend}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>查看实时准确率趋势图</span>
        </button>
      )}
    </footer>
  );
};
