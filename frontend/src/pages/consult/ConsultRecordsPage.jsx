import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, History, MessageSquare, ChevronRight, Calendar, Activity, Sparkles, Stethoscope, Brain, Clock, CheckCircle2, X, AlertCircle, ChevronDown } from 'lucide-react'
import { api } from '../../api.js'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 问诊记录页 · Claymorphism
export default function ConsultRecordsPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState(null)
  const [myAppts, setMyAppts] = useState([])
  const [tab, setTab] = useState('all')

  useEffect(() => { load() }, [])

  const load = async () => {
    const [sRes, aRes] = await Promise.all([
      api.consultSessions(),
      api.myAppointments()
    ])
    if (sRes.code === 200) setSessions(sRes.data || [])
    if (aRes.code === 200) setMyAppts(aRes.data || [])
  }

  if (sessions === null) return <CenterLoading />

  const total = sessions.length + myAppts.length
  const completed = myAppts.filter(a => a.status === 'completed').length
  const ongoing = myAppts.filter(a => a.status === 'pending' || a.status === 'confirmed').length

  const apptStatus = {
    pending:   { label: '待支付', emoji: '⏳', bg: 'bg-amber-50', text: 'text-amber-700' },
    confirmed: { label: '已预约', emoji: '✅', bg: 'bg-trust-50', text: 'text-trust-600' },
    completed: { label: '已完成', emoji: '🎉', bg: 'bg-health-50', text: 'text-health-600' },
    cancelled: { label: '已取消', emoji: '❌', bg: 'bg-ink-100',  text: 'text-ink-500' }
  }

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-health-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* Hero（Clay + 极光青绿） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-5 text-white shadow-clay">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,#B8F2D8 0%,#2EC4B6 50%,#1FA89C 100%)'
        }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute top-4 right-8 text-6xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.6s' }}>📋</div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> 问诊记录
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              <History size={32} /> 问诊历史 <span className="text-3xl">📋</span>
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">查看历次 AI 对话 · 预约问诊</p>
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-md">
              {[
                { num: sessions.length, label: 'AI 对话', icon: '🧠' },
                { num: completed, label: '已完成', icon: '✅' },
                { num: ongoing, label: '进行中', icon: '⏳' }
              ].map((s, i) => (
                <div key={i} className="glass text-white rounded-clay px-3 py-2 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-base font-extrabold font-display">{s.num}</div>
                  <div className="text-[10px] opacity-90">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Tab 切换（Clay） */}
      <Reveal delay={1} className="clay clay-hover p-3 mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { k: 'all', l: '全部', emoji: '📋' },
          { k: 'appt', l: '预约问诊', emoji: '📅' },
          { k: 'ai', l: 'AI 对话', emoji: '🧠' }
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`clickable flex items-center gap-1 whitespace-nowrap text-xs px-4 py-2 rounded-full font-bold transition-all shrink-0
              ${tab === t.k
                ? 'bg-gradient-to-r from-health-500 to-health-600 text-white shadow-glow-health font-display'
                : 'clay-inset text-ink-700'
              }`}
          >
            <span>{t.emoji}</span>
            <span>{t.l}</span>
          </button>
        ))}
      </Reveal>

      {/* 预约问诊 */}
      {(tab === 'all' || tab === 'appt') && (
        <Reveal delay={2} className="clay clay-hover p-5 mb-4">
          <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-2">
            <span className="w-1 h-4 bg-health-500 rounded-full" />
            <Calendar size={14} className="text-health-600" /> 预约问诊
            <span className="text-xs text-ink-500 font-normal ml-1">({myAppts.length})</span>
          </h3>
          {myAppts.length === 0 ? (
            <div className="clay-inset text-center py-10">
              <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>📅</div>
              <Stethoscope size={32} className="text-ink-300 mx-auto mb-2" />
              <p className="text-sm text-ink-500 mb-3">还没有预约过医师问诊</p>
              <button
                onClick={() => navigate('/consult/chat')}
                className="clickable text-sm font-bold text-white px-5 py-2 rounded-clay shadow-glow-health font-display"
                style={{ background: 'linear-gradient(135deg,#2EC4B6,#1FA89C)' }}
              >
                🩺 去预约医师
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myAppts.map((a, i) => {
                const statusMeta = apptStatus[a.status] || apptStatus.pending
                return (
                  <div key={a.id} className="clay-inset p-3.5 flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-clay ${statusMeta.bg} flex items-center justify-center text-2xl shadow-clay-sm shrink-0`}>
                      {statusMeta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-bold text-ink-900 truncate font-display">{a.doctorName || '医师'}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusMeta.bg} ${statusMeta.text}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-500 mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> {a.apptDate} {a.apptSlot}</span>
                        <span className="text-ink-300">·</span>
                        <span className="flex items-center gap-0.5">🐾 {a.userPetName || '未命名'}</span>
                      </div>
                      <div className="text-sm text-health-600 font-extrabold mt-1 font-display">¥{a.amount}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Reveal>
      )}

      {/* AI 对话历史 */}
      {(tab === 'all' || tab === 'ai') && (
        <Reveal delay={3} className="clay clay-hover p-5">
          <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-2">
            <span className="w-1 h-4 bg-health-500 rounded-full" />
            <Brain size={14} className="text-health-600" /> AI 对话历史
            <span className="text-xs text-ink-500 font-normal ml-1">({sessions.length})</span>
          </h3>
          {sessions.length === 0 ? (
            <div className="clay-inset text-center py-10">
              <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>🧠</div>
              <Brain size={32} className="text-health-300 mx-auto mb-2" />
              <p className="text-sm text-ink-500 mb-3">还没有 AI 对话记录</p>
              <button
                onClick={() => navigate('/consult/ai')}
                className="clickable text-sm font-bold text-white px-5 py-2 rounded-clay shadow-glow-health font-display"
                style={{ background: 'linear-gradient(135deg,#2EC4B6,#1FA89C)' }}
              >
                💬 开始 AI 问诊
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.map(s => (
                <div
                  key={s.id}
                  onClick={() => navigate('/consult/ai')}
                  className="clay-inset p-3.5 flex items-center gap-3 hover:scale-[1.01] transition cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-health-400 to-health-600 text-white flex items-center justify-center shadow-clay-sm shrink-0 text-lg group-hover:animate-bounce-soft">
                    🧠
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-ink-900 truncate font-display group-hover:text-health-600 transition">
                      {s.title || '新的问诊'}
                    </div>
                    <div className="text-[10px] text-ink-500 mt-0.5 flex items-center gap-1.5">
                      <Clock size={10} />
                      {s.createTime?.replace('T', ' ').slice(0, 16) || '刚刚'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-ink-400 group-hover:text-health-600 transition shrink-0" />
                </div>
              ))}
            </div>
          )}
        </Reveal>
      )}
    </section>
  )
}

function CenterLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="clay inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    </div>
  )
}
