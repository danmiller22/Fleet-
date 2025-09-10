
// Lightweight motion add-on for Apple-like reveal animations.
(() => {
  const spring = 'cubic-bezier(.22,1,.36,1)';
  const t = 420;

  function prep(el){
    el.style.willChange = 'transform, opacity';
    el.style.transform = 'translateY(8px) scale(.995)';
    el.style.opacity = '0';
  }
  function play(el, delay=0){
    el.animate([
      { transform: 'translateY(8px) scale(.995)', opacity: 0 },
      { transform: 'translateY(0) scale(1)',      opacity: 1 }
    ], { duration: t, delay, easing: spring, fill: 'forwards' });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if(e.isIntersecting){
        observer.unobserve(e.target);
        const idx = Array.from(e.target.parentElement?.children || []).indexOf(e.target);
        play(e.target, Math.min(30 * idx, 200));
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  window.addEventListener('DOMContentLoaded', () => {
    // Panels / cards
    document.querySelectorAll('.panel').forEach(el => { prep(el); observer.observe(el); });
    // Table rows
    document.querySelectorAll('table tr').forEach((el, i) => {
      if(i === 0) return; prep(el); observer.observe(el);
    });
  });

  // Respect reduced motion
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if(mq.matches){ observer.disconnect(); }
})();
