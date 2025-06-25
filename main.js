import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import './export.js';

hljs.registerLanguage('javascript', javascript);

// DOM elements
const readBtn = document.getElementById('readClipboard');
const clearBtn = document.getElementById('clearStorage');
const exportTxt = document.getElementById('exportTxt');
const exportMd = document.getElementById('exportMd');
const snippetsDiv = document.getElementById('snippets');
const searchInput = document.getElementById('searchInput');
const autoCopyToggle = document.getElementById('autoCopyToggle');
const pinModeToggle = document.getElementById('pinModeToggle');
const categoryFilter = document.getElementById('categoryFilter');
const totalCount = document.getElementById('totalCount');
const favoriteCount = document.getElementById('favoriteCount');
const pinnedCount = document.getElementById('pinnedCount');

// State
let snippets = JSON.parse(localStorage.getItem('clipboard_snippets') || '[]');
let isAutoCopyEnabled = false;
let isPinModeEnabled = false;
let lastClipboardContent = '';
let clipboardCheckInterval = null;

// Enhanced snippet structure
function createSnippetObject(text) {
  const category = detectCategory(text);
  return {
    id: Date.now() + Math.random(),
    text: text,
    category: category,
    timestamp: Date.now(),
    favorite: false,
    pinned: false,
    copyCount: 0
  };
}

// Category detection
function detectCategory(text) {
  const trimmed = text.trim();
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return 'url';
  }
  if (trimmed.includes('@') && trimmed.includes('.') && trimmed.includes(' ')) {
    return 'email';
  }
  if (trimmed.includes('function') || trimmed.includes('const ') || 
      trimmed.includes('let ') || trimmed.includes('var ') ||
      trimmed.includes('{') || trimmed.includes('(') ||
      trimmed.includes(';') || trimmed.includes('console.')) {
    return 'code';
  }
  return 'text';
}

// Throttling function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Search and filter functionality
function filterSnippets() {
  const searchTerm = searchInput.value.toLowerCase();
  const categoryFilterValue = categoryFilter.value;
  const snippetItems = document.querySelectorAll('.snippet-item');
  
  snippetItems.forEach(item => {
    const text = item.querySelector('code').textContent.toLowerCase();
    const category = item.dataset.category;
    const isFavorite = item.classList.contains('favorite');
    const isPinned = item.classList.contains('pinned');
    
    let shouldShow = true;
    
    // Search filter
    if (searchTerm && !text.includes(searchTerm)) {
      shouldShow = false;
    }
    
    // Category filter
    if (categoryFilterValue && category !== categoryFilterValue) {
      if (categoryFilterValue === 'favorite' && !isFavorite) {
        shouldShow = false;
      } else if (categoryFilterValue !== 'favorite') {
        shouldShow = false;
      }
    }
    
    item.classList.toggle('hidden', !shouldShow);
  });
}

// Auto-copy functionality
async function checkClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text !== lastClipboardContent && !snippets.some(s => s.text === text)) {
      lastClipboardContent = text;
      addSnippet(text);
    }
  } catch (e) {
    // Silent fail for auto-copy
  }
}

function toggleAutoCopy() {
  isAutoCopyEnabled = !isAutoCopyEnabled;
  
  if (isAutoCopyEnabled) {
    autoCopyToggle.textContent = '🧠 Auto-copy: ON';
    autoCopyToggle.classList.add('active');
    clipboardCheckInterval = setInterval(checkClipboard, 1000);
  } else {
    autoCopyToggle.textContent = '🧠 Auto-copy: OFF';
    autoCopyToggle.classList.remove('active');
    if (clipboardCheckInterval) {
      clearInterval(clipboardCheckInterval);
      clipboardCheckInterval = null;
    }
  }
  
  localStorage.setItem('autoCopyEnabled', isAutoCopyEnabled);
}

function togglePinMode() {
  isPinModeEnabled = !isPinModeEnabled;
  
  if (isPinModeEnabled) {
    pinModeToggle.textContent = '📌 Pin Mode: ON';
    pinModeToggle.classList.add('active');
  } else {
    pinModeToggle.textContent = '📌 Pin Mode: OFF';
    pinModeToggle.classList.remove('active');
  }
  
  localStorage.setItem('pinModeEnabled', isPinModeEnabled);
}

// Add snippet to storage and render
function addSnippet(text) {
  const snippet = createSnippetObject(text);
  snippets.push(snippet);
  localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
  renderSnippets();
  updateStats();
}

// Copy snippet to clipboard
async function copySnippet(text, snippetId) {
  try {
    await navigator.clipboard.writeText(text);
    
    // Update copy count
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
      snippet.copyCount++;
      localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
    }
    
    // Show feedback
    const copyBtn = document.querySelector(`[data-snippet-id="${snippetId}"] .copy-btn`);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ Copied!';
    copyBtn.style.background = '#28a745';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '';
    }, 1000);
  } catch (e) {
    alert('Failed to copy to clipboard');
  }
}

// Toggle favorite
function toggleFavorite(snippetId) {
  const snippet = snippets.find(s => s.id === snippetId);
  if (snippet) {
    snippet.favorite = !snippet.favorite;
    localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
    renderSnippets();
    updateStats();
  }
}

// Toggle pin
function togglePin(snippetId) {
  const snippet = snippets.find(s => s.id === snippetId);
  if (snippet) {
    snippet.pinned = !snippet.pinned;
    localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
    renderSnippets();
    updateStats();
  }
}

// Delete snippet
function deleteSnippet(snippetId) {
  if (confirm('Are you sure you want to delete this snippet?')) {
    snippets = snippets.filter(s => s.id !== snippetId);
    localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
    renderSnippets();
    updateStats();
  }
}

