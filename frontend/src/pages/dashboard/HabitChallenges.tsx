import { useState, useEffect } from 'react';
import { Star, Trophy, Zap, Target, Shield, Flame, Lock, CheckCircle2, Crown, TrendingUp } from 'lucide-react';
import { GamificationAPI } from '@/lib/api';

const C = {
  teal: '#003d3d', sage: '#cdface', charcoal: '#2a2b2f', rust: '#b05b36',
  cream: '#f5eee2', white: '#ffffff', border: 'rgba(42,43,47,0.1)',
  muted: 'rgba(42,43,47,0.45)', rustLight: 'rgba(176,91,54,0.1)',
  sageLight: 'rgba(205,250,206,0.4)',
};

const defaultBadgeIcons = [Shield, Star, Flame, Zap, Target, TrendingUp, Crown, Trophy];

export default function HabitChallenges() {
  const [summary, setSummary] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [myBadges, setMyBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      GamificationAPI.getData().catch(() => null),
      GamificationAPI.getChallenges().catch(() => ({ results: [] })),
      GamificationAPI.getMyBadges().catch(() => []),
      GamificationAPI.getBadges().catch(() => []),
    ]).then(([s, ch, mb, ab]) => {
      setSummary(s);
      setChallenges(ch?.results ?? []);
      setMyBadges(mb ?? []);
      setAllBadges(ab ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id: number) => {
    try {
      await GamificationAPI.toggleChallenge(id);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const totalPts = summary?.total_points ?? 0;
  const level = summary?.level ?? 1;
  const earnedBadgeIds = new Set(myBadges.map((b: any) => b.badge ?? b.id));

  const badgesDisplay = allBadges.slice(0, 8).map((b: any, i: number) => ({
    ...b,
    unlocked: earnedBadgeIds.has(b.id),
    IconComp: defaultBadgeIcons[i % defaultBadgeIcons.length],
    step: String(i + 1).padStart(2, '0'),
  }));

  return (
    <div style={{ background: C.cream, minHeight: '100vh', fontFamily: 'Outfit, sans-serif', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 28px', background: C.teal }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Your Progress</p>
          <h2 style={{ color: C.white, margin: '0 0 20px', fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: 24 }}>
            Rewards & <em style={{ color: C.sage, fontStyle: 'italic' }}>Challenges</em>
          </h2>

          {/* Level Banner */}
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ background: C.rust, borderRadius: 8, padding: '2px 12px' }}>
                    <span style={{ color: C.white, fontSize: 11, fontWeight: 700 }}>LEVEL {level}</span>
                  </div>
                  <Crown size={14} color="#f5d78a" />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>Finance Strategist</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: C.white, fontSize: 28, fontWeight: 700, margin: 0, fontFamily: 'Playfair Display, serif' }}>{totalPts.toLocaleString()}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0' }}>Total Points</p>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 6, height: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(totalPts % 1000) / 10}%`, borderRadius: 6, background: C.sage, transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Lv. {level}</span>
              <span style={{ color: C.sage, fontSize: 10, fontWeight: 500 }}>{1000 - (totalPts % 1000)} pts to Level {level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curved cream */}
      <div style={{ background: C.cream, borderRadius: '20px 20px 0 0', marginTop: -16, padding: '24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Daily Challenges */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Today</p>
                <h3 style={{ color: C.charcoal, margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600 }}>
                  Daily <em style={{ color: C.rust, fontStyle: 'italic' }}>Challenges</em>
                </h3>
              </div>
              <span style={{ color: C.muted, fontSize: 11 }}>
                {challenges.filter((c: any) => c.completed).length}/{challenges.length} done
              </span>
            </div>

            {loading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p> : challenges.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 16, padding: '20px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.muted, fontSize: 13 }}>No challenges available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {challenges.map((ch: any) => {
                  const isDone = ch.completed;
                  return (
                    <button key={ch.id} onClick={() => handleToggle(ch.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', background: isDone ? 'rgba(205,250,206,0.3)' : C.white, borderRadius: 14, padding: '13px 16px', border: isDone ? `1px solid rgba(0,61,61,0.2)` : `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(42,43,47,0.05)', width: '100%' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: isDone ? C.sageLight : C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {ch.challenge?.icon || ch.icon || '🎯'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: isDone ? C.muted : C.charcoal, fontSize: 13, fontWeight: 500, margin: 0, textDecoration: isDone ? 'line-through' : 'none' }}>
                          {ch.challenge?.name || ch.name || ch.text}
                        </p>
                        <p style={{ color: C.rust, fontSize: 11, margin: '2px 0 0', fontWeight: 600 }}>
                          +{ch.challenge?.points || ch.points || 50} pts
                        </p>
                      </div>
                      {isDone ? <CheckCircle2 size={20} color={C.teal} /> : <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${C.border}` }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badges */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ color: C.muted, fontSize: 10, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8 }}>Achievements</p>
                <h3 style={{ color: C.charcoal, margin: 0, fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600 }}>
                  Your <em style={{ color: C.rust, fontStyle: 'italic' }}>Badges</em>
                </h3>
              </div>
              <span style={{ color: C.muted, fontSize: 11 }}>{earnedBadgeIds.size}/{allBadges.length}</span>
            </div>
            {loading ? <p style={{ color: C.muted, fontSize: 13 }}>Loading…</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {badgesDisplay.map((badge: any, i: number) => {
                  const Icon = badge.IconComp;
                  return (
                    <div key={badge.id || i} style={{ background: badge.unlocked ? C.white : C.cream, borderRadius: 18, padding: '16px 10px', border: badge.unlocked ? `1px solid rgba(0,61,61,0.15)` : `1px solid ${C.border}`, boxShadow: badge.unlocked ? '0 2px 12px rgba(42,43,47,0.08)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                      <span style={{ color: C.rust, fontSize: 9, fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>{badge.step}</span>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: badge.unlocked ? C.sageLight : 'rgba(42,43,47,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {badge.unlocked ? <Icon size={20} color={C.teal} /> : <Lock size={16} color="rgba(42,43,47,0.2)" />}
                      </div>
                      <p style={{ color: badge.unlocked ? C.charcoal : C.muted, fontSize: 9, fontWeight: 600, margin: 0, lineHeight: 1.3, textAlign: 'center' }}>
                        {badge.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
