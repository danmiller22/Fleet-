// Small helpers
export const cn = (...cls) => cls.filter(Boolean).join(" ");

// Toast functions
export const toast = {
  show(msg){ 
    const el = document.getElementById('toast'); 
    if(!el) return; 
    el.textContent = msg; 
    el.classList.add('show'); 
    setTimeout(()=>el.classList.remove('show'), 1800); 
  },
  success(msg){ this.show(msg); },
  error(msg){ this.show(msg); }
};

// Animation configs
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] }
};

export const cardTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { type: "spring", stiffness: 400, damping: 30, mass: 0.8 }
};
