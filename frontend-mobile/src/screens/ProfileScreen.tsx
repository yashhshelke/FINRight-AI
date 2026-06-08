import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Modal, TextInput, Alert } from 'react-native';
import { SettingsAPI, AuthAPI } from '@finexa/api';

const C = { teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36', cream: '#f5eee2', white: '#ffffff', muted: 'rgba(42,43,47,0.45)', border: 'rgba(42,43,47,0.1)', rustLight: 'rgba(176,91,54,0.1)', sageLight: 'rgba(205,250,206,0.4)' };

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [notifs, setNotifs] = useState(true);
  const [privacy, setPrivacy] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { SettingsAPI.getFullProfile().then(setProfile).catch(() => {}); }, []);

  const handleSave = async () => {
    if (!oldPw || !newPw) return;
    try {
      await SettingsAPI.changePassword({ old_password: oldPw, new_password: newPw, new_password_confirm: newPw });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowPwModal(false); setOldPw(''); setNewPw(''); }, 1500);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleLogout = () => { AuthAPI.logout(); };

  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'F' : 'F';
  const name = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.username || 'User' : '…';

  const Row = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.row}><View style={styles.rowIcon}><Text style={{ fontSize: 16 }}>{icon}</Text></View><View style={{ flex: 1 }}><Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text><Text style={{ color: C.charcoal, fontSize: 13, fontWeight: '500', marginTop: 2 }}>{value}</Text></View><Text style={{ color: C.muted, fontSize: 14 }}>›</Text></View>
  );

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 20 }}>{profile?.email ?? ''}</Text>
        <View style={{ flexDirection: 'row', gap: 36 }}>
          {[{ l: 'Credits', v: profile?.credits ?? '—' }, { l: 'Goals', v: profile?.goal_count ?? '—' }, { l: 'Level', v: `Lv.${profile?.level ?? '?'}` }].map(s => (
            <View key={s.l} style={{ alignItems: 'center' }}>
              <Text style={{ color: C.white, fontSize: 20, fontWeight: '700' }}>{s.v}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.main}>
        {/* Personal Info */}
        <Text style={styles.sectionTitle}>Personal <Text style={{ color: C.rust, fontStyle: 'italic' }}>& Info</Text></Text>
        <View style={styles.card}>
          <Row label="Full Name" value={name} icon="👤" />
          <View style={styles.divider} />
          <Row label="Email" value={profile?.email ?? '—'} icon="📧" />
          <View style={styles.divider} />
          <Row label="Phone" value={profile?.phone ?? '—'} icon="📱" />
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 18 }}>
          <TouchableOpacity onPress={() => setShowPwModal(true)} style={[styles.actionBtn, { backgroundColor: C.teal }]}>
            <Text style={{ fontSize: 16 }}>🔒</Text>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => SettingsAPI.exportData().then(() => Alert.alert('Success', 'Data export initiated!')).catch((e: any) => Alert.alert('Error', e.message))} style={[styles.actionBtn, { backgroundColor: C.white, borderWidth: 1, borderColor: C.border }]}>
            <Text style={{ fontSize: 16 }}>📥</Text>
            <Text style={{ color: C.rust, fontSize: 13, fontWeight: '600' }}>Export Data</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: notifs ? C.sageLight : C.cream }]}><Text style={{ fontSize: 16 }}>🔔</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.charcoal, fontSize: 13, fontWeight: '500' }}>Push Notifications</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Expense alerts & reminders</Text>
            </View>
            <Switch value={notifs} onValueChange={setNotifs} trackColor={{ false: 'rgba(42,43,47,0.12)', true: C.teal }} thumbColor={C.white} />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: privacy ? C.sageLight : C.cream }]}><Text style={{ fontSize: 16 }}>🛡️</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.charcoal, fontSize: 13, fontWeight: '500' }}>Privacy Mode</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>Hide balances by default</Text>
            </View>
            <Switch value={privacy} onValueChange={setPrivacy} trackColor={{ false: 'rgba(42,43,47,0.12)', true: C.teal }} thumbColor={C.white} />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={{ fontSize: 16 }}>🚪</Text>
          <Text style={{ color: C.rust, fontSize: 13, fontWeight: '600' }}>Log Out</Text>
        </TouchableOpacity>
        <Text style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginBottom: 40 }}>Finexa AI v2.4.1 · © 2026</Text>
      </View>

      {/* Password Modal */}
      <Modal visible={showPwModal} transparent animationType="slide" onRequestClose={() => setShowPwModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPwModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Change <Text style={{ color: C.rust, fontStyle: 'italic' }}>Password</Text></Text>
            {[{ l: 'Current Password', v: oldPw, s: setOldPw }, { l: 'New Password', v: newPw, s: setNewPw }].map(f => (
              <View key={f.l} style={{ marginBottom: 14 }}>
                <Text style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>{f.l}</Text>
                <TextInput value={f.v} onChangeText={f.s} secureTextEntry placeholder="••••••••" placeholderTextColor={C.muted} style={styles.sheetInput} />
              </View>
            ))}
            <TouchableOpacity onPress={handleSave} style={[styles.submitBtn, { backgroundColor: saved ? C.teal : C.rust }]}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{saved ? '✓ Saved!' : 'Update Password'}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },
  header: { backgroundColor: C.teal, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.rust, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 28 },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: C.sage, borderWidth: 2, borderColor: C.teal },
  name: { color: '#fff', fontSize: 22, fontWeight: '600', marginBottom: 4 },
  main: { backgroundColor: C.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, padding: 20 },
  sectionTitle: { color: C.charcoal, fontSize: 17, fontWeight: '600', marginBottom: 14 },
  card: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden', marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.rustLight, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 18 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  toggleIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, borderRadius: 14, padding: 15, borderWidth: 1, borderColor: 'rgba(176,91,54,0.2)', marginBottom: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(42,43,47,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  handle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { color: C.charcoal, fontSize: 18, fontWeight: '600', marginBottom: 20 },
  sheetInput: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, color: C.charcoal, fontSize: 15 },
  submitBtn: { padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 10 },
});
