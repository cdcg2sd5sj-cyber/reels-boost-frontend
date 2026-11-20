import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Адрес картинки аватарки для <img>.
 * - "/users/:id/avatar" — картинка сохранена на нашем бэкенде: берём её оттуда.
 * - ссылка Instagram CDN (старые данные) — через наш прокси (у Instagram hotlink protection).
 */
export function avatarSrc(profilePicUrl: string | null): string | null {
  if (!profilePicUrl) return null
  if (profilePicUrl.startsWith('/')) return API_URL.replace(/\/$/, '') + profilePicUrl
  return `/api/avatar-proxy?url=${encodeURIComponent(profilePicUrl)}`
}
const TOKEN_KEY = 'rb_token'

export const tokenStorage = {
  get: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  set: (token: string) => { if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token) },
  clear: () => { if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY) },
}

const client = axios.create({ baseURL: API_URL })

client.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface Achievement {
  id: number
  title: string
  unlocked: boolean
}

export interface Profile {
  id: number
  igUsername: string
  profilePicUrl: string | null
  balance: number
  completedTasks: number
  earnedTotal: number
  spentTotal: number
  referralCode: string
  referrals: number
  streak: number
  achievements?: Achievement[]
}

export type LeaderboardPeriod = 'week' | 'month' | 'all'

export interface LeaderboardEntry {
  rank: number
  username: string
  profilePicUrl: string | null
  totalEarned: number
  completedTasksCount: number
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  currentUserRank: number | null
}

export interface NextTask {
  id: number
  reelsUrl: string
  reward: number
  slotsLeft: number
  author: { username: string; profilePicUrl: string | null }
}

export interface CampaignDto {
  id: number
  reelsUrl: string
  totalSlots: number
  filledSlots: number
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  createdAt: string
  _count: { completions: number }
  /** Последние участники, выполнившие задание (новые сверху) */
  viewers?: CampaignViewer[]
}

export interface CampaignViewer {
  username: string
  profilePicUrl: string | null
  completedAt: string
}

function getTelegramInitData(): string {
  if (typeof window === 'undefined') return ''
  return (window as any).Telegram?.WebApp?.initData || ''
}

export async function login(instagramUsername?: string) {
  const initData = getTelegramInitData()
  const { data } = await client.post('/auth/login', { initData, instagramUsername })
  return data as { token?: string; user?: any; needsInstagram?: boolean; igError?: string }
}

export async function getProfile(): Promise<Profile> {
  const { data } = await client.get('/users/me')
  return data
}

export async function getNextTask(): Promise<NextTask | null> {
  const { data } = await client.get('/tasks/next')
  return data
}

/** Сообщает серверу, что человек открыл Reels: от этого момента сервер отсчитывает время просмотра. */
/** Жалоба «Reels не открывается»: задание пропадает из ленты этого пользователя. */
export async function reportTaskApi(campaignId: number) {
  await client.post('/tasks/report', { campaignId })
}

export async function openTaskApi(campaignId: number) {
  const { data } = await client.post('/tasks/open', { campaignId })
  return data as { openedAt: string; minWatchSeconds: number }
}

export async function completeTaskApi(campaignId: number, reelsUrl: string) {
  const { data } = await client.post('/tasks/complete', { campaignId, reelsUrl })
  return data as { creditsEarned: number; streak: number; streakBonusApplied: boolean }
}

export async function createCampaignApi(reelsUrl: string, totalSlots: number) {
  const { data } = await client.post('/campaigns', { reelsUrl, totalSlots })
  return data
}

export async function getMyCampaigns(): Promise<CampaignDto[]> {
  const { data } = await client.get('/campaigns/mine')
  return data
}

export async function getLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardResponse> {
  const { data } = await client.get('/leaderboard', { params: { period } })
  return data
}

/** Достаёт текст ошибки из ответа NestJS (ValidationPipe/BadRequestException) */
export interface IdeasResult {
  ideas: { hook: string; structure: string; cta: string }[]
  caption: string
  hashtags: string[]
}

/**
 * Лимит ИИ-инструмента на сегодня: remaining — бесплатных попыток осталось;
 * paidRemaining — сколько ещё можно купить за кредиты; creditPrice — цена в ₢.
 */
export interface IdeasQuota {
  limit: number
  used: number
  remaining: number
  paidRemaining: number
  creditPrice: number
  balance: number
}

export type AiTool = 'ideas' | 'hooks' | 'caption' | 'check'
type QuotaFields = Pick<IdeasQuota, 'remaining' | 'paidRemaining' | 'balance' | 'creditPrice'>

export async function getAiQuotasApi(): Promise<Record<AiTool, IdeasQuota>> {
  const { data } = await client.get('/ai/quota')
  return data
}

export async function generateHooksApi(topic: string, payWithCredits = false): Promise<{ hooks: string[] } & QuotaFields> {
  const { data } = await client.post('/ai/hooks', { topic, payWithCredits })
  return data
}

export async function improveCaptionApi(text: string, payWithCredits = false): Promise<{ captions: string[]; tip: string } & QuotaFields> {
  const { data } = await client.post('/ai/caption', { text, payWithCredits })
  return data
}

export interface CheckResult { score: number; firstImpression: string; strengths: string[]; fixes: string[] }

export async function checkBeforePublishApi(
  images: { data: string; mediaType: 'image/jpeg' }[],
  description: string,
  payWithCredits = false,
): Promise<CheckResult & QuotaFields> {
  const { data } = await client.post('/ai/check', { images, description, payWithCredits })
  return data
}

export async function getIdeasQuotaApi(): Promise<IdeasQuota> {
  const { data } = await client.get('/ai/ideas/quota')
  return data
}

export async function generateIdeasApi(
  niche: string,
  payWithCredits = false,
): Promise<IdeasResult & Pick<IdeasQuota, 'remaining' | 'paidRemaining' | 'balance' | 'creditPrice'>> {
  const { data } = await client.post('/ai/ideas', { niche, payWithCredits })
  return data
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any
  const message = anyErr?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}