// Update statistics
function updateStats() {
  const total = snippets.length;
  const favorites = snippets.filter(s => s.favorite).length;
  const pinned = snippets.filter(s => s.pinned).length;
  
  totalCount.textContent = `Total: ${total}`;
  favoriteCount.textContent = `Favorites: ${favorites}`;
  pinnedCount.textContent = `Pinned: ${pinned}`;
}

// Render snippets with enhanced features
function renderSnippets() {
  snippetsDiv.innerHTML = '';
  
  // Sort snippets: pinned first, then favorites, then by timestamp
  const sortedSnippets = [...snippets].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.timestamp - a.timestamp;
  });
  
  sortedSnippets.forEach((snippet) => {
    const snippetItem = document.createElement('div');
    snippetItem.className = 'snippet-item';
    snippetItem.dataset.snippetId = snippet.id;
    snippetItem.dataset.category = snippet.category;
    
    if (snippet.pinned) snippetItem.classList.add('pinned');
    if (snippet.favorite) snippetItem.classList.add('favorite');
    
    const header = document.createElement('div');
    header.className = 'snippet-header';
    
    const meta = document.createElement('div');
    meta.className = 'snippet-meta';
    
    const categoryBadge = document.createElement('span');
    categoryBadge.className = `category-badge category-${snippet.category}`;
    categoryBadge.textContent = snippet.category;
    
    const timestamp = document.createElement('span');
    timestamp.textContent = new Date(snippet.timestamp).toLocaleString();
    
    const copyCount = document.createElement('span');
    copyCount.textContent = `📋 ${snippet.copyCount}`;
    
    meta.appendChild(categoryBadge);
    meta.appendChild(timestamp);
    meta.appendChild(copyCount);
    
    const actions = document.createElement('div');
    actions.className = 'snippet-actions';
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.textContent = '📋 Copy';
    copyBtn.onclick = () => copySnippet(snippet.text, snippet.id);
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = `action-btn favorite-btn ${snippet.favorite ? 'favorited' : ''}`;
    favoriteBtn.textContent = snippet.favorite ? '⭐' : '☆';
    favoriteBtn.onclick = () => toggleFavorite(snippet.id);
    
    const pinBtn = document.createElement('button');
    pinBtn.className = `action-btn pin-btn ${snippet.pinned ? 'pinned' : ''}`;
    pinBtn.textContent = snippet.pinned ? '📌' : '📍';
    pinBtn.onclick = () => togglePin(snippet.id);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn';
    deleteBtn.textContent = '🗑';
    deleteBtn.onclick = () => deleteSnippet(snippet.id);
    
    actions.appendChild(copyBtn);
    actions.appendChild(favoriteBtn);
    actions.appendChild(pinBtn);
    actions.appendChild(deleteBtn);
    
    header.appendChild(meta);
    header.appendChild(actions);
    
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = snippet.text;
    code.classList.add('language-javascript');
    pre.appendChild(code);
    
    snippetItem.appendChild(header);
    snippetItem.appendChild(pre);
    snippetsDiv.appendChild(snippetItem);
    
    hljs.highlightElement(code);
  });
  
  filterSnippets();
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
  if (e.ctrlKey && e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 'v':
        e.preventDefault();
        readBtn.click();
        break;
      case 'c':
        e.preventDefault();
        // Copy the most recent snippet
        if (snippets.length > 0) {
          const mostRecent = snippets[snippets.length - 1];
          copySnippet(mostRecent.text, mostRecent.id);
        }
        break;
      case 'x':
        e.preventDefault();
        clearBtn.click();
        break;
    }
  }
}

// Event listeners
readBtn.addEventListener('click', throttle(async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && !snippets.some(s => s.text === text)) {
      addSnippet(text);
    }
  } catch (e) {
    alert('Clipboard access denied.');
  }
}, 1000));

clearBtn.addEventListener('click', throttle(() => {
  if (confirm('Are you sure you want to clear all snippets?')) {
    snippets = [];
    localStorage.removeItem('clipboard_snippets');
    renderSnippets();
    updateStats();
  }
}, 500));

exportTxt.addEventListener('click', throttle(() => {
  const blob = new Blob([snippets.map(s => s.text).join('\n\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'snippets.txt';
  a.click();
  URL.revokeObjectURL(url);
}, 1000));

exportMd.addEventListener('click', throttle(() => {
  const md = snippets.map(s => '```js\n' + s.text + '\n```').join('\n\n');
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'snippets.md';
  a.click();
  URL.revokeObjectURL(url);
}, 1000));

// Search and filter listeners
searchInput.addEventListener('input', throttle(() => {
  filterSnippets();
}, 300));

categoryFilter.addEventListener('change', () => {
  filterSnippets();
});

// Toggle listeners
autoCopyToggle.addEventListener('click', toggleAutoCopy);
pinModeToggle.addEventListener('click', togglePinMode);

// Keyboard shortcuts
document.addEventListener('keydown', handleKeyboardShortcuts);

// Initialize
function init() {
  // Restore states
  const savedAutoCopy = localStorage.getItem('autoCopyEnabled');
  const savedPinMode = localStorage.getItem('pinModeEnabled');
  
  if (savedAutoCopy === 'true') {
    toggleAutoCopy();
  }
  
  if (savedPinMode === 'true') {
    togglePinMode();
  }
  
  // Migrate old snippets to new format
  if (snippets.length > 0 && typeof snippets[0] === 'string') {
    snippets = snippets.map(text => createSnippetObject(text));
    localStorage.setItem('clipboard_snippets', JSON.stringify(snippets));
  }
  
  renderSnippets();
  updateStats();
}

init();
