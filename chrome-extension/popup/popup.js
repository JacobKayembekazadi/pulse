// ============================================================================
// NEXUS CHROME EXTENSION - POPUP SCRIPT
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const totalReplies = document.getElementById('totalReplies');
  const todayReplies = document.getElementById('todayReplies');
  const postedReplies = document.getElementById('postedReplies');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const autoInjectToggle = document.getElementById('autoInject');
  const defaultToneSelect = document.getElementById('defaultTone');
  const activityList = document.getElementById('activityList');
  const toast = document.getElementById('toast');

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async function init() {
    await loadApiKey();
    await loadSettings();
    await loadReplyHistory();
    updateConnectionStatus();
  }

  // ============================================================================
  // API KEY MANAGEMENT
  // ============================================================================

  async function loadApiKey() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEY' });
      if (response.success && response.apiKey) {
        apiKeyInput.value = '••••••••••••••••';
        apiKeyInput.dataset.hasKey = 'true';
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey || apiKey === '••••••••••••••••') {
      showToast('Please enter an API key', 'error');
      return;
    }

    saveApiKeyBtn.disabled = true;
    saveApiKeyBtn.textContent = 'Saving...';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SAVE_API_KEY',
        data: apiKey,
      });

      if (response.success) {
        apiKeyInput.value = '••••••••••••••••';
        apiKeyInput.dataset.hasKey = 'true';
        showToast('API key saved!');
        updateConnectionStatus();
      } else {
        showToast('Failed to save API key', 'error');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      showToast('Error saving API key', 'error');
    }

    saveApiKeyBtn.disabled = false;
    saveApiKeyBtn.textContent = 'Save';
  });

  apiKeyInput.addEventListener('focus', () => {
    if (apiKeyInput.dataset.hasKey === 'true') {
      apiKeyInput.value = '';
      apiKeyInput.type = 'text';
    }
  });

  apiKeyInput.addEventListener('blur', () => {
    if (apiKeyInput.dataset.hasKey === 'true' && !apiKeyInput.value) {
      apiKeyInput.value = '••••••••••••••••';
    }
    apiKeyInput.type = 'password';
  });

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.success && response.settings) {
        autoInjectToggle.checked = response.settings.autoInject !== false;
        defaultToneSelect.value = response.settings.defaultTone || 'helpful';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async function saveSettings() {
    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        data: {
          autoInject: autoInjectToggle.checked,
          defaultTone: defaultToneSelect.value,
        },
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  autoInjectToggle.addEventListener('change', saveSettings);
  defaultToneSelect.addEventListener('change', saveSettings);

  // ============================================================================
  // REPLY HISTORY & STATS
  // ============================================================================

  async function loadReplyHistory() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_REPLY_HISTORY' });
      if (response.success) {
        const history = response.history || [];
        updateStats(history);
        renderActivityList(history);
      }
    } catch (error) {
      console.error('Error loading reply history:', error);
    }
  }

  function updateStats(history) {
    const today = new Date().toDateString();
    const todayEntries = history.filter(
      (entry) => new Date(entry.timestamp).toDateString() === today
    );
    const posted = history.filter((entry) => entry.wasPosted);

    totalReplies.textContent = history.length;
    todayReplies.textContent = todayEntries.length;
    postedReplies.textContent = posted.length;
  }

  function renderActivityList(history) {
    if (history.length === 0) {
      activityList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No replies yet</p>
        </div>
      `;
      return;
    }

    const recentHistory = history.slice(0, 10);
    activityList.innerHTML = recentHistory
      .map((entry) => {
        const platformIcon = getPlatformIcon(entry.platform);
        const timeAgo = getTimeAgo(new Date(entry.timestamp));
        const statusClass = entry.wasPosted ? 'posted' : 'copied';
        const statusText = entry.wasPosted ? 'Posted' : 'Copied';

        return `
          <div class="activity-item">
            <div class="activity-platform ${entry.platform}">${platformIcon}</div>
            <div class="activity-content">
              <div class="activity-text">${escapeHtml(entry.reply.substring(0, 50))}...</div>
              <div class="activity-time">${timeAgo} - @${entry.postAuthor || 'unknown'}</div>
            </div>
            <span class="activity-status ${statusClass}">${statusText}</span>
          </div>
        `;
      })
      .join('');
  }

  function getPlatformIcon(platform) {
    const icons = {
      linkedin: 'in',
      twitter: '𝕏',
      reddit: 'r/',
    };
    return icons[platform] || '?';
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================================
  // CONNECTION STATUS
  // ============================================================================

  async function updateConnectionStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEY' });
      const hasApiKey = response.success && response.apiKey;

      if (hasApiKey) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
      } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'No API Key';
      }
    } catch (error) {
      statusDot.classList.remove('connected');
      statusText.textContent = 'Error';
    }
  }

  // ============================================================================
  // TOAST NOTIFICATIONS
  // ============================================================================

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ============================================================================
  // START
  // ============================================================================

  init();
});
