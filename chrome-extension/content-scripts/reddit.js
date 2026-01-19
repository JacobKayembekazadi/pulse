// ============================================================================
// NEXUS CHROME EXTENSION - REDDIT CONTENT SCRIPT
// Injects "Reply with NEXUS" buttons into Reddit posts and comments
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

  function findRedditPosts() {
    // Reddit posts (new design)
    const posts = document.querySelectorAll(
      'shreddit-post:not([' + PROCESSED_MARKER + ']), ' +
      '[data-testid="post-container"]:not([' + PROCESSED_MARKER + ']), ' +
      '.Post:not([' + PROCESSED_MARKER + '])'
    );

    // Reddit comments
    const comments = document.querySelectorAll(
      'shreddit-comment:not([' + PROCESSED_MARKER + ']), ' +
      '[data-testid="comment"]:not([' + PROCESSED_MARKER + ']), ' +
      '.Comment:not([' + PROCESSED_MARKER + '])'
    );

    return [...posts, ...comments];
  }

  function extractPostData(element) {
    try {
      const isComment = element.tagName.toLowerCase() === 'shreddit-comment' ||
                       element.classList.contains('Comment') ||
                       element.dataset.testid === 'comment';

      // Get author name
      let author = 'Unknown';
      const authorEl = element.querySelector(
        'a[href^="/user/"], [data-testid="post_author_link"], .author'
      );
      if (authorEl) {
        author = authorEl.textContent?.trim().replace('u/', '') || 'Unknown';
      }

      // Get content
      let content = '';
      const contentEl = element.querySelector(
        '[slot="text-body"], [data-testid="post-content"], .RichTextJSON-root, .md'
      );
      if (contentEl) {
        content = contentEl.textContent?.trim() || '';
      }

      // Get title for posts
      let title = '';
      if (!isComment) {
        const titleEl = element.querySelector(
          '[slot="title"], [data-testid="post-title"], .Post__title, h1'
        );
        title = titleEl?.textContent?.trim() || '';
      }

      // Get post URL
      let postUrl = window.location.href;
      const linkEl = element.querySelector(
        'a[href*="/comments/"]'
      );
      if (linkEl) {
        postUrl = linkEl.href;
      }

      // Get subreddit
      let subreddit = '';
      const subEl = element.querySelector(
        'a[href^="/r/"], [data-testid="subreddit-link"]'
      );
      if (subEl) {
        subreddit = subEl.textContent?.trim().replace('r/', '') || '';
      }

      // Get engagement
      const scoreEl = element.querySelector(
        '[score], [data-testid="vote-container"] faceplate-number, .score'
      );
      const score = parseInt(scoreEl?.textContent?.replace(/[^0-9-]/g, '') || '0');

      return {
        platform: 'reddit',
        author,
        content: title ? `${title}\n\n${content}` : content,
        title,
        postUrl,
        subreddit,
        isComment,
        engagement: { score },
      };
    } catch (error) {
      console.error('[NEXUS] Error extracting Reddit data:', error);
      return null;
    }
  }

  function injectNexusButton(element) {
    // Mark as processed
    element.setAttribute(PROCESSED_MARKER, 'true');

    // Find the action bar
    const actionsBar = element.querySelector(
      '[slot="action-row"], [slot="comment-action-row"], ' +
      '.Post__footer, .Comment__footer, ' +
      '[data-testid="post-bottom-bar"], [data-testid="comment-bottom-bar"]'
    );

    if (!actionsBar) return;

    // Check if button already exists
    if (actionsBar.querySelector('.' + NEXUS_BUTTON_CLASS)) return;

    // Create NEXUS button
    const nexusBtn = document.createElement('button');
    nexusBtn.className = NEXUS_BUTTON_CLASS + ' nexus-reddit-btn';
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
      const postData = extractPostData(element);
      if (postData) {
        showReplyModal(postData, element);
      }
    });

    // Insert button
    actionsBar.appendChild(nexusBtn);
  }

  // ============================================================================
  // REPLY MODAL
  // ============================================================================

  function showReplyModal(postData, element) {
    // Remove existing modal
    if (currentModal) {
      currentModal.remove();
    }

    const displayContent = postData.title
      ? `<strong>${postData.title}</strong><br/>${postData.content.replace(postData.title, '').trim().substring(0, 150)}`
      : postData.content.substring(0, 200);

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
          <div class="nexus-post-author">
            u/${postData.author}
            ${postData.subreddit ? `<span class="nexus-subreddit">in r/${postData.subreddit}</span>` : ''}
          </div>
          <div class="nexus-post-content">${displayContent}${postData.content.length > 200 ? '...' : ''}</div>
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
          <div class="nexus-char-count">0 characters</div>
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
            Reply
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
      charCount.textContent = `${textarea.value.length} characters`;
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
            platform: 'reddit',
          },
        });

        if (response.success) {
          textarea.value = response.reply;
        } else {
          textarea.value = response.fallback || 'Failed to generate reply. Please try again.';
          console.warn('[NEXUS] Generation error:', response.error);
        }

        charCount.textContent = `${textarea.value.length} characters`;
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
            platform: 'reddit',
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
      // Find and click the reply button
      const replyBtn = element.querySelector(
        'button[slot="reply-button"], ' +
        '[data-testid="comment-reply-button"], ' +
        '.reply-button, button:has-text("Reply")'
      );

      if (replyBtn) {
        replyBtn.click();

        // Wait for reply box to appear and insert text
        setTimeout(() => {
          const replyBox = document.querySelector(
            'div[contenteditable="true"], ' +
            'textarea[placeholder*="comment"], ' +
            '.public-DraftEditor-content'
          );

          if (replyBox) {
            if (replyBox.tagName === 'TEXTAREA') {
              replyBox.value = textarea.value;
              replyBox.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              replyBox.innerHTML = `<p>${textarea.value}</p>`;
              replyBox.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Log the reply as posted
            chrome.runtime.sendMessage({
              type: 'LOG_REPLY',
              data: {
                platform: 'reddit',
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
            // If can't find reply box, just copy to clipboard
            navigator.clipboard.writeText(textarea.value);
            alert('Reply box not found. Reply copied to clipboard - paste it manually.');
          }
        }, 500);
      } else {
        // If can't find reply button, copy and show message
        navigator.clipboard.writeText(textarea.value);
        alert('Could not find reply button. Reply copied to clipboard - paste it manually.');
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

    const posts = findRedditPosts();
    posts.forEach((post) => {
      injectNexusButton(post);
    });

    isProcessing = false;
  }

  // Initial scan
  setTimeout(processNewPosts, 1000);

  // Watch for new posts
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
    if (e.key === 'Escape' && currentModal) {
      closeModal();
    }
  });

  console.log('[NEXUS] Reddit content script loaded');
})();
