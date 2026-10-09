import { cleanHtml, tokenizeArticle, fetchWordAnnotation } from './utils/articleParser';
import { WordItem, DictEntry } from './types';
import { callDeepSeek } from './utils/deepseek';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  DEEPSEEK_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API: Parse article from URL or raw text
    if (url.pathname === '/api/parse-article' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const targetUrl = body.url;
        const rawText = body.text;
        const mode = body.mode || 'all_unique';
        const includeStopWords = body.includeStopWords !== false;
        const order = body.order || 'appearance';
        const maxWords = Number(body.maxWords) || 0;

        let articleTitle = '解析文章';
        let articleContent = '';

        if (targetUrl) {
          try {
            const resp = await fetch(targetUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
              },
            });

            if (!resp.ok) {
              return new Response(
                JSON.stringify({ error: `目标网址无法访问 (HTTP ${resp.status})，建议直接粘贴文章正文` }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
              );
            }

            const html = await resp.text();
            const cleaned = cleanHtml(html);
            articleTitle = cleaned.title || targetUrl;
            articleContent = cleaned.text;
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '网络请求失败';
            return new Response(
              JSON.stringify({ error: `抓取网页失败: ${msg}。建议切换到「粘贴文章文本」模式` }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } else if (rawText) {
          articleContent = String(rawText);
          articleTitle = body.title || '粘贴的文章';
        } else {
          return new Response(
            JSON.stringify({ error: '请提供文章网址(URL)或直接粘贴文章文本' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (!articleContent || articleContent.trim().length < 5) {
          return new Response(
            JSON.stringify({ error: '提取到的文章内容过短或无法解析正文，请尝试直接粘贴文本' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const tokens = tokenizeArticle(articleContent, {
          mode,
          includeStopWords,
          order,
          maxWords,
        });

        if (tokens.length === 0) {
          return new Response(
            JSON.stringify({ error: '未能从文章中提取出有效单词' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Annotate unique words with phonetics and meanings
        const uniqueWords = Array.from(new Set(tokens.map((t) => t.word.toLowerCase())));
        const annotationMap = new Map<string, DictEntry>();

        // Annotate in small batches
        const batchSize = 10;
        for (let i = 0; i < uniqueWords.length; i += batchSize) {
          const chunk = uniqueWords.slice(i, i + batchSize);
          await Promise.all(
            chunk.map(async (w) => {
              const entry = await fetchWordAnnotation(w);
              if (entry) annotationMap.set(w, entry);
            })
          );
        }

        // Fallback to DeepSeek if key exists and some words are missing annotations
        if (env.DEEPSEEK_API_KEY) {
          const missingWords = uniqueWords.filter((w) => !annotationMap.has(w));
          if (missingWords.length > 0) {
            try {
              const prompt = `请为以下英语单词提供规范的美式音标 (phoneticAmE)、英式音标 (phoneticBrE)、词性 (pos) 和详尽清晰的中文注释/释义 (meaning)。
必须以合法 JSON 格式输出，根对象格式为：
{
  "words": [
    {
      "word": "单词",
      "phoneticAmE": "[音标]",
      "phoneticBrE": "[音标]",
      "pos": "词性",
      "meaning": "中文释义"
    }
  ]
}
待查询单词列表: ${missingWords.slice(0, 50).join(', ')}`;

              const parsed = await callDeepSeek(
                [
                  { role: 'system', content: '你是一个专业的英语词典与翻译助手。请严格输出合法 JSON 格式数据。' },
                  { role: 'user', content: prompt },
                ],
                env.DEEPSEEK_API_KEY
              );

              const list = Array.isArray(parsed) ? parsed : (parsed?.words || []);
              if (Array.isArray(list)) {
                list.forEach((item: any) => {
                  const w = String(item.word || '').toLowerCase().trim();
                  if (w) {
                    annotationMap.set(w, {
                      phoneticAmE: item.phoneticAmE || `[${w}]`,
                      phoneticBrE: item.phoneticBrE || item.phoneticAmE || `[${w}]`,
                      pos: item.pos || 'n./v.',
                      meaning: item.meaning || `${w}`,
                    });
                  }
                });
              }
            } catch (err) {
              console.error('DeepSeek fallback error in worker:', err);
            }
          }
        }

        const words: WordItem[] = tokens.map((token, idx) => {
          const entry = annotationMap.get(token.word.toLowerCase());
          return {
            id: `article-word-${idx}-${token.word}`,
            word: token.word,
            phoneticAmE: entry?.phoneticAmE || `[${token.word}]`,
            phoneticBrE: entry?.phoneticBrE || `[${token.word}]`,
            pos: entry?.pos || 'n./v.',
            meaning: entry?.meaning || '核心词汇',
            sentence: token.sentence,
            frequency: 1,
          };
        });

        return new Response(
          JSON.stringify({
            title: articleTitle,
            url: targetUrl || '',
            totalWords: words.length,
            words,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '解析文章异常';
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. API: Generate custom vocabulary expansion pack using DeepSeek
    if (url.pathname === '/api/generate-vocab-pack' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const { topic = '托福核心高频词汇', count = 40 } = body;
        const requestedCount = Math.min(100, Math.max(10, Number(count) || 40));

        const apiKey = env.DEEPSEEK_API_KEY;
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: '未配置 DEEPSEEK_API_KEY，请在 Cloudflare 环境变量中添加 DEEPSEEK_API_KEY' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const prompt = `你是一个顶级英语教学专家与词汇学导师。用户希望系统化拓展词汇量。
请根据主题/级别: "${topic}"，生成 ${requestedCount} 个最具代表性、高性价比、能显著提升英语词汇量的核心优质英语单词。
请以 JSON 格式输出，根对象结构必须如下：
{
  "title": "词包标题",
  "category": "分类标签",
  "words": [
    {
      "word": "单词小写原型",
      "phoneticAmE": "[美式音标]",
      "phoneticBrE": "[英式音标]",
      "pos": "词性",
      "meaning": "中文释义",
      "sentence": "自然地道英文例句",
      "sentenceTranslation": "例句中文翻译",
      "difficulty": "easy 或 medium 或 hard"
    }
  ]
}`;

        const parsed = await callDeepSeek(
          [
            { role: 'system', content: '你是一个顶级英语教育专家，精通词汇学与双语教学。请严格输出 JSON 格式。' },
            { role: 'user', content: prompt },
          ],
          apiKey
        );

        const wordsList = (parsed.words || []).map((item: any, idx: number) => ({
          id: `ai-pack-${Date.now()}-${idx}-${item.word}`,
          word: String(item.word || '').toLowerCase().trim().replace(/[^a-z]/g, ''),
          phoneticAmE: item.phoneticAmE || `[${item.word}]`,
          phoneticBrE: item.phoneticBrE || item.phoneticAmE || `[${item.word}]`,
          pos: item.pos || 'n.',
          meaning: item.meaning || '',
          sentence: item.sentence || '',
          sentenceTranslation: item.sentenceTranslation || '',
          difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty)
            ? item.difficulty
            : 'medium',
          frequency: 1,
        })).filter((w: any) => w.word.length > 1);

        return new Response(
          JSON.stringify({
            title: parsed.title || topic,
            category: parsed.category || '拓展词库',
            totalWords: wordsList.length,
            words: wordsList,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '生成拓展词库失败';
        return new Response(
          JSON.stringify({ error: message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. API: Lookup word
    if (url.pathname === '/api/lookup-word') {
      const word = url.searchParams.get('word')?.trim().toLowerCase() || '';
      if (!word) {
        return new Response(JSON.stringify({ error: 'word is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const entry = await fetchWordAnnotation(word);
      return new Response(
        JSON.stringify(
          entry || {
            phoneticAmE: `[${word}]`,
            phoneticBrE: `[${word}]`,
            pos: 'n./v.',
            meaning: '常用词汇',
          }
        ),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Fall through to Cloudflare Static Assets (SPA / dist files)
    return env.ASSETS.fetch(request);
  },
};

