'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

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

const PLAN_LABELS: Record<string, string> = {
  WERTCHAIN_START: 'Start', WERTCHAIN_GROWTH: 'Growth',
  WERTCHAIN_PROFESSIONAL: 'Professional', WERTCHAIN_ELITE: 'Elite',
}
const PLAN_APY: Record<string, string> = {
  WERTCHAIN_START: '5%', WERTCHAIN_GROWTH: '8%',
  WERTCHAIN_PROFESSIONAL: '15%', WERTCHAIN_ELITE: '40%',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
function daysLeft(m?: string | null) {
  if (!m) return null
  return Math.max(0, Math.ceil((new Date(m).getTime() - Date.now()) / 86400000))
}

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
      supabase.from('wc_ledger_transactions').select('id, entry_type, amount, description, effective_date, created_at')
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
  const historyContracts = contracts.filter(c => c.state !== 'ACTIVE' && c.state !== 'PENDING')
  const pendingContracts = contracts.filter(c => c.state === 'PENDING')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="text-zinc-600 text-sm">Loading your portfolio…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">

      {/* ── toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-sm font-medium shadow-xl
          ${toast.ok ? 'bg-emerald-900/80 border-emerald-500/40 text-emerald-300' : 'bg-red-900/80 border-red-500/40 text-red-300'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── nav ── */}
      <nav className="border-b border-[#1E2A3B] sticky top-0 z-40 bg-[#0A0F1E]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
              <span className="text-black text-xs font-black">W</span>
            </div>
            <span className="font-semibold text-white">Wertchain</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/deposit" className="text-xs text-zinc-400 hover:text-white transition-colors">Deposit</Link>
            <Link href="/invest" className="text-xs text-zinc-400 hover:text-white transition-colors">Invest</Link>
            <Link href="/wallet" className="text-xs text-zinc-400 hover:text-white transition-colors">Wallet</Link>
            <div className="h-4 w-px bg-[#1E2A3B]" />
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <span className="text-amber-400 text-[10px] font-semibold">
                  {(user?.full_name ?? "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-zinc-500 hidden sm:inline">{user?.full_name}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── wallet summary ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-2 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-transparent p-5">
            <p className="text-xs text-amber-400/70 uppercase tracking-widest mb-1">Available Balance</p>
            <p className="text-3xl font-mono font-bold text-amber-400">{fmt(wallet?.available_balance ?? 0)}</p>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Link href="/deposit"
                className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors">
                Deposit
              </Link>
              <Link href="/invest"
                className="px-3 py-1.5 rounded border border-amber-500/40 hover:border-amber-400 text-amber-400 text-xs font-medium transition-colors">
                Invest
              </Link>
              <Link href="/wallet"
                className="px-3 py-1.5 rounded border border-[#1E2A3B] hover:border-zinc-600 text-zinc-400 text-xs font-medium transition-colors">
                Withdraw
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Locked Capital</p>
            <p className="text-xl font-mono font-semibold text-white">{fmt(wallet?.locked_capital ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Pending Release</p>
            <p className="text-xl font-mono font-semibold text-white">{fmt(wallet?.pending_release_capital ?? 0)}</p>
          </div>
          {(wallet?.pending_profit ?? 0) > 0 && (
            <div className="col-span-2 sm:col-span-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400/70 uppercase tracking-widest mb-0.5">Accruing Profit</p>
                <p className="text-sm text-zinc-400">Profit credited to your balance at contract maturity</p>
              </div>
              <p className="text-xl font-mono font-semibold text-emerald-400">+{fmt(wallet?.pending_profit ?? 0)}</p>
            </div>
          )}
        </div>

        {/* ── active contracts ── */}
        {(activeContracts.length > 0 || pendingContracts.length > 0) && (
          <div>
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Active Investments</h2>
            <div className="space-y-3">
              {[...pendingContracts, ...activeContracts].map(c => (
                <div key={c.id} className={`rounded-xl border bg-gradient-to-br p-5 ${PLAN_COLORS[c.plan_tier] ?? 'from-zinc-900/40 to-zinc-800/20 border-zinc-500/30'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">Wertchain {PLAN_LABELS[c.plan_tier]}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${STATE_COLORS[c.state] ?? ''}`}>
                          {c.state}
                        </span>
                      </div>
                      <p className="text-2xl font-mono font-bold text-white">{fmt(c.principal_amount)}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {(c.profit_rate_snapshot * 100).toFixed(0)}% profit · matures {fmtDate(c.maturity_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Profit earned</p>
                      <p className="text-lg font-mono text-emerald-400">+{fmt(c.profit_credited)}</p>
                      <p className="text-xs text-zinc-600">of {fmt(c.expected_profit)}</p>
                    </div>
                  </div>

                  {c.state === 'ACTIVE' && (
                    <>
                      <ProgressBar value={c.profit_credited} max={c.expected_profit} />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-4 text-xs text-zinc-500">
                          <span>{daysLeft(c.maturity_date) !== null ? `${daysLeft(c.maturity_date)} days left` : "Awaiting activation"}</span>
                          <span>+{fmt(c.daily_profit_amount)}/day</span>
                        </div>
                        <button
                          onClick={() => toggleAutoReinvest(c.id, c.auto_reinvest)}
                          disabled={togglingId === c.id}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors
                            ${c.auto_reinvest
                              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                              : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.auto_reinvest ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                          Auto-reinvest {c.auto_reinvest ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── no contracts CTA ── */}
        {contracts.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#1E2A3B] p-10 text-center">
            <p className="text-zinc-500 text-sm mb-3">You have no active investments yet.</p>
            <Link href="/invest"
              className="inline-flex px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold transition-colors">
              Browse Plans
            </Link>
          </div>
        )}

        {/* ── ledger history ── */}
        {ledger.length > 0 && (
          <div>
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Recent Activity</h2>
            <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] divide-y divide-[#1E2A3B]">
              {ledger.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-sm w-5 text-center text-zinc-500">{TX_ICONS[tx.entry_type] ?? '·'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{tx.description}</p>
                    <p className="text-xs text-zinc-600 font-mono">{tx.entry_type} · {fmtDate(tx.effective_date)}</p>
                  </div>
                  <span className="text-sm font-mono text-emerald-400 whitespace-nowrap">{fmt(tx.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── past contracts ── */}
        {historyContracts.length > 0 && (
          <div>
            <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Contract History</h2>
            <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] divide-y divide-[#1E2A3B]">
              {historyContracts.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Wertchain {PLAN_LABELS[c.plan_tier]}</p>
                    <p className="text-xs text-zinc-600">{fmtDate(c.maturity_date ?? c.activated_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white">{fmt(c.principal_amount)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${STATE_COLORS[c.state] ?? ''}`}>
                      {c.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}