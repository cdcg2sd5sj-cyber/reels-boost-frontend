import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
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

export interface Profile {
  id: number
  igUsername: string
  balance: number
  completedTasks: number
  earnedTotal: number
  spentTotal: number
  referralCode: string
  referrals: number
  streak: number
}

export interface NextTask {
  id: number
  reelsUrl: string
  reward: number
  slotsLeft: number
}

export interface CampaignDto {
  id: number
  reelsUrl: string
  totalSlots: number
  filledSlots: number
  createdAt: string
  _count: { completions: number }
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

export async function completeTaskApi(campaignId: number, comment: string) {
  const { data } = await client.post('/tasks/complete', { campaignId, comment })
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

/** Достаёт текст ошибки из ответа NestJS (ValidationPipe/BadRequestException) */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as any
  const message = anyErr?.response?.data?.message
  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string') return message
  return fallback
}
