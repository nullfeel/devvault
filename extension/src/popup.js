/* ============================================
   DevVault Chrome Extension - Popup Logic
   Premium Redesign
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  let currentTabUrl = '';
  let currentHostname = '';
  let currentSiteCreds = [];
  let allVaults = [];
  let previousScreen = 'main';
  let generatedPasswordForSave = '';
  let userEmail = '';

  // ---- Screen Registry ----
  const screenIds = ['login', 'main', 'vault', 'save', 'generator', 'settings'];
  const screens = {};
  screenIds.forEach((id) => {
    screens[id] = document.getElementById(`${id}-screen`);
  });

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const el = {
    // Login
    loginForm: $('#login-form'),
    loginEmail: $('#login-email'),
    loginPassword: $('#login-password'),
    loginTogglePw: $('#login-toggle-pw'),
    loginBtn: $('#login-btn'),
    loginError: $('#login-error'),
    loginServerLink: $('#login-server-link'),
    serverUrlDisplay: $('#server-url-display'),

    // Main
    mainAddBtn: $('#main-add-btn'),
    mainSettingsBtn: $('#main-settings-btn'),
    mainGenerateBtn: $('#main-generate-btn'),
    currentUrl: $('#current-url'),
    siteCredsList: $('#site-creds-list'),
    vaultCount: $('#vault-count'),
    vaultsList: $('#vaults-list'),

    // Vault
    vaultBackBtn: $('#vault-back-btn'),
    vaultName: $('#vault-name'),
    vaultSecretCount: $('#vault-secret-count'),
    vaultSecretsList: $('#vault-secrets-list'),

    // Save
    saveForm: $('#save-form'),
    saveBackBtn: $('#save-back-btn'),
    saveUrl: $('#save-url'),
    saveUsername: $('#save-username'),
    savePassword: $('#save-password'),
    toggleSavePw: $('#toggle-save-pw'),
    saveGenerateLink: $('#save-generate-link'),
    savePwStrength: $('#save-pw-strength'),
    saveVault: $('#save-vault'),
    saveSubmitBtn: $('#save-submit-btn'),

    // Generator
    genBackBtn: $('#gen-back-btn'),
    generatedPw: $('#generated-pw'),
    copyGeneratedPw: $('#copy-generated-pw'),
    regenerateBtn: $('#regenerate-btn'),
    genPwStrength: $('#gen-pw-strength'),
    pwLength: $('#pw-length'),
    pwLengthVal: $('#pw-length-val'),
    pwUpper: $('#pw-upper'),
    pwLower: $('#pw-lower'),
    pwNumbers: $('#pw-numbers'),
    pwSymbols: $('#pw-symbols'),
    usePasswordBtn: $('#use-password-btn'),

    // Settings
    settingsBackBtn: $('#settings-back-btn'),
    settingsApiUrl: $('#settings-api-url'),
    settingsSaveUrlBtn: $('#settings-save-url-btn'),
    settingsEmail: $('#settings-email'),
    settingsSignoutBtn: $('#settings-signout-btn'),

    // Toast
    toastContainer: $('#toast-container'),
  };

  // ---- SVG icon strings ----
  const icons = {
    copy: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>',
    eye: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3C5.5 3 1.7 5.9.5 10c1.2 4.1 5 7 9.5 7s8.3-2.9 9.5-7c-1.2-4.1-5-7-9.5-7zm0 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0-7.2c-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7-1.2-2.7-2.7-2.7z"/></svg>',
    chevron: '<svg class="icon vault-chevron" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.3 14.7a1 1 0 010-1.4L10.6 10 7.3 6.7a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z" clip-rule="evenodd"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944z" clip-rule="evenodd"/></svg>',
    lock: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>',
    folder: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>',
  };

  // ================================================================
  // NAVIGATION
  // ================================================================

  function showScreen(name) {
    Object.values(screens).forEach((s) => {
      if (s) s.classList.remove('active');
    });
    if (screens[name]) {
      screens[name].classList.add('active');
    }
  }

  function navigateTo(name, opts = {}) {
    if (!opts.noPrevious) {
      const current = screenIds.find((id) => screens[id]?.classList.contains('active'));
      if (current) previousScreen = current;
    }
    showScreen(name);

    setTimeout(() => {
      const firstInput = screens[name]?.querySelector('input:not([type="checkbox"]):not([type="range"])');
      if (firstInput && opts.focus !== false) firstInput.focus();
    }, 100);
  }

  function goBack() {
    if (previousScreen === 'main') {
      loadMainScreen();
    } else {
      navigateTo(previousScreen, { focus: false });
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const current = screenIds.find((id) => screens[id]?.classList.contains('active'));
      if (current && current !== 'login' && current !== 'main') {
        goBack();
      }
    }
  });

  // ================================================================
  // TOAST
  // ================================================================

  function showToast(message, type = 'info', duration = 2500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 150);
    }, duration);
  }

  // ================================================================
  // LOADING STATES
  // ================================================================

  function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text) text.classList.toggle('hidden', loading);
    if (loader) loader.classList.toggle('hidden', !loading);
    btn.disabled = loading;
  }

  // ================================================================
  // PASSWORD STRENGTH
  // ================================================================

  function updateStrengthBar(barEl, password) {
    const strength = getPasswordStrength(password);
    barEl.setAttribute('data-strength', strength);
  }

  // ================================================================
  // HELPERS
  // ================================================================

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getSecretTypeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('password')) return 'type-password';
    if (t.includes('api') || t.includes('key')) return 'type-apikey';
    if (t.includes('token')) return 'type-token';
    if (t.includes('env')) return 'type-envvar';
    return 'type-other';
  }

  function togglePasswordVisibility(inputEl, toggleBtn) {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');
    if (eyeIcon) eyeIcon.classList.toggle('hidden', !isPassword);
    if (eyeOffIcon) eyeOffIcon.classList.toggle('hidden', isPassword);
  }

  function getFaviconUrl(hostname) {
    if (!hostname) return '';
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  }

  function getFallbackLetter(hostname) {
    if (!hostname) return '?';
    return hostname.charAt(0).toUpperCase();
  }

  // ================================================================
  // INITIALIZATION
  // ================================================================

  async function init() {
    const apiUrl = await getApiUrl();
    el.serverUrlDisplay.textContent = apiUrl.replace(/^https?:\/\//, '');
    el.settingsApiUrl.value = apiUrl;

    const token = await getToken();
    if (token) {
      try {
        await apiCall('/api/ext/credentials?url=__ping__');
        await loadMainScreen();
        return;
      } catch (err) {
        if (err.status === 401) {
          await clearToken();
        } else {
          await loadMainScreen();
          return;
        }
      }
    }

    showScreen('login');
    el.loginEmail.focus();
  }

  // ================================================================
  // LOGIN SCREEN
  // ================================================================

  async function handleLogin(e) {
    if (e) e.preventDefault();

    const email = el.loginEmail.value.trim();
    const password = el.loginPassword.value;

    if (!email || !password) {
      showLoginError('Please enter email and password');
      return;
    }

    hideLoginError();
    setButtonLoading(el.loginBtn, true);

    try {
      const data = await apiCall('/api/ext/login', {
        method: 'POST',
        body: { email, password },
      });

      if (data.token) {
        await setToken(data.token);
        userEmail = email;
        await loadMainScreen();
      } else {
        throw new Error('No token received');
      }
    } catch (err) {
      showLoginError(err.message || 'Login failed');
    } finally {
      setButtonLoading(el.loginBtn, false);
    }
  }

  function showLoginError(msg) {
    el.loginError.textContent = msg;
    el.loginError.classList.remove('hidden');
  }

  function hideLoginError() {
    el.loginError.classList.add('hidden');
  }

  // Login event listeners
  el.loginForm.addEventListener('submit', handleLogin);

  el.loginTogglePw.addEventListener('click', () => {
    togglePasswordVisibility(el.loginPassword, el.loginTogglePw);
  });

  el.loginServerLink.addEventListener('click', () => {
    navigateTo('settings');
  });

  // ================================================================
  // MAIN SCREEN
  // ================================================================

  async function loadMainScreen() {
    navigateTo('main', { focus: false });

    currentTabUrl = await getCurrentTabUrl();
    currentHostname = getHostname(currentTabUrl);
    el.currentUrl.textContent = currentHostname || 'No active tab';

    await Promise.all([
      loadSiteCredentials(currentTabUrl),
      loadVaults(),
    ]);
  }

  // -- Site Credentials --

  async function loadSiteCredentials(url) {
    el.siteCredsList.innerHTML = '<div class="loading-placeholder"><span class="loading loading-light"></span>Searching...</div>';

    try {
      const data = await apiCall(`/api/ext/credentials?url=${encodeURIComponent(url)}`);
      currentSiteCreds = data.credentials || data || [];

      if (Array.isArray(currentSiteCreds) && currentSiteCreds.length > 0) {
        renderSiteCredentials(currentSiteCreds);
      } else {
        renderEmptyCredentials();
      }
    } catch {
      renderEmptyCredentials('Could not load credentials');
    }
  }

  function renderSiteCredentials(creds) {
    el.siteCredsList.innerHTML = '';
    creds.forEach((cred, idx) => {
      el.siteCredsList.appendChild(createCredentialCard(cred, idx));
    });
  }

  function renderEmptyCredentials(msg) {
    el.siteCredsList.innerHTML = `
      <div class="empty-state">
        ${icons.shield}
        <p>${escapeHtml(msg || 'No saved passwords for this site')}</p>
        ${!msg ? '<button class="link-btn" id="empty-save-link">Save one</button>' : ''}
      </div>
    `;
    const link = el.siteCredsList.querySelector('#empty-save-link');
    if (link) link.addEventListener('click', openSaveScreen);
  }

  function parseCredValue(cred) {
    let username = cred.key || 'Unknown';
    let password = cred.value || '';
    try {
      const parsed = JSON.parse(cred.value);
      if (parsed.username) username = parsed.username;
      if (parsed.password) password = parsed.password;
    } catch {
      // value is not JSON, use as-is
    }
    return { username, password };
  }

  function createCredentialCard(cred, index) {
    const card = document.createElement('div');
    card.className = 'cred-card';

    const { username, password } = parseCredValue(cred);
    const faviconUrl = getFaviconUrl(currentHostname);
    const fallback = getFallbackLetter(currentHostname);

    card.innerHTML = `
      <div class="cred-favicon">
        ${faviconUrl
          ? `<img src="${faviconUrl}" alt="" onerror="this.parentElement.innerHTML='<span class=\\'fallback\\'>${fallback}</span>'">`
          : `<span class="fallback">${fallback}</span>`
        }
      </div>
      <div class="cred-info">
        <div class="cred-username">${escapeHtml(username)}</div>
        <div class="cred-site">${escapeHtml(currentHostname)}</div>
        <div class="cred-pw-row">
          <span class="cred-pw masked">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span>
        </div>
      </div>
      <div class="cred-actions">
        <button class="icon-btn copy-user-btn" title="Copy username">${icons.copy}</button>
        <button class="icon-btn toggle-pw-btn" title="Show password">${icons.eye}</button>
        <button class="cred-autofill-btn" data-index="${index}">Autofill</button>
      </div>
    `;

    const pwDisplay = card.querySelector('.cred-pw');
    let pwVisible = false;

    // Copy username
    card.querySelector('.copy-user-btn').addEventListener('click', async () => {
      await copyToClipboard(username);
      showToast('Username copied', 'success', 1500);
    });

    // Toggle password visibility
    card.querySelector('.toggle-pw-btn').addEventListener('click', async () => {
      if (pwVisible) {
        pwDisplay.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
        pwDisplay.className = 'cred-pw masked';
        pwVisible = false;
      } else {
        pwDisplay.textContent = password;
        pwDisplay.className = 'cred-pw revealed';
        pwVisible = true;
        await copyToClipboard(password);
        showToast('Password copied', 'success', 1500);
      }
    });

    // Autofill
    card.querySelector('.cred-autofill-btn').addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'DEVVAULT_AUTOFILL',
            username,
            password,
          });
          showToast('Credentials filled', 'success');
        }
      } catch {
        showToast('Could not autofill', 'error');
      }
    });

    return card;
  }

  // -- Vaults --

  async function loadVaults() {
    el.vaultsList.innerHTML = '<div class="loading-placeholder"><span class="loading loading-light"></span>Loading...</div>';

    try {
      const data = await apiCall('/api/ext/vaults');
      allVaults = data.vaults || data || [];

      el.vaultCount.textContent = Array.isArray(allVaults) ? allVaults.length : '';

      if (Array.isArray(allVaults) && allVaults.length > 0) {
        renderVaults(allVaults);
      } else {
        el.vaultsList.innerHTML = `<div class="empty-state">${icons.lock}<p>No vaults found</p></div>`;
      }
    } catch {
      el.vaultsList.innerHTML = '<div class="empty-state"><p>Could not load vaults</p></div>';
    }
  }

  function renderVaults(vaults) {
    el.vaultsList.innerHTML = '';
    vaults.forEach((vault) => {
      el.vaultsList.appendChild(createVaultItem(vault));
    });
  }

  function createVaultItem(vault) {
    const item = document.createElement('div');
    item.className = 'vault-item';

    const count = vault.secretCount ?? vault.secrets?.length ?? 0;

    item.innerHTML = `
      <div class="vault-icon">${icons.folder}</div>
      <div class="vault-info">
        <div class="vault-name">${escapeHtml(vault.name)}</div>
        <div class="vault-meta">${count} secret${count !== 1 ? 's' : ''}</div>
      </div>
      ${icons.chevron}
    `;

    item.addEventListener('click', () => openVaultScreen(vault));
    return item;
  }

  // Main screen listeners
  el.mainSettingsBtn.addEventListener('click', () => {
    el.settingsEmail.textContent = userEmail || el.loginEmail.value || '--';
    navigateTo('settings');
  });
  el.mainAddBtn.addEventListener('click', openSaveScreen);
  el.mainGenerateBtn.addEventListener('click', () => openGeneratorScreen());

  // ================================================================
  // VAULT SCREEN
  // ================================================================

  async function openVaultScreen(vault) {
    navigateTo('vault', { focus: false });
    el.vaultName.textContent = vault.name;
    el.vaultSecretsList.innerHTML = '<div class="loading-placeholder"><span class="loading loading-light"></span>Loading...</div>';

    try {
      let secrets = vault.secrets || [];
      if (secrets.length === 0 && vault.id) {
        const data = await apiCall(`/api/ext/vaults/${vault.id}/secrets`);
        secrets = data.secrets || data || [];
      }

      const count = secrets.length;
      el.vaultSecretCount.textContent = `${count} secret${count !== 1 ? 's' : ''}`;

      if (secrets.length === 0) {
        el.vaultSecretsList.innerHTML = `
          <div class="empty-state">
            ${icons.shield}
            <p>No secrets in this vault</p>
          </div>
        `;
      } else {
        el.vaultSecretsList.innerHTML = '';
        secrets.forEach((secret) => {
          el.vaultSecretsList.appendChild(createSecretItem(secret));
        });
      }
    } catch {
      el.vaultSecretsList.innerHTML = '<div class="empty-state"><p>Could not load secrets</p></div>';
    }
  }

  function createSecretItem(secret) {
    const item = document.createElement('div');
    item.className = 'secret-item';

    const typeClass = getSecretTypeClass(secret.type);
    const typeLabel = escapeHtml(secret.type || 'OTHER');

    item.innerHTML = `
      <span class="secret-key">${escapeHtml(secret.key || secret.name || 'Untitled')}</span>
      <span class="secret-type ${typeClass}">${typeLabel}</span>
      <div class="secret-actions">
        <button class="icon-btn toggle-secret-btn" title="Show value">${icons.eye}</button>
        <button class="icon-btn copy-secret-btn" title="Copy">${icons.copy}</button>
      </div>
    `;

    let valueVisible = false;
    let valueEl = null;

    item.querySelector('.toggle-secret-btn').addEventListener('click', () => {
      if (valueVisible && valueEl) {
        valueEl.remove();
        valueEl = null;
        valueVisible = false;
      } else {
        valueEl = document.createElement('div');
        valueEl.className = 'secret-value';
        valueEl.textContent = secret.value || '';
        item.appendChild(valueEl);
        valueVisible = true;
      }
    });

    item.querySelector('.copy-secret-btn').addEventListener('click', async () => {
      await copyToClipboard(secret.value || '');
      showToast('Copied!', 'success', 1500);
    });

    return item;
  }

  el.vaultBackBtn.addEventListener('click', goBack);

  // ================================================================
  // SAVE SCREEN
  // ================================================================

  async function openSaveScreen() {
    navigateTo('save');

    el.saveUrl.value = currentTabUrl;
    el.saveUsername.value = '';
    el.savePassword.value = generatedPasswordForSave || '';
    generatedPasswordForSave = '';
    updateStrengthBar(el.savePwStrength, el.savePassword.value);

    // Reset password visibility
    el.savePassword.type = 'password';
    const eyeIcon = el.toggleSavePw.querySelector('.eye-icon');
    const eyeOffIcon = el.toggleSavePw.querySelector('.eye-off-icon');
    if (eyeIcon) eyeIcon.classList.remove('hidden');
    if (eyeOffIcon) eyeOffIcon.classList.add('hidden');

    // Load vaults for dropdown
    el.saveVault.innerHTML = '<option value="">Loading...</option>';
    try {
      const data = await apiCall('/api/ext/vaults');
      const vaults = data.vaults || data || [];
      el.saveVault.innerHTML = '<option value="">Auto (Passwords vault)</option>';
      vaults.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.name;
        el.saveVault.appendChild(opt);
      });
    } catch {
      el.saveVault.innerHTML = '<option value="">Could not load vaults</option>';
    }

    el.saveUsername.focus();
  }

  async function handleSaveCredentials(e) {
    if (e) e.preventDefault();

    const url = el.saveUrl.value.trim();
    const username = el.saveUsername.value.trim();
    const password = el.savePassword.value;
    const vaultId = el.saveVault.value;

    if (!url || !username || !password) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setButtonLoading(el.saveSubmitBtn, true);

    try {
      const body = { url, username, password };
      if (vaultId) body.vaultId = vaultId;
      await apiCall('/api/ext/credentials', {
        method: 'POST',
        body,
      });
      showToast('Saved!', 'success');
      await loadMainScreen();
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setButtonLoading(el.saveSubmitBtn, false);
    }
  }

  el.saveBackBtn.addEventListener('click', goBack);
  el.saveForm.addEventListener('submit', handleSaveCredentials);
  el.savePassword.addEventListener('input', () => {
    updateStrengthBar(el.savePwStrength, el.savePassword.value);
  });
  el.toggleSavePw.addEventListener('click', () => {
    togglePasswordVisibility(el.savePassword, el.toggleSavePw);
  });
  el.saveGenerateLink.addEventListener('click', () => {
    previousScreen = 'save';
    openGeneratorScreen('save');
  });

  // ================================================================
  // GENERATOR SCREEN
  // ================================================================

  let generatorReturnTo = null;

  function openGeneratorScreen(returnTo) {
    generatorReturnTo = returnTo || null;
    navigateTo('generator', { focus: false });
    doGenerate();
  }

  function getGenOptions() {
    return {
      uppercase: el.pwUpper.checked,
      lowercase: el.pwLower.checked,
      numbers: el.pwNumbers.checked,
      symbols: el.pwSymbols.checked,
    };
  }

  function doGenerate() {
    const length = parseInt(el.pwLength.value, 10);
    const options = getGenOptions();
    const pw = generatePassword(length, options);
    el.generatedPw.textContent = pw;
    updateStrengthBar(el.genPwStrength, pw);
  }

  el.genBackBtn.addEventListener('click', goBack);

  el.pwLength.addEventListener('input', () => {
    el.pwLengthVal.textContent = el.pwLength.value;
    doGenerate();
  });

  el.regenerateBtn.addEventListener('click', doGenerate);

  el.copyGeneratedPw.addEventListener('click', async () => {
    await copyToClipboard(el.generatedPw.textContent);
    showToast('Copied!', 'success', 1500);
  });

  el.usePasswordBtn.addEventListener('click', async () => {
    const pw = el.generatedPw.textContent;
    await copyToClipboard(pw);

    if (generatorReturnTo === 'save') {
      generatedPasswordForSave = pw;
      el.savePassword.value = pw;
      el.savePassword.type = 'text';
      updateStrengthBar(el.savePwStrength, pw);
      navigateTo('save');
    } else {
      showToast('Copied!', 'success', 1500);
      await openSaveScreen();
      el.savePassword.value = pw;
      updateStrengthBar(el.savePwStrength, pw);
    }
  });

  [el.pwUpper, el.pwLower, el.pwNumbers, el.pwSymbols].forEach((cb) => {
    cb.addEventListener('change', doGenerate);
  });

  // ================================================================
  // SETTINGS SCREEN
  // ================================================================

  el.settingsBackBtn.addEventListener('click', () => {
    const hasToken = screens.main.classList.contains('active') ||
      screens.vault.classList.contains('active') ||
      previousScreen === 'main';
    if (hasToken) {
      goBack();
    } else {
      navigateTo('login');
    }
  });

  el.settingsSaveUrlBtn.addEventListener('click', async () => {
    const url = el.settingsApiUrl.value.trim();
    if (url) {
      await setApiUrl(url);
      el.serverUrlDisplay.textContent = url.replace(/^https?:\/\//, '');
      showToast('Server URL saved', 'success');
    }
  });

  el.settingsSignoutBtn.addEventListener('click', async () => {
    await clearToken();
    userEmail = '';
    showToast('Signed out', 'info');
    navigateTo('login', { noPrevious: true });
    el.loginPassword.value = '';
  });

  // ================================================================
  // START
  // ================================================================

  init();
})();
