import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Shuffle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Keyboard,
  Settings,
  Pause,
  Play,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Layers,
  BookMarked,
  ArrowLeft,
} from 'lucide-react';
import { UserSettings } from '../types';

interface HeaderProps {
  articleTitle: string;
  currentIndex: number;
  totalTaskWords: number;
  currentTaskIndex: number;
  totalTasks: number;
  taskSize: number;
  totalArticleWords: number;
  settings: UserSettings;
  isPaused: boolean;
  notebookCount?: number;
  isPracticeMode?: boolean;
  onUpdateSettings: (updater: (prev: UserSettings) => UserSettings) => void;
  onTogglePause: () => void;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenNotebook: () => void;
  onExitPracticeMode?: () => void;
  onResetProgress: () => void;
  onShuffleWords: () => void;
  onSelectTask: (taskIdx: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  articleTitle,
  currentIndex,
  totalTaskWords,
  currentTaskIndex,
  totalTasks,
  taskSize,
  totalArticleWords,
  settings,
  isPaused,
  notebookCount = 0,
  isPracticeMode = false,
  onUpdateSettings,
  onTogglePause,
  onOpenImport,
  onOpenSettings,
  onOpenShortcuts,
  onOpenNotebook,
  onExitPracticeMode,
  onResetProgress,
  onShuffleWords,
  onSelectTask,
}) => {
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  const toggleAccent = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      accent: prev.accent === 'us' ? 'uk' : 'us',
    }));
  };

  const toggleAutoPlay = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      autoPlayAudio: !prev.autoPlayAudio,
    }));
  };

  const toggleDictation = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      dictationMode: !prev.dictationMode,
    }));
  };

  const toggleTheme = () => {
    onUpdateSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };

  return (
    <header className="w-full max-w-7xl mx-auto pt-4 px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Brand logo & import button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={onOpenImport}>
          {/* Keyboard Key 3D Icon */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-lg transform group-hover:-translate-y-0.5 transition-transform duration-150 border-b-2 border-indigo-700">
            <span className="font-mono-code">W</span>
            <div className="absolute inset-0 rounded-xl border border-white/20"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                WordKey
              </h1>
              <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                文键
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
              文章网址解析 & 键盘盲打默写
            </p>
          </div>
        </div>

        {/* Import Article URL Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 transition-colors border border-indigo-100 dark:border-slate-700 shadow-xs cursor-pointer"
          title="输入网址或文本解析文章单词"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>解析新文章</span>
        </button>

        {/* Notebook Button */}
        <button
          onClick={onOpenNotebook}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 transition-colors border border-amber-200/80 dark:border-amber-800/60 shadow-xs cursor-pointer"
          title="打开生词本 (本地持久化)"
        >
          <BookMarked className="w-3.5 h-3.5 text-amber-500" />
          <span>生词本</span>
          {notebookCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-mono-code font-bold">
              {notebookCount}
            </span>
          )}
        </button>

        {/* Practice Mode Return Button if in practice mode */}
        {isPracticeMode && onExitPracticeMode && (
          <button
            onClick={onExitPracticeMode}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 transition-colors border border-rose-200 dark:border-rose-900/40 cursor-pointer shadow-xs animate-pulse"
            title="退出生词本练习，返回原文章"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>退出练习</span>
          </button>
        )}
      </div>

      {/* Center-right Toolbar Capsule (Screenshot style) */}
      <div className="flex items-center gap-2 sm:gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-slate-200/70 dark:border-slate-700/60 transition-all text-sm">
        {/* Article title & Chapter / Word info */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-700 max-w-[220px] sm:max-w-[270px]">
          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="truncate">
            <div className="font-medium text-slate-700 dark:text-slate-200 text-xs sm:text-sm truncate" title={articleTitle}>
              {articleTitle || '文章词库'}
            </div>
          </div>

          {/* Task / Chapter Switcher Badge (e.g. 第 1 组 / 共 3 组) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsTaskDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              title="点击切换任务章节组"
            >
              <span>第 {currentTaskIndex + 1}/{totalTasks} 组</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Task Selector Dropdown */}
            {isTaskDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsTaskDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-40 text-xs animate-fade-in">
                  <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold mb-1.5">
                      <span>任务组选择 (共 {totalTasks} 组)</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">{totalArticleWords} 词</span>
                    </div>

                    {/* Quick Jump Input */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-slate-400 text-[11px] whitespace-nowrap">跳转到:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalTasks}
                        placeholder={`1-${totalTasks}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value, 10);
                            if (!isNaN(val) && val >= 1 && val <= totalTasks) {
                              onSelectTask(val - 1);
                              setIsTaskDropdownOpen(false);
                            }
                          }
                        }}
                        className="w-16 px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center font-mono-code text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 text-[11px]">组 (回车)</span>
                    </div>

                    {/* Prev / Next Task Quick Switch */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        disabled={currentTaskIndex === 0}
                        onClick={() => {
                          onSelectTask(currentTaskIndex - 1);
                          setIsTaskDropdownOpen(false);
                        }}
                        className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-40 text-[11px] font-medium text-slate-700 dark:text-slate-200"
                      >
                        ◀ 上一组
                      </button>
                      <button
                        type="button"
                        disabled={currentTaskIndex >= totalTasks - 1}
                        onClick={() => {
                          onSelectTask(currentTaskIndex + 1);
                          setIsTaskDropdownOpen(false);
                        }}
                        className="flex-1 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
                      >
                        下一组 ▶
                      </button>
                    </div>
                  </div>

                  {/* Scrollable list */}
                  <div className="max-h-60 overflow-y-auto py-1 px-1">
                    {Array.from({ length: totalTasks }).map((_, idx) => {
                      const startWord = idx * taskSize + 1;
                      const endWord = Math.min((idx + 1) * taskSize, totalArticleWords);
                      const isCurrent = idx === currentTaskIndex;
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            onSelectTask(idx);
                            setIsTaskDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>第 {idx + 1} 组</span>
                          <span className="text-[10px] text-slate-400 font-mono-code font-normal">
                            {startWord}-{endWord} 词
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Current word in task */}
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 whitespace-nowrap">
            {totalTaskWords > 0 ? currentIndex + 1 : 0}/{totalTaskWords}
          </div>
        </div>

        {/* Accent Toggle: AmE / BrE (美音 / 英音) */}
        <button
          onClick={toggleAccent}
          className="px-2 py-1 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
          title="点击切换美式/英式发音 (快捷键: Shift)"
        >
          <span>{settings.accent === 'us' ? '美音' : '英音'}</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-mono-code">
            {settings.accent === 'us' ? 'US' : 'UK'}
          </span>
        </button>

        {/* Sound Auto-play toggle */}
        <button
          onClick={toggleAutoPlay}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            settings.autoPlayAudio
              ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={settings.autoPlayAudio ? '自动发音: 开启' : '自动发音: 关闭'}
        >
          {settings.autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Shuffle Words */}
        <button
          onClick={onShuffleWords}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="随机乱序当前任务组单词"
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* Dictation Mode (默写模式 toggle) */}
        <button
          onClick={toggleDictation}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            settings.dictationMode
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          title={settings.dictationMode ? '默写模式已开启（隐藏字母拼写）' : '开启默写模式（听音辨词盲打）'}
        >
          {settings.dictationMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {settings.dictationMode && <span className="text-[11px] pr-0.5">默写中</span>}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={settings.theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
        >
          {settings.theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors hidden sm:block cursor-pointer"
          title="键盘快捷键指南"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="系统与打字设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Reset progress */}
        <button
          onClick={onResetProgress}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="重置当前组练习进度"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Pause / Resume Button (Screenshot style button) */}
        <button
          onClick={onTogglePause}
          className={`ml-1 px-3 py-1 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer ${
            isPaused
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-400 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 text-white'
          }`}
        >
          <span className="flex items-center gap-1">
            {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            {isPaused ? 'Resume' : 'Pause'}
          </span>
        </button>
      </div>
    </header>
  );
};
