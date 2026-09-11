/**
 * GHIRAS — Garden Screen
 */

import { State } from '../state.js';
import { GARDEN_STAGES, ACHIEVEMENTS, getGardenStage, getGardenProgress } from '../data/habits.js';
import { JUZ_NAMES } from '../data/quran.js';

const JUZ_PAGES = [
  { juz: 1, name: 'الجزء الأول', startPage: 1 },
  { juz: 2, name: 'الجزء الثاني', startPage: 22 },
  { juz: 3, name: 'الجزء الثالث', startPage: 42 },
  { juz: 4, name: 'الجزء الرابع', startPage: 62 },
  { juz: 5, name: 'الجزء الخامس', startPage: 82 },
  { juz: 6, name: 'الجزء السادس', startPage: 102 },
  { juz: 7, name: 'الجزء السابع', startPage: 121 },
  { juz: 8, name: 'الجزء الثامن', startPage: 142 },
  { juz: 9, name: 'الجزء التاسع', startPage: 162 },
  { juz: 10, name: 'الجزء العاشر', startPage: 182 },
  { juz: 11, name: 'الجزء الحادي عشر', startPage: 201 },
  { juz: 12, name: 'الجزء الثاني عشر', startPage: 222 },
  { juz: 13, name: 'الجزء الثالث عشر', startPage: 242 },
  { juz: 14, name: 'الجزء الرابع عشر', startPage: 262 },
  { juz: 15, name: 'الجزء الخامس عشر', startPage: 282 },
  { juz: 16, name: 'الجزء السادس عشر', startPage: 302 },
  { juz: 17, name: 'الجزء السابع عشر', startPage: 322 },
  { juz: 18, name: 'الجزء الثامن عشر', startPage: 342 },
  { juz: 19, name: 'الجزء التاسع عشر', startPage: 362 },
  { juz: 20, name: 'الجزء العشرون', startPage: 382 },
  { juz: 21, name: 'الجزء الحادي والعشرون', startPage: 402 },
  { juz: 22, name: 'الجزء الثاني والعشرون', startPage: 422 },
  { juz: 23, name: 'الجزء الثالث والعشرون', startPage: 442 },
  { juz: 24, name: 'الجزء الرابع والعشرون', startPage: 462 },
  { juz: 25, name: 'الجزء الخامس والعشرون', startPage: 482 },
  { juz: 26, name: 'الجزء السادس والعشرون', startPage: 502 },
  { juz: 27, name: 'الجزء السابع والعشرون', startPage: 522 },
  { juz: 28, name: 'الجزء الثامن والعشرون', startPage: 542 },
  { juz: 29, name: 'الجزء التاسع والعشرون', startPage: 562 },
  { juz: 30, name: 'الجزء الثلاثون', startPage: 582 }
];

