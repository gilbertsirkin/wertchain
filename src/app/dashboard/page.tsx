"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

// ── types ──────────────────────────────────────────────────────────────────
interface Wallet {
  available_balance: number
  locked_capital: number
  pending_release_capital: number
  pending_profit: number
}

interface Contract {
  id: string
  plan_tier: string
  principal_amount: number
  expected_profit: number
  profit_credited: number
  daily_profit_amount: number
  state: string
  auto_reinvest: boolean
  activated_at: string
  maturity_date: string
  profit_rate_snapshot: number
}

interface LedgerTx {
  id: string
  entry_type: string
  amount: number
  description: string
  effective_date: string
  created_at: string
}

// ── design tokens ──────────────────────────────────────────────────────────
const PLAN_META: Record<string, { label: string; color: string; glow: string; tier: string }> = {
  WERTCHAIN_START:        { label: 'Start',        tier: '01', color: '#3B82F6', glow: 'rgba(59,130,246,0.15)' },
  WERTCHAIN_GROWTH:       { label: 'Growth',       tier: '02', color: '#10B981', glow: 'rgba(16,185,129,0.15)' },
  WERTCHAIN_PROFESSIONAL: { label: 'Professional', tier: '03', color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)' },
  WERTCHAIN_ELITE:        { label: 'Elite',        tier: '04', color: '#F0B90B', glow: 'rgba(240,185,11,0.15)' },
}

const STATE_STYLE: Record<string, string> = {
  ACTIVE:          'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  PENDING:         'text-amber-400 bg-amber-400/10 border-amber-400/25',
  MATURED:         'text-blue-400 bg-blue-400/10 border-blue-400/25',
  RELEASE_QUEUE:   'text-orange-400 bg-orange-400/10 border-orange-400/25',
  RELEASED:        'text-teal-400 bg-teal-400/10 border-teal-400/25',
  AUTO_REINVESTED: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
  MIGRATED:        'text-zinc-400 bg-zinc-400/10 border-zinc-400/25',
  WITHDRAWN:       'text-zinc-500 bg-zinc-500/10 border-zinc-500/25',
}

