import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { niche } = await req.json()

  if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
    return NextResponse.json({ error: 'Укажи нишу или тему' }, { status: 400 })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Ты помогаешь начинающему блогеру придумать контент для Instagram Reels.

Ниша/тема блогера: "${niche.trim().slice(0, 200)}"

Придумай 3 РАЗНЫЕ концепции коротких видео (Reels) для этой ниши. Для каждой:
- hook — первая фраза/кадр, который цепляет за первые 2-3 секунды
- structure — краткое описание структуры ролика по шагам (2-4 шага)
- cta — призыв к действию в конце (лайк/подписка/сохранение/комментарий)

Также придумай:
- caption — готовую подпись под один из этих роликов (2-4 предложения, живым языком, без канцелярита)
- hashtags — 8-12 релевантных хэштегов на русском и английском вперемешку (с символом #)

Ответь СТРОГО в виде JSON, без markdown-разметки, без пояснений до или после:
{
  "ideas": [
    {"hook": "...", "structure": "...", "cta": "..."},
    {"hook": "...", "structure": "...", "cta": "..."},
    {"hook": "...", "structure": "...", "cta": "..."}
  ],
  "caption": "...",
  "hashtags": ["#...", "#..."]
}`,
      }],
    }),
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Не удалось сгенерировать идеи, попробуй ещё раз' }, { status: 502 })
  }
}
