'use client'
import { useEffect, useState } from 'react'
import { AiTool, apiErrorMessage, getAiQuotasApi, IdeasQuota } from '../lib/api'

type QuotaFields = Pick<IdeasQuota, 'remaining' | 'paidRemaining' | 'balance' | 'creditPrice'>

/**
 * Общая логика ИИ-инструмента: лимит на сегодня, покупка за кредиты, текст кнопки и подсказки.
 * run() вызывает запрос; бэкенд сам решает, бесплатная это попытка или платная.
 */
export function useAiTool(tool: AiTool, actionLabel: string) {
  const [quota, setQuota] = useState<IdeasQuota | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = () => getAiQuotasApi().then(all => setQuota(all[tool])).catch(() => undefined)
  useEffect(() => { refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const freeLeft = quota ? quota.remaining > 0 : true
  const paidLeft = !!quota && quota.paidRemaining > 0
  const canAfford = !!quota && quota.balance >= quota.creditPrice
  const mode: 'free' | 'paid' | 'poor' | 'done' = freeLeft ? 'free' : !paidLeft ? 'done' : canAfford ? 'paid' : 'poor'
  const usable = !loading && (mode === 'free' || mode === 'paid')

  async function run<T extends QuotaFields>(request: (payWithCredits: boolean) => Promise<T>): Promise<T | null> {
    if (!usable) return null
    setLoading(true)
    setError('')
    try {
      const res = await request(mode === 'paid')
      setQuota(q => q && { ...q, remaining: res.remaining, paidRemaining: res.paidRemaining, balance: res.balance, creditPrice: res.creditPrice })
      return res
    } catch (err) {
      setError(apiErrorMessage(err, 'Ошибка сети — попробуй ещё раз'))
      refresh()
      return null
    } finally {
      setLoading(false)
    }
  }

  const buttonText = loading
    ? 'ИИ думает...'
    : mode === 'free' ? actionLabel
    : mode === 'paid' ? `${actionLabel} за ${quota!.creditPrice} ₢`
    : mode === 'poor' ? `Нужно ${quota!.creditPrice} ₢ — выполни пару заданий`
    : 'На сегодня всё — приходи завтра'

  const hint = !quota ? null
    : mode === 'free' ? `Бесплатно сегодня: ${quota.remaining}. Дальше — ${quota.creditPrice} ₢`
    : mode === 'done' ? 'Лимит на день исчерпан. В платных тарифах больше'
    : quota.limit > 0 ? `Бесплатная попытка на сегодня использована · Баланс: ${quota.balance} ₢`
    : `Стоимость: ${quota.creditPrice} ₢ · Баланс: ${quota.balance} ₢`

  return { quota, loading, error, mode, usable, run, buttonText, hint }
}
