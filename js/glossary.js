/**
 * glossary.js - Clickable term definition popup system.
 * Term data is in glossary-data.js (window.GLOSSARY).
 */

let activePopup = null;

function initGlossary() {
  document.addEventListener('click', function(e) {
    const term = e.target.closest('.term');
    if (term) {
      e.preventDefault();
      e.stopPropagation();
      showTermPopup(term);
      return;
    }
    if (activePopup && !e.target.closest('.term-popup')) {
      closePopup();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && activePopup) {
      closePopup();
    }
  });
}

function showTermPopup(el) {
  closePopup();

  const termKey = el.getAttribute('data-term') || el.textContent.trim();
  const glossary = (typeof window !== 'undefined' && window.GLOSSARY) || {};
  const definition = glossary[termKey];
  if (!definition) return;

  const popup = document.createElement('div');
  popup.className = 'term-popup';
  popup.innerHTML = `
    <div class="popup-title">${termKey}</div>
    <div class="popup-body">${definition}</div>
  `;

  document.body.appendChild(popup);
  activePopup = popup;

  // Position near the term element
  const rect = el.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();

  let top = rect.bottom + 8;
  let left = rect.left;

  // Keep within viewport
  if (top + popupRect.height > window.innerHeight - 20) {
    top = rect.top - popupRect.height - 8;
  }
  if (left + popupRect.width > window.innerWidth - 20) {
    left = window.innerWidth - popupRect.width - 20;
  }
  if (left < 20) left = 20;

  popup.style.top = top + 'px';
  popup.style.left = left + 'px';
}

function closePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlossary);
} else {
  initGlossary();
}
