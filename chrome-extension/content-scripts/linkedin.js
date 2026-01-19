// ============================================================================
// NEXUS CHROME EXTENSION - LINKEDIN CONTENT SCRIPT
// Injects "Reply with NEXUS" buttons into LinkedIn posts
// ============================================================================

(function () {
  'use strict';

  const NEXUS_BUTTON_CLASS = 'nexus-reply-btn';
  const NEXUS_MODAL_CLASS = 'nexus-reply-modal';
  const PROCESSED_MARKER = 'data-nexus-processed';

  let currentModal = null;
  let isProcessing = false;

  // ============================================================================
  // POST DETECTION & BUTTON INJECTION
  // ============================================================================

  function findLinkedInPosts() {
    // LinkedIn feed posts
    const feedPosts = document.querySelectorAll(
      '.feed-shared-update-v2:not([' + PROCESSED_MARKER + '])'
    );

    // LinkedIn article posts
    const articlePosts = document.querySelectorAll(
      '.occludable-update:not([' + PROCESSED_MARKER + '])'
    );

    // Profile activity posts
    const activityPosts = document.querySelectorAll(
      '.profile-creator-shared-feed-update__container:not([' + PROCESSED_MARKER + '])'
    );

    return [...feedPosts, ...articlePosts, ...activityPosts];
  }

  function extractPostData(postElement) {
    try {
      // Get author name
      const authorEl =
        postElement.querySelector('.update-components-actor__name span span') ||
        postElement.querySelector('.feed-shared-actor__name span span') ||
        postElement.querySelector('.update-components-actor__title span');
      const author = authorEl?.textContent?.trim() || 'Unknown';

      // Get author title
      const titleEl =
        postElement.querySelector('.update-components-actor__description') ||
        postElement.querySelector('.feed-shared-actor__description');
      const authorTitle = titleEl?.textContent?.trim() || '';

      // Get post content
      const contentEl =
        postElement.querySelector('.feed-shared-update-v2__description') ||
        postElement.querySelector('.feed-shared-text') ||
        postElement.querySelector('.update-components-text');
      const content = contentEl?.textContent?.trim() || '';

      // Get post URL
      const linkEl =
        postElement.querySelector('a.app-aware-link[href*="/feed/update/"]') ||
        postElement.querySelector('.feed-shared-actor__sub-description a') ||
        postElement.querySelector('a[href*="activity"]');
      const postUrl = linkEl?.href || window.location.href;

      // Get engagement metrics
      const likesEl = postElement.querySelector('.social-details-social-counts__reactions-count');
      const commentsEl = postElement.querySelector('.social-details-social-counts__comments');
      const likes = parseInt(likesEl?.textContent?.replace(/[^0-9]/g, '') || '0');
      const comments = parseInt(commentsEl?.textContent?.replace(/[^0-9]/g, '') || '0');

      return {
        platform: 'linkedin',
        author,
        authorTitle,
        content,
        postUrl,
        engagement: { likes, comments },
      };
    } catch (error) {
      console.error('[NEXUS] Error extracting post data:', error);
      return null;
    }
  }

  function injectNexusButton(postElement) {
    // Mark as processed
    postElement.setAttribute(PROCESSED_MARKER, 'true');

    // Find the social actions bar
    const actionsBar =
      postElement.querySelector('.feed-shared-social-actions') ||
      postElement.querySelector('.social-details-social-activity') ||
      postElement.querySelector('.feed-shared-social-action-bar');

    if (!actionsBar) return;

    // Check if button already exists
    if (actionsBar.querySelector('.' + NEXUS_BUTTON_CLASS)) return;

    // Create NEXUS button
    const nexusBtn = document.createElement('button');
    nexusBtn.className = NEXUS_BUTTON_CLASS;
    nexusBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <span>NEXUS</span>
    `;

    nexusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postData = extractPostData(postElement);
      if (postData) {
        showReplyModal(postData, postElement);
      }
    });

    // Insert button
    actionsBar.appendChild(nexusBtn);
  }

  // ============================================================================
  // REPLY MODAL
  // ============================================================================

  function showReplyModal(postData, postElement) {
    // Remove existing modal
    if (currentModal) {
      currentModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = NEXUS_MODAL_CLASS;
    modal.innerHTML = `
      <div class="nexus-modal-backdrop"></div>
      <div class="nexus-modal-content">
        <div class="nexus-modal-header">
          <div class="nexus-modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>NEXUS Reply</span>
          </div>
          <button class="nexus-modal-close">&times;</button>
        </div>

        <div class="nexus-modal-post-preview">
          <div class="nexus-post-author">${postData.author}</div>
          <div class="nexus-post-content">${postData.content.substring(0, 200)}${postData.content.length > 200 ? '...' : ''}</div>
        </div>

        <div class="nexus-tone-selector">
          <label>Tone</label>
          <div class="nexus-tone-options">
            <button class="nexus-tone-btn active" data-tone="helpful">Helpful</button>
            <button class="nexus-tone-btn" data-tone="professional">Professional</button>
            <button class="nexus-tone-btn" data-tone="friendly">Friendly</button>
            <button class="nexus-tone-btn" data-tone="curious">Curious</button>
            <button class="nexus-tone-btn" data-tone="witty">Witty</button>
          </div>
        </div>

        <div class="nexus-reply-area">
          <label>Your Reply</label>
          <textarea class="nexus-reply-input" placeholder="Click 'Generate' to create an AI-powered reply..."></textarea>
          <div class="nexus-char-count">0 / 280</div>
        </div>

        <div class="nexus-modal-actions">
          <button class="nexus-btn nexus-btn-generate">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            Generate Reply
          </button>
          <button class="nexus-btn nexus-btn-copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button class="nexus-btn nexus-btn-primary nexus-btn-post">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Post Reply
          </button>
        </div>

        <div class="nexus-modal-footer">
          <a href="#" class="nexus-open-app">Open in NEXUS App for more options</a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    currentModal = modal;

    // Get elements
    const backdrop = modal.querySelector('.nexus-modal-backdrop');
    const closeBtn = modal.querySelector('.nexus-modal-close');
    const toneButtons = modal.querySelectorAll('.nexus-tone-btn');
    const textarea = modal.querySelector('.nexus-reply-input');
    const charCount = modal.querySelector('.nexus-char-count');
    const generateBtn = modal.querySelector('.nexus-btn-generate');
    const copyBtn = modal.querySelector('.nexus-btn-copy');
    const postBtn = modal.querySelector('.nexus-btn-post');
    const openAppLink = modal.querySelector('.nexus-open-app');

    let selectedTone = 'helpful';

    // Event handlers
    backdrop.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    toneButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        toneButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTone = btn.dataset.tone;
      });
    });

    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length} / 280`;
      charCount.classList.toggle('warning', textarea.value.length > 280);
    });

    generateBtn.addEventListener('click', async () => {
      generateBtn.disabled = true;
      generateBtn.innerHTML = `
        <svg class="nexus-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Generating...
      `;

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'GENERATE_REPLY',
          data: {
            post: {
              author: postData.author,
              content: postData.content,
            },
            tone: selectedTone,
            platform: 'linkedin',
          },
        });

        if (response.success) {
          textarea.value = response.reply;
        } else {
          textarea.value = response.fallback || 'Failed to generate reply. Please try again.';
          console.warn('[NEXUS] Generation error:', response.error);
        }

        charCount.textContent = `${textarea.value.length} / 280`;
      } catch (error) {
        console.error('[NEXUS] Error generating reply:', error);
        textarea.value = 'Error generating reply. Please check your API key in extension settings.';
      }

      generateBtn.disabled = false;
      generateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
        Generate Reply
      `;
    });

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(textarea.value);
        copyBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Copied!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          `;
        }, 2000);

        // Log the reply
        chrome.runtime.sendMessage({
          type: 'LOG_REPLY',
          data: {
            platform: 'linkedin',
            postUrl: postData.postUrl,
            postAuthor: postData.author,
            postContent: postData.content,
            reply: textarea.value,
            tone: selectedTone,
            wasPosted: false,
          },
        });
      } catch (error) {
        console.error('[NEXUS] Copy failed:', error);
      }
    });

    postBtn.addEventListener('click', () => {
      // Find and click the comment button on the post
      const commentBtn =
        postElement.querySelector('button.comment-button') ||
        postElement.querySelector('[data-control-name="comment"]') ||
        postElement.querySelector('.feed-shared-social-action-bar__action-button--comment') ||
        postElement.querySelector('button[aria-label*="Comment"]');

      if (commentBtn) {
        commentBtn.click();

        // Wait for comment box to appear and insert text
        setTimeout(() => {
          const commentBox =
            postElement.querySelector('.ql-editor[data-placeholder]') ||
            postElement.querySelector('.comments-comment-box__form-container .ql-editor') ||
            document.querySelector('.comments-comment-texteditor .ql-editor');

          if (commentBox) {
            commentBox.innerHTML = `<p>${textarea.value}</p>`;
            commentBox.dispatchEvent(new Event('input', { bubbles: true }));

            // Log the reply as posted
            chrome.runtime.sendMessage({
              type: 'LOG_REPLY',
              data: {
                platform: 'linkedin',
                postUrl: postData.postUrl,
                postAuthor: postData.author,
                postContent: postData.content,
                reply: textarea.value,
                tone: selectedTone,
                wasPosted: true,
              },
            });

            closeModal();
          } else {
            // If can't find comment box, just copy to clipboard
            navigator.clipboard.writeText(textarea.value);
            alert('Comment box not found. Reply copied to clipboard - paste it manually.');
          }
        }, 500);
      } else {
        // If can't find comment button, copy and show message
        navigator.clipboard.writeText(textarea.value);
        alert('Could not find comment button. Reply copied to clipboard - paste it manually.');
      }
    });

    openAppLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({
        type: 'OPEN_NEXUS_APP',
        data: postData,
      });
      closeModal();
    });

    // Auto-generate on open
    generateBtn.click();
  }

  function closeModal() {
    if (currentModal) {
      currentModal.remove();
      currentModal = null;
    }
  }

  // ============================================================================
  // OBSERVER & INITIALIZATION
  // ============================================================================

  function processNewPosts() {
    if (isProcessing) return;
    isProcessing = true;

    const posts = findLinkedInPosts();
    posts.forEach((post) => {
      injectNexusButton(post);
    });

    isProcessing = false;
  }

  // Initial scan
  setTimeout(processNewPosts, 1000);

  // Watch for new posts (infinite scroll)
  const observer = new MutationObserver((mutations) => {
    let hasNewPosts = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        hasNewPosts = true;
        break;
      }
    }
    if (hasNewPosts) {
      setTimeout(processNewPosts, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Periodic rescan (fallback)
  setInterval(processNewPosts, 3000);

  // Handle keyboard shortcut
  document.addEventListener('keydown', (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && currentModal) {
      closeModal();
    }
  });

  console.log('[NEXUS] LinkedIn content script loaded');
})();
