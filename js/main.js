/**
 * main.js - Reveal.js initialization, event wiring, and slide animations
 */

document.addEventListener('DOMContentLoaded', function() {
  Reveal.initialize({
    hash: true,
    slideNumber: true,
    progress: true,
    controls: true,
    keyboard: true,
    overview: true,
    center: true,
    transition: 'slide',
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    width: 1600,
    height: 900,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.0,
    plugins: [],
  });

  // ── Slide change event handler ──
  Reveal.on('slidechanged', function(event) {
    const slide = event.currentSlide;

    // Animate barrel bars
    slide.querySelectorAll('.barrel-bar').forEach(bar => {
      const target = bar.dataset.width;
      if (target) {
        bar.style.width = '0%';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.width = target;
          });
        });
      }
    });

    // Animate SVG path draw-in (futures curves, price trajectory)
    slide.querySelectorAll('.trajectory-path, .curve-line').forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.classList.remove('drawn');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          path.style.transition = 'stroke-dashoffset 1.5s ease-out';
          path.style.strokeDashoffset = '0';
          path.classList.add('drawn');
        });
      });
    });

    // Animate peak markers (price trajectory chart)
    slide.querySelectorAll('.peak-marker, .peak-label').forEach(el => {
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), 1600);
    });

    // Animate sector diagnostic bars
    slide.querySelectorAll('.sector-bar').forEach(bar => {
      const score = bar.style.getPropertyValue('--score');
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = score;
        });
      });
    });

    // Animate chokepoint flow bars
    slide.querySelectorAll('.chokepoint-fill').forEach(fill => {
      const pct = fill.style.getPropertyValue('--flow-pct');
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = pct;
        });
      });
    });

    // Close any open popups on slide change
    const popup = document.querySelector('.term-popup');
    if (popup) popup.remove();

    // Close chart modal on slide change
    const modal = document.querySelector('.chart-modal-overlay');
    if (modal) {
      modal.remove();
      Reveal.configure({ keyboard: true });
    }
  });

  // ── Quiz slide scroll handling ──
  document.querySelector('.reveal').addEventListener('wheel', function(e) {
    const quizSlide = e.target.closest('.quiz-slide');
    if (quizSlide) {
      const atTop = quizSlide.scrollTop <= 0;
      const atBottom = quizSlide.scrollTop + quizSlide.clientHeight >= quizSlide.scrollHeight - 2;
      if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
        return; // let Reveal navigate
      }
      e.stopPropagation();
    }
  }, true);

  // ── Clickable agenda items ──
  // Discover section-header indices dynamically (same logic as nav.js)
  const sectionIndices = [];
  document.querySelectorAll('.reveal .slides > section').forEach((slide, index) => {
    if (slide.classList.contains('section-header')) {
      sectionIndices.push(index);
    }
  });

  document.querySelectorAll('.agenda-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const sectionNum = parseInt(this.dataset.section);
      if (!isNaN(sectionNum) && sectionIndices[sectionNum] !== undefined) {
        Reveal.slide(sectionIndices[sectionNum]);
      }
    });
  });
});
