'use client'
import { useState } from 'react'
import { IG_GRADIENT } from '../lib/theme'

/** Инициалы для аватара-заглушки (в духе Instagram — кольцо-градиент + инициалы) */
export function getInitials(igUsername: string): string {
  const clean = igUsername.replace(/[^a-zA-Zа-яА-Я0-9]/g, '')
  return clean.slice(0, 2).toUpperCase() || '??'
}

/**
 * Круглая аватарка: фото профиля Instagram (через прокси-роут — у Instagram
 * hotlink protection, поэтому картинку нельзя грузить напрямую по URL) с
 * фолбэком на инициалы, если фото нет или прокси не смог его получить.
 */
export default function Avatar({ src, username, size }: { src: string | null; username: string; size: number }) {
  const [failed, setFailed] = useState(false)
  const proxiedSrc = src ? `/api/avatar-proxy?url=${encodeURIComponent(src)}` : null

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', padding: 2, background: IG_GRADIENT, flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {proxiedSrc && !failed ? (
          <img
            src={proxiedSrc}
            alt={username}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            onError={() => setFailed(true)}
          />
        ) : (
          <span style={{ fontSize: size * 0.32, fontWeight: 600, color: '#fff' }}>{getInitials(username)}</span>
        )}
      </div>
    </div>
  )
}
