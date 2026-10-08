export interface WordItem {
  id: string;
  word: string;
  phoneticAmE: string;
  phoneticBrE: string;
  pos: string; // e.g. "n.", "v.", "adj."
  meaning: string; // e.g. "衣服，衣物"
  sentence: string; // context sentence from article
  sentenceTranslation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  frequency?: number;
}

export interface ArticleInfo {
  url?: string;
  title: string;
  excerpt?: string;
  wordCount: number;
  totalUniqueWords: number;
}

export type ExtractionMode = 'all_unique' | 'key_words' | 'full_text';

export type AccentType = 'us' | 'uk'; // AmE or BrE

export interface TypingStats {
  elapsedSeconds: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wrongKeystrokes: number;
  correctWords: number;
  wrongWords: number;
  wpm: number;
  accuracy: number;
}

export interface TaskProgressPoint {
  index: number; // 单词序号 (1, 2, 3...)
  word: string; // 单词文本
  cumulativeAccuracy: number; // 累计正确率 (0-100)
  wordAccuracy: number; // 单词即时正确率 (0-100)
  wpm: number; // 实时打字速度
  mistakes: number; // 错键次数
}

export interface UserSettings {
  accent: AccentType; // 'us' | 'uk'
  dictationMode: boolean; // 默写模式: hides word spelling
  autoPlayAudio: boolean; // Auto play pronunciation when word switches
  keySound: boolean; // Mechanical keyboard click sound
  showMeaning: boolean; // Show/hide Chinese translation
  showPhonetic: boolean; // Show/hide phonetic
  wordFilter: 'all' | 'medium_hard' | 'hard'; // Vocabulary difficulty filter
  theme: 'light' | 'dark';
  taskSize: number; // 任务切分大小: 默认 20 个单词每组
}
