/* ============================================
   DevVault Chrome Extension - Content Script
   Password detection, auto-fill, save prompts,
   and password suggestions via Shadow DOM UI.
   ============================================ */

(function () {
  'use strict';

  // Don't run on DevVault's own pages
  const selfPatterns = ['localhost:3000', 'devvault.app', 'devvault.dev'];
  if (selfPatterns.some((p) => window.location.host.includes(p))) return;

  // ================================================================
  //  CONSTANTS & STATE
  // ================================================================

  const PREFIX = 'devvault-ext';
  let processedForms = new WeakSet();
  let processedPasswordFields = new WeakSet();
  let savePromptVisible = false;
  let credentialsAvailable = false;
  let capturedCredentials = null;

  // ================================================================
  //  UTILITY: Set native value (React/Vue/Angular compatible)
  // ================================================================

  function setNativeValue(el, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function getHostname(url) {
    try { return new URL(url).hostname; } catch { return url || ''; }
  }

  function truncate(str, len = 24) {
    if (!str || str.length <= len) return str || '';
    return str.substring(0, len) + '...';
  }

  function generatePassword(length = 16) {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const syms = '!@#$%^&*_+-=?';
    const all = lower + upper + nums + syms;
    const required = [lower, upper, nums, syms];
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let pw = '';
    for (let i = 0; i < length; i++) pw += all[arr[i] % all.length];
    for (let i = 0; i < required.length && i < length; i++) {
      const set = required[i];
      const pos = arr[i] % length;
      pw = pw.substring(0, pos) + set[arr[i] % set.length] + pw.substring(pos + 1);
    }
    return pw;
  }

  // ================================================================
  //  SHADOW DOM HELPER
  // ================================================================

  function createShadowContainer(className) {
    const host = document.createElement('div');
    host.className = `${PREFIX}-${className}`;
    const shadow = host.attachShadow({ mode: 'closed' });
    return { host, shadow };
  }

  function injectStyles(shadow, css) {
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);
    return style;
  }

  // ================================================================
  //  SVG ICONS
  // ================================================================

  const ICONS = {
    lock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    shield: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    key: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
  };

  // ================================================================
  //  SHARED SHADOW STYLES
  // ================================================================

  const BASE_SHADOW_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; }

    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e4e4e7;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px 10px;
    }

    .card-header-icon {
      color: #22d3ee;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #fafafa;
      flex: 1;
      line-height: 1.3;
    }

    .card-body {
      padding: 0 16px 14px;
    }

    .card-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px 14px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      line-height: 1;
    }

    .btn-primary {
      background: #06b6d4;
      color: #020617;
    }
    .btn-primary:hover {
      background: #22d3ee;
      box-shadow: 0 0 16px rgba(6,182,212,0.3);
    }

    .btn-ghost {
      background: transparent;
      color: #71717a;
      border: 1px solid #27272a;
    }
    .btn-ghost:hover {
      color: #a1a1aa;
      border-color: #3f3f46;
      background: rgba(255,255,255,0.03);
    }

    .btn-text {
      background: none;
      border: none;
      color: #71717a;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      font-family: inherit;
      transition: color 0.15s;
    }
    .btn-text:hover { color: #a1a1aa; }

    .close-btn {
      background: none;
      border: none;
      color: #52525b;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .close-btn:hover { color: #a1a1aa; background: rgba(255,255,255,0.05); }

    .mono {
      font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', Consolas, monospace;
    }

    .text-muted { color: #71717a; font-size: 11px; }
    .text-xs { font-size: 11px; }

    .divider {
      height: 1px;
      background: #27272a;
      margin: 0;
    }

    .animate-in {
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .animate-out {
      animation: slideDown 0.2s ease forwards;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideDown {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(12px); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    @keyframes countdown {
      from { width: 100%; }
      to   { width: 0%; }
    }
  `;

  // ================================================================
  //  FORM DETECTION
  // ================================================================

  function findPasswordFields() {
    return Array.from(document.querySelectorAll('input[type="password"]'))
      .filter((el) => el.offsetParent !== null);
  }

  function findUsernameField(passwordField) {
    const form = passwordField.closest('form');
    const container = form || passwordField.parentElement?.parentElement?.parentElement || document.body;

    const selectors = [
      'input[type="email"]',
      'input[autocomplete="username"]',
      'input[autocomplete="email"]',
      'input[name*="user" i]',
      'input[name*="email" i]',
      'input[name*="login" i]',
      'input[id*="user" i]',
      'input[id*="email" i]',
      'input[id*="login" i]',
      'input[type="text"][name*="name" i]',
    ];

    for (const sel of selectors) {
      const found = container.querySelector(sel);
      if (found && found.offsetParent !== null && found !== passwordField) return found;
    }

    // Fallback: text/email input before the password field in DOM order
    const allInputs = Array.from(container.querySelectorAll('input'));
    const pwIndex = allInputs.indexOf(passwordField);
    for (let i = pwIndex - 1; i >= 0; i--) {
      const inp = allInputs[i];
      if ((inp.type === 'text' || inp.type === 'email') && inp.offsetParent !== null) {
        return inp;
      }
    }

    return null;
  }

  /**
   * Classify a form as LOGIN or REGISTER.
   * REGISTER: has confirm password or multiple visible password fields.
   */
  function classifyForm(passwordField) {
    const form = passwordField.closest('form');
    const container = form || document.body;
    const pwFields = Array.from(container.querySelectorAll('input[type="password"]'))
      .filter((el) => el.offsetParent !== null);

    if (pwFields.length >= 2) return 'REGISTER';

    // Check for confirm password patterns
    const confirmSelectors = [
      'input[name*="confirm" i]',
      'input[name*="repeat" i]',
      'input[name*="retype" i]',
      'input[id*="confirm" i]',
      'input[id*="repeat" i]',
      'input[placeholder*="confirm" i]',
      'input[placeholder*="repeat" i]',
      'input[placeholder*="retype" i]',
    ];

    for (const sel of confirmSelectors) {
      if (container.querySelector(sel)) return 'REGISTER';
    }

    return 'LOGIN';
  }

  // ================================================================
  //  AUTO-FILL ICON (inside password field)
  // ================================================================

  function injectAutofillIcon(passwordField) {
    if (processedPasswordFields.has(passwordField)) return;
    processedPasswordFields.add(passwordField);

    // Create the icon element
    const { host, shadow } = createShadowContainer('icon-anchor');

    injectStyles(shadow, `
      .icon-wrap {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #71717a;
        border-radius: 4px;
        transition: all 0.15s ease;
      }
      .icon-wrap:hover {
        color: #22d3ee;
        background: rgba(34,211,238,0.08);
      }
      .icon-wrap svg {
        width: 16px;
        height: 16px;
      }
    `);

    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-wrap';
    iconWrap.innerHTML = ICONS.key;
    iconWrap.title = 'DevVault - Auto-fill';
    shadow.appendChild(iconWrap);

    // Position the icon inside the password field
    function positionIcon() {
      const rect = passwordField.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      host.style.position = 'fixed';
      host.style.top = `${rect.top + (rect.height - 24) / 2}px`;
      host.style.left = `${rect.right - 30}px`;
      host.style.zIndex = '2147483646';
      host.style.pointerEvents = 'auto';
    }

    positionIcon();
    document.body.appendChild(host);

    window.addEventListener('scroll', positionIcon, { passive: true });
    window.addEventListener('resize', positionIcon, { passive: true });

    // Reposition periodically for SPA layout shifts
    const repoInterval = setInterval(() => {
      if (!document.body.contains(passwordField)) {
        host.remove();
        clearInterval(repoInterval);
        return;
      }
      positionIcon();
    }, 1000);

    // Click handler
    iconWrap.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestAndFillCredentials(passwordField);
    });
  }

  // ================================================================
  //  CREDENTIAL REQUEST & FILL
  // ================================================================

  function requestAndFillCredentials(passwordField) {
    chrome.runtime.sendMessage(
      { type: 'GET_CREDENTIALS', url: window.location.href },
      (response) => {
        if (chrome.runtime.lastError) return;

        if (!response || !response.credentials || response.credentials.length === 0) {
          showToast('No saved credentials for this site');
          return;
        }

        if (response.credentials.length === 1) {
          fillCredential(passwordField, response.credentials[0]);
          showToast('Credentials filled');
        } else {
          showCredentialDropdown(passwordField, response.credentials);
        }
      }
    );
  }

  function fillCredential(passwordField, cred) {
    const usernameField = findUsernameField(passwordField);
    if (usernameField && cred.username) {
      setNativeValue(usernameField, cred.username);
    }
    if (cred.password) {
      setNativeValue(passwordField, cred.password);
    }
  }

  // ================================================================
  //  CREDENTIAL DROPDOWN (multiple credentials)
  // ================================================================

  function showCredentialDropdown(passwordField, credentials) {
    // Remove existing dropdown
    document.querySelectorAll(`.${PREFIX}-credential-dropdown`).forEach((el) => el.remove());

    const { host, shadow } = createShadowContainer('credential-dropdown');

    injectStyles(shadow, BASE_SHADOW_CSS + `
      .dropdown {
        width: 280px;
        animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .cred-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 1px solid #27272a;
        transition: background 0.1s;
      }
      .cred-item:last-child { border-bottom: none; }
      .cred-item:hover { background: rgba(255,255,255,0.03); }
      .cred-user {
        font-size: 12px;
        color: #e4e4e7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 160px;
      }
      .cred-vault {
        font-size: 10px;
        color: #52525b;
        margin-top: 2px;
      }
      .fill-btn {
        padding: 4px 12px;
        background: rgba(6,182,212,0.1);
        color: #22d3ee;
        border: 1px solid rgba(6,182,212,0.2);
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .fill-btn:hover {
        background: rgba(6,182,212,0.2);
        border-color: rgba(6,182,212,0.4);
      }
    `);

    const dropdown = document.createElement('div');
    dropdown.className = 'card dropdown';

    let header = `
      <div class="card-header">
        <span class="card-header-icon">${ICONS.key}</span>
        <span class="card-title">${credentials.length} saved credentials</span>
      </div>
      <div class="divider"></div>
    `;

    let items = '';
    credentials.forEach((cred, idx) => {
      items += `
        <div class="cred-item" data-idx="${idx}">
          <div>
            <div class="cred-user">${escapeHtml(cred.username || 'No username')}</div>
            <div class="cred-vault">${escapeHtml(cred.vaultName)}</div>
          </div>
          <button class="fill-btn" data-idx="${idx}">Fill</button>
        </div>
      `;
    });

    dropdown.innerHTML = header + items;
    shadow.appendChild(dropdown);

    // Position below password field
    const rect = passwordField.getBoundingClientRect();
    host.style.position = 'fixed';
    host.style.top = `${rect.bottom + 4}px`;
    host.style.left = `${Math.min(rect.left, window.innerWidth - 296)}px`;
    host.style.zIndex = '2147483647';

    document.body.appendChild(host);

    // Fill handlers
    shadow.querySelectorAll('.fill-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        fillCredential(passwordField, credentials[idx]);
        host.remove();
        showToast('Credentials filled');
      });
    });

    // Dismiss on outside click
    const dismissHandler = (e) => {
      if (!host.contains(e.target)) {
        host.remove();
        document.removeEventListener('click', dismissHandler, true);
      }
    };
    setTimeout(() => document.addEventListener('click', dismissHandler, true), 100);
  }

  // ================================================================
  //  SAVE PASSWORD PROMPT
  // ================================================================

  function showSavePrompt(url, username, password) {
    if (savePromptVisible) return;
    savePromptVisible = true;

    // Remove existing
    document.querySelectorAll(`.${PREFIX}-save-prompt`).forEach((el) => el.remove());

    const { host, shadow } = createShadowContainer('save-prompt');

    injectStyles(shadow, BASE_SHADOW_CSS + `
      .save-card {
        width: 320px;
        animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .save-card.closing {
        animation: slideDown 0.25s ease forwards;
      }
      .info-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
      }
      .info-label {
        font-size: 11px;
        color: #52525b;
        width: 64px;
        flex-shrink: 0;
      }
      .info-value {
        font-size: 12px;
        color: #a1a1aa;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dots {
        letter-spacing: 2px;
        font-size: 10px;
      }
      .countdown-bar {
        height: 2px;
        background: rgba(6,182,212,0.15);
        border-radius: 0 0 12px 12px;
        overflow: hidden;
      }
      .countdown-fill {
        height: 100%;
        background: #06b6d4;
        border-radius: 2px;
        animation: countdown 15s linear forwards;
      }
      .brand {
        font-size: 10px;
        color: #3f3f46;
        text-align: center;
        padding: 6px 0 2px;
      }
    `);

    const hostname = getHostname(url);
    const maskedPw = '\u2022'.repeat(Math.min(password.length, 12));

    const card = document.createElement('div');
    card.className = 'card save-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="card-header-icon">${ICONS.shield}</span>
        <span class="card-title">Save password for ${escapeHtml(hostname)}?</span>
        <button class="close-btn" id="dv-close">${ICONS.close}</button>
      </div>
      <div class="divider"></div>
      <div class="card-body" style="padding-top: 12px;">
        <div class="info-row">
          <span class="info-label">Username</span>
          <span class="info-value mono">${escapeHtml(truncate(username))}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Password</span>
          <span class="info-value dots">${maskedPw}</span>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-primary" id="dv-save" style="flex:1;">Save to DevVault</button>
        <button class="btn btn-ghost" id="dv-dismiss">Not now</button>
      </div>
      <div class="countdown-bar"><div class="countdown-fill" id="dv-countdown"></div></div>
    `;

    shadow.appendChild(card);

    host.style.position = 'fixed';
    host.style.bottom = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647';

    document.body.appendChild(host);

    function dismiss() {
      card.classList.add('closing');
      setTimeout(() => {
        host.remove();
        savePromptVisible = false;
      }, 250);
    }

    // Save
    shadow.getElementById('dv-save').addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'SAVE_CREDENTIALS',
        url: url,
        username: username,
        password: password,
      }, (response) => {
        if (response && response.success) {
          showToast('Password saved to DevVault');
        } else {
          showToast('Failed to save: ' + (response?.error || 'Unknown error'));
        }
      });
      dismiss();
    });

    // Dismiss
    shadow.getElementById('dv-dismiss').addEventListener('click', dismiss);
    shadow.getElementById('dv-close').addEventListener('click', dismiss);

    // Auto-dismiss after 15 seconds
    const autoDismiss = setTimeout(dismiss, 15000);

    // Pause countdown on hover
    card.addEventListener('mouseenter', () => {
      const fill = shadow.getElementById('dv-countdown');
      if (fill) fill.style.animationPlayState = 'paused';
      clearTimeout(autoDismiss);
    });
  }

  // ================================================================
  //  PASSWORD SUGGESTION (Register forms)
  // ================================================================

  function showPasswordSuggestion(passwordField, confirmField) {
    // Remove existing
    document.querySelectorAll(`.${PREFIX}-password-suggest`).forEach((el) => el.remove());

    const { host, shadow } = createShadowContainer('password-suggest');

    let currentPassword = generatePassword(16);

    injectStyles(shadow, BASE_SHADOW_CSS + `
      .suggest-card {
        width: 300px;
        animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .suggest-card.closing {
        animation: slideDown 0.2s ease forwards;
      }
      .pw-display {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: #09090b;
        border: 1px solid #27272a;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      .pw-text {
        flex: 1;
        font-size: 12px;
        color: #22d3ee;
        word-break: break-all;
        line-height: 1.5;
        letter-spacing: 0.5px;
        user-select: all;
      }
      .strength-bar {
        display: flex;
        gap: 3px;
        margin-bottom: 12px;
      }
      .strength-seg {
        flex: 1;
        height: 3px;
        border-radius: 2px;
        background: #27272a;
        transition: background 0.2s;
      }
      .strength-seg.active { background: #22d3ee; }
      .actions-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `);

    function getStrength(pw) {
      let s = 0;
      if (pw.length >= 8) s++;
      if (pw.length >= 12) s++;
      if (pw.length >= 16) s++;
      if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
      if (/\d/.test(pw)) s++;
      if (/[^a-zA-Z0-9]/.test(pw)) s++;
      return Math.min(Math.floor(s * 4 / 6), 4);
    }

    function render() {
      const strength = getStrength(currentPassword);
      const segments = [0, 1, 2, 3].map((i) =>
        `<div class="strength-seg ${i <= strength ? 'active' : ''}"></div>`
      ).join('');

      card.innerHTML = `
        <div class="card-header">
          <span class="card-header-icon">${ICONS.shield}</span>
          <span class="card-title">Use a strong password</span>
          <button class="close-btn" id="dv-sg-close">${ICONS.close}</button>
        </div>
        <div class="divider"></div>
        <div class="card-body" style="padding-top: 12px;">
          <div class="pw-display">
            <span class="pw-text mono">${escapeHtml(currentPassword)}</span>
          </div>
          <div class="strength-bar">${segments}</div>
          <div class="actions-row">
            <button class="btn btn-primary" id="dv-sg-use" style="flex:1;">Use this password</button>
            <button class="btn-text" id="dv-sg-regen" style="display:flex;align-items:center;gap:4px;">${ICONS.refresh} Another</button>
          </div>
        </div>
      `;

      // Rebind events
      shadow.getElementById('dv-sg-close').addEventListener('click', dismissSuggest);
      shadow.getElementById('dv-sg-use').addEventListener('click', () => {
        setNativeValue(passwordField, currentPassword);
        if (confirmField) setNativeValue(confirmField, currentPassword);
        dismissSuggest();
        showToast('Strong password applied');
      });
      shadow.getElementById('dv-sg-regen').addEventListener('click', () => {
        currentPassword = generatePassword(16);
        render();
      });
    }

    const card = document.createElement('div');
    card.className = 'card suggest-card';
    shadow.appendChild(card);
    render();

    // Position near the password field
    function positionSuggest() {
      const rect = passwordField.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      host.style.position = 'fixed';
      host.style.zIndex = '2147483647';
      host.style.left = `${Math.min(rect.left, window.innerWidth - 316)}px`;

      if (spaceBelow > 220) {
        host.style.top = `${rect.bottom + 6}px`;
      } else {
        host.style.top = `${rect.top - 6}px`;
        host.style.transform = 'translateY(-100%)';
      }
    }

    positionSuggest();
    document.body.appendChild(host);

    function dismissSuggest() {
      card.classList.add('closing');
      setTimeout(() => host.remove(), 200);
    }

    // Dismiss on outside click (delayed to prevent immediate dismiss)
    const outsideHandler = (e) => {
      if (!host.contains(e.target) && e.target !== passwordField && e.target !== confirmField) {
        dismissSuggest();
        document.removeEventListener('click', outsideHandler, true);
      }
    };
    setTimeout(() => document.addEventListener('click', outsideHandler, true), 200);
  }

  // ================================================================
  //  TOAST NOTIFICATION
  // ================================================================

  function showToast(message) {
    document.querySelectorAll(`.${PREFIX}-toast`).forEach((el) => el.remove());

    const { host, shadow } = createShadowContainer('toast');

    injectStyles(shadow, `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .toast {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #e4e4e7;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      .toast.out {
        animation: toastOut 0.25s ease forwards;
      }
      .toast-icon { color: #22d3ee; display: flex; }
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(8px) translateX(-50%); }
        to   { opacity: 1; transform: translateY(0) translateX(-50%); }
      }
      @keyframes toastOut {
        from { opacity: 1; transform: translateY(0) translateX(-50%); }
        to   { opacity: 0; transform: translateY(8px) translateX(-50%); }
      }
    `);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${ICONS.check}</span>${escapeHtml(message)}`;
    shadow.appendChild(toast);

    host.style.position = 'fixed';
    host.style.bottom = '20px';
    host.style.left = '50%';
    host.style.transform = 'translateX(-50%)';
    host.style.zIndex = '2147483647';

    document.body.appendChild(host);

    setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => host.remove(), 250);
    }, 2800);
  }

  // ================================================================
  //  FORM SUBMIT CAPTURE
  // ================================================================

  function watchFormSubmissions() {
    // Capture on form submit event
    document.addEventListener('submit', captureOnSubmit, true);

    // Also capture on Enter key in password fields and button clicks
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active && active.type === 'password') {
          const form = active.closest('form');
          if (form) captureFromForm(form);
        }
      }
    }, true);
  }

  function captureOnSubmit(e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    captureFromForm(form);
  }

  function captureFromForm(form) {
    const pwField = form.querySelector('input[type="password"]');
    if (!pwField || !pwField.value) return;

    // Skip if this is a register form (we handle those differently)
    const formType = classifyForm(pwField);
    if (formType === 'REGISTER') return;

    const usernameField = findUsernameField(pwField);
    const username = usernameField ? usernameField.value : '';
    const password = pwField.value;

    if (!username || !password) return;

    capturedCredentials = {
      url: window.location.href,
      username,
      password,
      timestamp: Date.now(),
    };

    // Notify background script to store pending credential
    chrome.runtime.sendMessage({
      type: 'CREDENTIAL_CAPTURED',
      url: window.location.href,
      username,
      password,
    });

    // Also try to show save prompt after a delay (handles non-navigation submits like AJAX)
    setTimeout(() => {
      if (capturedCredentials && (Date.now() - capturedCredentials.timestamp) < 5000) {
        showSavePrompt(
          capturedCredentials.url,
          capturedCredentials.username,
          capturedCredentials.password
        );
        capturedCredentials = null;
      }
    }, 2000);
  }

  // ================================================================
  //  FORM SCANNING & PROCESSING
  // ================================================================

  function processPasswordField(pwField) {
    if (processedForms.has(pwField)) return;
    processedForms.add(pwField);

    const formType = classifyForm(pwField);

    if (formType === 'LOGIN') {
      injectAutofillIcon(pwField);
    } else if (formType === 'REGISTER') {
      // Find the confirm password field
      const form = pwField.closest('form') || document.body;
      const allPwFields = Array.from(form.querySelectorAll('input[type="password"]'))
        .filter((el) => el.offsetParent !== null);

      const confirmField = allPwFields.length >= 2 ? allPwFields[1] : null;

      // Show suggestion when user focuses the password field
      pwField.addEventListener('focus', () => {
        if (!pwField.value) {
          showPasswordSuggestion(pwField, confirmField);
        }
      }, { once: true });
    }
  }

  function scanForForms() {
    const pwFields = findPasswordFields();
    pwFields.forEach(processPasswordField);
  }

  // ================================================================
  //  MESSAGE LISTENER (from background / popup)
  // ================================================================

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Auto-fill from popup
    if (msg.type === 'AUTOFILL_CREDENTIALS') {
      const pwFields = findPasswordFields();
      if (pwFields.length > 0) {
        fillCredential(pwFields[0], msg);
        showToast('Credentials filled');
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No password field found' });
      }
      return true;
    }

    // Show save prompt (from background after navigation)
    if (msg.type === 'SHOW_SAVE_PROMPT') {
      showSavePrompt(msg.url, msg.username, msg.password);
      sendResponse({ success: true });
      return true;
    }

    // Notification that credentials exist for this site
    if (msg.type === 'CREDENTIALS_AVAILABLE') {
      credentialsAvailable = true;
      // Re-scan to ensure icons are injected
      scanForForms();
      sendResponse({ received: true });
      return true;
    }

    return false;
  });

  // ================================================================
  //  MUTATION OBSERVER (detect dynamically added forms)
  // ================================================================

  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector && (
              node.matches('input[type="password"]') ||
              node.querySelector('input[type="password"]') ||
              node.matches('form') ||
              node.querySelector('form')
            )) {
              shouldScan = true;
              break;
            }
          }
        }
      }
      if (shouldScan) break;
    }
    if (shouldScan) scanForForms();
  });

  // ================================================================
  //  INIT
  // ================================================================

  function init() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    scanForForms();
    watchFormSubmissions();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  init();
})();
