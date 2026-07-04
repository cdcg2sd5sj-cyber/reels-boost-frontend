import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { saveScreenshot, commentScreenshot, commentText } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Проверь два скриншота выполнения задания в Instagram.

Скриншот 1 — сохранение ролика
Скриншот 2 — комментарий под роликом

Текст комментария который должен быть на скриншоте: "${commentText}"

Ответь ТОЛЬКО в формате JSON:
{
  "saveValid": true/false,
  "commentValid": true/false,
  "reason": "причина если что-то не так"
}`
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: saveScreenshot
            }
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: commentScreenshot
            }
          }
        ]
      }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ saveValid: false, commentValid: false, reason: 'Ошибка проверки' })
  }
}
