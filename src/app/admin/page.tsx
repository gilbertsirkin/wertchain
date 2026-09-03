'use client'

import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { useState, useEffect, useCallback, useRef } from 'react'

// ── types ──────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'deposits' | 'withdrawals' | 'migrations' | 'users'

interface Stats {
  totalLockedCapital: number
  totalAvailableBalance: number
  pendingDeposits: number
  pendingWithdrawals: number
  pendingMigrations: number
  activeContracts: number
  totalUsers: number
}

interface Deposit {
  id: string
  user_id: string
  amount: number
  payment_method: string
  payment_reference: string
  status: string
  created_at: string
  wc_users: { full_name: string; email: string } | null
}

interface Withdrawal {
  id: string
  user_id: string
  amount: number
  withdrawal_type: string
  status: string
  created_at: string
  destination_details: Record<string, string>
  wc_users: { full_name: string; email: string } | null
}

interface Migration {
  id: string
  user_id: string
  capital_amount: number
  topup_amount: number
  migration_type: string
  target_plan_tier: string
  status: string
  created_at: string
  wc_users: { full_name: string; email: string } | null
}

interface User {
  id: string
  full_name: string
  email: string
  kyc_status: string
  is_suspended: boolean
  is_active: boolean
  created_at: string
}

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const STATUS_META: Record<string, { color: string; dot: string }> = {
  PENDING:        { color: 'text-amber-400 bg-amber-400/10 border-amber-400/25',   dot: 'bg-amber-400' },
  APPROVED:       { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', dot: 'bg-emerald-400' },
  REJECTED:       { color: 'text-red-400 bg-red-400/10 border-red-400/25',         dot: 'bg-red-400' },
  CANCELLED:      { color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25',       dot: 'bg-zinc-500' },
  VERIFIED:       { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', dot: 'bg-emerald-400' },
  UNVERIFIED:     { color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25',       dot: 'bg-zinc-500' },
  PENDING_REVIEW: { color: 'text-blue-400 bg-blue-400/10 border-blue-400/25',       dot: 'bg-blue-400' },
  ACTIVE:         { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25', dot: 'bg-emerald-400' },
  INACTIVE:       { color: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/25',       dot: 'bg-zinc-500' },
  SUSPENDED:      { color: 'text-red-400 bg-red-400/10 border-red-400/25',         dot: 'bg-red-400' },
}

function Badge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { color: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/25', dot: 'bg-zinc-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono tracking-wider font-medium ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  )
}

function KpiCard({ label, value, sub, accent, delta }: {
  label: string; value: string; sub?: string; accent?: boolean; delta?: string
}) {
  return (
    <div className={`relative rounded-xl border p-5 overflow-hidden group transition-all duration-200 hover:border-opacity-60
      ${accent
        ? 'border-[#F0B90B]/30 bg-gradient-to-br from-[#F0B90B]/8 to-transparent'
        : 'border-[#2B2F36] bg-[#161A1E] hover:border-[#3a3f47]'}`}>
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F0B90B]/60 to-transparent" />
      )}
      <p className="text-[10px] font-mono tracking-[0.15em] text-[#848E9C] uppercase mb-2">{label}</p>
      <p className={`text-2xl font-mono font-bold tracking-tight ${accent ? 'text-[#F0B90B]' : 'text-[#EAECEF]'}`}>{value}</p>
      {sub && <p className="text-[11px] text-[#474D57] mt-1.5 font-mono">{sub}</p>}
      {delta && <p className="text-[11px] text-emerald-400 mt-1 font-mono">{delta}</p>}
    </div>
  )
}

function SectionHeader({ title, count, children }: { title: string; count?: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[#EAECEF] tracking-wide">{title}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-mono text-[#848E9C] bg-[#0B0E11] border border-[#2B2F36] px-2 py-0.5 rounded-full">
            {count} records
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function FilterBar({ value, onChange }: {
  value: string
  onChange: (v: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED') => void
}) {
  const opts = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const
  return (
    <div className="flex gap-1 bg-[#0B0E11] border border-[#2B2F36] rounded-lg p-1">
      {opts.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1.5 rounded-md text-[11px] font-mono tracking-wide transition-all duration-150
            ${value === f
              ? 'bg-[#F0B90B]/15 text-[#F0B90B] border border-[#F0B90B]/30'
              : 'text-[#848E9C] hover:text-[#EAECEF]'}`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}

// ── row card ───────────────────────────────────────────────────────────────
function RowCard({ children, pending }: { children: React.ReactNode; pending?: boolean }) {
  return (
    <div className={`rounded-xl border transition-all duration-150
      ${pending
        ? 'border-[#F0B90B]/20 bg-gradient-to-r from-[#F0B90B]/4 to-[#161A1E] hover:border-[#F0B90B]/30'
        : 'border-[#2B2F36] bg-[#161A1E] hover:border-[#3a3f47]'}`}>
      {children}
    </div>
  )
}

// ── reject modal ──────────────────────────────────────────────────────────
function RejectModal({ title, onConfirm, onCancel, loading }: {
  title: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#2B2F36] bg-[#0B0E11] p-6 space-y-5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <span className="text-red-400 text-xs">✕</span>
            </div>
            <h3 className="text-[#EAECEF] font-semibold text-sm">Confirm Rejection</h3>
          </div>
          <p className="text-[#848E9C] text-xs font-mono ml-9">{title}</p>
        </div>
        <div>
          <label className="text-[10px] font-mono tracking-[0.12em] text-[#848E9C] uppercase block mb-2">
            Reason <span className="text-red-400">*</span>
          </label>
          <textarea
            ref={ref}
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full bg-[#161A1E] border border-[#2B2F36] rounded-lg px-4 py-3 text-[#EAECEF] text-sm font-mono resize-none focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-[#474D57]"
            placeholder="Visible to the user — be clear and specific."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-[#2B2F36] text-[#848E9C] text-sm hover:text-[#EAECEF] hover:border-[#3a3f47] transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()) }}
            disabled={loading || !reason.trim()}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
          >
            {loading ? 'Processing…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── main component ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab]               = useState<Tab>('overview')
  const [stats, setStats]           = useState<Stats | null>(null)
  const [deposits, setDeposits]     = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [users, setUsers]           = useState<User[]>([])
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)
  const [rejectModal, setRejectModal] = useState<{
    type: 'deposit' | 'withdrawal' | 'migration'
    id: string; title: string
  } | null>(null)
  const [depositFilter, setDepositFilter]       = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [migrationFilter, setMigrationFilter]   = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to load admin data')
      const data = await res.json()
      setStats(data.stats)
      setDeposits(data.deposits)
      setWithdrawals(data.withdrawals)
      setMigrations(data.migrations)
      setUsers(data.users)
    } catch (e: unknown) {
      showToast((e as Error).message, false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function approveDeposit(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/deposits/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: id, action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Deposit approved — ledger updated.', true)
      setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'APPROVED' } : d))
      setStats(prev => prev ? { ...prev, pendingDeposits: Math.max(0, prev.pendingDeposits - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null) }
  }

  async function rejectDeposit(id: string, reason: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/deposits/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: id, action: 'reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Deposit rejected.', true)
      setDeposits(prev => prev.map(d => d.id === id ? { ...d, status: 'REJECTED' } : d))
      setStats(prev => prev ? { ...prev, pendingDeposits: Math.max(0, prev.pendingDeposits - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null); setRejectModal(null) }
  }

  async function approveWithdrawal(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: id, action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Withdrawal approved.', true)
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'APPROVED' } : w))
      setStats(prev => prev ? { ...prev, pendingWithdrawals: Math.max(0, prev.pendingWithdrawals - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null) }
  }

  async function rejectWithdrawal(id: string, reason: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/withdrawals/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: id, action: 'reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Withdrawal rejected — funds returned.', true)
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'REJECTED' } : w))
      setStats(prev => prev ? { ...prev, pendingWithdrawals: Math.max(0, prev.pendingWithdrawals - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null); setRejectModal(null) }
  }

  async function approveMigration(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/migrations/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migration_id: id, action: 'approve' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Migration approved — new contract live.', true)
      setMigrations(prev => prev.map(m => m.id === id ? { ...m, status: 'APPROVED' } : m))
      setStats(prev => prev ? { ...prev, pendingMigrations: Math.max(0, prev.pendingMigrations - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null) }
  }

  async function rejectMigration(id: string, reason: string) {
    setActionLoading(id)
    try {
      const res = await fetch('/api/admin/migrations/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migration_id: id, action: 'reject', reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showToast('Migration rejected.', true)
      setMigrations(prev => prev.map(m => m.id === id ? { ...m, status: 'REJECTED' } : m))
      setStats(prev => prev ? { ...prev, pendingMigrations: Math.max(0, prev.pendingMigrations - 1) } : prev)
    } catch (e: unknown) {
      showToast((e as Error).message ?? 'Failed', false)
    } finally { setActionLoading(null); setRejectModal(null) }
  }

  function handleModalConfirm(reason: string) {
    if (!rejectModal) return
    if (rejectModal.type === 'deposit')    rejectDeposit(rejectModal.id, reason)
    if (rejectModal.type === 'withdrawal') rejectWithdrawal(rejectModal.id, reason)
    if (rejectModal.type === 'migration')  rejectMigration(rejectModal.id, reason)
  }

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',    label: 'Overview' },
    { id: 'deposits',    label: 'Deposits',    badge: stats?.pendingDeposits },
    { id: 'withdrawals', label: 'Withdrawals', badge: stats?.pendingWithdrawals },
    { id: 'migrations',  label: 'Migrations',  badge: stats?.pendingMigrations },
    { id: 'users',       label: 'Users' },
  ]

  const visibleDeposits    = depositFilter    === 'ALL' ? deposits    : deposits.filter(d => d.status === depositFilter)
  const visibleWithdrawals = withdrawalFilter === 'ALL' ? withdrawals : withdrawals.filter(w => w.status === withdrawalFilter)
  const visibleMigrations  = migrationFilter  === 'ALL' ? migrations  : migrations.filter(m => m.status === migrationFilter)

  return (
    <div className="min-h-screen text-[#EAECEF] font-sans" style={{
      background: '#0B0E11',
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* google fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* ── reject modal ── */}
      {rejectModal && (
        <RejectModal
          title={rejectModal.title}
          onConfirm={handleModalConfirm}
          onCancel={() => setRejectModal(null)}
          loading={actionLoading !== null}
        />
      )}

      {/* ── toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-sm transition-all
          ${toast.ok
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/90 border-red-500/40 text-red-300'}`}
          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <span className={`w-1.5 h-1.5 rounded-full ${toast.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {toast.msg}
        </div>
      )}

      {/* ── topbar ── */}
      <header className="sticky top-0 z-40 border-b border-[#2B2F36]"
        style={{ background: 'rgba(11,14,17,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">

          {/* logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-black"
              style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)', fontFamily: "'IBM Plex Sans', sans-serif" }}>
              W
            </div>
            <span className="font-semibold text-[#EAECEF] tracking-wide text-sm"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Wertchain
            </span>
            <span className="text-[10px] font-mono text-[#474D57] tracking-[0.15em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              ADMIN
            </span>
          </div>

          {/* stats + nav */}
          <div className="flex items-center gap-5">
            {stats && (
              <div className="hidden md:flex items-center gap-4 text-[11px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span className="text-[#848E9C]">
                  LOCKED <span className="text-[#F0B90B] font-semibold">{fmt(stats.totalLockedCapital)}</span>
                </span>
                <span className="text-[#474D57]">·</span>
                <span className="text-[#848E9C]">
                  ACTIVE <span className="text-[#EAECEF]">{stats.activeContracts}</span>
                </span>
                <span className="text-[#474D57]">·</span>
                <span className="text-[#848E9C]">
                  USERS <span className="text-[#EAECEF]">{stats.totalUsers}</span>
                </span>
              </div>
            )}
            <div className="h-4 w-px bg-[#2B2F36]" />
            <Link href="/dashboard"
              className="text-xs text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Dashboard
            </Link>
            <LogoutButton className="text-xs text-[#848E9C] hover:text-red-400 transition-colors" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-7">

        {/* ── tabs ── */}
        <div className="flex gap-0 border-b border-[#2B2F36] mb-7 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-150
                ${tab === t.id ? 'text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'}`}
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              {t.label}
              {t.badge && t.badge > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-black"
                  style={{ background: '#F0B90B', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {t.badge > 9 ? '9+' : t.badge}
                </span>
              ) : null}
              {tab === t.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #F0B90B, transparent)' }} />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#F0B90B]/30 border-t-[#F0B90B] animate-spin" />
            <p className="text-[#474D57] text-xs font-mono" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Loading platform data…
            </p>
          </div>
        ) : (
          <>
            {/* ════════════════════════════════════════════════════════════
                OVERVIEW
            ════════════════════════════════════════════════════════════ */}
            {tab === 'overview' && stats && (
              <div className="space-y-5">
                {/* primary KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard label="Total Locked Capital"  value={fmt(stats.totalLockedCapital)}    accent />
                  <KpiCard label="Available Balances"    value={fmt(stats.totalAvailableBalance)} />
                  <KpiCard label="Active Contracts"      value={String(stats.activeContracts)} />
                  <KpiCard label="Registered Users"      value={String(stats.totalUsers)} />
                </div>

                {/* queue KPIs */}
                <div className="grid grid-cols-3 gap-3">
                  <KpiCard
                    label="Pending Deposits"
                    value={String(stats.pendingDeposits)}
                    sub={stats.pendingDeposits > 0 ? 'Awaiting verification' : 'Queue clear'}
                    delta={stats.pendingDeposits > 0 ? '→ Review in Deposits tab' : undefined}
                  />
                  <KpiCard
                    label="Pending Withdrawals"
                    value={String(stats.pendingWithdrawals)}
                    sub={stats.pendingWithdrawals > 0 ? 'Awaiting payout' : 'Queue clear'}
                    delta={stats.pendingWithdrawals > 0 ? '→ Review in Withdrawals tab' : undefined}
                  />
                  <KpiCard
                    label="Pending Migrations"
                    value={String(stats.pendingMigrations)}
                    sub={stats.pendingMigrations > 0 ? 'Awaiting approval' : 'Queue clear'}
                    delta={stats.pendingMigrations > 0 ? '→ Review in Migrations tab' : undefined}
                  />
                </div>

                {/* ledger integrity note */}
                <div className="rounded-xl border border-[#2B2F36] bg-[#161A1E] p-4 overflow-x-auto">
                  <p className="text-[10px] font-mono tracking-[0.12em] text-[#474D57] uppercase mb-2"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Ledger Integrity
                  </p>
                  <p className="text-[11px] text-[#474D57] font-mono leading-relaxed"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    All balances derive from the master ledger. Canonical balance per user:<br />
                    <span className="text-[#848E9C]">
                      SELECT SUM(amount) FILTER (WHERE direction = &apos;CREDIT&apos;) - SUM(amount) FILTER (WHERE direction = &apos;DEBIT&apos;) FROM wc_ledger_entries WHERE account_type = &apos;USER_WALLET&apos; AND user_id = :id
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                DEPOSITS
            ════════════════════════════════════════════════════════════ */}
            {tab === 'deposits' && (
              <div className="space-y-3">
                <SectionHeader title="Deposits" count={visibleDeposits.length}>
                  <FilterBar value={depositFilter} onChange={setDepositFilter} />
                </SectionHeader>

                {visibleDeposits.length === 0 && (
                  <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-[#2B2F36] text-[#474D57] text-sm font-mono"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    No deposits matching filter
                  </div>
                )}

                {visibleDeposits.map(d => (
                  <RowCard key={d.id} pending={d.status === 'PENDING'}>
                    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-lg font-mono font-bold text-[#EAECEF]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {fmt(d.amount)}
                          </span>
                          <Badge status={d.status} />
                        </div>
                        <p className="text-sm text-[#EAECEF]/80" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {d.wc_users?.full_name ?? '—'}
                          <span className="text-[#848E9C] ml-1.5 text-xs font-mono">{d.wc_users?.email ?? ''}</span>
                        </p>
                        <p className="text-[11px] text-[#848E9C] font-mono truncate max-w-sm"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {d.payment_method} · {d.payment_reference ?? 'no ref'}
                        </p>
                        <p className="text-[11px] text-[#474D57] font-mono"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {fmtDate(d.created_at)}
                        </p>
                      </div>

                      {d.status === 'PENDING' && (
                        <div className="flex gap-2 self-start">
                          <button
                            onClick={() => approveDeposit(d.id)}
                            disabled={actionLoading === d.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-black transition-all disabled:opacity-40"
                            style={{ background: actionLoading === d.id ? '#474D57' : 'linear-gradient(135deg, #F0B90B, #C99D0A)', fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            {actionLoading === d.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ type: 'deposit', id: d.id, title: `${fmt(d.amount)} from ${d.wc_users?.full_name ?? 'user'}` })}
                            disabled={actionLoading === d.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 transition-all disabled:opacity-40"
                            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </RowCard>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                WITHDRAWALS
            ════════════════════════════════════════════════════════════ */}
            {tab === 'withdrawals' && (
              <div className="space-y-3">
                <SectionHeader title="Withdrawals" count={visibleWithdrawals.length}>
                  <FilterBar value={withdrawalFilter} onChange={setWithdrawalFilter} />
                </SectionHeader>

                {visibleWithdrawals.length === 0 && (
                  <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-[#2B2F36] text-[#474D57] text-sm font-mono"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    No withdrawals matching filter
                  </div>
                )}

                {visibleWithdrawals.map(w => (
                  <RowCard key={w.id} pending={w.status === 'PENDING'}>
                    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-lg font-mono font-bold text-[#EAECEF]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {fmt(w.amount)}
                          </span>
                          <span className="text-[10px] font-mono tracking-wider text-[#848E9C] bg-[#0B0E11] border border-[#2B2F36] px-2 py-0.5 rounded-full"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {w.withdrawal_type}
                          </span>
                          <Badge status={w.status} />
                        </div>
                        <p className="text-sm text-[#EAECEF]/80">
                          {w.wc_users?.full_name ?? '—'}
                          <span className="text-[#848E9C] ml-1.5 text-xs font-mono">{w.wc_users?.email ?? ''}</span>
                        </p>
                        <p className="text-[11px] text-[#848E9C] font-mono truncate max-w-sm"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {Object.entries(w.destination_details ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                        <p className="text-[11px] text-[#474D57] font-mono"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          {fmtDate(w.created_at)}
                        </p>
                      </div>

                      {w.status === 'PENDING' && (
                        <div className="flex gap-2 self-start">
                          <button
                            onClick={() => approveWithdrawal(w.id)}
                            disabled={actionLoading === w.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-black transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)', fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            {actionLoading === w.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ type: 'withdrawal', id: w.id, title: `${fmt(w.amount)} by ${w.wc_users?.full_name ?? 'user'}` })}
                            disabled={actionLoading === w.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 transition-all disabled:opacity-40"
                            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </RowCard>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                MIGRATIONS
            ════════════════════════════════════════════════════════════ */}
            {tab === 'migrations' && (
              <div className="space-y-3">
                <SectionHeader title="Migrations" count={visibleMigrations.length}>
                  <FilterBar value={migrationFilter} onChange={setMigrationFilter} />
                </SectionHeader>

                {visibleMigrations.length === 0 && (
                  <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-[#2B2F36] text-[#474D57] text-sm font-mono"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    No migrations matching filter
                  </div>
                )}

                {visibleMigrations.map(m => (
                  <RowCard key={m.id} pending={m.status === 'PENDING'}>
                    <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-lg font-mono font-bold text-[#EAECEF]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {fmt(m.capital_amount)}
                          </span>
                          {m.topup_amount > 0 && (
                            <span className="text-xs font-mono text-[#F0B90B]"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                              +{fmt(m.topup_amount)} top-up
                            </span>
                          )}
                          <span className="text-[10px] font-mono tracking-wider text-[#848E9C] bg-[#0B0E11] border border-[#2B2F36] px-2 py-0.5 rounded-full">
                            {m.migration_type}
                          </span>
                          <Badge status={m.status} />
                        </div>
                        <p className="text-sm text-[#EAECEF]/80">
                          {m.wc_users?.full_name ?? '—'}
                          <span className="text-[#848E9C] ml-1.5 text-xs font-mono">{m.wc_users?.email ?? ''}</span>
                        </p>
                        <p className="text-[11px] text-[#848E9C] font-mono"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                          Target plan: {m.target_plan_tier}
                        </p>
                        <p className="text-[11px] text-[#474D57] font-mono">{fmtDate(m.created_at)}</p>
                      </div>

                      {m.status === 'PENDING' && (
                        <div className="flex gap-2 self-start">
                          <button
                            onClick={() => approveMigration(m.id)}
                            disabled={actionLoading === m.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-black transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #F0B90B, #C99D0A)', fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            {actionLoading === m.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectModal({ type: 'migration', id: m.id, title: `${fmt(m.capital_amount)} migration by ${m.wc_users?.full_name ?? 'user'}` })}
                            disabled={actionLoading === m.id}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 transition-all disabled:opacity-40"
                            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </RowCard>
                ))}
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════
                USERS
            ════════════════════════════════════════════════════════════ */}
            {tab === 'users' && (
              <div>
                <SectionHeader title="All Users" count={users.length} />

                {users.length === 0 && (
                  <div className="flex items-center justify-center h-36 rounded-xl border border-dashed border-[#2B2F36] text-[#474D57] text-sm font-mono">
                    No users yet
                  </div>
                )}

                <div className="rounded-xl border border-[#2B2F36] overflow-hidden">
                  {/* table head */}
                  <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-[#161A1E] border-b border-[#2B2F36]">
                    {['Name', 'Email', 'KYC', 'Status', 'Joined'].map((h, i) => (
                      <p key={h}
                        className={`text-[10px] font-mono tracking-[0.12em] text-[#474D57] uppercase ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-4' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : 'col-span-2'}`}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {h}
                      </p>
                    ))}
                  </div>

                  {users.map((u, i) => (
                    <div key={u.id}
                      className={`grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-[#2B2F36] last:border-0 transition-colors hover:bg-[#161A1E]
                        ${i % 2 === 1 ? 'bg-[#0B0E11]' : 'bg-transparent'}`}>
                      <p className="col-span-2 text-sm font-medium text-[#EAECEF] truncate"
                        style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
                        {u.full_name}
                      </p>
                      <p className="col-span-4 text-xs font-mono text-[#848E9C] truncate"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {u.email}
                      </p>
                      <div className="col-span-2">
                        <Badge status={u.kyc_status} />
                      </div>
                      <div className="col-span-2">
                        <Badge status={u.is_suspended ? 'SUSPENDED' : u.is_active ? 'ACTIVE' : 'INACTIVE'} />
                      </div>
                      <p className="col-span-2 text-xs font-mono text-[#474D57]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        {fmtDate(u.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}