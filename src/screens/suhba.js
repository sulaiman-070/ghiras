/**
 * GHIRAS — Suhba (Social/Community) Screen
 */

import { State } from '../state.js';

const COLORS = ['#4A6B53', '#B88E4F', '#6E6053', '#2C5F2E', '#7B5216'];

export function renderSuhba() {
  const s = State.get();
  const n = State.toArabicNum;
  const groups = s.suhba.groups;

  // Demo leaderboard data (merged with real user)
  const leaderboard = [
    { rank: 1, name: 'أبو سليمان', avatar: 'أ', streak: 12, xp: 840, color: '#4A6B53', isMe: false },
    { rank: 2, name: s.user.name, avatar: s.user.avatar, streak: s.garden.streakDays, xp: s.garden.totalXP, color: '#B88E4F', isMe: true },
    { rank: 3, name: 'أم سليمان', avatar: 'أ', streak: 8, xp: 620, color: '#6E6053', isMe: false },
    { rank: 4, name: 'عبدالرحمن', avatar: 'ع', streak: 5, xp: 380, color: '#2C5F2E', isMe: false },
  ];

  return `
<div class="screen-content" id="suhba-content">

  <!-- Header -->
  <section>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
      <h1 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary)">الصحبة الصالحة</h1>
      <button onclick="App.createGroup()" class="btn btn--primary btn--sm" style="width:auto;gap:var(--space-1)">
        <span class="material-symbols-outlined" style="font-size:1rem">group_add</span>
        دعوة
      </button>
    </div>
    <p style="font-size:var(--font-size-base);color:var(--text-secondary);line-height:1.8">
      تحفيز إيجابي بين الإخوة والأخوات. لا منافسة سلبية — فقط تشجيع هادئ وحب في الله.
    </p>
  </section>

  <!-- My Groups -->
  ${groups.length > 0 ? `
  <section>
    <h2 class="section-title" style="margin-bottom:var(--space-3)">
      <span class="material-symbols-outlined icon-fill">groups</span>
      مجموعاتي
    </h2>
    <div style="display:flex;flex-direction:column;gap:var(--space-3)">
      ${groups.map(g => `
        <div class="card" style="cursor:pointer" onclick="App.openGroup('${g.id}')">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
            <div style="display:flex;align-items:center;gap:var(--space-3)">
              <div style="width:2.75rem;height:2.75rem;border-radius:var(--radius-lg);background:var(--color-bg-sage);border:1px solid var(--color-sage-light);display:flex;align-items:center;justify-content:center;font-size:1.5rem">
                ${g.emoji}
              </div>
              <div>
                <div style="font-size:var(--font-size-md);font-weight:700;color:var(--text-primary)">${g.name}</div>
                <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">${n(g.members.length)} أعضاء</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-1)">
              ${g.members.filter(m => m.todayDone).map(m => `
                <div style="width:1.75rem;height:1.75rem;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;color:white;font-size:var(--font-size-xs);font-weight:700;border:2px solid var(--color-bg-card)">
                  ${m.avatar}
                </div>
              `).join('')}
              <span style="font-size:0.625rem;color:var(--text-muted);margin-right:var(--space-1)">أكملوا اليوم</span>
            </div>
          </div>
          <!-- Members list -->
          <div style="display:flex;flex-direction:column;gap:var(--space-2)">
            ${g.members.map((m, i) => `
              <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);background:${m.todayDone ? 'var(--color-bg-sage)' : 'var(--color-bg)'}">
                <span style="font-size:var(--font-size-base);font-weight:700;color:var(--text-muted);min-width:1.5rem">${n(i+1)}</span>
                <div style="width:2rem;height:2rem;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;color:white;font-size:var(--font-size-xs);font-weight:700">
                  ${m.avatar}
                </div>
                <div style="flex:1">
                  <div style="font-size:var(--font-size-base);font-weight:600;color:var(--text-primary)">${m.name}</div>
                  <div style="font-size:var(--font-size-xs);color:var(--text-muted);display:flex;align-items:center;gap:var(--space-1)">
                    <span class="material-symbols-outlined icon-fill" style="font-size:0.875rem;color:var(--color-gold)">local_fire_department</span>
                    ${n(m.streak)} أيام متتالية
                  </div>
                </div>
                <div>
                  ${m.todayDone
                    ? `<span class="material-symbols-outlined icon-fill" style="color:var(--color-sage);font-size:1.375rem">check_circle</span>`
                    : `<button onclick="event.stopPropagation();App.encourageMember('${g.id}','${m.id}')" style="padding:var(--space-1) var(--space-2);border-radius:var(--radius-full);border:1px solid var(--color-border);background:var(--color-bg-card);font-size:0.75rem;cursor:pointer;font-family:var(--font-family)">💌 شجّع</button>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- Leaderboard -->
  <section>
    <h2 class="section-title" style="margin-bottom:var(--space-3)">
      <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">emoji_events</span>
      لوحة الاستمرار هذا الأسبوع
    </h2>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      ${leaderboard.map(member => `
        <div class="suhba-leaderboard-row ${member.isMe ? 'me' : ''}">
          <div style="font-size:var(--font-size-lg);font-weight:700;color:${member.rank <= 3 ? 'var(--color-gold)' : 'var(--text-muted)'};min-width:1.5rem">
            ${member.rank === 1 ? '🥇' : member.rank === 2 ? '🥈' : member.rank === 3 ? '🥉' : n(member.rank)}
          </div>
          <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:${member.color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:var(--font-size-base)">
            ${member.avatar}
          </div>
          <div style="flex:1">
            <div style="font-size:var(--font-size-base);font-weight:${member.isMe ? '700' : '500'};color:var(--text-primary)">
              ${member.name} ${member.isMe ? '(أنت)' : ''}
            </div>
            <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">
              🔥 ${n(member.streak)} أيام
            </div>
          </div>
          <div style="text-align:left">
            <div style="font-size:var(--font-size-base);font-weight:700;color:var(--color-gold)">${n(member.xp)}</div>
            <div style="font-size:0.625rem;color:var(--text-muted)">نقطة</div>
          </div>
        </div>
      `).join('')}
    </div>

    <p style="text-align:center;font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-3);line-height:1.8;padding:var(--space-3);background:var(--color-bg-secondary);border-radius:var(--radius-xl)">
      🌿 هذه لوحة للتشجيع الإيجابي فقط، وليست للمنافسة — كل واحد في مسيرته الخاصة بإذن الله
    </p>
  </section>

  <!-- Invite Friends -->
  <section style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-5);text-align:center">
    <div style="font-size:2.5rem;margin-bottom:var(--space-3)">🤝</div>
    <h3 style="font-size:var(--font-size-lg);font-weight:700;margin-bottom:var(--space-2)">ادعُ صديقاً إلى الصحبة</h3>
    <p style="font-size:var(--font-size-base);color:var(--text-secondary);margin-bottom:var(--space-4);line-height:1.8">
      «من دل على خير فله مثل أجر فاعله» — شارك التطبيق مع من تحب
    </p>
    <button class="btn btn--primary" onclick="App.inviteFriend()" style="display:inline-flex;width:auto">
      <span class="material-symbols-outlined icon-fill">share</span>
      شارك التطبيق
    </button>
  </section>

</div>`;
}
