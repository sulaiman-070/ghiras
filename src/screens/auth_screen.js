/**
 * GHIRAS — Authentication & Account Screen
 * Spiritual Islamic Aesthetic with Full RTL Support
 */

let _authMode = 'login'; // 'login' | 'register'
let _showPassword = false;
let _authError = null;
let _authLoading = false;

export function setAuthMode(mode) {
  _authMode = mode;
  _authError = null;
}

export function getAuthMode() {
  return _authMode;
}

export function setAuthError(err) {
  _authError = err;
}

export function setAuthLoading(loading) {
  _authLoading = loading;
}

export function togglePasswordVisibility() {
  _showPassword = !_showPassword;
}

export function isPasswordVisible() {
  return _showPassword;
}

export function renderAuthScreen() {
  const isRegister = _authMode === 'register';

  return `
  <div class="auth-screen-wrapper" style="
    min-height: 100vh;
    min-height: 100dvh;
    background: radial-gradient(circle at 50% 10%, rgba(184, 142, 79, 0.12) 0%, #FAF7F2 60%);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: var(--space-4);
    box-sizing: border-box;
    font-family: var(--font-family);
  ">
    <div style="
      width: 100%;
      max-width: 420px;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(184, 142, 79, 0.25);
      border-radius: var(--radius-3xl, 24px);
      box-shadow: 0 20px 50px -10px rgba(44, 34, 25, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
      padding: var(--space-6) var(--space-5);
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      animation: fadeIn 0.4s ease;
    ">
      <!-- Decorative Islamic Motif Pattern in background -->
      <div style="
        position: absolute;
        top: -30px;
        right: -30px;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(184, 142, 79, 0.15) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
      "></div>

      <!-- Brand Header -->
      <div style="text-align: center; margin-bottom: var(--space-6);">
        <div style="
          width: 68px;
          height: 68px;
          margin: 0 auto var(--space-3);
          border-radius: 20px;
          background: linear-gradient(135deg, #2C2219 0%, #44372B 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(44, 34, 25, 0.25);
          border: 1px solid rgba(184, 142, 79, 0.4);
        ">
          <span class="material-symbols-outlined icon-fill" style="font-size: 2.25rem; color: var(--color-gold, #B88E4F);">spa</span>
        </div>

        <h1 style="
          font-family: 'Amiri', serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--color-primary, #2C2219);
          margin: 0 0 0.25rem;
          letter-spacing: -0.5px;
        ">غِـــرَاس</h1>

        <p style="
          font-size: 0.875rem;
          color: var(--color-gold-dark, #8A652E);
          margin: 0 0 0.5rem;
          font-weight: 600;
        ">"أحبُّ الأعمالِ إلى اللهِ أدْومُها وإنْ قلَّ"</p>

        <p style="
          font-size: 0.8125rem;
          color: var(--text-secondary, #6E6053);
          margin: 0;
          line-height: 1.5;
        ">
          ${isRegister 
            ? 'أنشئ حسابك الشخصي لتبدأ رحلتك القرآنية' 
            : 'سجّل دخولك لمتابعة وردك اليومي ونمو حديقتك المباركة'}
        </p>
      </div>

      <!-- Segmented Auth Switcher -->
      <div style="
        display: flex;
        background: rgba(230, 220, 205, 0.45);
        padding: 4px;
        border-radius: var(--radius-xl, 14px);
        margin-bottom: var(--space-5);
        border: 1px solid rgba(184, 142, 79, 0.15);
      ">
        <button type="button" onclick="App.switchAuthMode('login')" style="
          flex: 1;
          padding: 10px;
          border: none;
          background: ${!isRegister ? '#FFFFFF' : 'transparent'};
          color: ${!isRegister ? 'var(--color-primary, #2C2219)' : 'var(--text-secondary, #6E6053)'};
          font-weight: ${!isRegister ? '700' : '500'};
          font-size: 0.875rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: ${!isRegister ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'};
          font-family: inherit;
        ">
          تسجيل الدخول
        </button>
        <button type="button" onclick="App.switchAuthMode('register')" style="
          flex: 1;
          padding: 10px;
          border: none;
          background: ${isRegister ? '#FFFFFF' : 'transparent'};
          color: ${isRegister ? 'var(--color-primary, #2C2219)' : 'var(--text-secondary, #6E6053)'};
          font-weight: ${isRegister ? '700' : '500'};
          font-size: 0.875rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: ${isRegister ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'};
          font-family: inherit;
        ">
          حساب جديد
        </button>
      </div>

      <!-- Error Alert -->
      ${_authError ? `
        <div id="auth-error-banner" style="
          background: #FDEDED;
          border: 1px solid rgba(186, 26, 26, 0.3);
          border-radius: var(--radius-lg, 12px);
          padding: 10px 14px;
          margin-bottom: var(--space-4);
          display: flex;
          align-items: center;
          gap: 10px;
          color: #B3261E;
          font-size: 0.8125rem;
          animation: shake 0.3s ease;
        ">
          <span class="material-symbols-outlined" style="font-size: 1.125rem;">error</span>
          <span style="flex: 1;">${_authError}</span>
          <button type="button" onclick="App.dismissAuthError()" style="background: none; border: none; cursor: pointer; color: #B3261E; padding: 2px;">
            <span class="material-symbols-outlined" style="font-size: 1rem;">close</span>
          </button>
        </div>
      ` : ''}

      <!-- Form -->
      <form onsubmit="App.handleAuthSubmit(event)" style="display: flex; flex-direction: column; gap: var(--space-4);">
        
        ${isRegister ? `
          <!-- Full Name -->
          <div>
            <label style="
              display: block;
              font-size: 0.8125rem;
              font-weight: 600;
              color: var(--text-primary, #2C2219);
              margin-bottom: 6px;
            ">الاسم الكريم</label>
            <div style="position: relative;">
              <span class="material-symbols-outlined" style="
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--color-gold, #B88E4F);
                font-size: 1.25rem;
                pointer-events: none;
              ">person</span>
              <input
                id="auth-name-input"
                type="text"
                required
                placeholder="مثال: عبدالله أو مريم"
                maxlength="30"
                style="
                  width: 100%;
                  box-sizing: border-box;
                  padding: 12px 42px 12px 14px;
                  background: #FFFFFF;
                  border: 1.5px solid rgba(184, 142, 79, 0.3);
                  border-radius: var(--radius-xl, 14px);
                  font-size: 0.9375rem;
                  font-family: inherit;
                  color: var(--text-primary, #2C2219);
                  outline: none;
                  transition: border-color 0.2s, box-shadow 0.2s;
                "
                onfocus="this.style.borderColor='var(--color-gold, #B88E4F)'; this.style.boxShadow='0 0 0 3px rgba(184, 142, 79, 0.15)';"
                onblur="this.style.borderColor='rgba(184, 142, 79, 0.3)'; this.style.boxShadow='none';"
              />
            </div>
          </div>
        ` : ''}

        <!-- Email -->
        <div>
          <label style="
            display: block;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-primary, #2C2219);
            margin-bottom: 6px;
          ">البريد الإلكتروني الشخصي</label>
          <div style="position: relative;">
            <span class="material-symbols-outlined" style="
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--color-gold, #B88E4F);
              font-size: 1.25rem;
              pointer-events: none;
            ">mail</span>
            <input
              id="auth-email-input"
              type="email"
              required
              dir="ltr"
              placeholder="name@example.com"
              style="
                width: 100%;
                box-sizing: border-box;
                padding: 12px 42px 12px 14px;
                background: #FFFFFF;
                border: 1.5px solid rgba(184, 142, 79, 0.3);
                border-radius: var(--radius-xl, 14px);
                font-size: 0.9375rem;
                font-family: inherit;
                color: var(--text-primary, #2C2219);
                text-align: right;
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
              "
              onfocus="this.style.borderColor='var(--color-gold, #B88E4F)'; this.style.boxShadow='0 0 0 3px rgba(184, 142, 79, 0.15)';"
              onblur="this.style.borderColor='rgba(184, 142, 79, 0.3)'; this.style.boxShadow='none';"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label style="
            display: block;
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--text-primary, #2C2219);
            margin-bottom: 6px;
          ">كلمة المرور</label>
          <div style="position: relative;">
            <span class="material-symbols-outlined" style="
              position: absolute;
              right: 12px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--color-gold, #B88E4F);
              font-size: 1.25rem;
              pointer-events: none;
            ">lock</span>
            <input
              id="auth-password-input"
              type="${_showPassword ? 'text' : 'password'}"
              required
              minlength="4"
              placeholder="${isRegister ? '٤ خانات على الأقل' : '••••••••'}"
              style="
                width: 100%;
                box-sizing: border-box;
                padding: 12px 42px 12px 42px;
                background: #FFFFFF;
                border: 1.5px solid rgba(184, 142, 79, 0.3);
                border-radius: var(--radius-xl, 14px);
                font-size: 0.9375rem;
                font-family: inherit;
                color: var(--text-primary, #2C2219);
                outline: none;
                transition: border-color 0.2s, box-shadow 0.2s;
              "
              onfocus="this.style.borderColor='var(--color-gold, #B88E4F)'; this.style.boxShadow='0 0 0 3px rgba(184, 142, 79, 0.15)';"
              onblur="this.style.borderColor='rgba(184, 142, 79, 0.3)'; this.style.boxShadow='none';"
            />
            <button
              type="button"
              onclick="App.togglePasswordVisibility()"
              tabindex="-1"
              style="
                position: absolute;
                left: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                color: var(--text-muted, #9E8F80);
                display: flex;
                align-items: center;
                padding: 4px;
              "
            >
              <span id="auth-eye-icon" class="material-symbols-outlined" style="font-size: 1.25rem;">
                ${_showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          id="auth-submit-btn"
          ${_authLoading ? 'disabled' : ''}
          style="
            width: 100%;
            padding: 14px;
            margin-top: var(--space-2);
            border: none;
            border-radius: var(--radius-xl, 14px);
            background: linear-gradient(135deg, #2C2219 0%, #44372B 100%);
            color: #FAF7F2;
            font-size: 1rem;
            font-weight: 700;
            cursor: ${_authLoading ? 'not-allowed' : 'pointer'};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 10px 20px -5px rgba(44, 34, 25, 0.3);
            transition: all 0.25s ease;
            font-family: inherit;
            position: relative;
          "
        >
          ${_authLoading ? `
            <span class="material-symbols-outlined" style="font-size: 1.25rem; animation: spin 1s linear infinite;">progress_activity</span>
            <span>جاري المعالجة...</span>
          ` : `
            <span class="material-symbols-outlined icon-fill" style="font-size: 1.25rem; color: var(--color-gold, #B88E4F);">
              ${isRegister ? 'person_add' : 'login'}
            </span>
            <span>${isRegister ? 'إنشاء الحساب والبدء' : 'دخول إلى حسابي'}</span>
          `}
        </button>

      </form>

      <!-- Divider -->
      <div style="
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin: var(--space-5) 0 var(--space-4);
      ">
        <div style="flex: 1; height: 1px; background: rgba(184, 142, 79, 0.2);"></div>
        <span style="font-size: 0.75rem; color: var(--text-muted, #9E8F80);">أو للتجربة السريعة</span>
        <div style="flex: 1; height: 1px; background: rgba(184, 142, 79, 0.2);"></div>
      </div>

      <!-- Guest Continue Button -->
      <button
        type="button"
        onclick="App.continueAsGuest()"
        style="
          width: 100%;
          padding: 11px;
          border: 1px dashed rgba(184, 142, 79, 0.4);
          border-radius: var(--radius-xl, 14px);
          background: rgba(255, 255, 255, 0.6);
          color: var(--text-secondary, #6E6053);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          font-family: inherit;
        "
        onmouseover="this.style.background='#FFFFFF'; this.style.borderColor='var(--color-gold, #B88E4F)';"
        onmouseout="this.style.background='rgba(255, 255, 255, 0.6)'; this.style.borderColor='rgba(184, 142, 79, 0.4)';"
      >
        <span class="material-symbols-outlined" style="font-size: 1.125rem;">explore</span>
        <span>المتابعة كزائر مؤقت</span>
      </button>

    </div>
  </div>
  `;
}
