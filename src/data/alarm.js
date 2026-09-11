/**
 * GHIRAS — Smart Quran Reminders & Alarm Engine
 * Handles Web Audio harmonic chimes, Web Notifications, and real-time alarm checking
 */

let _audioCtx = null;

/**
 * Plays a peaceful, resonant Islamic chime using Web Audio API (100% offline)
 */
export function playAlarmChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!_audioCtx || _audioCtx.state === 'suspended') {
      _audioCtx = new AudioContext();
    }

    const now = _audioCtx.currentTime;
    
    // Peaceful Chord: F5 (698.46Hz), A5 (880Hz), C6 (1046.5Hz)
    const tones = [523.25, 659.25, 783.99, 1046.50];

    tones.forEach((freq, idx) => {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.18));

      // Gentle attack and long calming decay
      gain.gain.setValueAtTime(0, now + (idx * 0.18));
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + (idx * 0.18) + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx * 0.18) + 2.8);

      osc.connect(gain);
      gain.connect(_audioCtx.destination);

      osc.start(now + (idx * 0.18));
      osc.stop(now + (idx * 0.18) + 2.9);
    });

  } catch (e) {
    console.warn('Ghiras: Web Audio alarm chime error', e);
  }
}

/**
 * Requests Notification permission from user
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Fires a system web notification
 */
export function sendAlarmNotification(reminder) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const title = `🔔 موعدك مع كتاب الله: ${reminder.title}`;
    const options = {
      body: `حان الآن موعد تذكيرك (${reminder.time}). اضغط لفتح المصحف والبدء فوراً 🌿`,
      icon: './icon.png',
      badge: './icon.png',
      tag: `ghiras-reminder-${reminder.id}`,
      renotify: true,
      data: {
        reminderId: reminder.id,
        surahNumber: reminder.surahNumber,
        page: reminder.page
      }
    };

    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (window.App && typeof window.App.onAlarmNotificationClick === 'function') {
        window.App.onAlarmNotificationClick(reminder);
      }
      notif.close();
    };
  } catch (e) {
    console.warn('Ghiras: Notification dispatch error', e);
  }
}

/**
 * Checks reminders against current device time
 */
export function checkReminders(reminders, onTrigger) {
  if (!reminders || !Array.isArray(reminders)) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  const dayOfWeek = now.getDay(); // 0 = Sunday .. 6 = Saturday (Friday = 5)
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  reminders.forEach(rem => {
    if (!rem.enabled) return;

    // Check day of week
    if (rem.days && Array.isArray(rem.days) && !rem.days.includes(dayOfWeek)) {
      return;
    }

    // Check time match and that it hasn't triggered for this specific day
    if (rem.time === currentTime && rem.lastTriggeredDate !== todayKey) {
      onTrigger(rem, todayKey);
    }
  });
}

/**
 * Starts background clock loop to check alarms every 15 seconds
 */
export function startAlarmClock(getRemindersFn, onTriggerFn) {
  // Run once immediately
  checkReminders(getRemindersFn(), onTriggerFn);

  // Check every 15 seconds
  return setInterval(() => {
    checkReminders(getRemindersFn(), onTriggerFn);
  }, 15000);
}
