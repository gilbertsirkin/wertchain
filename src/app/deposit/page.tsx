'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CURRENCIES = [
  { code: 'USDT_TRC20', label: 'USDT (TRC20)' },
  { code: 'USDT_ERC20', label: 'USDT (ERC20)' },
  { code: 'BTC', label: 'Bitcoin' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

type Step = 'choose' | 'pay' | 'done'

function DepositContent() {
  const params = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/signin?redirectTo=/deposit')
    })
  }, [supabase, router])

  const planId = params.get('plan_id') ?? ''
  const planLabel = params.get('plan_label') ?? ''
  const amountNeeded = params.get('amount_needed') ?? ''
  const currentBalance = params.get('current_balance') ?? '0'
  const shortfall = params.get('shortfall') ?? ''

  const defaultAmount = shortfall
    ? Number(shortfall)
    : amountNeeded
    ? Number(amountNeeded)
    : 0

  const [step, setStep] = useState<Step>('choose')
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '')
  const [currency, setCurrency] = useState('USDT_TRC20')
  const [depositId, setDepositId] = useState('')
  const [address, setAddress] = useState('')
  const [txHash, setTxHash] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createDeposit() {
    setError('')
    const amountNum = Number(amount)
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, plan_id: planId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start deposit')
      setDepositId(data.deposit.id)
      setAddress(data.to_address)
      setStep('pay')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitTxHash() {
    setError('')
    if (!txHash.trim()) {
      setError('Please enter your transaction hash')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/deposits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_id: depositId, tx_hash: txHash.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit transaction hash')
      setStep('done')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <nav className="border-b border-[#1E2A3B] sticky top-0 z-40 bg-[#0A0F1E]/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center">
              <span className="text-black text-xs font-black">W</span>
            </div>
            <span className="font-semibold">Wertchain</span>
          </div>
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {planLabel && step !== 'done' && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">Insufficient Balance</p>
            <h1 className="text-white text-xl font-semibold mb-3">
              You selected {planLabel} — {fmt(Number(amountNeeded))}
            </h1>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-zinc-500">Required</p>
                <p className="text-sm font-mono text-white">{fmt(Number(amountNeeded))}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Your balance</p>
                <p className="text-sm font-mono text-white">{fmt(Number(currentBalance))}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Shortfall</p>
                <p className="text-sm font-mono text-amber-400">{fmt(Number(shortfall))}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Deposit at least {fmt(Number(shortfall))} to activate this investment.
            </p>
          </div>
        )}

        {step === 'choose' && (
          <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] p-5 space-y-4">
            {!planLabel && (
              <div>
                <h1 className="text-white text-xl font-semibold">Deposit Funds</h1>
                <p className="text-zinc-500 text-sm mt-1">Add funds to your available balance.</p>
              </div>
            )}

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
                Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="w-full bg-[#0A0F1E] border border-[#1E2A3B] rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
                Deposit Currency
              </label>
              <div className="flex gap-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-3 py-2 rounded-lg border text-xs font-mono transition-colors
                      ${currency === c.code
                        ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                        : 'border-[#1E2A3B] text-zinc-500 hover:border-zinc-600'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={createDeposit}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition-colors"
            >
              {loading ? 'Starting deposit…' : 'Continue'}
            </button>
          </div>
        )}

        {step === 'pay' && (
          <div className="rounded-xl border border-[#1E2A3B] bg-[#111827] p-5 space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
                Send Exactly
              </label>
              <p className="text-2xl font-mono text-white">{fmt(Number(amount))}</p>
              <p className="text-xs text-zinc-500">via {CURRENCIES.find((c) => c.code === currency)?.label}</p>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
                To This Address
              </label>
              <div className="bg-[#0A0F1E] border border-[#1E2A3B] rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <span className="font-mono text-amber-400 text-sm break-all">{address}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="text-xs text-zinc-500 hover:text-white shrink-0 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1.5">
                Transaction Hash
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste your transaction hash after sending"
                className="w-full bg-[#0A0F1E] border border-[#1E2A3B] rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={submitTxHash}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Deposit for Review'}
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <span className="text-emerald-400 text-xl">✓</span>
            </div>
            <h2 className="text-white font-semibold text-lg">Deposit submitted for review</h2>
            <p className="text-zinc-400 text-sm">
              Our team will confirm your deposit and credit your available balance.
              {planLabel && ` Once confirmed, you can activate ${planLabel}.`}
            </p>
            <Link
              href="/dashboard"
              className="block w-full py-2.5 rounded-lg bg-[#111827] border border-[#1E2A3B] text-white text-sm font-medium hover:border-zinc-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DepositPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center text-zinc-600 text-sm">
        Loading…
      </div>
    }>
      <DepositContent />
    </Suspense>
  )
}
