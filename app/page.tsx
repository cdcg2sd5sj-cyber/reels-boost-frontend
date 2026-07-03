'use client'
import { useEffect, useState } from 'react'

export default function Home() {
  const [screen, setScreen] = useState('loading')
  const [balance, setBalance] = useState(10)
  const [igUsername, setIgUsername] = useState('')
  const [comment, setComment] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [reelsUrl, setReelsUrl] = useState('')
  const [slots, setSlots] = useState(20)

  useEffect(() => {
    setTimeout(() => setScreen('onboarding'), 1000)
  }, [])

  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter((w: string) => w.length > 0)
    setWordCount(words.length)
    setComment(text)
  }

  if (screen === 'loading') return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-2xl font-bold">Reels Boost</div>
    </div>
  )

  if (screen === 'onboarding') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <h1 className="text-xl font-bold mb-2">Привет!</h1>
      <p className="text-gray-500 text-sm text-center mb-6">Получай реальную активность на свои Reels</p>
      <input
        className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-2"
        placeholder="@твой_instagram"
        value={igUsername}
        onChange={e => setIgUsername(e.target.value)}
      />
      <p className="text-xs text-gray-400 text-center mb-6">Аккаунт должен быть открытым и старше 30 дней</p>
      <button
        onClick={() => igUsername && setScreen('tasks')}
        className="w-full bg-blue-500 text-white rounded-xl p-3 font-medium"
      >Начать</button>
    </div>
  )

  if (screen === 'tasks') return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl p-4 mb-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400">Баланс</div>
          <div className="text-xl font-bold">{balance} Credits</div>
        </div>
      </div>
      <div className="font-medium mb-3">Следующее задание</div>
      <div className="bg-white rounded-xl overflow-hidden mb-4">
        <div className="p-4">
          <div className="text-2xl font-bold text-green-500">+15 Credits</div>
          <div className="text-xs text-gray-400">за выполнение задания</div>
        </div>
        <div className="border-t border-gray-100 p-3 text-xs text-gray-400">18 мест осталось</div>
      </div>
      <div className="space-y-2 mb-4">
        {['Открой Reels по ссылке', 'Досмотри 3 раза', 'Лайк, сохранение, сторис, Direct', 'Оставь комментарий в Instagram'].map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 text-xs flex items-center justify-center font-medium">{i+1}</div>
            <div className="text-sm text-gray-600">{s}</div>
          </div>
        ))}
      </div>
      <button onClick={() => window.open('https://instagram.com')} className="w-full bg-blue-500 text-white rounded-xl p-3 font-medium mb-3">Открыть Reels</button>
      <div className="bg-blue-50 rounded-xl p-3 mb-3">
        <div className="text-sm font-medium text-blue-600 mb-1">Комментарий в Instagram</div>
        <div className="text-xs text-blue-500">Напиши комментарий под роликом — минимум 10 слов. Потом вставь его сюда.</div>
      </div>
      <textarea
        className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-1 h-20"
        onChange={e => countWords(e.target.value)}
      />
      <div className={`text-xs text-right mb-3 ${wordCount >= 10 ? 'text-green-500' : 'text-gray-400'}`}>{wordCount} / 10 слов</div>
      <button
        disabled={wordCount < 10}
        onClick={() => { setBalance(b => b + 15); setScreen('boost') }}
        className={`w-full rounded-xl p-3 font-medium ${wordCount >= 10 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
      >Отправить на проверку</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-xl p-4 mb-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-400">Доступно</div>
          <div className="text-xl font-bold">{balance} Credits</div>
        </div>
      </div>
      <div className="font-medium mb-3">Вставь ссылку на Reels</div>
      <input
        className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-4"
        placeholder="instagram.com/reel/..."
        value={reelsUrl}
        onChange={e => setReelsUrl(e.target.value)}
      />
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">Участников</div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSlots(s => Math.max(5, s-5))} className="w-8 h-8 rounded-lg border border-gray-200 text-lg">-</button>
          <div className="font-medium w-8 text-center">{slots}</div>
          <button onClick={() => setSlots(s => Math.min(100, s+5))} className="w-8 h-8 rounded-lg border border-gray-200 text-lg">+</button>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 flex justify-between text-sm mb-4">
        <span className="text-gray-400">Спишется</span>
        <span className="font-medium">{Math.ceil(slots * 1.5)} Credits</span>
      </div>
      <button
        onClick={() => { setBalance(b => b - Math.ceil(slots * 1.5)); setScreen('tasks') }}
        className="w-full bg-blue-500 text-white rounded-xl p-3 font-medium"
      >Запустить продвижение</button>
    </div>
  )
}
