/**
 * GHIRAS — Complete Holy Quran (القرآن الكريم كاملاً)
 * 114 Surahs — 604 Pages — 6236 Ayat
 * Authentic Madinah Mushaf Page-by-Page and Surah-by-Surah Navigation
 */

import { State } from '../state.js';
import {
  getPage,
  getSurah,
  getAllSurahs,
  JUZ_NAMES,
  ATHKAR,
  isQuranLoaded,
  getReciter
} from '../data/quran.js';

let _activeTab = 'quran';       // 'quran' | 'athkar'
let _readingMode = 'page';      // 'page' (1..604) | 'surah' (1..114)

export function renderWird() {
  const s = State.get();
  const n = State.toArabicNum;
  const qp = s.quranProgress;
  const activeReciter = getReciter(s.settings.reciterId);

  const currentPageNum = Math.max(1, Math.min(604, qp.currentPage || 1));
  const currentSurahNum = Math.max(1, Math.min(114, qp.currentSurahId || 1));

  // Get Page Data or Surah Data based on active mode
  const pageData = getPage(currentPageNum);
  const surahData = getSurah(currentSurahNum);

  const athkarMorning = ATHKAR.morning;
  const progress = qp.todayAyahsRead || 0;

  return `
<div class="screen-content" id="wird-content">

  <!-- Floating Button to Exit Focus Mode -->
  <button class="mushaf-exit-focus-btn" onclick="App.toggleMushafFocus(false)">
    <span class="material-symbols-outlined">fullscreen_exit</span>
    <span>إنهاء وضع الخشوع</span>
  </button>

  <!-- Header: Mode Toggle & Today's Progress -->
  <section>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <div>
        <h1 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:var(--space-2)">
          <span>المصحف الشريف</span>
          <span style="font-size:1.1rem">📖</span>
        </h1>
        <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">
          القرآن الكريم كاملاً (٦٠٤ صفحات • ١١٤ سورة • ٦٢٣٦ آية)
        </p>
      </div>

      <div class="chip chip--sage" style="cursor:pointer" onclick="App.markPageRead()" title="اضغط لتسجيل صفحة في وردك اليومي">
        <span class="material-symbols-outlined icon-fill" style="font-size:1rem">check_circle</span>
        <span>${n(progress)} آية اليوم</span>
      </div>
    </div>

    <!-- Mode Tabs: Quran vs Athkar -->
    <div style="display:flex;gap:var(--space-2);padding:var(--space-1);background:var(--color-bg-secondary);border-radius:var(--radius-xl);border:1px solid var(--color-border);margin-bottom:var(--space-3)">
      <button id="wird-tab-quran" onclick="App.switchWirdTab('quran')"
        style="flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:none;font-family:var(--font-family);font-size:var(--font-size-base);font-weight:600;cursor:pointer;transition:all 0.2s;
        background:${_activeTab === 'quran' ? 'var(--color-primary)' : 'transparent'};
        color:${_activeTab === 'quran' ? 'var(--text-inverted)' : 'var(--text-secondary)'}">
        📖 القرآن الكريم
      </button>
      <button id="wird-tab-athkar" onclick="App.switchWirdTab('athkar')"
        style="flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:none;font-family:var(--font-family);font-size:var(--font-size-base);font-weight:600;cursor:pointer;transition:all 0.2s;
        background:${_activeTab === 'athkar' ? 'var(--color-primary)' : 'transparent'};
        color:${_activeTab === 'athkar' ? 'var(--text-inverted)' : 'var(--text-secondary)'}">
        🤲 الأذكار والمأثورات
      </button>
    </div>
  </section>

  <!-- ═════════════════════════════════════════════════
       QURAN TAB: COMPLETE MADINAH MUSHAF
       ═════════════════════════════════════════════════ -->
  <div id="wird-quran-tab" style="${_activeTab === 'quran' ? '' : 'display:none'}">

    <div class="mushaf-wrapper">

      <!-- ── Mushaf Controls Toolbar ── -->
      <div class="mushaf-toolbar">

        <!-- Right: Surah Index & Page Jumper -->
        <div class="mushaf-toolbar__group">
          <button class="mushaf-tool-btn" onclick="App.openSurahIndex()" title="فهرس سور القرآن (114 سورة)">
            <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">menu_book</span>
            <span>فهرس السور</span>
            <span class="material-symbols-outlined" style="font-size:0.9rem">arrow_drop_down</span>
          </button>

          <button class="mushaf-tool-btn" onclick="App.openPageJumpModal()" title="انتقال مباشر إلى أي صفحة (1..604)">
            <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-sage)">find_in_page</span>
            <span>ص ${n(currentPageNum)}</span>
          </button>
        </div>

        <!-- Middle: Page Flip Controls (Next / Prev) -->
        <div class="mushaf-toolbar__group">
          <!-- Next Page (in Arabic reading order: flips to next numerical page) -->
          <button class="mushaf-tool-btn" ${currentPageNum < 604 ? `onclick="App.goToPage(${currentPageNum + 1})"` : 'disabled style="opacity:0.3;cursor:default"'} title="الصفحة التالية (${currentPageNum + 1})">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>

          <span style="font-family:var(--font-quran);font-weight:700;font-size:1rem;color:var(--mushaf-gold-dark);padding:0 var(--space-1);min-width:3rem;text-align:center" title="رقم الصفحة الحالية">
            ${n(currentPageNum)} / ٦٠٤
          </span>

          <!-- Prev Page -->
          <button class="mushaf-tool-btn" ${currentPageNum > 1 ? `onclick="App.goToPage(${currentPageNum - 1})"` : 'disabled style="opacity:0.3;cursor:default"'} title="الصفحة السابقة (${currentPageNum - 1})">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>

        <!-- Left: Font Zoom & Fullscreen Focus Mode -->
        <div class="mushaf-toolbar__group">
          <button class="mushaf-tool-btn" onclick="App.adjustMushafFontSize(-2)" title="تصغير الخط">
            <span style="font-size:0.8rem;font-weight:700">A-</span>
          </button>
          <button class="mushaf-tool-btn" onclick="App.adjustMushafFontSize(2)" title="تكبير الخط">
            <span style="font-size:0.95rem;font-weight:700">A+</span>
          </button>
          <button class="mushaf-tool-btn" onclick="App.toggleMushafFocus(true)" title="وضع الخشوع (ملء الشاشة)">
            <span class="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </div>

      <!-- ── The Authentic Classical Mushaf Page (1..604) ── -->
      <div class="mushaf-page" id="mushaf-page">

        <!-- Double Gilded Frame with Ornate Islamic Corners -->
        <div class="mushaf-frame">

          <!-- Corner Rosettes -->
          <span class="mushaf-corner mushaf-corner--tl">✤</span>
          <span class="mushaf-corner mushaf-corner--tr">✤</span>
          <span class="mushaf-corner mushaf-corner--bl">✤</span>
          <span class="mushaf-corner mushaf-corner--br">✤</span>

          <!-- Upper Header: Juz, Surah Name, Hizb -->
          <div class="mushaf-page-header">
            <div class="mushaf-page-header__juz">
              <span>${pageData.juzName || JUZ_NAMES[pageData.juz || 1] || 'الجزء الأول'}</span>
            </div>
            <div class="mushaf-page-header__center">
              <span>۞ ${pageData.blocks.length > 0 ? pageData.blocks.map(b => `سورة ${b.surahName}`).join(' • ') : 'القرآن الكريم'} ۞</span>
            </div>
            <div class="mushaf-page-header__hizb">
              <span>الحزب ${n(Math.ceil((pageData.hizbQuarter || 1) / 4))}</span>
            </div>
          </div>

          <!-- Page Content: Render all Surah blocks appearing on this page -->
          ${pageData.blocks.map(block => `
            <!-- If a new Surah starts on this page, render the iconic gilded headpiece -->
            ${block.isNewSurahStart ? `
              <div class="mushaf-surah-cartouche">
                <div class="mushaf-surah-badge">${block.type}</div>
                <div class="mushaf-surah-title">
                  <span class="mushaf-surah-title__ornament">❁</span>
                  <span>سُورَةُ ${block.surahName}</span>
                  <span class="mushaf-surah-title__ornament">❁</span>
                </div>
                <div class="mushaf-surah-badge">آيَاتُهَا ${n(block.ayahCount)}</div>
              </div>

              <!-- Basmala if applicable -->
              ${block.showBasmala ? `
              <div class="mushaf-basmala">
                <span class="mushaf-basmala__flourish">❦</span>
                <span>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
                <span class="mushaf-basmala__flourish">❦</span>
              </div>` : ''}
            ` : ''}

            <!-- Continuous Flowing Justified Quran Text -->
            <div class="mushaf-body" id="mushaf-text-flow-${block.surahNumber}">
              ${block.ayahs.map(ayah => {
                const isSelected = qp.lastReadSurahId === block.surahNumber && qp.lastReadAyah === ayah.number;
                const isRead = qp.lastReadPage >= currentPageNum || (qp.lastReadSurahId === block.surahNumber && qp.lastReadAyah >= ayah.number);
                return `
                  <span class="mushaf-ayah ${isSelected ? 'selected' : ''} ${isRead ? 'read-done' : ''}"
                        id="mushaf-ayah-${block.surahNumber}-${ayah.number}"
                        onclick="App.openAyahAction(${block.surahNumber}, ${ayah.number}, event)"
                        title="سورة ${block.surahName} • آية ${ayah.number} — اضغط للتفسير والاستماع">
                    ${ayah.text}
                  </span>
                  <span class="mushaf-ayah-end"
                        onclick="App.openAyahAction(${block.surahNumber}, ${ayah.number}, event)"
                        title="آية ${ayah.number}">
                    <span class="mushaf-ayah-num">${n(ayah.number)}</span>
                  </span>
                `;
              }).join('')}
            </div>
          `).join('')}

          <!-- Bottom Footer: Mushaf Page Number -->
          <div class="mushaf-page-footer">
            <div class="mushaf-page-num-badge" onclick="App.openPageJumpModal()" style="cursor:pointer" title="اضغط للانتقال إلى أي صفحة">
              <span>— ﴿ ${n(currentPageNum)} ﴾ —</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Quick Page Navigation Bottom Bar -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)">
        <button class="btn btn--secondary btn--sm" ${currentPageNum < 604 ? `onclick="App.goToPage(${currentPageNum + 1})"` : 'disabled'} style="flex:1">
          <span class="material-symbols-outlined">arrow_forward</span>
          <span>الصفحة التالية (ص ${n(currentPageNum + 1)})</span>
        </button>

        <button class="btn btn--primary btn--sm" onclick="App.markPageRead()" style="flex:1">
          <span class="material-symbols-outlined icon-fill">check_circle</span>
          <span>قرأت هذه الصفحة</span>
        </button>

        <button class="btn btn--secondary btn--sm" ${currentPageNum > 1 ? `onclick="App.goToPage(${currentPageNum - 1})"` : 'disabled'} style="flex:1">
          <span>(ص ${n(currentPageNum - 1)}) السابقة</span>
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

    </div>

  </div>

  <!-- ═════════════════════════════════════════════════
       ATHKAR TAB
       ═════════════════════════════════════════════════ -->
  <div id="wird-athkar-tab" style="${_activeTab === 'athkar' ? '' : 'display:none'}">
    <div style="display:flex;flex-direction:column;gap:var(--space-4)">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <h2 style="font-size:var(--font-size-lg);font-weight:700;color:var(--text-primary)">أذكار الصباح والمأثورات</h2>
          <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">حصن المسلم اليومي بأذكار ميسرة</p>
        </div>
        <button class="btn btn--sage btn--sm" onclick="App.completeAthkar()" style="width:auto">
          <span class="material-symbols-outlined icon-fill">done_all</span>
          أتممتها جميعاً
        </button>
      </div>

      ${athkarMorning.map((thikr, idx) => `
        <div id="thikr-${idx}" class="card" style="cursor:pointer;transition:all 0.2s" onclick="App.countThikr(${idx})">
          <p style="font-family:var(--font-quran);font-size:1.25rem;color:var(--text-primary);line-height:2;text-align:right;margin-bottom:var(--space-3)">
            ${thikr.text}
          </p>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="chip chip--neutral" style="font-size:0.75rem">${thikr.category}</span>
            <div id="counter-${idx}" style="display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);background:var(--color-bg-secondary);border-radius:var(--radius-full);border:1px solid var(--color-border)">
              <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">touch_app</span>
              <span id="count-display-${idx}" style="font-size:var(--font-size-md);font-weight:700;color:var(--text-primary)">٠ / ${toArabicNum(thikr.count)}</span>
            </div>
          </div>
        </div>
      `).join('')}

      <button class="btn btn--sage" onclick="App.completeAthkar()" style="margin-top:var(--space-2)">
        <span class="material-symbols-outlined icon-fill">check_circle</span>
        سجّل إتمام أذكار الصباح في عاداتك
      </button>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════
       AYAH ACTION BOTTOM SHEET (تلاوة • تفسير • نسخ • حفظ)
       ═════════════════════════════════════════════════ -->
  <div id="ayah-action-sheet" class="ayah-sheet">
    <div class="modal-handle"></div>
    <div class="ayah-sheet__header">
      <div class="ayah-sheet__title" id="ayah-sheet-title">
        <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">auto_stories</span>
        <span>سورة الفاتحة — آية ١</span>
      </div>
      <button onclick="App.closeAyahAction()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Ayah Text Snippet -->
    <div id="ayah-sheet-text" style="font-family:var(--font-quran);font-size:1.3rem;line-height:2.2;color:var(--mushaf-text-ink);text-align:right;margin-bottom:var(--space-3);background:var(--mushaf-paper-bg);padding:var(--space-3);border-radius:var(--radius-xl);border:1px solid var(--mushaf-gold-border-soft)">
      بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
    </div>

    <!-- Tafseer Box -->
    <div class="ayah-sheet__tafseer-box" id="ayah-sheet-tafseer">
      التفسير الميسر يظهر هنا...
    </div>

    <!-- Recitation & Repeat Control -->
    <div style="background:var(--color-bg-secondary);padding:var(--space-3);border-radius:var(--radius-xl);border:1px solid var(--color-border);margin-bottom:var(--space-3);display:flex;flex-direction:column;gap:var(--space-2)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:4px">
          <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">record_voice_over</span>
          <span id="current-reciter-name">تلاوة الشيخ ${activeReciter.name}</span>
        </span>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn--ghost" style="padding:2px 8px;font-size:0.75rem;border:1px solid rgba(197,160,89,0.4);border-radius:var(--radius-pill);color:var(--color-gold);cursor:pointer;display:inline-flex;align-items:center;gap:3px" onclick="App.openReciterModal()" title="تغيير القارئ">
            <span class="material-symbols-outlined" style="font-size:0.95rem">swap_horiz</span>
            <span>تغيير</span>
          </button>
          <span id="ayah-repeat-indicator" style="font-size:0.75rem;color:var(--color-gold);font-weight:600">بدون تكرار</span>
        </div>
      </div>

      <!-- Repeat Mode Selector Chips -->
      <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:2px">
        <button class="chip audio-repeat-chip active" id="chip-repeat-1" onclick="App.setAudioRepeatMode(1)" style="font-size:0.75rem;cursor:pointer">
          مستمر (بدون تكرار)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-2" onclick="App.setAudioRepeatMode(2)" style="font-size:0.75rem;cursor:pointer">
          تكرار مرتين (٢x)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-3" onclick="App.setAudioRepeatMode(3)" style="font-size:0.75rem;cursor:pointer">
          تكرار ٣ مرات (٣x)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-inf" onclick="App.setAudioRepeatMode(Infinity)" style="font-size:0.75rem;cursor:pointer">
          تكرار دائم (∞)
        </button>
      </div>

      <button class="btn btn--primary" id="ayah-play-audio-btn" onclick="App.playCurrentAyahAudio()" style="width:100%;margin-top:2px">
        <span class="material-symbols-outlined">play_circle</span>
        <span>تشغيل التلاوة المستمرة من هذه الآية</span>
      </button>
    </div>

    <!-- Other Ayah Actions -->
    <div class="ayah-sheet__actions">
      <button class="btn btn--secondary" onclick="App.bookmarkSelectedAyah()" title="حفظ علامة مرجعية" style="flex:1">
        <span class="material-symbols-outlined">bookmark</span>
        <span>علامة</span>
      </button>

      <button class="btn btn--secondary" onclick="App.copySelectedAyah()" title="نسخ الآية" style="flex:1">
        <span class="material-symbols-outlined">content_copy</span>
        <span>نسخ</span>
      </button>

      <button class="btn btn--sage" onclick="App.markSelectedAyahAsRead()" title="سجّل قراءة هذه الآية في وردك" style="flex:1.2">
        <span class="material-symbols-outlined icon-fill">check</span>
        <span>حفظ الورد</span>
      </button>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════
       FLOATING STICKY MUSHAF AUDIO PLAYER BAR
       ═════════════════════════════════════════════════ -->
  <div id="mushaf-audio-bar" class="mushaf-audio-bar">
    <div class="mushaf-audio-bar__header">
      <div class="mushaf-audio-bar__info">
        <div class="mushaf-audio-bar__avatar" onclick="App.openReciterModal()" style="cursor:pointer" title="تغيير القارئ">
          <span class="material-symbols-outlined" style="font-size:1.3rem">graphic_eq</span>
        </div>
        <div class="mushaf-audio-bar__meta">
          <div class="mushaf-audio-bar__title" id="audio-bar-title">سورة الفاتحة • آية ١</div>
          <div class="mushaf-audio-bar__subtitle" style="cursor:pointer" onclick="App.openReciterModal()" title="انقر لتغيير القارئ">
            <span id="audio-bar-reciter-name">${activeReciter.name}</span>
            <span class="material-symbols-outlined" style="font-size:0.9rem;color:var(--color-gold)">expand_more</span>
            <span>•</span>
            <span id="audio-bar-status">جاري التلاوة</span>
          </div>
        </div>
      </div>
      <button class="mushaf-audio-bar__close" onclick="App.stopAyahAudio()" title="إيقاف التلاوة وإغلاق المشغل">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="mushaf-audio-bar__controls">
      <!-- Repeat Mode Cycle Button -->
      <button class="mushaf-audio-repeat-btn" id="audio-bar-repeat-btn" onclick="App.audioCycleRepeatMode()" title="تغيير وضع التكرار">
        <span class="material-symbols-outlined" style="font-size:1.1rem">repeat</span>
        <span id="audio-bar-repeat-label">مستمر</span>
      </button>

      <!-- Player Controls -->
      <div style="display:flex;align-items:center;gap:10px">
        <button class="mushaf-audio-btn" onclick="App.audioPlayPrevAyah()" title="الآية السابقة">
          <span class="material-symbols-outlined" style="font-size:1.6rem">skip_previous</span>
        </button>

        <button class="mushaf-audio-btn mushaf-audio-btn--play" id="audio-bar-play-toggle" onclick="App.audioTogglePlayPause()" title="تشغيل / إيقاف مؤقت">
          <span class="material-symbols-outlined" id="audio-bar-play-icon" style="font-size:1.8rem">pause</span>
        </button>

        <button class="mushaf-audio-btn" onclick="App.audioPlayNextAyah()" title="الآية التالية">
          <span class="material-symbols-outlined" style="font-size:1.6rem">skip_next</span>
        </button>
      </div>

      <!-- Current Page Jump Quick View -->
      <div id="audio-bar-page-badge" style="font-size:0.75rem;color:#C5A059;font-weight:700;padding:4px 8px;background:rgba(255,255,255,0.06);border-radius:var(--radius-md);cursor:pointer" onclick="App.audioBarJumpToCurrentPage()">
        ص ١
      </div>
    </div>
  </div>

</div>
`;
}

export function setWirdTab(tab) {
  _activeTab = tab;
}

export function setReadingMode(mode) {
  _readingMode = mode;
}

function toArabicNum(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
