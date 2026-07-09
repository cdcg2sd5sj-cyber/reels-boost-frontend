'use client'
import { IG_GRADIENT } from '../lib/theme'

export type BoostSuccessInfo = { name: string; emoji: string; slots: number; cost: number }

export default function BoostSuccessModal({ info, onClose }: { info: BoostSuccessInfo; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'boostSuccessFade 0.25s ease',
      }}
    >
      <style>{`
        @keyframes boostSuccessFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes boostSuccessScale { from { opacity: 0; transform: scale(0.85) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
      <div
        style={{
          background: '#1a1a2e', borderRadius: 22, padding: '32px 24px 24px',
          maxWidth: 340, width: '100%', textAlign: 'center',
          border: '0.5px solid rgba(255,255,255,0.1)',
          animation: 'boostSuccessScale 0.35s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: IG_GRADIENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, margin: '0 auto 18px',
        }}>
          {info.emoji}
        </div>

        <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          Продвижение запущено! 🚀
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 20 }}>
          Участники сообщества начнут выполнять задания в ближайшее время
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginBottom: 22, border: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Пакет</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{info.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Участников</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{info.slots}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Списано</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>{info.cost} ₢</span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: IG_GRADIENT, border: 'none', borderRadius: 14, padding: '13px 16px',
            fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', width: '100%',
          }}
        >
          Отлично
        </button>
      </div>
    </div>
  )
}
