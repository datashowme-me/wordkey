export async function callDeepSeek(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  apiKey?: string
): Promise<any> {
  const key = apiKey || (typeof process !== 'undefined' ? process.env?.DEEPSEEK_API_KEY : undefined);
  if (!key) {
    throw new Error('未检测到 DEEPSEEK_API_KEY，请在 .env 文件或 Cloudflare 环境变量中配置');
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
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
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API 请求失败 (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.slice(7);
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.slice(3);
  }
  if (cleanContent.endsWith('```')) {
    cleanContent = cleanContent.slice(0, -3);
  }
  cleanContent = cleanContent.trim();

  try {
    return JSON.parse(cleanContent);
  } catch (parseErr) {
    console.error('DeepSeek JSON 解析失败:', content);
    throw new Error(`解析 DeepSeek 返回的数据失败: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
  }
}
