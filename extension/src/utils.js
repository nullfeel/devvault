/* ============================================
   DevVault Chrome Extension - Shared Utilities
   ============================================ */

const DEFAULT_API_URL = 'http://localhost:3000';

/**
 * Get the API base URL from chrome.storage (or default).
 */
async function getApiUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['apiUrl'], (result) => {
      resolve(result.apiUrl || DEFAULT_API_URL);
    });
  });
}

/**
 * Set the API base URL in chrome.storage.
 */
async function setApiUrl(url) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ apiUrl: url }, resolve);
  });
}

/**
 * Get the auth token from chrome.storage.
 */
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

/**
 * Set the auth token in chrome.storage.
 */
async function setToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ authToken: token }, resolve);
  });
}

/**
 * Clear the auth token.
 */
async function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['authToken'], resolve);
  });
}

/**
 * Generate a cryptographically secure random password.
 * @param {number} length
 * @param {object} options - { uppercase, lowercase, numbers, symbols }
 * @returns {string}
 */
function generatePassword(length = 16, options = {}) {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = '';
  const required = [];

  if (lowercase) {
    const set = 'abcdefghijklmnopqrstuvwxyz';
    chars += set;
    required.push(set);
  }
  if (uppercase) {
    const set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    chars += set;
    required.push(set);
  }
  if (numbers) {
    const set = '0123456789';
    chars += set;
    required.push(set);
  }
  if (symbols) {
    const set = '!@#$%^&*_+-=?';
    chars += set;
    required.push(set);
  }

  if (!chars) {
    chars = 'abcdefghijklmnopqrstuvwxyz';
    required.push(chars);
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  // Ensure at least one char from each required set
  for (let i = 0; i < required.length && i < length; i++) {
    const set = required[i];
    const randIndex = array[i] % set.length;
    const pos = array[i] % length;
    password = password.substring(0, pos) + set[randIndex] + password.substring(pos + 1);
  }

  return password;
}

/**
 * Calculate password strength score.
 * @param {string} password
 * @returns {number} 0=very weak, 1=weak, 2=fair, 3=strong, 4=very strong
 */
function getPasswordStrength(password) {
  if (!password || password.length < 4) return 0;

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (/^[a-zA-Z]+$/.test(password)) score = Math.max(score - 1, 0);
  if (/^[0-9]+$/.test(password)) score = Math.max(score - 2, 0);
  if (password.length < 6) return Math.min(score, 1);

  return Math.min(Math.floor(score * 4 / 6), 4);
}

/**
 * Get hostname from a URL string.
 * @param {string} url
 * @returns {string}
 */
function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url || '';
  }
}

/**
 * Make an authenticated API call to the DevVault server.
 * @param {string} endpoint - API endpoint path (e.g. '/api/ext/login')
 * @param {object} options - { method, body }
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiCall(endpoint, options = {}) {
  const apiUrl = await getApiUrl();
  const token = await getToken();
  const { method = 'GET', body } = options;

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = { method, headers };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiUrl}${endpoint}`, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * Copy text to clipboard.
 * @param {string} text
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}
