'use client'
import { useEffect, useState } from 'react'
import { getLeaderboard, LeaderboardEntry, LeaderboardPeriod, Profile } from '../lib/api'
import { IG_GRADIENT } from '../lib/theme'
import Avatar from './Avatar'

const ChevronLeftIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'all', label: 'Всё время' },
]

const MEDALS: Record<number, { emoji: string; bg: string; border: string }> = {
  1: { emoji: '🥇', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.35)' },
  2: { emoji: '🥈', bg: 'rgba(203,213,225,0.12)', border: 'rgba(203,213,225,0.3)' },
  3: { emoji: '🥉', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
}

function LeaderboardRow({ entry, isYou }: { entry: LeaderboardEntry; isYou?: boolean }) {
  const medal = MEDALS[entry.rank]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, marginBottom: 8,
      background: isYou ? 'rgba(99,102,241,0.15)' : medal ? medal.bg : 'rgba(255,255,255,0.04)',
      border: `0.5px solid ${isYou ? 'rgba(99,102,241,0.4)' : medal ? medal.border : 'rgba(255,255,255,0.06)'}`,
    }}>
      <div style={{ width: 26, textAlign: 'center', fontSize: medal ? 17 : 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
        {medal ? medal.emoji : `#${entry.rank}`}
      </div>
      <Avatar src={entry.profilePicUrl} username={entry.username} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{entry.username}{isYou ? ' (ты)' : ''}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{entry.completedTasksCount} заданий</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>{entry.totalEarned} ₢</div>
    </div>
  )
}

export default function LeaderboardPage({ onBack, profile }: { onBack: () => void; profile: Profile }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('week')
  const [top, setTop] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getLeaderboard(period)
      .then(res => {
        if (cancelled) return
        setTop(res.leaderboard)
        setCurrentUserRank(res.currentUserRank)
      })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить таблицу лидеров') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [period])

  const userInTop = currentUserRank !== null && top.some(e => e.rank === currentUserRank)

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0f0f1a', display: 'flex', alignItems: 'center',
        gap: 10, padding: '14px 14px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeftIcon color="#fff" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>🏆 Топ авторов</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 24 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, margin: '0 14px 14px', gap: 4 }}>
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                flex: 1, border: 'none', borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 600,
                background: period === p.id ? IG_GRADIENT : 'transparent',
                color: period === p.id ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', transition: 'background 0.2s ease',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ margin: '0 14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Загружаем…</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 30, fontSize: 11, color: '#f87171' }}>{error}</div>
          ) : top.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Пока никто не заработал Credits в этот период</div>
          ) : (
            <>
              {top.map(entry => (
                <LeaderboardRow key={entry.rank} entry={entry} isYou={entry.rank === currentUserRank} />
              ))}
              {currentUserRank !== null && !userInTop && (
                <>
                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 14, padding: '2px 0 8px' }}>⋯</div>
                  <LeaderboardRow
                    entry={{
                      rank: currentUserRank,
                      username: profile.igUsername,
                      profilePicUrl: profile.profilePicUrl,
                      totalEarned: profile.earnedTotal,
                      completedTasksCount: profile.completedTasks,
                    }}
                    isYou
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
