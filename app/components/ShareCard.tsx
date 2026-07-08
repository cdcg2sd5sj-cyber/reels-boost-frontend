'use client'
import { useState } from 'react'
import { Profile } from '../lib/api'
import { PURPLE } from '../lib/theme'
import { getInitials } from './Avatar'

const WIDTH = 1080
const HEIGHT = 1920

function loadImage(src: string | null): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function drawShareCard(profile: Profile): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#0f0f1a'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT * 0.55)
  glow.addColorStop(0, '#833AB4')
  glow.addColorStop(0.5, '#FD1D1D')
  glow.addColorStop(1, '#FCAF45')
  ctx.globalAlpha = 0.16
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.ellipse(WIDTH / 2, 0, WIDTH * 0.8, HEIGHT * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  const avatarSize = 220
  const avatarX = WIDTH / 2
  const avatarY = 340
  const proxiedSrc = profile.profilePicUrl ? `/api/avatar-proxy?url=${encodeURIComponent(profile.profilePicUrl)}` : null
  const avatarImg = await loadImage(proxiedSrc)

  const ringGrad = ctx.createLinearGradient(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarX + avatarSize / 2, avatarY + avatarSize / 2)
  ringGrad.addColorStop(0, '#833AB4')
  ringGrad.addColorStop(0.5, '#FD1D1D')
  ringGrad.addColorStop(1, '#FCAF45')
  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 10, 0, Math.PI * 2)
  ctx.fillStyle = ringGrad
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
  } else {
    ctx.fillStyle = '#0f0f1a'
    ctx.fillRect(avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize)
    ctx.fillStyle = '#fff'
    ctx.font = '700 76px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(getInitials(profile.igUsername), avatarX, avatarY)
  }
  ctx.restore()

  ctx.fillStyle = '#fff'
  ctx.font = '700 54px -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`@${profile.igUsername}`, WIDTH / 2, avatarY + avatarSize / 2 + 80)

  const stats = [
    { label: 'Заработано', value: `${profile.earnedTotal} ₢`, color: '#4ade80' },
    { label: 'Заданий выполнено', value: `${profile.completedTasks}`, color: '#ffffff' },
    { label: 'Стрик', value: `${profile.streak} дн. 🔥`, color: '#f59e0b' },
  ]
  const cardW = 760
  const cardH = 150
  const cardX = (WIDTH - cardW) / 2
  let cardY = avatarY + avatarSize / 2 + 150
  const gap = 26

  for (const stat of stats) {
    roundRect(ctx, cardX, cardY, cardW, cardH, 24)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.stroke()

    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '600 28px -apple-system, sans-serif'
    ctx.fillText(stat.label, cardX + 40, cardY + 58)

    ctx.fillStyle = stat.color
    ctx.font = '800 56px -apple-system, sans-serif'
    ctx.fillText(stat.value, cardX + 40, cardY + 118)

    cardY += cardH + gap
  }

  const brandY = HEIGHT - 120
  const iconSize = 56
  const iconX = WIDTH / 2 - 140
  const iconY = brandY - iconSize / 2
  const iconGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize)
  iconGrad.addColorStop(0, '#833AB4')
  iconGrad.addColorStop(0.5, '#FD1D1D')
  iconGrad.addColorStop(1, '#FCAF45')
  roundRect(ctx, iconX, iconY, iconSize, iconSize, 16)
  ctx.fillStyle = iconGrad
  ctx.fill()
  ctx.textAlign = 'left'
  ctx.fillStyle = '#fff'
  ctx.font = '700 40px -apple-system, sans-serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('Reels Boost', WIDTH / 2 - 140 + iconSize + 16, brandY)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

export default function ShareResultsButton({ profile }: { profile: Profile }) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)

  const handleShare = async () => {
    setGenerating(true)
    setError('')
    try {
      const blob = await drawShareCard(profile)
      if (!blob) {
        setError('Не удалось создать карточку — попробуй ещё раз')
        return
      }

      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> }
      const file = new File([blob], 'reels-boost-results.png', { type: 'image/png' })
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: 'Reels Boost', text: 'Мои результаты в Reels Boost' })
          return
        } catch {
          // Пользователь закрыл системный share sheet или он недоступен —
          // показываем превью карточки с ручным сохранением ниже.
        }
      }

      setPreviewBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch {
      setError('Не удалось создать карточку — попробуй ещё раз')
    } finally {
      setGenerating(false)
    }
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewBlob(null)
  }

  const handleSave = () => {
    if (!previewBlob || !previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = 'reels-boost-results.png'
    a.click()
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={generating}
        style={{
          background: PURPLE, borderRadius: 14, padding: '13px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700,
          color: '#fff', margin: '8px 12px', cursor: generating ? 'default' : 'pointer', border: 'none',
          width: 'calc(100% - 24px)', opacity: generating ? 0.6 : 1, display: 'block',
        }}
      >
        {generating ? 'Создаём карточку…' : '📤 Поделиться результатами'}
      </button>

      {error && (
        <div style={{ margin: '0 12px 8px', background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#f87171' }}>{error}</div>
      )}

      {previewUrl && (
        <div
          onClick={closePreview}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 300, width: '100%' }}>
            <img src={previewUrl} alt="Карточка результатов" style={{ width: '100%', borderRadius: 16, marginBottom: 12, display: 'block' }} />
            <button
              onClick={handleSave}
              style={{ background: PURPLE, border: 'none', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#fff', width: '100%', cursor: 'pointer', marginBottom: 8 }}
            >
              Сохранить изображение
            </button>
            <button
              onClick={closePreview}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 14, padding: '11px 16px', fontSize: 13, fontWeight: 600, color: '#fff', width: '100%', cursor: 'pointer' }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  )
}