export function renderGarden() {
  const s = State.get();
  const n = State.toArabicNum;
  const streak = s.garden.streakDays;
  const stage = getGardenStage(streak);
  const pct = getGardenProgress(streak);
  const last7 = State.getLast7Days();
  const curPage = Math.max(1, Math.min(604, s.quranProgress.currentPage || 1));
  const khatmaPct = Math.min(100, Math.round((curPage / 604) * 100));
  const currentJuz = Math.min(30, Math.max(1, Math.ceil(curPage / 20.13)));

  // Which achievements are unlocked?
  const unlockedIds = s.garden.badges.map(b => b.id);

  // Milestone data for timeline
  const milestones = [
    { id: 'seed',   label: 'بذرة الإيمان',   emoji: '🌱', day: 1 },
    { id: 'sprout', label: 'البادرة الخضراء', emoji: '🌿', day: 3 },
    { id: 'plant',  label: 'شتلة يانعة',     emoji: '🌵', day: 7 },
    { id: 'tree',   label: 'شجرة مورقة',     emoji: '🌳', day: 14 },
    { id: 'oasis',  label: 'واحة مثمرة',     emoji: '🌴', day: 30 },
  ];

  function milestoneStatus(m, index) {
    if (streak >= m.day) return 'done';
    if (streak >= (milestones[index - 1]?.day ?? 0)) return 'active';
    return streak >= (milestones[index - 1]?.day ?? -1) ? 'next' : 'locked';
  }

  return `
<div class="screen-content" id="garden-content">

  <!-- Header -->
  <section>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
      <div class="chip chip--sage">
        <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">eco</span>
        <span>المستوى ${n(s.user.level)} · ${stage.label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-1);font-size:var(--font-size-xs);color:var(--color-gold);font-weight:500">
        <span class="material-symbols-outlined" style="font-size:1rem">water_drop</span>
        <span>عمر النبتة: ${n(streak)} أيام</span>
      </div>
    </div>
    <h1 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary)">حديقة القرآن والختمة المباركة 🌿</h1>
    <p style="font-size:var(--font-size-base);color:var(--text-secondary);margin-top:var(--space-2);line-height:1.8">
      كل صفحة تتلوها تُنبت ورقة وتفتح زهرة في شجرة ختمتك، وكل يوم استمرار يروي روحك بالسكينة.
    </p>
  </section>

  <!-- ═════════════════════════════════════════════════
       THE LIVING KHATMA TREE (شجرة ختمة القرآن الحية)
       ═════════════════════════════════════════════════ -->
  <section class="card animate-fadeInUp" style="background:linear-gradient(135deg, rgba(24, 18, 12, 0.95) 0%, rgba(38, 30, 20, 0.95) 100%);border:1.5px solid var(--color-gold);color:#FAF7F2;position:relative;overflow:hidden;padding:var(--space-5)">
    <!-- Golden Ambient Aura -->
    <div style="position:absolute;top:-4rem;right:-4rem;width:14rem;height:14rem;background:radial-gradient(circle, rgba(197,160,89,0.25) 0%, transparent 70%);border-radius:50%;pointer-events:none"></div>
    <div style="position:absolute;bottom:-4rem;left:-4rem;width:12rem;height:12rem;background:radial-gradient(circle, rgba(74,107,83,0.3) 0%, transparent 70%);border-radius:50%;pointer-events:none"></div>

    <div style="position:relative;z-index:1">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:2.6rem;height:2.6rem;border-radius:50%;background:rgba(197,160,89,0.2);border:1px solid var(--color-gold);display:flex;align-items:center;justify-content:center;color:var(--color-gold)">
            <span class="material-symbols-outlined" style="font-size:1.4rem">park</span>
          </div>
          <div>
            <h2 style="font-size:1.15rem;font-weight:700;color:#FFF8EE;margin:0">شجرة ختمة القرآن الحية 🌳</h2>
            <div style="font-size:0.75rem;color:#D4BA94;margin-top:2px">٣٠ غصناً تزهر وتضيء مع كل صفحة تقرؤها في مصحفك</div>
          </div>
        </div>
        <button class="btn btn--sm" style="background:rgba(197,160,89,0.2);color:var(--color-gold);border:1px solid var(--color-gold);border-radius:var(--radius-pill);font-size:0.75rem;padding:4px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="App.openKhatmaCertificate()">
          <span class="material-symbols-outlined" style="font-size:1rem">workspace_premium</span>
          <span>شهادة الختمة</span>
        </button>
      </div>

      <!-- Khatma Progress Stats Ring & Bar -->
      <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(197,160,89,0.3);border-radius:var(--radius-xl);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:0.85rem;color:#E6C887;font-weight:600">تقدّم الختمة المباركة:</span>
          <span style="font-size:1rem;font-weight:700;color:var(--color-gold)">
            ${n(curPage)} / ٦٠٤ صفحة (${n(khatmaPct)}٪)
          </span>
        </div>
        <div class="progress-bar" style="background:rgba(255,255,255,0.1);height:8px">
          <div class="progress-bar__fill" style="width:${khatmaPct}%;background:linear-gradient(90deg, #B88E4F 0%, #E6C887 100%)"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.75rem;color:#D4BA94;margin-top:8px">
          <span>أنت الآن في: ${JUZ_NAMES[currentJuz] || 'الجزء الأول'}</span>
          <span>المتبقي للختم: ${n(Math.max(0, 604 - curPage))} صفحة</span>
        </div>
      </div>

      <!-- 30-Juz Interactive Branches Grid -->
      <div style="margin-bottom:var(--space-1)">
        <div style="font-size:0.8rem;font-weight:700;color:#FFF8EE;margin-bottom:8px;display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">eco</span>
          <span>أغصان الأجزاء الثلاثين (اضغط للانتقال فوراً للمصحف):</span>
        </div>
        <div class="khatma-branches-grid">
          ${JUZ_PAGES.map(j => {
            const nextStart = JUZ_PAGES[j.juz]?.startPage || 605;
            const isCompleted = curPage >= nextStart;
            const isCurrent = curPage >= j.startPage && curPage < nextStart;
            const statusClass = isCompleted ? 'bloomed' : (isCurrent ? 'active' : 'bud');
            const icon = isCompleted ? '🌸' : (isCurrent ? '🌿' : '🌱');
            return `
              <div class="khatma-branch-leaf ${statusClass}" onclick="App.goToPage(${j.startPage})" title="${j.name} (يبدأ ص ${j.startPage})">
                <span class="khatma-branch-icon">${icon}</span>
                <span class="khatma-branch-num">ج ${n(j.juz)}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  </section>

  <!-- Garden Visual -->
  <section style="background:linear-gradient(to bottom, var(--color-bg-card), var(--color-bg-sage));border:1px solid var(--color-sage-light);border-radius:var(--radius-3xl);padding:var(--space-6);position:relative;overflow:hidden;box-shadow:0 12px 32px rgba(74,107,83,0.07)">
    <!-- Ambient sparkles -->
    <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
      <div class="garden-sparkle" style="position:absolute;top:15%;right:15%;font-size:0.875rem">✨</div>
      <div class="garden-sparkle" style="position:absolute;top:35%;left:12%;font-size:0.75rem;animation-delay:0.7s">🌸</div>
      <div class="garden-sparkle" style="position:absolute;bottom:25%;right:10%;font-size:0.75rem;animation-delay:1.2s">💫</div>
      <div class="garden-sparkle" style="position:absolute;bottom:15%;left:20%;font-size:0.875rem;animation-delay:0.3s">🍃</div>
    </div>

    <!-- Status ribbon -->
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-5)">
      <div style="display:flex;align-items:center;gap:var(--space-2);background:rgba(255,253,249,0.9);backdrop-filter:blur(8px);padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);box-shadow:var(--shadow-sm);border:1px solid var(--color-border)">
        <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">sparkles</span>
        <span style="font-size:var(--font-size-xs);font-weight:600;color:var(--text-primary)">
          ${streak >= 7
            ? `الحديقة في أوج نضارتها بفضل استمرارك لـ ${n(streak)} أيام ✨`
            : streak > 0
              ? `النبتة تنمو بخطوات هادئة ومباركة 🌱`
              : 'ابدأ رحلتك اليوم بخطوة صغيرة 🌿'}
        </span>
      </div>
    </div>

    <!-- Garden Plant Visual -->
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-5)">
      <div style="position:relative">
        <!-- Glow -->
        <div style="position:absolute;inset:-10%;background:radial-gradient(circle,rgba(74,107,83,0.15) 0%,transparent 70%);border-radius:50%;pointer-events:none"></div>
        <!-- Plant Container -->
        <div style="width:13rem;height:13rem;border-radius:50%;background:linear-gradient(to bottom,var(--color-bg-card),var(--color-bg-sage));box-shadow:0 8px 32px rgba(74,107,83,0.15);display:flex;align-items:center;justify-content:center;border:2px solid var(--color-sage-light);overflow:hidden;font-size:5.5rem">
          <span class="animate-float">${stage.emoji}</span>
        </div>
        <!-- Water button -->
        <button onclick="App.waterGarden()" id="water-btn"
          style="position:absolute;bottom:0.5rem;left:0.5rem;width:2.5rem;height:2.5rem;border-radius:50%;background:var(--color-primary);color:var(--color-gold);border:2px solid var(--color-gold);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md);cursor:pointer;transition:transform 0.2s">
          <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem">water_drop</span>
        </button>
      </div>
    </div>

    <!-- Care Indicator -->
    <div style="background:rgba(255,253,249,0.85);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:space-between;border:1px solid var(--color-border)">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div style="width:2rem;height:2rem;border-radius:50%;background:var(--color-gold-light);display:flex;align-items:center;justify-content:center;color:var(--color-gold)">
          <span class="material-symbols-outlined" style="font-size:1.125rem">local_florist</span>
        </div>
        <div>
          <div style="font-size:var(--font-size-base);font-weight:600;color:var(--text-primary)">درجة الرعاية اليومية</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">${State.getTodayProgress() > 0 ? 'تم الريّ بالأذكار والقرآن' : 'في انتظار رعايتك اليوم'}</div>
        </div>
      </div>
      <div style="font-size:var(--font-size-lg);font-weight:700;color:var(--color-sage)">
        ${State.toArabicNum(State.getTodayProgress())}٪
        <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;vertical-align:middle">
          ${State.getTodayProgress() === 100 ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </div>
    </div>

    <!-- Garden XP -->
    <div style="margin-top:var(--space-3);text-align:center;font-size:var(--font-size-xs);color:var(--text-secondary)">
      <span>إجمالي النقاط المكتسبة: </span>
      <span style="font-weight:700;color:var(--color-gold)">${n(s.garden.totalXP)} نقطة</span>
    </div>
  </section>

  <!-- Milestone Timeline -->
  <section>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined">conversion_path</span>
        مراحل نمو نبتتك
      </h2>
      <span style="font-size:var(--font-size-xs);color:var(--text-secondary)">${n(streak)} / ${n(30)} يوماً</span>
    </div>
    <div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-4);overflow-x:auto">
      <div style="display:flex;align-items:center;min-width:560px;padding:var(--space-2) 0">
        ${milestones.map((m, i) => {
          const status = milestoneStatus(m, i);
          const isLast = i === milestones.length - 1;
          return `
          <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-1);text-align:center;min-width:96px">
            <div class="milestone-node__dot milestone-node__dot--${status === 'done' ? 'done' : status === 'active' ? 'active' : status === 'next' ? 'next' : 'locked'}" style="font-size:1.5rem">
              ${status === 'done' ? '✓' : m.emoji}
            </div>
            <span style="font-size:var(--font-size-xs);font-weight:${status === 'active' ? '700' : '500'};color:${status === 'active' ? 'var(--color-gold)' : status === 'done' ? 'var(--text-primary)' : 'var(--text-muted)'}">
              ${m.label}
            </span>
            <span style="font-size:0.625rem;color:var(--text-muted)">يوم ${n(m.day)} ${status === 'active' ? '· أنت هنا' : status === 'done' ? '· تم' : ''}</span>
          </div>
          ${!isLast ? `<div style="flex:1;height:2px;border-radius:9999px;background:${status === 'done' ? 'var(--color-primary)' : 'var(--color-border)'}"></div>` : ''}
          `;
        }).join('')}
      </div>
    </div>
  </section>

  <!-- Compassion Card -->
  <section style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-5);display:flex;gap:var(--space-4);align-items:flex-start">
    <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:var(--color-gold-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--color-gold)">
      <span class="material-symbols-outlined icon-fill" style="font-size:1.375rem">favorite</span>
    </div>
    <div>
      <h3 style="font-size:var(--font-size-md);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">مساحة لطف وأمان 🌱</h3>
      <p style="font-size:var(--font-size-base);color:var(--text-secondary);line-height:1.8">
        إذا انشغلت يوماً، نبتتك تشتاق لك وتنتظر عودتك لتزهر من جديد بدون لوم أو انكسار. العبرة دائماً بالعودة الطيبة والاستمرار الهادئ.
      </p>
    </div>
  </section>

  <!-- Achievements / Badges -->
  <section>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined" style="color:var(--color-gold)">stars</span>
        ثمار الحديقة (الأوسمة المباركة)
      </h2>
      <span style="font-size:var(--font-size-xs);color:var(--color-sage);font-weight:500">
        ${n(unlockedIds.length)} مكتملة
      </span>
    </div>
    <div class="badge-grid">
      ${ACHIEVEMENTS.map(ach => {
        const unlocked = unlockedIds.includes(ach.id);
        return `
        <div class="badge-card ${unlocked ? '' : 'locked'}">
          <div class="badge-card__icon ${unlocked ? 'badge-card__icon--gold' : 'badge-card__icon--dark'}">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.25rem">${ach.icon}</span>
          </div>
          ${unlocked ? `<span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--color-sage);position:absolute;top:var(--space-3);left:var(--space-3)">verified</span>` : ''}
          <div class="badge-card__name">${ach.name}</div>
          <div class="badge-card__desc">${ach.desc}</div>
          <div class="badge-card__status">
            ${unlocked
              ? `<span class="material-symbols-outlined icon-fill" style="font-size:0.875rem">check_circle</span> مكتملة ومُزهرة ✓`
              : `<span class="material-symbols-outlined" style="font-size:0.875rem">lock</span> ${n(ach.xp)} نقطة`
            }
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>

  <!-- Share Garden -->
  <button id="share-garden-btn" onclick="App.shareGarden()"
    style="width:100%;padding:var(--space-4);border-radius:var(--radius-2xl);background:var(--color-primary);color:var(--text-inverted);border:1px solid var(--color-gold);font-family:var(--font-family);font-size:var(--font-size-base);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--space-2);box-shadow:var(--shadow-button);transition:all 0.2s">
    <span class="material-symbols-outlined icon-fill">share</span>
    شارك حديقتك مع أصحابك
  </button>

</div>`;
}
