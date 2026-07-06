import { NextRequest, NextResponse } from 'next/server'

// Инстаграм отдаёт фото профиля с CDN-доменов, которые ограничивают прямую
// загрузку по Referer/User-Agent (hotlink protection). Поэтому качаем картинку
// на сервере и отдаём её фронтенду сами — а заодно не даём роуту стать
// открытым прокси, разрешая только эти домены.
const ALLOWED_HOSTS = [/(^|\.)cdninstagram\.com$/, /(^|\.)fbcdn\.net$/]

// HTTP-кеш (браузер + Vercel Edge Network) держит картинку сутки — этого
// достаточно, чтобы один и тот же пользователь не дёргал Instagram при каждом
// открытии профиля. stale-while-revalidate позволяет ещё неделю отдавать
// подзастаревшую версию, пока в фоне тихо подтягивается свежая.
const HTTP_CACHE_HEADER = 'public, max-age=86400, stale-while-revalidate=604800'

// Доп. серверный кеш байт картинки — на случай, если HTTP-кеш промахнётся
// из-за смены подписанных токенов (oe/oh/_nc_ht и т.п.) в query-строке
// Instagram-ссылки: сам путь до медиа-файла при этом остаётся стабильным.
// Работает как best-effort in-memory LRU: на serverless (Vercel) память не
// гарантированно переживает между вызовами и не шарится между параллельными
// инстансами, поэтому это не замена HTTP-кешу, а подстраховка для случая,
// когда несколько запросов подряд попадают в один и тот же тёплый инстанс.
const LRU_MAX_ENTRIES = 500
const LRU_MAX_TOTAL_BYTES = 40 * 1024 * 1024 // 40MB — жёсткий потолок независимо от числа пользователей

interface CachedImage {
  bytes: ArrayBuffer
  contentType: string
}

const imageCache = new Map<string, CachedImage>()
let cachedTotalBytes = 0

function cacheKeyFor(parsed: URL): string {
  return parsed.hostname + parsed.pathname
}

function getCached(key: string): CachedImage | undefined {
  const entry = imageCache.get(key)
  if (!entry) return undefined
  // Переставляем в конец Map — используем как порядок "давно использовалось → недавно"
  imageCache.delete(key)
  imageCache.set(key, entry)
  return entry
}

function setCached(key: string, entry: CachedImage) {
  const existing = imageCache.get(key)
  if (existing) cachedTotalBytes -= existing.bytes.byteLength

  imageCache.delete(key)
  imageCache.set(key, entry)
  cachedTotalBytes += entry.bytes.byteLength

  while (imageCache.size > 0 && (imageCache.size > LRU_MAX_ENTRIES || cachedTotalBytes > LRU_MAX_TOTAL_BYTES)) {
    const oldestKey = imageCache.keys().next().value
    if (oldestKey === undefined) break
    const oldest = imageCache.get(oldestKey)
    if (oldest) cachedTotalBytes -= oldest.bytes.byteLength
    imageCache.delete(oldestKey)
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.some((re) => re.test(parsed.hostname))) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 })
  }

  const key = cacheKeyFor(parsed)
  const cached = getCached(key)
  if (cached) {
    return new NextResponse(cached.bytes, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': HTTP_CACHE_HEADER,
      },
    })
  }

  let upstream: Response
  try {
    upstream = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Referer: 'https://www.instagram.com/',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg'
  const bytes = await upstream.arrayBuffer()
  setCached(key, { bytes, contentType })

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': HTTP_CACHE_HEADER,
    },
  })
}
