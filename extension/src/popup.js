/* ============================================
   DevVault Chrome Extension - Popup Logic
   Minimalist Premium Rewrite
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
    loginEmail: $('#login-email'),
    loginPassword: $('#login-password'),
    loginPwToggle: $('#login-pw-toggle'),
    loginBtn: $('#login-btn'),
    loginError: $('#login-error'),
    loginServerLink: $('#login-server-link'),
    serverUrlDisplay: $('#server-url-display'),

    // Main
    mainSettingsBtn: $('#main-settings-btn'),
    searchInput: $('#search-input'),
    currentUrl: $('#current-url'),
    siteCredsList: $('#site-creds-list'),
    vaultCount: $('#vault-count'),
    vaultsList: $('#vaults-list'),
    genPasswordBtn: $('#gen-password-btn'),
    saveCredsBtn: $('#save-creds-btn'),

    // Vault
    vaultBackBtn: $('#vault-back-btn'),
    vaultName: $('#vault-name'),
    vaultSecretsList: $('#vault-secrets-list'),

    // Save
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
    settingsLogoutBtn: $('#settings-logout-btn'),

    // Toast
    toastContainer: $('#toast-container'),
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

    // Auto-focus first input on screen
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

  // Escape key to go back
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
    const spinner = btn.querySelector('.loading');
    if (text) text.classList.toggle('hidden', loading);
    if (spinner) spinner.classList.toggle('hidden', !loading);
    btn.disabled = loading;
  }

  // ================================================================
  // PASSWORD STRENGTH
  // ================================================================

  function updateStrengthBar(barEl, password) {
    // Remove old strength classes
    barEl.className = 'strength-bar';
    const strength = getPasswordStrength(password);
    barEl.classList.add(`strength-${strength}`);
  }

  // ================================================================
  // HELPERS
  // ================================================================

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function getSecretTypeBadgeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('password')) return 'badge-password';
    if (t.includes('api') || t.includes('key')) return 'badge-apikey';
    if (t.includes('token')) return 'badge-token';
    if (t.includes('env')) return 'badge-envvar';
    return 'badge-count';
  }

  function togglePasswordVisibility(inputEl, toggleBtn) {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');
    if (eyeIcon) eyeIcon.classList.toggle('hidden', !isPassword);
    if (eyeOffIcon) eyeOffIcon.classList.toggle('hidden', isPassword);
  }

  // SVG icon helpers (inline for performance)
  const icons = {
    copy: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>',
    eye: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3C5.5 3 1.7 5.9.5 10c1.2 4.1 5 7 9.5 7s8.3-2.9 9.5-7c-1.2-4.1-5-7-9.5-7zm0 11.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm0-7.2c-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7-1.2-2.7-2.7-2.7z"/></svg>',
    chevron: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.3 14.7a1 1 0 010-1.4L10.6 10 7.3 6.7a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z" clip-rule="evenodd"/></svg>',
    lock: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944z" clip-rule="evenodd"/></svg>',
    trash: '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
  };

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

  async function handleLogin() {
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
  el.loginBtn.addEventListener('click', handleLogin);
  el.loginPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  el.loginEmail.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.loginPassword.focus();
  });

  el.loginPwToggle.addEventListener('click', () => {
    togglePasswordVisibility(el.loginPassword, el.loginPwToggle);
  });

  el.loginServerLink.addEventListener('click', () => {
    navigateTo('settings');
  });

  // ================================================================
  // MAIN SCREEN
  // ================================================================

  async function loadMainScreen() {
    navigateTo('main', { focus: false });

    // Get current tab
    currentTabUrl = await getCurrentTabUrl();
    currentHostname = getHostname(currentTabUrl);
    el.currentUrl.textContent = currentHostname || 'No active tab';

    // Load data in parallel
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
        <span>${escapeHtml(msg || 'No saved passwords for this site')}</span>
        ${!msg ? '<button class="empty-state-link" id="empty-save-link">Save one</button>' : ''}
      </div>
    `;
    const link = el.siteCredsList.querySelector('#empty-save-link');
    if (link) link.addEventListener('click', openSaveScreen);
  }

  function parseCredValue(cred) {
    // API stores password credentials as JSON: {"username":"...","password":"..."}
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
    card.className = 'credential-card';

    const { username, password } = parseCredValue(cred);
    const faviconUrl = currentHostname
      ? `https://www.google.com/s2/favicons?domain=${currentHostname}&sz=32`
      : '';

    card.innerHTML = `
      ${faviconUrl ? `<img src="${faviconUrl}" class="credential-favicon" alt="" onerror="this.style.display='none'">` : ''}
      <div class="credential-info">
        <div class="credential-username">${escapeHtml(username)}</div>
        <span class="credential-password pw-dots">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span>
      </div>
      <div class="credential-actions">
        <button class="btn-icon copy-user-btn" title="Copy username">${icons.copy}</button>
        <button class="btn-icon toggle-pw-btn" title="Show password">${icons.eye}</button>
        <button class="btn-autofill" data-index="${index}">Autofill</button>
      </div>
    `;

    const pwDisplay = card.querySelector('.credential-password');
    let pwVisible = false;

    // Copy username
    card.querySelector('.copy-user-btn').addEventListener('click', async () => {
      await copyToClipboard(username);
      showToast('Copied!', 'success', 1500);
    });

    // Toggle password visibility
    card.querySelector('.toggle-pw-btn').addEventListener('click', async () => {
      if (pwVisible) {
        pwDisplay.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
        pwDisplay.classList.add('pw-dots');
        pwVisible = false;
      } else {
        pwDisplay.textContent = password;
        pwDisplay.classList.remove('pw-dots');
        pwVisible = true;
        await copyToClipboard(password);
        showToast('Copied!', 'success', 1500);
      }
    });

    // Autofill
    card.querySelector('.btn-autofill').addEventListener('click', async () => {
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
        el.vaultsList.innerHTML = '<div class="empty-state">' + icons.lock + '<span>No vaults found</span></div>';
      }
    } catch {
      el.vaultsList.innerHTML = '<div class="empty-state"><span>Could not load vaults</span></div>';
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
      <div class="vault-item-left">
        <span class="vault-item-name">${escapeHtml(vault.name)}</span>
      </div>
      <div class="vault-item-right">
        <span class="badge badge-count">${count}</span>
        <span class="vault-item-chevron">${icons.chevron}</span>
      </div>
    `;

    item.addEventListener('click', () => openVaultScreen(vault));
    return item;
  }

  // -- Search --

  let searchTimeout = null;
  el.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = el.searchInput.value.trim().toLowerCase();
      filterVaults(query);
    }, 200);
  });

  function filterVaults(query) {
    if (!query) {
      renderVaults(allVaults);
      renderSiteCredentials(currentSiteCreds);
      return;
    }

    const filtered = allVaults.filter((v) =>
      v.name.toLowerCase().includes(query)
    );
    renderVaults(filtered);

    const filteredCreds = currentSiteCreds.filter((c) => {
      const u = (c.username || c.key || '').toLowerCase();
      return u.includes(query);
    });
    if (filteredCreds.length > 0) {
      renderSiteCredentials(filteredCreds);
    }
  }

  // Main screen listeners
  el.mainSettingsBtn.addEventListener('click', () => navigateTo('settings'));
  el.saveCredsBtn.addEventListener('click', openSaveScreen);
  el.genPasswordBtn.addEventListener('click', () => openGeneratorScreen());

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

      if (secrets.length === 0) {
        el.vaultSecretsList.innerHTML = `
          <div class="empty-state">
            ${icons.shield}
            <span>No secrets in this vault</span>
          </div>
        `;
      } else {
        el.vaultSecretsList.innerHTML = '';
        secrets.forEach((secret) => {
          el.vaultSecretsList.appendChild(createSecretItem(secret));
        });
      }
    } catch {
      el.vaultSecretsList.innerHTML = '<div class="empty-state"><span>Could not load secrets</span></div>';
    }
  }

  function createSecretItem(secret) {
    const item = document.createElement('div');
    item.className = 'secret-item';

    const typeBadge = getSecretTypeBadgeClass(secret.type);
    const typeLabel = escapeHtml(secret.type || 'text');

    item.innerHTML = `
      <div class="secret-info">
        <span class="secret-key">${escapeHtml(secret.key || secret.name || 'Untitled')}</span>
        <span class="badge ${typeBadge}">${typeLabel}</span>
      </div>
      <div class="secret-actions">
        <button class="btn-icon toggle-secret-btn" title="Show value">${icons.eye}</button>
        <button class="btn-icon copy-secret-btn" title="Copy">${icons.copy}</button>
      </div>
    `;

    let valueVisible = false;
    let valueEl = null;

    // Toggle value
    item.querySelector('.toggle-secret-btn').addEventListener('click', () => {
      if (valueVisible && valueEl) {
        valueEl.remove();
        valueEl = null;
        valueVisible = false;
      } else {
        valueEl = document.createElement('div');
        valueEl.className = 'secret-value';
        valueEl.textContent = secret.value || '';
        valueEl.style.marginTop = '4px';
        valueEl.style.padding = '0 16px 8px';
        valueEl.style.maxWidth = '100%';
        item.appendChild(valueEl);
        valueVisible = true;
      }
    });

    // Copy
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

  async function handleSaveCredentials() {
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
  el.saveSubmitBtn.addEventListener('click', handleSaveCredentials);
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
      // Go back to save screen with password filled
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
    const token = getTokenSync();
    if (token) {
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

  el.settingsLogoutBtn.addEventListener('click', async () => {
    await clearToken();
    userEmail = '';
    showToast('Signed out', 'info');
    navigateTo('login', { noPrevious: true });
    el.loginPassword.value = '';
  });

  // Sync helper for checking token without await
  function getTokenSync() {
    // We use a simple check - if we're on main screen, we have a token
    return screens.main.classList.contains('active') || screens.vault.classList.contains('active');
  }

  // Update settings email when showing settings
  const origSettingsClick = el.mainSettingsBtn.onclick;
  el.mainSettingsBtn.addEventListener('click', () => {
    el.settingsEmail.textContent = userEmail || el.loginEmail.value || '--';
  });

  // ================================================================
  // START
  // ================================================================

  init();
})();
