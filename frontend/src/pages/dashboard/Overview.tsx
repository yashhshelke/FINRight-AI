import { useState, useEffect } from 'react';
import { ShoppingCart, Home, Coffee, Car, Zap, TrendingUp, TrendingDown, ChevronRight, Bell, Eye, EyeOff, ArrowUpRight } from 'lucide-react';
import { WalletAPI, HealthAPI, GoalsAPI, TransactionsAPI } from '@/lib/api';

const C = {
  teal: '#003d3d',
  sage: '#cdface',
  charcoal: '#2a2b2f',
  rust: '#b05b36',
  cream: '#f5eee2',
  white: '#ffffff',
  sageLight: 'rgba(205,250,206,0.4)',
  rustLight: 'rgba(176,91,54,0.1)',
  border: 'rgba(42,43,47,0.1)',
  muted: 'rgba(42,43,47,0.45)',
};

function HealthGauge({ score }: { score: number }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const grade = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor';
  return (
    <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke={C.border} strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={C.teal} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ color: C.teal, fontSize: 22, fontWeight: 700, lineHeight: 1, fontFamily: 'Playfair Display, serif' }}>{score}</div>
        <div style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>/ 100</div>
        <div style={{ color: C.rust, fontSize: 9, fontWeight: 600, marginTop: 1 }}>{grade}</div>
      </div>
    </div>
  );
}

const categoryIcons: Record<string, any> = {
  Food: Coffee, Housing: Home, Transport: Car, Shopping: ShoppingCart,
  Utilities: Zap, Income: TrendingUp, Default: TrendingUp,
};

