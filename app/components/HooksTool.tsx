'use client'
import { useState } from 'react'
import { generateHooksApi } from '../lib/api'
import { useAiTool } from './useAiTool'
import { CARD, CopyRow, ErrorCard, INPUT, RunButton, ToolHeader } from './toolUi'

export default function HooksTool() {
  const [topic, setTopic] = useState('')
  const [hooks, setHooks] = useState<string[] | null>(null)
  const tool = useAiTool('hooks', 'Придумать хуки')
  const active = !!topic.trim() && tool.usable

  const go = async () => {
    if (!active) return
    setHooks(null)
    const res = await tool.run(pay => generateHooksApi(topic.trim(), pay))
    if (res) setHooks(res.hooks)
  }

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="Генератор хуков" subtitle="Опиши, о чём ролик — получи 10 первых фраз, которые не дают пролистать" />
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="Например: как я похудел на 5 кг без зала"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') go() }}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={tool.error} />
      {hooks?.map((h, i) => <CopyRow key={i} text={h} />)}
    </>
  )
}
