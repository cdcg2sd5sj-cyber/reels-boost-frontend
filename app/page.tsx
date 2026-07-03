'use client'
import { useState, useEffect } from 'react'

interface UserData {
  igUsername: string
  balance: number
  completedTasks: number
  earnedTotal: number
  spentTotal: number
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [tab, setTab] = useState('tasks')
  const [wordCount, setWordCount] = useState(0)
  const [reelsUrl, setReelsUrl] = useState('')
  const [slots, setSlots] = useState(20)
  const [igInput, setIgInput] = useState('')
  const [taskDone, setTaskDone] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('reels_boost_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const saveUser = (data: UserData) => {
    setUser(data)
    localStorage.setItem('reels_boost_user', JSON.stringify(data))
  }

  const register = () => {
    if (!igInput) return
    const newUser: UserData = {
      igUsername: igInput,
      balance: 10,
      completedTasks: 0,
      earnedTotal: 0,
      spentTotal: 0,
    }
    saveUser(newUser)
  }

  const completeTask = () => {
    if (!user || wordCount < 10) return
    const updated = {
      ...user,
      balance: user.balance + 15,
      completedTasks: user.completedTasks + 1,
      earnedTotal: user.earnedTotal + 15,
    }
    saveUser(updated)
    setTaskDone(true)
    setWordCount(0)
  }

