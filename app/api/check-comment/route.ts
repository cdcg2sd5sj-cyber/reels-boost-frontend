import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { comment, prevComments } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Проверь комментарий к Instagram Reels. Ответь только YES или NO.

Правила — комментарий плохой если:
- Бессмысленный набор слов или просто эмодзи
- Явный спам или шаблонный текст
- Очень похож на один из предыдущих комментариев

Предыдущие комментарии: ${(prevComments || []).slice(-5).join(' | ')}

Новый комментарий: "${comment}"

Ответ (YES = хороший, NO = плохой):`
      }]
    })
  })

  const data = await response.json()
  const result = data.content?.[0]?.text?.trim() || 'NO'
  return NextResponse.json({ approved: result.includes('YES') })
}
