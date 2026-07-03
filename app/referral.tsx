'use client'
export function ReferralBlock({ username }: { username: string }) {
  const code = username.replace('@', '').toUpperCase().slice(0, 6)
  const link = `t.me/reelsboost_bot?start=${code}`

  const copy = () => {
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована!')
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 mt-4">
      <div className="text-sm font-medium mb-1">Пригласи друга</div>
      <div className="text-xs text-gray-400 mb-3">Ты и друг получите по +20 Credits</div>
      <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center gap-2">
        <div className="text-xs text-gray-600 truncate">{link}</div>
        <button onClick={copy} className="text-blue-500 text-xs font-medium whitespace-nowrap">Копировать</button>
      </div>
    </div>
  )
}