  const launchBoost = () => {
    if (!user) return
    const cost = Math.ceil(slots * 1.5)
    if (user.balance < cost || !reelsUrl) return
    const updated = {
      ...user,
      balance: user.balance - cost,
      spentTotal: user.spentTotal + cost,
    }
    saveUser(updated)
    setReelsUrl('')
    alert('Reels запущен в продвижение!')
  }

  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter((w: string) => w.length > 0)
    setWordCount(words.length)
  }

  if (!user) return (
    <div style="min-height:100vh;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px">
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">Reels Boost</h1>
        <p className="text-gray-400 text-sm mb-8">Комьюнити Instagram авторов</p>
        <div className="w-full mb-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Твой Instagram</div>
          <input
            className="w-full border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:border-blue-400"
            placeholder="@username"
            value={igInput}
            onChange={e => setIgInput(e.target.value)}
          />
          <div className="text-xs text-gray-400 mt-2">Открытый аккаунт, старше 30 дней, от 100 подписчиков</div>
        </div>
        <div className="w-full bg-blue-50 rounded-2xl p-4 mb-6">
          <div className="text-sm font-medium text-blue-700 mb-2">Как это работает</div>
          <div className="text-xs text-blue-600 space-y-1">
            <div>1. Выполняй задания — зарабатывай Credits</div>
            <div>2. Трать Credits на продвижение своих Reels</div>
            <div>3. Получай живую активность от реальных людей</div>
          </div>
        </div>
        <button
          onClick={register}
          className={`w-full rounded-2xl p-4 font-medium text-base ${igInput ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
        >Начать</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-auto p-4 pb-28">

        <div className="bg-white rounded-2xl p-4 mb-4 flex justify-between items-center">
          <div>
            <div className="text-xs text-gray-400 mb-1">Баланс</div>
            <div className="text-2xl font-bold">{user.balance} <span className="text-blue-500">₢</span></div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{user.igUsername}</div>
            <div className="text-xs text-gray-400 mt-1">Заданий: {user.completedTasks}</div>
          </div>
        </div>

        {tab === 'tasks' && (
          <div>
            {taskDone && (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-center">
                <div className="text-green-600 font-medium mb-1">+15 ₢ начислено!</div>
                <div className="text-xs text-green-500">Задание выполнено. Следующее уже ждёт!</div>
                <button onClick={() => setTaskDone(false)} className="mt-2 text-xs text-green-600 underline">Следующее задание</button>
              </div>
            )}
            {!taskDone && (
              <>
                <div className="font-semibold text-base mb-3">Следующее задание</div>
                <div className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-100">
                  <div className="p-4 border-b border-gray-50">
                    <div className="text-3xl font-bold text-green-500 mb-1">+15 ₢</div>
                    <div className="text-xs text-gray-400">за выполнение задания</div>
                  </div>
                  <div className="p-3 text-xs text-gray-400 flex justify-between">
                    <span>18 мест осталось</span><span>~5 минут</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
                  <div className="text-sm font-medium mb-3">Шаги выполнения</div>
                  <div className="space-y-3">
                    {['Открой Reels по ссылке', 'Досмотри до конца 3 раза', 'Лайк, сохранение, сторис, отправь другу', 'Оставь комментарий в Instagram'].map((s, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">{i+1}</div>
                        <div className="text-sm text-gray-600">{s}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="w-full bg-blue-500 text-white rounded-2xl p-4 font-medium mb-3">Открыть Reels</button>
                <div className="bg-blue-50 rounded-2xl p-4 mb-3 border border-blue-100">
                  <div className="text-sm font-medium text-blue-700 mb-1">Вставь свой комментарий</div>
                  <div className="text-xs text-blue-500">Написанный в Instagram — минимум 10 слов. ИИ проверит.</div>
                </div>
                <textarea
                  className="w-full border border-gray-200 rounded-2xl p-4 text-sm mb-1 h-24 outline-none focus:border-blue-400"
                  onChange={e => countWords(e.target.value)}
                />
                <div className={`text-xs text-right mb-3 ${wordCount >= 10 ? 'text-green-500' : 'text-gray-400'}`}>{wordCount} / 10 слов</div>
                <button
                  disabled={wordCount < 10}
                  onClick={completeTask}
                  className={`w-full rounded-2xl p-4 font-medium ${wordCount >= 10 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}
                >Отправить на проверку — получить 15 ₢</button>
              </>
            )}

            <div className="bg-white rounded-2xl p-4 mt-4 border border-gray-100">
              <div className="text-sm font-medium mb-3">Моя статистика</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Выполнено заданий</div>
                  <div className="text-xl font-bold">{user.completedTasks}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Заработано всего</div>
                  <div className="text-xl font-bold text-green-500">{user.earnedTotal} ₢</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Потрачено</div>
                  <div className="text-xl font-bold text-blue-500">{user.spentTotal} ₢</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400">Баланс</div>
                  <div className="text-xl font-bold">{user.balance} ₢</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'boost' && (
          <div>
            <div className="font-semibold text-base mb-3">Продвинуть мой Reels</div>
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="text-sm font-medium mb-2">Ссылка на Reels</div>
              <input
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-400"
                placeholder="https://instagram.com/reel/..."
                value={reelsUrl}
                onChange={e => setReelsUrl(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium">Участников</div>
                  <div className="text-xs text-gray-400 mt-0.5">Стоимость: {Math.ceil(slots * 1.5)} ₢</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSlots(s => Math.max(10, s-5))} className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-medium">-</button>
                  <div className="font-bold text-lg w-8 text-center">{slots}</div>
                  <button onClick={() => setSlots(s => Math.min(100, s+5))} className="w-9 h-9 rounded-xl border border-gray-200 text-lg font-medium">+</button>
                </div>
              </div>
            </div>
            {user.balance < Math.ceil(slots * 1.5) && (
              <div className="bg-red-50 rounded-2xl p-4 text-sm text-red-500 mb-4 text-center border border-red-100">
                Недостаточно Credits. Выполни задания чтобы заработать.
              </div>
            )}
            <button
              disabled={user.balance < Math.ceil(slots * 1.5) || !reelsUrl}
              onClick={launchBoost}
              className={`w-full rounded-2xl p-4 font-medium ${user.balance >= Math.ceil(slots * 1.5) && reelsUrl ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}
            >Запустить продвижение</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <button onClick={() => setTab('tasks')} className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 ${tab === 'tasks' ? 'text-blue-500' : 'text-gray-400'}`}>
          <span className="text-xl">📋</span>Задания
        </button>
        <button onClick={() => setTab('boost')} className={`flex-1 py-3 text-xs font-medium flex flex-col items-center gap-1 ${tab === 'boost' ? 'text-blue-500' : 'text-gray-400'}`}>
          <span className="text-xl">🚀</span>Мой Reels
        </button>
      </div>
    </div>
  )
}
