import { useState, useEffect } from 'react';
import { Search, Plus, Coffee, Home, Car, ShoppingCart, Zap, TrendingUp, Utensils, Wifi, Gamepad2, Heart, X } from 'lucide-react';
import { TransactionsAPI } from '@/lib/api';

const C = {
  teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36',
  cream: '#f5eee2', white: '#ffffff', border: 'rgba(42,43,47,0.1)',
  muted: 'rgba(42,43,47,0.45)', rustLight: 'rgba(176,91,54,0.1)',
  sageLight: 'rgba(205,250,206,0.4)',
};

const categoryIcons: Record<string, any> = {
  Food: Coffee, Housing: Home, Rent: Home, Transport: Car, Shopping: ShoppingCart,
  Utilities: Zap, Income: TrendingUp, Entertainment: Gamepad2, Health: Heart,
  Telecom: Wifi, Dining: Utensils,
};

type FilterType = 'All' | 'Income' | 'Expense';

export default function Transactions() {
  const [filter, setFilter] = useState<FilterType>('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [newAmount, setNewAmount] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      TransactionsAPI.list(1).catch(() => ({ results: [] })),
      TransactionsAPI.summary().catch(() => null),
    ]).then(([txData, s]) => {
      setAllTransactions(txData?.results ?? []);
      setSummary(s);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = allTransactions.filter((tx) => {
    const matchFilter = filter === 'All' || (filter === 'Income' ? tx.type === 'income' : tx.type === 'expense');
    const matchSearch = (tx.description ?? '').toLowerCase().includes(search.toLowerCase()) || (tx.category ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalIncome = summary?.total_income ?? 0;
  const totalExpense = summary?.total_expense ?? 0;

  const grouped: Record<string, typeof allTransactions> = {};
  filtered.forEach(tx => {
    const key = tx.date || 'Unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(tx);
  });

  const handleAdd = async () => {
    if (!newAmount || !newName) return;
    setSaving(true);
    try {
      await TransactionsAPI.create({
        amount: parseFloat(newAmount), category: newCategory,
        type: addType, description: newName,
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddModal(false);
      setNewAmount(''); setNewName('');
      fetchData();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'Outfit, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 24px', background: C.teal }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Overview</p>
          <h2 style={{ color: C.white, margin: '0 0 20px', fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 24 }}>Transactions</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(205,250,206,0.12)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(205,250,206,0.2)' }}>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Income</p>
              <p style={{ color: C.sage, fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>₹{totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Expenses</p>
              <p style={{ color: '#f4a48a', fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>₹{totalExpense.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Curved cream area */}
      <div style={{ background: C.cream, borderRadius: '20px 20px 0 0', marginTop: -16, padding: '24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.white, borderRadius: 14, padding: '11px 16px', border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: '0 2px 10px rgba(42,43,47,0.06)' }}>
            <Search size={16} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.charcoal, fontSize: 14, fontFamily: 'Outfit, sans-serif' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} color={C.muted} /></button>}
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {(['All', 'Income', 'Expense'] as FilterType[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', background: filter === f ? (f === 'Income' ? C.teal : f === 'Expense' ? C.rust : C.charcoal) : C.white, border: `1px solid ${filter === f ? 'transparent' : C.border}`, color: filter === f ? C.white : C.muted, fontSize: 13, fontWeight: filter === f ? 600 : 400, boxShadow: filter === f ? '0 3px 12px rgba(42,43,47,0.2)' : 'none' }}>
                {f}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          {loading ? (
            <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p>
          ) : Object.entries(grouped).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: C.muted, fontSize: 14 }}>No transactions found</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, txs]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <p style={{ color: C.muted, fontSize: 10, fontWeight: 600, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{date}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {txs.map(tx => {
                    const isIncome = tx.type === 'income';
                    const Icon = categoryIcons[tx.category] ?? TrendingUp;
                    return (
                      <div key={tx.id} style={{ background: C.white, borderRadius: 14, padding: '13px 16px', border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(42,43,47,0.05)', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: isIncome ? C.sageLight : C.rustLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={18} color={isIncome ? C.teal : C.rust} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: C.charcoal, fontSize: 13, fontWeight: 500, margin: 0 }}>{tx.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            <span style={{ background: isIncome ? C.sageLight : C.rustLight, borderRadius: 6, padding: '1px 8px', color: isIncome ? C.teal : C.rust, fontSize: 10, fontWeight: 500 }}>{tx.category}</span>
                          </div>
                        </div>
                        <span style={{ color: isIncome ? C.teal : C.rust, fontSize: 14, fontWeight: 700 }}>
                          {isIncome ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddModal(true)} style={{ position: 'fixed', bottom: 36, right: 32, width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', background: C.rust, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(176,91,54,0.45)', zIndex: 10 }}>
        <Plus size={24} color={C.white} />
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,43,47,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, background: C.white, borderRadius: '24px 24px 0 0', padding: '24px 24px 48px', border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ color: C.charcoal, margin: '0 0 20px', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Add Transaction</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {(['expense', 'income'] as const).map(t => (
                <button key={t} onClick={() => setAddType(t)} style={{ flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', background: addType === t ? (t === 'income' ? C.teal : C.rust) : C.cream, border: `1px solid ${addType === t ? 'transparent' : C.border}`, color: addType === t ? C.white : C.muted, fontWeight: 600, fontSize: 13 }}>
                  {t === 'income' ? '+ Income' : '- Expense'}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: C.muted, fontSize: 11, margin: '0 0 6px' }}>Description</p>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Coffee at Starbucks" style={{ width: '100%', background: C.cream, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', color: C.charcoal, fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: C.muted, fontSize: 11, margin: '0 0 6px' }}>Category</p>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ width: '100%', background: C.cream, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', color: C.charcoal, fontSize: 13, fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' }}>
                {['Food', 'Housing', 'Transport', 'Shopping', 'Utilities', 'Health', 'Entertainment', 'Income', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: C.muted, fontSize: 11, margin: '0 0 6px' }}>Amount (₹)</p>
              <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" style={{ width: '100%', background: C.cream, border: `1px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', color: C.charcoal, fontSize: 20, fontWeight: 700, fontFamily: 'Playfair Display, serif', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleAdd} disabled={saving} style={{ width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer', background: addType === 'income' ? C.teal : C.rust, border: 'none', color: C.white, fontSize: 15, fontWeight: 600, fontFamily: 'Outfit, sans-serif', boxShadow: `0 6px 20px rgba(${addType === 'income' ? '0,61,61' : '176,91,54'},0.35)`, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Add Transaction'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