export default function Overview() {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      WalletAPI.getWallet().catch(() => null),
      HealthAPI.getScore().catch(() => null),
      GoalsAPI.list().catch(() => ({ results: [] })),
      TransactionsAPI.list(1).catch(() => ({ results: [] })),
      TransactionsAPI.summary().catch(() => null),
    ]).then(([w, h, g, t, s]) => {
      setWallet(w);
      setHealth(h);
      setGoals(g?.results?.slice(0, 4) || []);
      setTransactions(t?.results?.slice(0, 6) || []);
      setSummary(s);
      setLoading(false);
    });
  }, []);

  const balance = wallet?.balance ?? 0;
  const income = summary?.total_income ?? 0;
  const expense = summary?.total_expense ?? 0;
  const healthScore = health?.score ?? 0;

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'Outfit, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 20px', background: C.teal }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.rust, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>F</span>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>Good Morning 👋</p>
              <p style={{ color: C.white, fontWeight: 600, fontSize: 16, margin: 0, fontFamily: 'Playfair Display, serif' }}>Finexa AI</p>
            </div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={17} color="rgba(255,255,255,0.8)" />
          </button>
        </div>

        {/* Balance */}
        <div style={{ maxWidth: 900, margin: '20px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px', letterSpacing: 1, textTransform: 'uppercase' }}>Total Balance</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: C.white, fontSize: 32, fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>
                {balanceVisible ? `₹${balance.toLocaleString('en-IN')}` : '••••••••'}
              </span>
              <button onClick={() => setBalanceVisible(!balanceVisible)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {balanceVisible ? <Eye size={15} color="rgba(255,255,255,0.5)" /> : <EyeOff size={15} color="rgba(255,255,255,0.5)" />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(205,250,206,0.15)', borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(205,250,206,0.25)' }}>
            <ArrowUpRight size={12} color={C.sage} />
            <span style={{ color: C.sage, fontSize: 11, fontWeight: 600 }}>Active</span>
          </div>
        </div>

        {/* Income / Expense pills */}
        <div style={{ maxWidth: 900, margin: '16px auto 0', display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Income</p>
            <p style={{ color: C.sage, fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>₹{income.toLocaleString('en-IN')}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Expenses</p>
            <p style={{ color: '#f4a48a', fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>₹{expense.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ background: C.cream, borderRadius: '20px 20px 0 0', marginTop: -16, padding: '24px', maxWidth: 948, margin: '-16px auto 0' }}>

        {/* Health Score + Quick Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
          <div style={{ background: C.white, borderRadius: 20, padding: 18, flex: '0 0 180px', boxShadow: '0 2px 16px rgba(42,43,47,0.07)', border: `1px solid ${C.border}` }}>
            <p style={{ color: C.muted, fontSize: 10, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Financial Health</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <HealthGauge score={healthScore} />
            </div>
            <p style={{ color: C.muted, fontSize: 10, margin: '10px 0 0', textAlign: 'center' }}>
              {healthScore >= 60 ? 'Above average' : 'Needs attention'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {[
              { label: 'Savings Rate', value: summary ? `${Math.round((summary.savings / Math.max(summary.total_income, 1)) * 100)}%` : '—', note: 'of income' },
              { label: 'Net Savings', value: summary ? `₹${summary.all_time_savings?.toLocaleString('en-IN') ?? 0}` : '—', note: 'all time' },
              { label: 'Health Score', value: health?.grade ?? '—', note: health?.trend ?? '' },
            ].map((s) => (
              <div key={s.label} style={{ background: C.white, borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 12px rgba(42,43,47,0.06)', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.muted, fontSize: 9, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.7 }}>{s.label}</p>
                <p style={{ color: C.teal, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>{s.value}</p>
                <p style={{ color: C.rust, fontSize: 9, margin: '1px 0 0' }}>{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Goals */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Progress</p>
              <h3 style={{ color: C.charcoal, margin: 0, fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>
                Savings <em style={{ color: C.rust, fontStyle: 'italic' }}>Goals</em>
              </h3>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: C.teal, fontSize: 11, fontWeight: 600 }}>See all</span>
              <ChevronRight size={12} color={C.teal} />
            </button>
          </div>
          {loading ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Loading goals…</p>
          ) : goals.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 16, padding: '20px', textAlign: 'center', border: `1px solid ${C.border}` }}>
              <p style={{ color: C.muted, fontSize: 13 }}>No savings goals yet. Create one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {goals.map((goal, i) => {
                const pct = Math.min(100, Math.round((goal.current_amount / Math.max(goal.target_amount, 1)) * 100));
                const steps = ['01', '02', '03', '04'];
                return (
                  <div key={goal.id} style={{ minWidth: 160, background: C.white, borderRadius: 18, padding: '16px', border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(42,43,47,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: C.rust, fontSize: 10, fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>{steps[i] ?? '0' + (i + 1)}</span>
                      <span style={{ fontSize: 20 }}>{goal.icon ?? '🎯'}</span>
                    </div>
                    <p style={{ color: C.charcoal, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{goal.title}</p>
                    <p style={{ color: C.teal, fontSize: 15, fontWeight: 700, margin: '0 0 1px', fontFamily: 'Playfair Display, serif' }}>
                      ₹{(goal.current_amount / 1000).toFixed(1)}K
                    </p>
                    <p style={{ color: C.muted, fontSize: 10, margin: '0 0 8px' }}>of ₹{(goal.target_amount / 1000).toFixed(1)}K</p>
                    <div style={{ background: C.cream, borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct > 60 ? C.teal : C.rust, transition: 'width 1s ease' }} />
                    </div>
                    <p style={{ color: C.muted, fontSize: 9, margin: '4px 0 0', textAlign: 'right' }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Latest</p>
              <h3 style={{ color: C.charcoal, margin: 0, fontSize: 17, fontFamily: 'Playfair Display, serif', fontWeight: 600 }}>
                Recent <em style={{ color: C.rust, fontStyle: 'italic' }}>Transactions</em>
              </h3>
            </div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: C.teal, fontSize: 11, fontWeight: 600 }}>See all</span>
              <ChevronRight size={12} color={C.teal} />
            </button>
          </div>
          {loading ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <div style={{ background: C.white, borderRadius: 16, padding: '20px', textAlign: 'center', border: `1px solid ${C.border}` }}>
              <p style={{ color: C.muted, fontSize: 13 }}>No transactions yet. Add one!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {transactions.map((tx: any) => {
                const isIncome = tx.type === 'income';
                const Icon = categoryIcons[tx.category] ?? categoryIcons.Default;
                return (
                  <div key={tx.id} style={{ background: C.white, borderRadius: 14, padding: '12px 16px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(42,43,47,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: isIncome ? 'rgba(205,250,206,0.5)' : C.rustLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} color={isIncome ? C.teal : C.rust} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: C.charcoal, fontSize: 13, fontWeight: 500, margin: 0 }}>{tx.description}</p>
                      <p style={{ color: C.muted, fontSize: 10, margin: '2px 0 0' }}>{tx.category} · {tx.date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isIncome ? <TrendingUp size={11} color={C.teal} /> : <TrendingDown size={11} color={C.rust} />}
                      <span style={{ color: isIncome ? C.teal : C.rust, fontSize: 14, fontWeight: 700 }}>
                        {isIncome ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
