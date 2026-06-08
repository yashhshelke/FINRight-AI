import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { GamificationAPI } from '@finexa/api';

const C = { teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36', cream: '#f5eee2', white: '#ffffff', muted: 'rgba(42,43,47,0.45)', border: 'rgba(42,43,47,0.1)', rustLight: 'rgba(176,91,54,0.1)', sageLight: 'rgba(205,250,206,0.4)' };

const badgeEmojis = ['🛡️', '⭐', '🔥', '⚡', '🎯', '📈', '👑', '🏆'];

export default function GamificationScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  const load = () => {
    Promise.all([
      GamificationAPI.getData(), GamificationAPI.getChallenges(),
      GamificationAPI.getMyBadges(), GamificationAPI.getBadges(),
    ]).then(([s, ch, mb, ab]) => {
      setSummary(s); setChallenges(ch?.results ?? []);
      setMyBadges(mb ?? []); setAllBadges(ab ?? []);
    }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const earnedIds = new Set(myBadges.map((b: any) => b.badge ?? b.id));
  const level = summary?.level ?? 1;
  const pts = summary?.total_points ?? 0;

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.micro}>Your Progress</Text>
        <Text style={styles.title}>Rewards & <Text style={{ color: C.sage, fontStyle: 'italic' }}>Challenges</Text></Text>
        {/* Level Banner */}
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: C.rust, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>LEVEL {level}</Text>
                </View>
                <Text>👑</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Finance Strategist</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{pts.toLocaleString()}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Total Points</Text>
            </View>
          </View>
          <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${(pts % 1000) / 10}%` }]} /></View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Lv. {level}</Text>
            <Text style={{ color: C.sage, fontSize: 10, fontWeight: '500' }}>{1000 - (pts % 1000)} pts to Level {level + 1}</Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        {/* Challenges */}
        <Text style={styles.sectionTitle}>Daily <Text style={{ color: C.rust, fontStyle: 'italic' }}>Challenges</Text></Text>
        {challenges.length === 0 ? <Text style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>No challenges yet</Text> : (
          <View style={{ marginBottom: 28 }}>
            {challenges.map((ch: any) => {
              const done = ch.completed;
              return (
                <TouchableOpacity key={ch.id} onPress={() => GamificationAPI.toggleChallenge(ch.id).then(load).catch(() => {})} style={[styles.challengeRow, { backgroundColor: done ? 'rgba(205,250,206,0.3)' : C.white, borderColor: done ? 'rgba(0,61,61,0.2)' : C.border }]}>
                  <View style={[styles.challengeIcon, { backgroundColor: done ? C.sageLight : C.cream }]}>
                    <Text style={{ fontSize: 18 }}>{ch.challenge?.icon || ch.icon || '🎯'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: done ? C.muted : C.charcoal, fontSize: 13, fontWeight: '500', textDecorationLine: done ? 'line-through' : 'none' }}>
                      {ch.challenge?.name || ch.name}
                    </Text>
                    <Text style={{ color: C.rust, fontSize: 11, fontWeight: '600', marginTop: 2 }}>+{ch.challenge?.points || 50} pts</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>{done ? '✅' : '⭕'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Badges */}
        <Text style={styles.sectionTitle}>Your <Text style={{ color: C.rust, fontStyle: 'italic' }}>Badges</Text></Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {allBadges.slice(0, 8).map((b: any, i: number) => {
            const unlocked = earnedIds.has(b.id);
            return (
              <View key={b.id || i} style={[styles.badgeCard, { backgroundColor: unlocked ? C.white : C.cream, borderColor: unlocked ? 'rgba(0,61,61,0.15)' : C.border }]}>
                <Text style={{ color: C.rust, fontSize: 9, fontWeight: '700', marginBottom: 6 }}>0{i + 1}</Text>
                <View style={[styles.badgeIcon, { backgroundColor: unlocked ? C.sageLight : 'rgba(42,43,47,0.05)' }]}>
                  <Text style={{ fontSize: 20 }}>{unlocked ? badgeEmojis[i % badgeEmojis.length] : '🔒'}</Text>
                </View>
                <Text style={{ color: unlocked ? C.charcoal : C.muted, fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 6, lineHeight: 13 }}>{b.name}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.teal, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28 },
  micro: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { color: '#fff', fontSize: 24, fontWeight: '600', marginBottom: 20 },
  banner: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  progressBg: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, height: 7, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: C.sage },
  main: { backgroundColor: C.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  sectionTitle: { color: C.charcoal, fontSize: 17, fontWeight: '600', marginBottom: 14 },
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  challengeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeCard: { width: '22%', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  badgeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
