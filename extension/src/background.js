/* ============================================
   DevVault Chrome Extension - Background Service Worker
   ============================================ */

const DEFAULT_API_URL = 'http://localhost:3000';

// In-memory store for captured credentials pending save prompt
const pendingCredentials = new Map();

// ---- Storage Helpers ----

async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl'], (result) => {
      resolve(result.apiUrl || DEFAULT_API_URL);
    });
  });
}

async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

// ---- API Communication ----

async function apiCall(endpoint, options = {}) {
  const baseUrl = await getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated. Please log in to DevVault.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const url = `${baseUrl.replace(/\/$/, '')}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || data.error || `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    throw new Error(`Network error: Could not connect to DevVault server.`);
  }
}

// ---- Password Generation ----

function generatePassword(length = 16, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = '';
  const required = [];

  if (lowercase) { const s = 'abcdefghijklmnopqrstuvwxyz'; chars += s; required.push(s); }
  if (uppercase) { const s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; chars += s; required.push(s); }
  if (numbers) { const s = '0123456789'; chars += s; required.push(s); }
  if (symbols) { const s = '!@#$%^&*_+-=?'; chars += s; required.push(s); }

  if (!chars) { chars = 'abcdefghijklmnopqrstuvwxyz'; required.push(chars); }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  for (let i = 0; i < required.length && i < length; i++) {
    const set = required[i];
    const randIndex = array[i] % set.length;
    const pos = array[i] % length;
    password = password.substring(0, pos) + set[randIndex] + password.substring(pos + 1);
  }

  return password;
}

// ---- Message Handlers ----

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // GET_CREDENTIALS: look up saved credentials for a URL
  if (message.type === 'GET_CREDENTIALS') {
    handleGetCredentials(message.url)
      .then(sendResponse)
      .catch((err) => sendResponse({ credentials: [], error: err.message }));
    return true;
  }

  // SAVE_CREDENTIALS: save a new credential to the vault
  if (message.type === 'SAVE_CREDENTIALS') {
    handleSaveCredentials(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  // CHECK_CREDENTIALS: check if any credentials exist for a URL
  if (message.type === 'CHECK_CREDENTIALS') {
    handleCheckCredentials(message.url)
      .then(sendResponse)
      .catch((err) => sendResponse({ exists: false, count: 0, error: err.message }));
    return true;
  }

  // GENERATE_PASSWORD: generate a strong random password
  if (message.type === 'GENERATE_PASSWORD') {
    const pw = generatePassword(message.length || 16, {
      uppercase: message.uppercase !== false,
      lowercase: message.lowercase !== false,
      numbers: message.numbers !== false,
      symbols: message.symbols !== false,
    });
    sendResponse({ password: pw });
    return false;
  }

  // GET_CURRENT_TAB: return the active tab's URL
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        sendResponse({ url: tabs[0].url, tabId: tabs[0].id });
      } else {
        sendResponse({ url: '', tabId: null });
      }
    });
    return true;
  }

  // CREDENTIAL_CAPTURED: content script captured credentials from form submit
  if (message.type === 'CREDENTIAL_CAPTURED') {
    const tabId = sender.tab?.id;
    if (tabId) {
      pendingCredentials.set(tabId, {
        url: message.url,
        username: message.username,
        password: message.password,
        timestamp: Date.now(),
      });
    }
    sendResponse({ received: true });
    return false;
  }

  return false;
});

// ---- Credential Lookup ----

async function handleGetCredentials(url) {
  try {
    const hostname = new URL(url).hostname;
    const data = await apiCall(`/api/ext/credentials?url=${encodeURIComponent(hostname)}`);
    const credentials = Array.isArray(data) ? data : (data.credentials || []);

    // Parse credential values (stored as JSON { username, password })
    const parsed = credentials.map((cred) => {
      let username = cred.key || '';
      let password = cred.value || '';

      try {
        const val = JSON.parse(cred.value);
        if (val.username) username = val.username;
        if (val.password) password = val.password;
      } catch {
        // value is not JSON, use raw
      }

      return {
        id: cred.id,
        username,
        password,
        url: cred.url || cred.key,
        vaultName: cred.vault?.name || 'Passwords',
      };
    });

    return { credentials: parsed };
  } catch (err) {
    return { credentials: [], error: err.message };
  }
}

// ---- Check if credentials exist ----

async function handleCheckCredentials(url) {
  try {
    const hostname = new URL(url).hostname;
    const data = await apiCall(`/api/ext/credentials?url=${encodeURIComponent(hostname)}`);
    const credentials = Array.isArray(data) ? data : (data.credentials || []);
    return { exists: credentials.length > 0, count: credentials.length };
  } catch {
    return { exists: false, count: 0 };
  }
}

// ---- Save Credentials ----

async function handleSaveCredentials(message) {
  try {
    await apiCall('/api/ext/credentials', {
      method: 'POST',
      body: {
        url: message.url,
        username: message.username,
        password: message.password,
        vaultId: message.vaultId || undefined,
      },
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ---- Tab Monitoring ----

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Skip chrome:// and extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  // Check for pending credentials from a previous form submission in this tab
  const pending = pendingCredentials.get(tabId);
  if (pending && (Date.now() - pending.timestamp) < 30000) {
    // Send save prompt to the new page
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, {
        type: 'SHOW_SAVE_PROMPT',
        url: pending.url,
        username: pending.username,
        password: pending.password,
      }).catch(() => {});
    }, 800);

    pendingCredentials.delete(tabId);
    return;
  }

  // Notify content script about available credentials
  handleCheckCredentials(tab.url).then((result) => {
    if (result.exists) {
      chrome.tabs.sendMessage(tabId, {
        type: 'CREDENTIALS_AVAILABLE',
        count: result.count,
      }).catch(() => {});
    }
  });
});

// Clean up pending credentials for closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  pendingCredentials.delete(tabId);
});

// Periodic cleanup of stale pending credentials (older than 60s)
setInterval(() => {
  const now = Date.now();
  for (const [tabId, data] of pendingCredentials.entries()) {
    if (now - data.timestamp > 60000) {
      pendingCredentials.delete(tabId);
    }
  }
}, 30000);

// ---- Install / Update ----

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[DevVault] Extension installed');
  } else if (details.reason === 'update') {
    console.log('[DevVault] Extension updated to', chrome.runtime.getManifest().version);
  }
});
