'use client'
import { useState } from 'react'
import { fileToJpegBase64 } from '../lib/image'

export const MAX_IMAGES = 3

// Выбор 1–3 картинок: сжимает в JPEG и показывает превью с кнопкой удаления.
export function useImagePicker() {
  const [images, setImages] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setError('')
    setBusy(true)
    try {
      const picked = Array.from(files).slice(0, MAX_IMAGES - images.length)
      const converted = await Promise.all(picked.map(f => fileToJpegBase64(f)))
      setImages(prev => [...prev, ...converted].slice(0, MAX_IMAGES))
    } catch {
      setError('Не удалось прочитать картинку — попробуй другой файл')
    } finally {
      setBusy(false)
    }
  }

  const remove = (i: number) => setImages(prev => prev.filter((_, j) => j !== i))
  const payload = images.map(data => ({ data, mediaType: 'image/jpeg' as const }))
  return { images, busy, error, addFiles, remove, payload }
}

export function ImagePicker({ picker, label }: { picker: ReturnType<typeof useImagePicker>; label: string }) {
  const { images, busy, addFiles, remove } = picker
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      {images.map((img, i) => (
        <div key={i} style={{ position: 'relative', width: 72, height: 96 }}>
          <img src={`data:image/jpeg;base64,${img}`} alt={`${label} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
          <button
            onClick={() => remove(i)}
            style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>
      ))}
      {images.length < MAX_IMAGES && (
        <label style={{ width: 72, height: 96, borderRadius: 10, border: '0.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
          {busy ? '…' : '+'}
        </label>
      )}
    </div>
  )
}

export function BulletCard({ title, color, items }: { title: string; color: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>{title}</div>
      {items.map((t, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>• {t}</div>)}
    </div>
  )
}
