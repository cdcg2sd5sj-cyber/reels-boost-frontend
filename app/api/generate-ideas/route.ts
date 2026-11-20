import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Клиент создаётся при первом запросе, а не при сборке: на этапе сборки ключа может не быть.
// Ключ берётся из ANTHROPIC_API_KEY в переменных окружения Vercel.
let client: Anthropic | null = null
const getClient = () => (client ??= new Anthropic())

export async function POST(req: NextRequest) {
  const { niche } = await req.json()

  if (!niche || typeof niche !== 'string' || niche.trim().length < 2) {
    return NextResponse.json({ error: 'Укажи нишу или тему' }, { status: 400 })
  }

  let text = '{}'
  try {
    const response = await getClient().messages.create({
      // Haiku 5.5: быстрее и в десятки раз дешевле Sonnet, для идей хватает.
      model: 'claude-haiku-5-5',
      max_tokens: 4000,
      // Задача простая — минимум размышлений, быстрее ответ и меньше затрат.
      output_config: { effort: 'low' },
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
    })
    // У Haiku 5.5 размышления включены по умолчанию: первым блоком может идти thinking,
    // поэтому берём именно текстовый блок.
    if (response.stop_reason !== 'refusal') {
      text = response.content.find(b => b.type === 'text')?.text ?? '{}'
    }
  } catch (error) {
    console.error('generate-ideas: Claude API error', error instanceof Anthropic.APIError ? error.status : error)
    return NextResponse.json({ error: 'Сервис идей временно недоступен, попробуй позже' }, { status: 502 })
  }

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Не удалось сгенерировать идеи, попробуй ещё раз' }, { status: 502 })
  }
}
