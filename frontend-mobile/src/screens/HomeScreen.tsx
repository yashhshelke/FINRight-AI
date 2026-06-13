import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HealthAPI, GoalsAPI, TransactionsAPI } from '@finexa/api';

const C = { teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36', cream: '#f5eee2', white: '#ffffff', muted: 'rgba(42,43,47,0.45)', border: 'rgba(42,43,47,0.1)', rustLight: 'rgba(176,91,54,0.1)', sageLight: 'rgba(205,250,206,0.4)' };

export default function HomeScreen() {
  const [health, setHealth] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    Promise.all([
      HealthAPI.getScore().catch(() => null),
      GoalsAPI.list().catch(() => ({ results: [] })),
      TransactionsAPI.list(1).catch(() => ({ results: [] })),
      TransactionsAPI.summary().catch(() => null),
    ]).then(([w, h, g, t, s]) => {
      setHealth(h);
      setGoals(g?.results?.slice(0, 4) ?? []);
      setTransactions(t?.results?.slice(0, 5) ?? []);
      setSummary(s);
    });
  }, []);
  const balance = summary?.all_time_savings ?? 0;
  const income = summary?.total_income ?? 0;
  const expense = summary?.total_expense ?? 0;
  const score = health?.score ?? 0;

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.avatar}><Text style={styles.avatarText}>F</Text></View>
            <View>
              <Text style={styles.greeting}>Good Morning 👋</Text>
              <Text style={styles.appName}>Finexa AI</Text>
            </View>
          </View>
        </View>
        {/* Balance */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.balance}>{balanceVisible ? `₹${balance.toLocaleString('en-IN')}` : '••••••••'}</Text>
          </TouchableOpacity>
        </View>
        {/* Income / Expense */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <View style={styles.pill}><Text style={styles.pillLabel}>Income</Text><Text style={[styles.pillValue, { color: C.sage }]}>₹{income.toLocaleString('en-IN')}</Text></View>
          <View style={styles.pill}><Text style={styles.pillLabel}>Expenses</Text><Text style={[styles.pillValue, { color: '#f4a48a' }]}>₹{expense.toLocaleString('en-IN')}</Text></View>
        </View>
      </View>

      {/* Main */}
      <View style={styles.main}>
        {/* Health */}
        <View style={styles.card}>
          <Text style={styles.sectionMicro}>Financial Health</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: C.rust, fontSize: 11, fontWeight: '600' }}>{score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair'}</Text>
              <Text style={{ color: C.muted, fontSize: 10 }}>/ 100</Text>
            </View>
          </View>
          <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${score}%`, backgroundColor: C.teal }]} /></View>
        </View>

        {/* Goals */}
        <Text style={styles.sectionTitle}>Savings <Text style={{ color: C.rust, fontStyle: 'italic' }}>Goals</Text></Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          {goals.length === 0 ? <Text style={{ color: C.muted, fontSize: 13, marginLeft: 4 }}>No goals yet</Text> : goals.map((g: any, i: number) => {
            const pct = Math.min(100, Math.round((g.current_amount / Math.max(g.target_amount, 1)) * 100));
            return (
              <View key={g.id} style={styles.goalCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: C.rust, fontSize: 10, fontWeight: '700' }}>0{i + 1}</Text>
                  <Text style={{ fontSize: 18 }}>{g.icon ?? '🎯'}</Text>
                </View>
                <Text style={{ color: C.charcoal, fontSize: 12, fontWeight: '600' }}>{g.title}</Text>
                <Text style={{ color: C.teal, fontSize: 14, fontWeight: '700', marginTop: 2 }}>₹{(g.current_amount / 1000).toFixed(1)}K</Text>
                <Text style={{ color: C.muted, fontSize: 10 }}>of ₹{(g.target_amount / 1000).toFixed(1)}K</Text>
                <View style={[styles.progressBg, { marginTop: 8 }]}><View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct > 60 ? C.teal : C.rust }]} /></View>
              </View>
            );
          })}
        </ScrollView>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Recent <Text style={{ color: C.rust, fontStyle: 'italic' }}>Transactions</Text></Text>
        {transactions.map((tx: any) => {
          const isIncome = tx.type === 'income';
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: isIncome ? C.sageLight : C.rustLight }]}>
                <Text style={{ fontSize: 16 }}>{isIncome ? '📈' : '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.charcoal, fontSize: 13, fontWeight: '500' }}>{tx.description}</Text>
                <Text style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>{tx.category}</Text>
              </View>
              <Text style={{ color: isIncome ? C.teal : C.rust, fontSize: 13, fontWeight: '700' }}>
                {isIncome ? '+' : '-'}₹{Math.abs(Number(tx.amount)).toLocaleString('en-IN')}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.teal, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.rust, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  appName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  balanceLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  balance: { color: '#fff', fontSize: 30, fontWeight: '700' },
  pill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  pillValue: { fontSize: 14, fontWeight: '700' },
  main: { backgroundColor: C.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  card: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: C.border },
  sectionMicro: { color: C.muted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  scoreNumber: { color: C.teal, fontSize: 36, fontWeight: '700' },
  progressBg: { backgroundColor: C.cream, borderRadius: 4, height: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { color: C.charcoal, fontSize: 16, fontWeight: '600', marginBottom: 14 },
  goalCard: { width: 155, backgroundColor: C.white, borderRadius: 16, padding: 14, marginRight: 12, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.white, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border },
  txIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