const TX_ICON: Record<string, { icon: string; color: string }> = {
  DEPOSIT:             { icon: '↓', color: '#10B981' },
  INVESTMENT_CREATION: { icon: '⬡', color: '#F0B90B' },
  PROFIT_ACCRUAL:      { icon: '+', color: '#10B981' },
  PROFIT_CREDIT:       { icon: '✦', color: '#10B981' },
  AUTO_REINVEST:       { icon: '↺', color: '#8B5CF6' },
  WITHDRAWAL_REQUEST:  { icon: '↑', color: '#848E9C' },
  WITHDRAWAL_APPROVED: { icon: '✓', color: '#10B981' },
  CAPITAL_RELEASE:     { icon: '⬡', color: '#3B82F6' },
  MIGRATION_DEBIT:     { icon: '→', color: '#848E9C' },
  MIGRATION_CREDIT:    { icon: '←', color: '#8B5CF6' },
  BONUS:               { icon: '★', color: '#F0B90B' },
}

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'Pending'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(maturity: string | null | undefined) {
  if (!maturity) return null
  const diff = new Date(maturity).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const r = 20, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
      <circle
        cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="26" y="30" textAnchor="middle" fontSize="10" fill={color}
        style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const supabase = createClient()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [ledger, setLedger] = useState<LedgerTx[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const [walletRes, contractsRes, userRes, ledgerRes] = await Promise.all([
      supabase.from('wc_wallet_balances').select('*').eq('user_id', authUser.id).single(),
      supabase.from('wc_contracts').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
      supabase.from('wc_users').select('full_name, email').eq('id', authUser.id).single(),
      supabase.from('wc_ledger_transactions')
        .select('id, entry_type, amount, description, effective_date, created_at')
        .eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(30),
    ])
    setWallet(walletRes.data)
    setContracts((contractsRes.data as Contract[]) ?? [])
    setUser(userRes.data)
    setLedger((ledgerRes.data as LedgerTx[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function toggleAutoReinvest(contractId: string, current: boolean) {
    setTogglingId(contractId)
    const { error } = await supabase
      .from('wc_contracts')
      .update({ auto_reinvest: !current } as never)
      .eq('id', contractId)
    if (error) {
      showToast(error.message, false)
    } else {
      showToast(`Auto-reinvest ${!current ? 'enabled' : 'disabled'}.`, true)
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, auto_reinvest: !current } : c))
    }
    setTogglingId(null)
  }

  const activeContracts  = contracts.filter(c => c.state === 'ACTIVE')
  const pendingContracts = contracts.filter(c => c.state === 'PENDING')
  const historyContracts = contracts.filter(c => c.state !== 'ACTIVE' && c.state !== 'PENDING')
  const totalPortfolio   = (wallet?.available_balance ?? 0) + (wallet?.locked_capital ?? 0) + (wallet?.pending_release_capital ?? 0)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0B0E11' }}>
        <div className="w-7 h-7 rounded-full border-2 border-[#F0B90B]/30 border-t-[#F0B90B] animate-spin" />
        <p className="text-[#474D57] text-xs font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          Loading your portfolio…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-[#EAECEF]" style={{
      background: '#0B0E11',
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* ── toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-sm
          ${toast.ok ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : 'bg-red-950/90 border-red-500/40 text-red-300'}`}>
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${toast.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── nav ── */}
      <nav className="sticky top-0 z-40 border-b border-[#2B2F36]"
        style={{ background: 'rgba(11,14,17,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-black"
              style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)' }}>W</div>
            <span className="font-semibold text-[#EAECEF] text-sm tracking-wide">Wertchain</span>
          </div>

          <div className="flex items-center gap-5">
            {[['Deposit', '/deposit'], ['Invest', '/invest'], ['Wallet', '/wallet']].map(([label, href]) => (
              <Link key={href} href={href}
                className="text-xs text-[#848E9C] hover:text-[#EAECEF] transition-colors hidden sm:block"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {label}
              </Link>
            ))}
            <div className="h-4 w-px bg-[#2B2F36]" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)' }}>
                {(user?.full_name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[#848E9C] hidden md:block">{user?.full_name}</span>
            </div>
            <LogoutButton className="text-xs text-[#848E9C] hover:text-red-400 transition-colors" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-5 py-7 space-y-7">

        {/* ── portfolio hero ── */}
        <div className="rounded-2xl border border-[#2B2F36] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #161A1E 0%, #0B0E11 100%)' }}>
          <div className="absolute-0 relative">
            {/* gold top line */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #F0B90B, transparent)' }} />
            <div className="p-6 sm:p-8">
              <p className="text-[10px] font-mono tracking-[0.2em] text-[#848E9C] uppercase mb-2"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Total Portfolio Value
              </p>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-[#848E9C] text-2xl font-mono font-light"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}>$</span>
                <span className="text-4xl sm:text-5xl font-mono font-bold text-[#EAECEF] tracking-tight"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                  {fmt(totalPortfolio)}
                </span>
              </div>

              {/* wallet breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Available', value: wallet?.available_balance ?? 0, color: '#F0B90B', highlight: true },
                  { label: 'Locked', value: wallet?.locked_capital ?? 0, color: '#8B5CF6' },
                  { label: 'Pending Release', value: wallet?.pending_release_capital ?? 0, color: '#3B82F6' },
                  { label: 'Accruing Profit', value: wallet?.pending_profit ?? 0, color: '#10B981' },
                ].map(item => (
                  <div key={item.label}
                    className="rounded-xl border p-3.5"
                    style={{
                      borderColor: item.highlight ? 'rgba(240,185,11,0.3)' : '#2B2F36',
                      background: item.highlight ? 'rgba(240,185,11,0.06)' : 'rgba(255,255,255,0.02)',
                    }}>
                    <p className="text-[10px] font-mono tracking-wide uppercase mb-1.5"
                      style={{ color: '#848E9C', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {item.label}
                    </p>
                    <p className="text-base font-mono font-semibold"
                      style={{ color: item.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                      ${fmt(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* quick actions */}
              <div className="flex gap-2 mt-5 flex-wrap">
                <Link href="/deposit"
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-black transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Deposit
                </Link>
                <Link href="/invest"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:border-[#F0B90B]/50"
                  style={{ borderColor: 'rgba(240,185,11,0.3)', color: '#F0B90B', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Invest
                </Link>
                <Link href="/wallet"
                  className="px-5 py-2.5 rounded-lg text-sm font-medium border border-[#2B2F36] text-[#848E9C] hover:text-[#EAECEF] hover:border-[#3a3f47] transition-all"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  Withdraw
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── active investments ── */}
        {(activeContracts.length > 0 || pendingContracts.length > 0) && (
          <section>
            <p className="text-[10px] font-mono tracking-[0.15em] text-[#848E9C] uppercase mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Active Investments · {activeContracts.length + pendingContracts.length}
            </p>
            <div className="space-y-3">
              {[...pendingContracts, ...activeContracts].map(c => {
                const meta = PLAN_META[c.plan_tier] ?? { label: c.plan_tier, tier: '—', color: '#848E9C', glow: 'transparent' }
                const days = daysLeft(c.maturity_date)
                const profitPct = c.expected_profit > 0 ? (c.profit_credited / c.expected_profit) * 100 : 0

                return (
                  <div key={c.id} className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: `${meta.color}30`, background: `linear-gradient(135deg, ${meta.glow} 0%, #161A1E 60%)` }}>
                    {/* colored top strip */}
                    <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                        <div>
                          <div className="flex items-center gap-2.5 mb-1">
                            <span className="text-[10px] font-mono tracking-[0.15em] uppercase"
                              style={{ color: meta.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                              {meta.tier}
                            </span>
                            <span className="text-base font-semibold text-[#EAECEF]">Wertchain {meta.label}</span>
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono ${STATE_STYLE[c.state] ?? ''}`}
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              {c.state}
                            </span>
                          </div>
                          <p className="text-3xl font-mono font-bold text-[#EAECEF]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            ${fmt(c.principal_amount)}
                          </p>
                          <p className="text-xs text-[#848E9C] mt-1 font-mono"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {(c.profit_rate_snapshot * 100).toFixed(0)}% APY · matures {fmtDate(c.maturity_date)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-mono text-[#848E9C] uppercase tracking-wide mb-0.5"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              Profit Earned
                            </p>
                            <p className="text-xl font-mono font-semibold text-emerald-400"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              +${fmt(c.profit_credited)}
                            </p>
                            <p className="text-[11px] text-[#474D57] font-mono">of ${fmt(c.expected_profit)}</p>
                          </div>
                          <ProgressRing value={c.profit_credited} max={c.expected_profit} color={meta.color} />
                        </div>
                      </div>

                      {c.state === 'ACTIVE' && (
                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                          <div className="flex gap-5 text-xs font-mono text-[#848E9C]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {days !== null && (
                              <span><span className="text-[#EAECEF] font-semibold">{days}</span> days left</span>
                            )}
                            <span><span className="text-emerald-400 font-semibold">+${fmt(c.daily_profit_amount)}</span>/day</span>
                          </div>
                          <button
                            onClick={() => toggleAutoReinvest(c.id, c.auto_reinvest)}
                            disabled={togglingId === c.id}
                            className="flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-lg border transition-all font-mono disabled:opacity-40"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              borderColor: c.auto_reinvest ? 'rgba(16,185,129,0.3)' : '#2B2F36',
                              color: c.auto_reinvest ? '#10B981' : '#848E9C',
                              background: c.auto_reinvest ? 'rgba(16,185,129,0.08)' : 'transparent',
                            }}>
                            <span className={`w-1.5 h-1.5 rounded-full ${c.auto_reinvest ? 'bg-emerald-400' : 'bg-[#474D57]'}`} />
                            Auto-reinvest {c.auto_reinvest ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── empty state ── */}
        {contracts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2B2F36] p-12 text-center">
            <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(240,185,11,0.1)', border: '1px solid rgba(240,185,11,0.2)' }}>
              <span className="text-[#F0B90B] text-xl">⬡</span>
            </div>
            <p className="text-[#848E9C] text-sm mb-1">No active investments</p>
            <p className="text-[#474D57] text-xs mb-5">Fund your wallet and choose a plan to start earning fixed yields.</p>
            <Link href="/invest"
              className="inline-flex px-5 py-2.5 rounded-lg text-sm font-semibold text-black transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)' }}>
              Browse Plans
            </Link>
          </div>
        )}

        {/* ── recent activity ── */}
        {ledger.length > 0 && (
          <section>
            <p className="text-[10px] font-mono tracking-[0.15em] text-[#848E9C] uppercase mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Recent Activity
            </p>
            <div className="rounded-xl border border-[#2B2F36] overflow-hidden">
              {ledger.map((tx, i) => {
                const icon = TX_ICON[tx.entry_type] ?? { icon: '·', color: '#848E9C' }
                return (
                  <div key={tx.id}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-[#2B2F36] last:border-0 transition-colors hover:bg-[#161A1E]"
                    style={{ background: i % 2 === 1 ? 'rgba(22,26,30,0.5)' : 'transparent' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: `${icon.color}12`, color: icon.color }}>
                      {icon.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#EAECEF] truncate">{tx.description}</p>
                      <p className="text-[11px] font-mono text-[#474D57] mt-0.5"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {tx.entry_type} · {fmtDate(tx.effective_date)}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-semibold flex-shrink-0"
                      style={{ color: icon.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                      ${fmt(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── contract history ── */}
        {historyContracts.length > 0 && (
          <section>
            <p className="text-[10px] font-mono tracking-[0.15em] text-[#848E9C] uppercase mb-4"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Contract History
            </p>
            <div className="rounded-xl border border-[#2B2F36] overflow-hidden">
              {historyContracts.map((c, i) => {
                const meta = PLAN_META[c.plan_tier] ?? { label: c.plan_tier, tier: '—', color: '#848E9C', glow: '' }
                return (
                  <div key={c.id}
                    className="flex items-center justify-between px-5 py-4 border-b border-[#2B2F36] last:border-0 hover:bg-[#161A1E] transition-colors"
                    style={{ background: i % 2 === 1 ? 'rgba(22,26,30,0.5)' : 'transparent' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: meta.color }} />
                      <div>
                        <p className="text-sm font-medium text-[#EAECEF]">Wertchain {meta.label}</p>
                        <p className="text-[11px] font-mono text-[#474D57]"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {fmtDate(c.maturity_date ?? c.activated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-mono font-semibold text-[#EAECEF]"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          ${fmt(c.principal_amount)}
                        </p>
                        <p className="text-[11px] font-mono text-emerald-400"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          +${fmt(c.profit_credited)}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border font-mono ${STATE_STYLE[c.state] ?? ''}`}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {c.state}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}