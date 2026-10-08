import { cleanHtml, tokenizeArticle, fetchWordAnnotation } from './utils/articleParser';
import { WordItem, DictEntry } from './types';

interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
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

    // 2. API: Lookup word
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

    // 3. Fall through to Cloudflare Static Assets (SPA / dist files)
    return env.ASSETS.fetch(request);
  },
};
