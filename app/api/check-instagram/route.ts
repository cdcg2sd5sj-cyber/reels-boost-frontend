import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { username } = await req.json()
  const clean = username.replace('@', '').trim()

  try {
    const response = await fetch(
      `https://instagram-scraper-stable-api.p.rapidapi.com/v1/info?username_or_id_or_url=${clean}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
          'X-RapidAPI-Host': 'instagram-scraper-stable-api.p.rapidapi.com',
        },
      }
    )

    const data = await response.json()
    const user = data?.data

    if (!user) return NextResponse.json({ valid: false, reason: 'Аккаунт не найден' })
    if (user.is_private) return NextResponse.json({ valid: false, reason: 'Аккаунт закрытый — сделай его открытым' })
    if (user.follower_count < 100) return NextResponse.json({ valid: false, reason: `Нужно минимум 100 подписчиков. У тебя: ${user.follower_count}` })
    if (user.media_count < 5) return NextResponse.json({ valid: false, reason: `Нужно минимум 5 публикаций. У тебя: ${user.media_count}` })

    return NextResponse.json({ valid: true, followers: user.follower_count, posts: user.media_count })
  } catch {
    return NextResponse.json({ valid: false, reason: 'Не удалось проверить аккаунт. Попробуй позже.' })
  }
}
