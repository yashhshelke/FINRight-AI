import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { TransactionsAPI } from '@finexa/api';

const C = { teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36', cream: '#f5eee2', white: '#ffffff', muted: 'rgba(42,43,47,0.45)', border: 'rgba(42,43,47,0.1)', rustLight: 'rgba(176,91,54,0.1)', sageLight: 'rgba(205,250,206,0.4)' };
type Filter = 'All' | 'Income' | 'Expense';

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [txs, setTxs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([TransactionsAPI.list(1), TransactionsAPI.summary()]).then(([t, s]) => {
      setTxs(t?.results ?? []); setSummary(s);
    }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const filtered = txs.filter(t => {
    const mf = filter === 'All' || (filter === 'Income' ? t.type === 'income' : t.type === 'expense');
    const ms = (t.description ?? '').toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const handleAdd = async () => {
    if (!amount || !desc) return;
    setSaving(true);
    try {
      await TransactionsAPI.create({ amount: parseFloat(amount), category: 'Other', type: addType, description: desc, date: new Date().toISOString().split('T')[0] });
      setShowModal(false); setAmount(''); setDesc('');
      load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.micro}>Overview</Text>
          <Text style={styles.title}>Transactions</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={styles.pill}><Text style={styles.pillLabel}>Income</Text><Text style={[styles.pillVal, { color: C.sage }]}>₹{(summary?.total_income ?? 0).toLocaleString('en-IN')}</Text></View>
            <View style={styles.pill}><Text style={styles.pillLabel}>Expenses</Text><Text style={[styles.pillVal, { color: '#f4a48a' }]}>₹{(summary?.total_expense ?? 0).toLocaleString('en-IN')}</Text></View>
          </View>
        </View>

        <View style={styles.main}>
          {/* Search */}
          <View style={styles.searchBar}>
            <Text style={{ color: C.muted, marginRight: 8 }}>🔍</Text>
            <TextInput value={search} onChangeText={setSearch} placeholder="Search transactions…" placeholderTextColor={C.muted} style={{ flex: 1, color: C.charcoal, fontSize: 14 }} />
          </View>

          {/* Filter chips */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
            {(['All', 'Income', 'Expense'] as Filter[]).map(f => (
              <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterChip, { backgroundColor: filter === f ? (f === 'Income' ? C.teal : f === 'Expense' ? C.rust : C.charcoal) : C.white }]}>
                <Text style={{ color: filter === f ? '#fff' : C.muted, fontSize: 13, fontWeight: filter === f ? '600' : '400' }}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List */}
          {filtered.length === 0 ? <Text style={{ color: C.muted, textAlign: 'center', marginTop: 40 }}>No transactions found</Text> : (
            filtered.map(tx => {
              const isIncome = tx.type === 'income';
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: isIncome ? C.sageLight : C.rustLight }]}>
                    <Text style={{ fontSize: 18 }}>{isIncome ? '📈' : '💳'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.charcoal, fontSize: 13, fontWeight: '500' }}>{tx.description}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={{ backgroundColor: isIncome ? C.sageLight : C.rustLight, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1 }}>
                        <Text style={{ color: isIncome ? C.teal : C.rust, fontSize: 10, fontWeight: '500' }}>{tx.category}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ color: isIncome ? C.teal : C.rust, fontSize: 13, fontWeight: '700' }}>
                    {isIncome ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity onPress={() => setShowModal(true)} style={styles.fab}><Text style={{ color: '#fff', fontSize: 28 }}>+</Text></TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Add Transaction</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {(['expense', 'income'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => setAddType(t)} style={[styles.typeBtn, { backgroundColor: addType === t ? (t === 'income' ? C.teal : C.rust) : C.cream }]}>
                  <Text style={{ color: addType === t ? '#fff' : C.muted, fontWeight: '600', fontSize: 13 }}>{t === 'income' ? '+ Income' : '- Expense'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput value={desc} onChangeText={setDesc} placeholder="e.g. Coffee" placeholderTextColor={C.muted} style={styles.sheetInput} />
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor={C.muted} style={[styles.sheetInput, { fontSize: 20, fontWeight: '700' }]} />
            <TouchableOpacity onPress={handleAdd} disabled={saving} style={[styles.submitBtn, { backgroundColor: addType === 'income' ? C.teal : C.rust, opacity: saving ? 0.7 : 1 }]}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{saving ? 'Saving…' : 'Add Transaction'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.teal, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  micro: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 16 },
  pill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  pillVal: { fontSize: 15, fontWeight: '700' },
  main: { backgroundColor: C.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  filterChip: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  txIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.rust, alignItems: 'center', justifyContent: 'center', shadowColor: C.rust, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(42,43,47,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  handle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: C.charcoal, fontSize: 18, fontWeight: '600', marginBottom: 20 },
  typeBtn: { flex: 1, padding: 11, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  inputLabel: { color: C.muted, fontSize: 11, marginBottom: 6, marginTop: 4 },
  sheetInput: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.charcoal, fontSize: 14, marginBottom: 12 },
  submitBtn: { padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
});
