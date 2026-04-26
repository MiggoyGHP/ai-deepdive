/**
 * nav.js - Floating pill bar for non-linear section navigation
 */

const SECTIONS = [
  { num: '01', title: 'The Great Divide' },
  { num: '02', title: 'Strategic Frameworks' },
  { num: '03', title: 'Compute Regimes' },
  { num: '04', title: "Who's Who" },
  { num: '05', title: 'The Physical Stack' },
  { num: '06', title: "What's Changing Now" },
  { num: '07', title: 'Synthesis & Risks' },
];

function initNav() {
  // Discover section-header slide indices dynamically
  const allSlides = document.querySelectorAll('.reveal .slides > section');
  let sectionIdx = 0;
  allSlides.forEach((slide, index) => {
    if (slide.classList.contains('section-header') && sectionIdx < SECTIONS.length) {
      SECTIONS[sectionIdx].slideIndex = index;
      sectionIdx++;
    }
  });

  // Build pill bar HTML
  const nav = document.createElement('nav');
  nav.className = 'pill-nav glass';
  nav.setAttribute('aria-label', 'Section navigation');
  nav.innerHTML = SECTIONS.map(s =>
    `<button class="pill-nav-item" data-slide="${s.slideIndex}" data-title="${s.title}" aria-label="Section ${s.num}: ${s.title}">${s.num}</button>`
  ).join('');

  // Insert outside .reveal to avoid transform scaling issues
  document.body.appendChild(nav);

  // Click handler — jump to section
  nav.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill-nav-item');
    if (!pill) return;
    const slideIndex = parseInt(pill.dataset.slide);
    if (!isNaN(slideIndex)) {
      Reveal.slide(slideIndex);
    }
  });

  // Update active pill on slide change
  Reveal.on('slidechanged', updateActivePill);

  // Hide pill bar when chart modal is open
  const observer = new MutationObserver(() => {
    const modalOpen = !!document.querySelector('.chart-modal-overlay');
    nav.classList.toggle('hidden', modalOpen);
  });
  observer.observe(document.body, { childList: true });

  // Set initial active
  updateActivePill();
}

function updateActivePill() {
  const currentIndex = Reveal.getState().indexh;
  const pills = document.querySelectorAll('.pill-nav-item');

  // Find which section we're in (last section whose index <= current)
  let activeIdx = -1;
  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    if (currentIndex >= SECTIONS[i].slideIndex) {
      activeIdx = i;
      break;
    }
  }

  pills.forEach((pill, idx) => {
    pill.classList.toggle('active', idx === activeIdx);
  });
}

// Wait for Reveal.js to be ready
if (window.Reveal && Reveal.isReady && Reveal.isReady()) {
  initNav();
} else if (window.Reveal) {
  Reveal.on('ready', initNav);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    Reveal.on('ready', initNav);
  });
}
