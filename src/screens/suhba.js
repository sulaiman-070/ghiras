/**
 * GHIRAS — Suhba (Personal Companions & Competition Groups) Screen
 * Real-time friend progress tracking, unique IDs, and competitive groups
 */

import { State } from '../state.js';
import { Auth } from '../auth.js';
import { ALL_SURAHS, JUZ_NAMES } from '../data/quran.js';

let _activeSuhbaTab = 'companions'; // 'companions' | 'groups'

export function setSuhbaTab(tab) {
  _activeSuhbaTab = tab;
}

export function getSuhbaTab() {
  return _activeSuhbaTab;
}

function getSurahAndJuzForPage(pageNumber) {
  const page = Math.min(604, Math.max(1, Number(pageNumber) || 1));
  let surah = ALL_SURAHS[0];
  for (const s of ALL_SURAHS) {
    if (s.page <= page) {
      surah = s;
    } else {
      break;
    }
  }
  const juzIdx = Math.min(30, Math.max(1, Math.ceil(page / 20)));
  const juzName = JUZ_NAMES[juzIdx] || `الجزء ${juzIdx}`;
  return { surahName: surah.name, juzName };
}

export function renderSuhba() {
  const s = State.get();
  const n = State.toArabicNum;
  const currentUser = Auth.getCurrentUser();
  const myTag = s.user?.userTag || currentUser?.userTag || State.getUserTag() || 'GHR-1024';
  const myPage = s.quranProgress?.currentPage || 1;
  const myQuranInfo = getSurahAndJuzForPage(myPage);

  const companions = s.suhba?.companions || [];
  const groups = State.getGroups() || [];
  const incomingNudges = s.suhba?.incomingNudges || [];

  // Build personalized leaderboard from current user + their companions
  const myLeaderboardEntry = {
    id: 'me',
    name: s.user?.name || 'أنت',
    userTag: myTag,
    relation: 'أنت',
    avatar: s.user?.avatar || 'أ',
    streak: s.garden?.streakDays || 0,
    xp: s.user?.xp || s.garden?.totalXP || 0,
    currentPage: myPage,
    currentSurahName: myQuranInfo.surahName,
    currentJuzName: myQuranInfo.juzName,
    color: '#B88E4F',
    todayDone: State.getTodayProgress() > 0 || (s.quranProgress?.todayPages || 0) > 0,
    isMe: true
  };

  const allMembers = [
    myLeaderboardEntry,
    ...companions.map(c => ({
      ...c,
      isMe: false,
      quranInfo: getSurahAndJuzForPage(c.currentPage || 1)
    }))
  ].sort((a, b) => ((b.xp || 0) + (b.streak || 0) * 50) - ((a.xp || 0) + (a.streak || 0) * 50));

  return `
<div class="screen-content" id="suhba-content" style="padding-bottom:var(--space-8);direction:rtl">

  <!-- Header -->
  <section style="margin-bottom:var(--space-4)">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:var(--space-2)">
      <div>
        <h1 style="font-size:var(--font-size-2xl);font-weight:800;color:var(--text-primary);margin:0;display:flex;align-items:center;gap:8px">
          <span>الصحبة الصالحة</span>
          <span style="font-size:1.5rem">👥</span>
        </h1>
        <div style="font-size:0.875rem;color:var(--text-secondary);margin-top:4px">
          تتبع تقدم أصدقائك وتنافسوا في ختم القرآن وبناء العادات الروحية
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button onclick="App.openAddCompanionByIdModal()" class="btn btn--primary btn--sm" style="gap:6px;padding:8px 16px;border-radius:var(--radius-xl);cursor:pointer;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:1.15rem">person_add</span>
          <span>إضافة رفيق بالـ ID</span>
        </button>
        <button onclick="App.openCreateGroupModal()" class="btn btn--secondary btn--sm" style="gap:6px;padding:8px 14px;border-radius:var(--radius-xl);cursor:pointer;font-weight:600">
          <span class="material-symbols-outlined" style="font-size:1.15rem">group_add</span>
          <span>إنشاء حلقة</span>
        </button>
      </div>
    </div>

    <p style="font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.7;margin:0;background:rgba(184,142,79,0.08);padding:10px 14px;border-radius:var(--radius-lg);border-right:3px solid var(--color-gold)">
      «وَاصْبِرْ نَفْسَكَ مَعَ الَّذِينَ يَدْعُونَ رَبَّهُم بِالْغَدَاةِ وَالْعَشِيِّ يُرِيدُونَ وَجْهَهُ» — رفيقك يشحذ همتك في الطاعة.
    </p>
  </section>

  <!-- 🕊️ INCOMING NUDGES & INVOCATIONS (صندوق همسات الود والدعاء من الرفقاء) -->
  ${incomingNudges.length > 0 ? `
  <section class="animate-fadeInUp" style="background:linear-gradient(135deg, rgba(74,107,83,0.12) 0%, rgba(184,142,79,0.12) 100%);border:1.5px solid rgba(74,107,83,0.35);border-radius:var(--radius-2xl);padding:var(--space-4);margin-bottom:var(--space-4);box-shadow:0 6px 18px rgba(74,107,83,0.06)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:1.25rem">🕊️</span>
        <h3 style="font-size:0.95rem;font-weight:800;color:var(--text-primary);margin:0">همسات الود والدعاء الواردة من رفقائك</h3>
      </div>
      <button onclick="App.clearAllNudges()" style="background:none;border:none;cursor:pointer;font-size:0.75rem;color:var(--text-muted);text-decoration:underline;padding:0">تحديد الكل كمقروء</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${incomingNudges.slice(0, 3).map(nudge => `
        <div style="background:var(--color-bg-card);border:1px solid rgba(184,142,79,0.25);border-radius:var(--radius-xl);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:2.2rem;height:2.2rem;border-radius:50%;background:var(--color-sage);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0">
              ${nudge.fromUserAvatar || 'غ'}
            </div>
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary)">
                <span>${nudge.fromUserName}</span>
                <span style="font-size:0.72rem;color:var(--color-gold-dark);font-family:monospace;margin-right:4px">(${nudge.fromUserTag})</span>
              </div>
              <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;line-height:1.5">
                «${nudge.message}»
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <button onclick="App.replyThanksNudge('${nudge.fromUserTag}', '${nudge.fromUserName}')" class="btn btn--sm" style="background:rgba(184,142,79,0.15);color:var(--color-gold-dark);padding:5px 12px;font-size:0.75rem;border-radius:var(--radius-full);border:1px solid rgba(184,142,79,0.3);cursor:pointer;font-weight:600">
              <span>جزاك الله خيراً 🤲</span>
            </button>
            <button onclick="App.openWird()" class="btn btn--sm btn--primary" style="padding:5px 12px;font-size:0.75rem;border-radius:var(--radius-full);cursor:pointer;font-weight:600">
              <span>قراءة الورد 📖</span>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  <!-- My Profile & ID Card (Hero Card) -->
  <section style="background:linear-gradient(135deg, rgba(44,34,25,0.06) 0%, rgba(184,142,79,0.12) 100%);border:1.5px solid rgba(184,142,79,0.35);border-radius:var(--radius-2xl);padding:var(--space-4);margin-bottom:var(--space-4);box-shadow:0 8px 24px rgba(44,34,25,0.05)">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px">
      
      <!-- User Info -->
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div style="width:3.4rem;height:3.4rem;border-radius:50%;background:var(--color-primary);color:var(--color-gold);border:2.5px solid var(--color-gold);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800;flex-shrink:0">
          ${s.user?.avatar || 'أ'}
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:1.15rem;font-weight:800;color:var(--text-primary)">${s.user?.name || 'أنت'}</span>
            <span class="chip" style="background:rgba(184,142,79,0.25);color:var(--color-gold-dark);font-size:0.75rem;padding:2px 8px;font-weight:700">حسابك</span>
            ${myLeaderboardEntry.todayDone 
              ? `<span class="chip" style="background:#E8F0E9;color:#2D5A3D;font-weight:700;font-size:0.72rem;padding:2px 8px;display:inline-flex;align-items:center;gap:3px">
                   <span class="material-symbols-outlined icon-fill" style="font-size:0.85rem">check_circle</span>
                   <span>أنجزت اليوم</span>
                 </span>`
              : `<span class="chip" style="background:#FDF3E7;color:#B88E4F;font-size:0.72rem;padding:2px 8px">في انتظار وردك</span>`
            }
          </div>

          <!-- Current Quran Progress & Stats -->
          <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:4px;font-weight:600;color:var(--color-primary)">
              <span class="material-symbols-outlined" style="font-size:0.95rem;color:var(--color-gold)">menu_book</span>
              <span>أين وصلت: صفحة ${n(myPage)} (${myQuranInfo.surahName})</span>
            </span>
            <span>·</span>
            <span>⭐ ${n(s.user?.xp || s.garden?.totalXP || 0)} نقطة</span>
            <span>·</span>
            <span>🔥 سلسلة ${n(s.garden?.streakDays || 0)} أيام</span>
          </div>
        </div>
      </div>

      <!-- Shareable User Tag Box -->
      <div style="background:rgba(255,255,255,0.85);border:1px solid rgba(184,142,79,0.4);border-radius:var(--radius-xl);padding:8px 14px;display:flex;align-items:center;gap:10px">
        <div style="text-align:right">
          <div style="font-size:0.6875rem;color:var(--text-muted);font-weight:600">معرّفك الشخصي (ID)</div>
          <div style="font-size:1.05rem;font-weight:800;letter-spacing:1px;color:var(--color-primary);direction:ltr;font-family:monospace">
            ${myTag}
          </div>
        </div>
        <button onclick="App.copyMyUserTag('${myTag}')" class="btn btn--sm" style="background:var(--color-primary);color:var(--color-gold);padding:6px 12px;border-radius:var(--radius-lg);cursor:pointer;font-size:0.75rem;font-weight:700;display:flex;align-items:center;gap:4px" title="نسخ المعرف لمشاركته">
          <span class="material-symbols-outlined" style="font-size:1rem">content_copy</span>
          <span>نسخ الـ ID</span>
        </button>
      </div>

    </div>
  </section>

  <!-- Navigation Tabs (رفقاء الدرب / مجموعات التنافس) -->
  <section style="margin-bottom:var(--space-4)">
    <div style="display:flex;gap:8px;background:rgba(44,34,25,0.05);padding:4px;border-radius:var(--radius-xl)">
      <button onclick="App.switchSuhbaTab('companions')" style="
        flex:1;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        padding:10px 16px;
        border:none;
        border-radius:var(--radius-lg);
        font-family:inherit;
        font-size:0.9375rem;
        font-weight:700;
        cursor:pointer;
        transition:all 0.2s ease;
        background:${_activeSuhbaTab === 'companions' ? 'var(--color-bg-card, #FFFFFF)' : 'transparent'};
        color:${_activeSuhbaTab === 'companions' ? 'var(--color-primary)' : 'var(--text-secondary)'};
        box-shadow:${_activeSuhbaTab === 'companions' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'};
      ">
        <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--color-gold)">diversity_3</span>
        <span>رفقاء دربي</span>
        <span class="chip" style="background:${_activeSuhbaTab === 'companions' ? 'rgba(184,142,79,0.2)' : 'rgba(0,0,0,0.06)'};color:var(--color-gold-dark);font-size:0.75rem;padding:2px 8px">
          ${n(companions.length)}
        </span>
      </button>

      <button onclick="App.switchSuhbaTab('groups')" style="
        flex:1;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:8px;
        padding:10px 16px;
        border:none;
        border-radius:var(--radius-lg);
        font-family:inherit;
        font-size:0.9375rem;
        font-weight:700;
        cursor:pointer;
        transition:all 0.2s ease;
        background:${_activeSuhbaTab === 'groups' ? 'var(--color-bg-card, #FFFFFF)' : 'transparent'};
        color:${_activeSuhbaTab === 'groups' ? 'var(--color-primary)' : 'var(--text-secondary)'};
        box-shadow:${_activeSuhbaTab === 'groups' ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'};
      ">
        <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--color-gold)">groups</span>
        <span>حِلَق ومجموعات التنافس</span>
        <span class="chip" style="background:${_activeSuhbaTab === 'groups' ? 'rgba(184,142,79,0.2)' : 'rgba(0,0,0,0.06)'};color:var(--color-gold-dark);font-size:0.75rem;padding:2px 8px">
          ${n(groups.length)}
        </span>
      </button>
    </div>
  </section>

  <!-- TAB 1: Companions (رفقاء الدرب) -->
  ${_activeSuhbaTab === 'companions' ? `
    
    <!-- Companions List Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <h2 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="color:var(--color-gold)">person_search</span>
        <span>الرفقاء المضافون (${n(companions.length)})</span>
      </h2>
      <button onclick="App.openAddCompanionByIdModal()" class="btn btn--secondary btn--sm" style="gap:4px;padding:6px 12px;font-size:0.8125rem;border-radius:var(--radius-lg)">
        <span class="material-symbols-outlined" style="font-size:1rem">add</span>
        <span>إضافة رفيق</span>
      </button>
    </div>

    ${companions.length === 0 ? `
      <!-- Empty State -->
      <div style="background:var(--color-bg-card);border:1.5px dashed var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-6) var(--space-4);text-align:center;margin-bottom:var(--space-4)">
        <div style="width:4rem;height:4rem;margin:0 auto var(--space-3);border-radius:50%;background:rgba(184,142,79,0.15);color:var(--color-gold);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:2.2rem">badge</span>
        </div>
        <h3 style="font-size:var(--font-size-lg);font-weight:800;color:var(--text-primary);margin:0 0 var(--space-2)">
          تابع تقدم رفقاء دربك وتنافسوا بالـ ID 🌿
        </h3>
        <p style="font-size:0.875rem;color:var(--text-secondary);max-width:380px;margin:0 auto var(--space-4);line-height:1.8">
          اطلب من أصدقائك أو إخوانك معرّفهم الخاص (مثل <code style="background:rgba(184,142,79,0.15);padding:2px 6px;border-radius:6px;font-weight:700">GHR-1042</code>)، وأضفهم لتشاهد أين وصلوا في المصحف ونقاطهم الحية وتتشجعوا معاً!
        </p>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
          <button onclick="App.openAddCompanionByIdModal()" class="btn btn--primary" style="padding:10px 22px;font-size:0.875rem;border-radius:var(--radius-xl)">
            <span class="material-symbols-outlined">person_add</span>
            <span>إضافة رفيق بالـ ID</span>
          </button>
          <button onclick="App.addDemoCompanionQuick('GHR-1042')" class="btn btn--secondary" style="padding:10px 18px;font-size:0.875rem;border-radius:var(--radius-xl)">
            <span>تجربة إضافة رفيق تجريبي (عمر)</span>
          </button>
        </div>
      </div>
    ` : `
      <!-- Companion Cards Grid -->
      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-5)">
        ${companions.map(c => {
          const cQuran = getSurahAndJuzForPage(c.currentPage || 1);
          const percent = Math.min(100, Math.round(((c.currentPage || 1) / 604) * 100));
          return `
          <div class="card" style="padding:var(--space-4);border-radius:var(--radius-2xl);background:var(--color-bg-card);border:1px solid var(--color-border);box-shadow:0 4px 16px rgba(0,0,0,0.03);position:relative;overflow:hidden">
            
            <!-- Top Row: Identity & Status -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-3)">
              
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:3.2rem;height:3.2rem;border-radius:50%;background:${c.color || '#4A6B53'};color:white;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:800;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.1)">
                  ${c.avatar || c.name.charAt(0)}
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="font-size:1.05rem;font-weight:800;color:var(--text-primary)">${c.name}</span>
                    <span class="chip" style="background:rgba(74,107,83,0.12);color:var(--color-sage);font-size:0.72rem;padding:2px 8px;font-weight:700">
                      ${c.relation || 'رفيق درب'}
                    </span>
                    ${c.userTag ? `
                      <span style="font-family:monospace;font-size:0.75rem;background:rgba(44,34,25,0.06);padding:2px 6px;border-radius:6px;color:var(--text-secondary);font-weight:700;direction:ltr">
                        ${c.userTag}
                      </span>
                    ` : ''}
                  </div>
                  
                  <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px;display:flex;align-items:center;gap:8px">
                    <span style="display:flex;align-items:center;gap:2px;color:var(--color-gold);font-weight:700">
                      <span class="material-symbols-outlined icon-fill" style="font-size:0.95rem">local_fire_department</span>
                      ${n(c.streak || 0)} أيام
                    </span>
                    <span>·</span>
                    <span style="font-weight:700;color:var(--text-primary)">⭐ ${n(c.xp || 0)} XP</span>
                  </div>
                </div>
              </div>

              <!-- Today status chip -->
              <div>
                ${c.todayDone 
                  ? `<span class="chip" style="background:#E8F0E9;color:#2D5A3D;font-weight:700;font-size:0.75rem;padding:4px 10px;display:inline-flex;align-items:center;gap:4px">
                       <span class="material-symbols-outlined icon-fill" style="font-size:0.95rem">check_circle</span>
                       <span>أنجز ورده اليوم</span>
                     </span>`
                  : `<span class="chip" style="background:#FDF3E7;color:#B88E4F;font-weight:700;font-size:0.75rem;padding:4px 10px;display:inline-flex;align-items:center;gap:4px">
                       <span class="material-symbols-outlined" style="font-size:0.95rem">schedule</span>
                       <span>في انتظار ورده</span>
                     </span>`
                }
              </div>

            </div>

            <!-- Middle Row: Quran Live Progress -->
            <div style="background:var(--color-bg-secondary);border-radius:var(--radius-xl);padding:10px 14px;margin-bottom:var(--space-3)">
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.8125rem;margin-bottom:6px">
                <span style="font-weight:700;color:var(--text-primary);display:inline-flex;align-items:center;gap:5px">
                  <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">menu_book</span>
                  <span>أين وصل: صفحة ${n(c.currentPage || 1)}</span>
                  <span style="color:var(--text-muted);font-weight:normal">(${cQuran.surahName} — ${cQuran.juzName})</span>
                </span>
                <span style="font-weight:700;color:var(--color-gold-dark);font-size:0.78rem">
                  ${n(percent)}% من المصحف
                </span>
              </div>

              <!-- Progress bar -->
              <div style="height:6px;background:rgba(44,34,25,0.08);border-radius:99px;overflow:hidden">
                <div style="height:100%;width:${percent}%;background:linear-gradient(90deg, var(--color-gold), #4A6B53);border-radius:99px;transition:width 0.5s ease"></div>
              </div>
            </div>

            <!-- Bottom Actions Row -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:2px">
              <div style="display:flex;align-items:center;gap:8px">
                <button onclick="App.openSendNudgeModal('${c.userTag || ''}', '${c.name}')" class="btn btn--sm" style="background:rgba(184,142,79,0.15);color:var(--color-gold-dark);border:1px solid rgba(184,142,79,0.3);padding:6px 12px;font-size:0.8rem;border-radius:var(--radius-full);cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:4px">
                  <span>🕊️</span>
                  <span>همسة ود ودعاء</span>
                </button>
                <button onclick="App.openCompanionDetailModal('${c.id}')" class="btn btn--sm" style="background:var(--color-bg-secondary);color:var(--text-primary);padding:6px 12px;font-size:0.8rem;border-radius:var(--radius-full);cursor:pointer;font-weight:600">
                  <span class="material-symbols-outlined" style="font-size:0.95rem">visibility</span>
                  <span>بطاقة الإنجاز</span>
                </button>
              </div>

              <button onclick="App.confirmDeleteCompanion('${c.id}', '${c.name}')" style="background:none;border:none;cursor:pointer;color:var(--color-error);opacity:0.65;padding:6px;display:flex;align-items:center" title="حذف الرفيق">
                <span class="material-symbols-outlined" style="font-size:1.15rem">delete</span>
              </button>
            </div>

          </div>`;
        }).join('')}
      </div>
    `}

    <!-- Personalized Leaderboard -->
    <section style="margin-bottom:var(--space-5)">
      <div class="section-header" style="margin-bottom:var(--space-3)">
        <h2 class="section-title">
          <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">emoji_events</span>
          <span>لوحة الصدارة والتحفيز (أنت ورفاقك)</span>
        </h2>
        <span style="font-size:var(--font-size-xs);color:var(--text-muted)">تنافس في الطاعات</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-2)">
        ${allMembers.map((member, idx) => {
          const rank = idx + 1;
          return `
          <div class="suhba-leaderboard-row ${member.isMe ? 'me' : ''}" style="${member.isMe ? 'border:2px solid var(--color-gold);background:rgba(184,142,79,0.12)' : 'background:var(--color-bg-card);border:1px solid var(--color-border)'};padding:12px 14px;border-radius:var(--radius-xl);display:flex;align-items:center;gap:12px">
            <div style="font-size:1.3rem;font-weight:800;color:${rank <= 3 ? 'var(--color-gold)' : 'var(--text-muted)'};min-width:2rem;text-align:center">
              ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : n(rank)}
            </div>
            
            <div style="width:2.75rem;height:2.75rem;border-radius:50%;background:${member.color || '#4A6B53'};display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.1rem;flex-shrink:0">
              ${member.avatar}
            </div>

            <div style="flex:1">
              <div style="font-size:0.9375rem;font-weight:${member.isMe ? '800' : '700'};color:var(--text-primary);display:flex;align-items:center;gap:6px">
                <span>${member.name}</span>
                ${member.isMe ? '<span class="chip" style="background:var(--color-primary);color:var(--color-gold);font-size:0.6875rem;padding:2px 8px;font-weight:700">أنت</span>' : ''}
              </div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;display:flex;align-items:center;gap:6px">
                <span>📖 صفحة ${n(member.currentPage || 1)}</span>
                <span>·</span>
                <span>🔥 ${n(member.streak || 0)} أيام متتالية</span>
              </div>
            </div>

            <div style="text-align:left">
              <div style="font-size:1.1rem;font-weight:800;color:var(--color-gold)">${n(member.xp || 0)}</div>
              <div style="font-size:0.6875rem;color:var(--text-muted)">XP</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>

  ` : `
    <!-- TAB 2: Competition Groups (حِلَق التنافس) -->
    
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <h2 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0;display:flex;align-items:center;gap:6px">
        <span class="material-symbols-outlined" style="color:var(--color-gold)">groups</span>
        <span>حلقات التنافس المشتركة (${n(groups.length)})</span>
      </h2>
      <div style="display:flex;gap:6px">
        <button onclick="App.openJoinGroupModal()" class="btn btn--secondary btn--sm" style="font-size:0.8125rem;border-radius:var(--radius-lg);padding:6px 12px">
          <span class="material-symbols-outlined" style="font-size:1rem">login</span>
          <span>انضمام برمز</span>
        </button>
        <button onclick="App.openCreateGroupModal()" class="btn btn--primary btn--sm" style="font-size:0.8125rem;border-radius:var(--radius-lg);padding:6px 14px">
          <span class="material-symbols-outlined" style="font-size:1rem">add</span>
          <span>إنشاء حلقة</span>
        </button>
      </div>
    </div>

    ${groups.length === 0 ? `
      <!-- Groups Empty State -->
      <div style="background:var(--color-bg-card);border:1.5px dashed var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-6) var(--space-4);text-align:center;margin-bottom:var(--space-4)">
        <div style="width:4rem;height:4rem;margin:0 auto var(--space-3);border-radius:50%;background:rgba(184,142,79,0.15);color:var(--color-gold);display:flex;align-items:center;justify-content:center">
          <span class="material-symbols-outlined" style="font-size:2.2rem">military_tech</span>
        </div>
        <h3 style="font-size:var(--font-size-lg);font-weight:800;color:var(--text-primary);margin:0 0 var(--space-2)">
          أنشئ حلقة تنافس مع إخوانك أو أصدقائك 🏆
        </h3>
        <p style="font-size:0.875rem;color:var(--text-secondary);max-width:380px;margin:0 auto var(--space-4);line-height:1.8">
          سواء كان تحدي بين الإخوة أو أصدقاء المسجد أو حلقة دراسية، أنشئ مجموعتك الخاصة، وشارك رمز الانضمام ليتنافس الجميع في لوحة صدارة واحدة!
        </p>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
          <button onclick="App.openCreateGroupModal()" class="btn btn--primary" style="padding:10px 22px;font-size:0.875rem;border-radius:var(--radius-xl)">
            <span class="material-symbols-outlined">add_circle</span>
            <span>إنشاء أول حلقة تنافس</span>
          </button>
          <button onclick="App.openJoinGroupModal()" class="btn btn--secondary" style="padding:10px 18px;font-size:0.875rem;border-radius:var(--radius-xl)">
            <span class="material-symbols-outlined">tag</span>
            <span>الانضمام برمز موجود</span>
          </button>
          <button onclick="App.quickJoinDemoGroup()" class="btn btn--secondary" style="padding:10px 18px;font-size:0.875rem;border-radius:var(--radius-xl);background:#FDF3E7;color:#B88E4F;border:1px solid rgba(184,142,79,0.3)">
            <span>تجربة حلقة الأصحاب والإخوة (GRP-7700)</span>
          </button>
        </div>
      </div>
    ` : `
      <!-- Active Groups List -->
      <div style="display:flex;flex-direction:column;gap:var(--space-4);margin-bottom:var(--space-5)">
        ${groups.map(g => {
          const members = Array.isArray(g.members) ? g.members : [];
          return `
          <div class="card" style="padding:var(--space-4);border-radius:var(--radius-2xl);background:var(--color-bg-card);border:1.5px solid rgba(184,142,79,0.3);box-shadow:0 6px 20px rgba(0,0,0,0.04)">
            
            <!-- Group Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:var(--space-3)">
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">
                    ${g.name}
                  </h3>
                  <span class="chip" style="background:rgba(184,142,79,0.2);color:var(--color-gold-dark);font-size:0.75rem;padding:2px 8px;font-weight:700">
                    ${g.category || 'تنافس'}
                  </span>
                </div>
                ${g.description ? `
                  <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:3px;line-height:1.6">
                    ${g.description}
                  </div>
                ` : ''}
              </div>

              <!-- Group Code Badge with Copy -->
              <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);padding:6px 12px;border-radius:var(--radius-xl);display:flex;align-items:center;gap:8px">
                <div style="text-align:right">
                  <span style="font-size:0.6875rem;color:var(--text-muted);display:block">رمز الدعوة:</span>
                  <span style="font-family:monospace;font-weight:800;color:var(--color-primary);font-size:0.95rem;letter-spacing:1px;direction:ltr">
                    ${g.code}
                  </span>
                </div>
                <button onclick="App.copyGroupCode('${g.code}')" class="btn btn--sm" style="background:var(--color-primary);color:var(--color-gold);padding:4px 8px;font-size:0.7rem;border-radius:var(--radius-md);cursor:pointer">
                  نسخ
                </button>
              </div>
            </div>

            <!-- Aggregate Stats Banner -->
            <div style="background:linear-gradient(135deg, rgba(74,107,83,0.08) 0%, rgba(184,142,79,0.08) 100%);border-radius:var(--radius-xl);padding:10px 14px;margin-bottom:var(--space-3);display:flex;align-items:center;justify-content:space-around;text-align:center">
              <div>
                <div style="font-size:1.15rem;font-weight:800;color:var(--color-sage)">${n(g.membersCount || members.length)}</div>
                <div style="font-size:0.6875rem;color:var(--text-muted)">أعضاء متنافسون</div>
              </div>
              <div style="width:1px;height:24px;background:var(--color-border)"></div>
              <div>
                <div style="font-size:1.15rem;font-weight:800;color:var(--color-gold)">${n(g.totalPagesRead || 0)}</div>
                <div style="font-size:0.6875rem;color:var(--text-muted)">صفحة مقروءة معاً 📖</div>
              </div>
              <div style="width:1px;height:24px;background:var(--color-border)"></div>
              <div>
                <div style="font-size:1.15rem;font-weight:800;color:var(--color-primary)">${members.length > 0 ? members[0].name : '—'}</div>
                <div style="font-size:0.6875rem;color:var(--text-muted)">متصدر الحلقة 🥇</div>
              </div>
            </div>

            <!-- Group Members Leaderboard -->
            <div style="margin-bottom:var(--space-3)">
              <div style="font-size:0.8125rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px">
                ترتيب أعضاء الحلقة:
              </div>
              <div style="display:flex;flex-direction:column;gap:6px">
                ${members.map((m, mIdx) => {
                  const mRank = mIdx + 1;
                  return `
                  <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${m.isMe ? 'rgba(184,142,79,0.12)' : 'var(--color-bg-secondary)'};border-radius:var(--radius-lg);border:${m.isMe ? '1.5px solid var(--color-gold)' : '1px solid transparent'}">
                    <div style="font-size:1.1rem;font-weight:800;min-width:1.8rem;text-align:center;color:${mRank <= 3 ? 'var(--color-gold)' : 'var(--text-muted)'}">
                      ${mRank === 1 ? '🥇' : mRank === 2 ? '🥈' : mRank === 3 ? '🥉' : n(mRank)}
                    </div>
                    <div style="width:2.2rem;height:2.2rem;border-radius:50%;background:${m.color || '#4A6B53'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.95rem;flex-shrink:0">
                      ${m.avatar || m.name.charAt(0)}
                    </div>
                    <div style="flex:1">
                      <div style="font-size:0.875rem;font-weight:${m.isMe ? '800' : '700'};color:var(--text-primary);display:flex;align-items:center;gap:6px">
                        <span>${m.name}</span>
                        ${m.isMe ? '<span class="chip" style="background:var(--color-primary);color:var(--color-gold);font-size:0.625rem;padding:1px 6px">أنت</span>' : ''}
                      </div>
                      <div style="font-size:0.72rem;color:var(--text-secondary)">
                        📖 صفحة ${n(m.currentPage || 1)} (${m.currentSurahName || 'الفاتحة'})
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px">
                      ${!m.isMe ? `
                        <button onclick="App.openSendNudgeModal('${m.userTag || ''}', '${m.name}')" title="أرسل همسة ود ودعاء لـ ${m.name}" style="background:none;border:none;cursor:pointer;font-size:1.15rem;padding:2px" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                          🕊️
                        </button>
                      ` : ''}
                      <div style="text-align:left">
                        <div style="font-size:0.9375rem;font-weight:800;color:var(--color-gold)">${n(m.xp || 0)}</div>
                        <div style="font-size:0.625rem;color:var(--text-muted)">XP</div>
                      </div>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <!-- Group Footer Actions -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:4px;border-top:1px solid var(--color-border)">
              <button onclick="App.copyGroupCode('${g.code}')" class="btn btn--sm" style="background:none;border:none;color:var(--color-gold-dark);font-size:0.8rem;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
                <span class="material-symbols-outlined" style="font-size:1rem">share</span>
                <span>مشاركة رمز المجموعة مع أصدقائك</span>
              </button>
              <button onclick="App.confirmLeaveGroup('${g.id}', '${g.name}')" style="background:none;border:none;color:var(--color-error);font-size:0.75rem;cursor:pointer;opacity:0.7">
                مغادرة الحلقة
              </button>
            </div>

          </div>`;
        }).join('')}
      </div>
    `}

  `}

  <!-- Invite & Share Footer Banner -->
  <section style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-5);text-align:center;margin-top:var(--space-4)">
    <div style="font-size:2.5rem;margin-bottom:var(--space-2)">🤝</div>
    <h3 style="font-size:var(--font-size-lg);font-weight:800;margin-bottom:var(--space-2);color:var(--text-primary)">
      «الدال على الخير كفاعله»
    </h3>
    <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4);line-height:1.7;max-width:380px;margin-left:auto;margin-right:auto">
      شارك معرفك الشخصي <strong>${myTag}</strong> مع عائلتك وأصدقائك ليعمرو أوقاتهم بالقرآن وتكسبوا الأجر معاً.
    </p>
    <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">
      <button class="btn btn--primary" onclick="App.copyMyUserTag('${myTag}')" style="padding:10px 22px;border-radius:var(--radius-xl)">
        <span class="material-symbols-outlined icon-fill">share</span>
        <span>نسخ ومشاركة معرّفي (ID)</span>
      </button>
    </div>
  </section>

</div>`;
}
