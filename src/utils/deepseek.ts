export async function callDeepSeek(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey?: string,
  customBaseUrl?: string
): Promise<any> {
  const key = apiKey || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : undefined);
  if (!key) {
    throw new Error('未检测到 DEEPSEEK_API_KEY，请在 .env 文件或 Cloudflare 环境变量中配置');
  }

  const rawBaseUrl = customBaseUrl || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_BASE_URL : undefined) || 'https://api.deepseek.com';
  const endpoint = rawBaseUrl.endsWith('/chat/completions')
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000), // 60s timeout protection
    });
  } catch (netErr: any) {
    if (netErr.name === 'TimeoutError') {
      throw new Error('DeepSeek API 请求超时（超过60秒），请检查网络连接或稍后重试');
    }
    throw new Error(`连接 DeepSeek API 失败: ${netErr.message || String(netErr)}`);
  }

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 401) {
      throw new Error('DeepSeek API 鉴权失败 (401)，请检查 DEEPSEEK_API_KEY 是否正确');
    }
    if (res.status === 402) {
      throw new Error('DeepSeek 账户余额不足 (402)，请前往 DeepSeek 开放平台充值');
    }
    if (res.status === 429) {
      throw new Error('DeepSeek API 请求频次超限 (429)，请稍候重试');
    }
    throw new Error(`DeepSeek API 请求失败 (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  let content = data.choices?.[0]?.message?.content || '{}';

  // Strip <think>...</think> reasoning traces if deepseek-reasoner or thinking mode is enabled
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip Markdown code block decorators
  if (content.startsWith('```json')) {
    content = content.slice(7);
  } else if (content.startsWith('```')) {
    content = content.slice(3);
  }
  if (content.endsWith('```')) {
    content = content.slice(0, -3);
  }
  content = content.trim();

  // Extract outermost JSON block if any surrounding text remains
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(content);
  } catch (parseErr) {
    console.error('DeepSeek JSON 解析失败:', content);
    throw new Error(`解析 DeepSeek 返回的数据失败: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }
}
