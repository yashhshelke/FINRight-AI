import { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Download, Bell, Moon, Shield, ChevronRight, LogOut, Eye, EyeOff, Check, Fingerprint, Globe } from 'lucide-react';
import { SettingsAPI, AuthAPI } from '@/lib/api';

const C = {
  teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36',
  cream: '#f5eee2', white: '#ffffff', border: 'rgba(42,43,47,0.1)',
  muted: 'rgba(42,43,47,0.45)', rustLight: 'rgba(176,91,54,0.1)',
  sageLight: 'rgba(205,250,206,0.4)',
};

type Toggle = { id: string; label: string; desc: string; icon: React.ElementType; value: boolean };

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [toggles, setToggles] = useState<Toggle[]>([
    { id: 'push', label: 'Push Notifications', desc: 'Expense alerts & reminders', icon: Bell, value: true },
    { id: 'dark', label: 'Dark Mode', desc: 'AMOLED-friendly theme', icon: Moon, value: false },
    { id: 'biometric', label: 'Biometric Login', desc: 'Face ID / Fingerprint', icon: Fingerprint, value: false },
    { id: 'privacy', label: 'Privacy Mode', desc: 'Hide balances by default', icon: Shield, value: false },
  ]);
  const [showPwModal, setShowPwModal] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    SettingsAPI.getFullProfile().then(setProfile).catch(() => {});
  }, []);

  const flip = (id: string) => setToggles(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));

  const handleSave = async () => {
    try {
      await SettingsAPI.changePassword({ old_password: oldPw, new_password: newPw, new_password_confirm: newPw });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowPwModal(false); setOldPw(''); setNewPw(''); }, 1500);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await SettingsAPI.exportData();
      alert('Data export initiated! Check your email.');
    } catch (e: any) { alert(e.message); }
    finally { setExporting(false); }
  };

  const handleLogout = () => { AuthAPI.logout(); window.location.href = '/login'; };

  const initials = profile ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'F' : 'F';
  const name = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.username || 'User' : 'Loading…';

  const Section = ({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ marginBottom: 12 }}>
        <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Settings</p>
        <h3 style={{ color: C.charcoal, margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 15, fontWeight: 600 }}>
          {title.split('&').map((part, i) =>
            i === 0 ? part : <em key={i} style={{ color: accent, fontStyle: 'italic' }}>& {part.trim()}</em>
          )}
        </h3>
      </div>
      <div style={{ background: C.white, borderRadius: 18, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(42,43,47,0.06)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'Outfit, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 28px', background: C.teal, textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', position: 'relative', marginBottom: 14 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: C.rust, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: C.white, fontWeight: 800, fontSize: 28 }}>{initials}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: C.sage, border: `2px solid ${C.teal}` }} />
          </div>
          <h2 style={{ color: C.white, margin: '0 0 4px', fontFamily: 'Playfair Display, serif', fontSize: 22 }}>{name}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 20px' }}>{profile?.email ?? ''}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 36 }}>
            {[{ label: 'Transactions', val: profile?.transaction_count ?? '—' }, { label: 'Goals', val: profile?.goal_count ?? '—' }, { label: 'Credits', val: profile?.credits ?? '—' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ color: C.white, fontWeight: 700, fontSize: 20, margin: 0, fontFamily: 'Playfair Display, serif' }}>{s.val}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Curved cream */}
      <div style={{ background: C.cream, borderRadius: '20px 20px 0 0', marginTop: -16, padding: '24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* Personal Info */}
          <Section title="Personal & Info" accent={C.rust}>
            {[
              { icon: User, label: 'Full Name', value: name },
              { icon: Mail, label: 'Email', value: profile?.email ?? '—' },
              { icon: Phone, label: 'Phone', value: profile?.phone ?? '—' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.rustLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={C.rust} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.muted, fontSize: 10, margin: 0 }}>{item.label}</p>
                      <p style={{ color: C.charcoal, fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>{item.value}</p>
                    </div>
                    <ChevronRight size={14} color={C.border} />
                  </div>
                  {i < 2 && <div style={{ height: 1, background: C.border, margin: '0 18px' }} />}
                </div>
              );
            })}
          </Section>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <button onClick={() => setShowPwModal(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.teal, borderRadius: 14, padding: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,61,61,0.25)' }}>
              <Lock size={15} color={C.white} />
              <span style={{ color: C.white, fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Change Password</span>
            </button>
            <button onClick={handleExport} disabled={exporting} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.white, borderRadius: 14, padding: '14px', border: `1px solid ${C.border}`, cursor: 'pointer', boxShadow: '0 2px 10px rgba(42,43,47,0.07)' }}>
              <Download size={15} color={C.rust} />
              <span style={{ color: C.rust, fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{exporting ? 'Exporting…' : 'Export Data'}</span>
            </button>
          </div>

          {/* Preferences */}
          <Section title="Preferences" accent={C.rust}>
            {toggles.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={t.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: t.value ? C.sageLight : C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={t.value ? C.teal : C.muted} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: C.charcoal, fontSize: 13, fontWeight: 500, margin: 0 }}>{t.label}</p>
                      <p style={{ color: C.muted, fontSize: 11, margin: '2px 0 0' }}>{t.desc}</p>
                    </div>
                    <button onClick={() => flip(t.id)} style={{ width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: t.value ? C.teal : 'rgba(42,43,47,0.12)', position: 'relative', flexShrink: 0, transition: 'background 0.25s' }}>
                      <div style={{ position: 'absolute', top: 3, left: t.value ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: C.white, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                    </button>
                  </div>
                  {i < toggles.length - 1 && <div style={{ height: 1, background: C.border, margin: '0 18px' }} />}
                </div>
              );
            })}
          </Section>

          {/* More */}
          <Section title="More" accent={C.rust}>
            {[{ label: 'Payment Methods', icon: Lock }, { label: 'Connected Banks', icon: Globe, badge: '0' }, { label: 'Privacy Policy', icon: Shield }].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={15} color={C.charcoal} />
                    </div>
                    <span style={{ color: C.charcoal, fontSize: 13, fontWeight: 500, flex: 1 }}>{item.label}</span>
                    {'badge' in item && item.badge && <span style={{ background: C.sageLight, borderRadius: 6, padding: '2px 8px', color: C.teal, fontSize: 10, fontWeight: 600, border: `1px solid rgba(0,61,61,0.15)` }}>{item.badge}</span>}
                    <ChevronRight size={14} color={C.border} />
                  </div>
                  {i < 2 && <div style={{ height: 1, background: C.border, margin: '0 18px' }} />}
                </div>
              );
            })}
          </Section>

          {/* Logout */}
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.white, borderRadius: 14, padding: '15px', border: `1px solid rgba(176,91,54,0.2)`, cursor: 'pointer', marginBottom: 14 }}>
            <LogOut size={15} color={C.rust} />
            <span style={{ color: C.rust, fontSize: 13, fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>Log Out</span>
          </button>
          <p style={{ color: C.muted, fontSize: 11, textAlign: 'center' }}>Finexa AI v2.4.1 · © 2026</p>
        </div>
      </div>

      {/* Password Modal */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,43,47,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowPwModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, background: C.white, borderRadius: '24px 24px 0 0', padding: '24px 24px 48px', border: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ color: C.charcoal, margin: '0 0 20px', fontFamily: 'Playfair Display, serif', fontSize: 18 }}>Change <em style={{ color: C.rust, fontStyle: 'italic' }}>Password</em></h3>
            {[{ label: 'Current Password', value: oldPw, set: setOldPw, show: showOld, toggle: () => setShowOld(!showOld) }, { label: 'New Password', value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) }].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <p style={{ color: C.muted, fontSize: 11, margin: '0 0 6px' }}>{f.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', background: C.cream, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px' }}>
                  <input type={f.show ? 'text' : 'password'} value={f.value} onChange={e => f.set(e.target.value)} placeholder="••••••••" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.charcoal, fontSize: 15, fontFamily: 'Outfit, sans-serif' }} />
                  <button onClick={f.toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {f.show ? <Eye size={15} color={C.muted} /> : <EyeOff size={15} color={C.muted} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handleSave} style={{ width: '100%', padding: '15px', borderRadius: 14, cursor: 'pointer', marginTop: 10, background: saved ? C.teal : C.rust, border: 'none', color: C.white, fontSize: 15, fontWeight: 600, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px rgba(${saved ? '0,61,61' : '176,91,54'},0.35)`, transition: 'background 0.3s' }}>
              {saved ? <><Check size={17} /> Saved!</> : 'Update Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
