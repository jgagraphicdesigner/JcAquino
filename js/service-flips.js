(() => {
  const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  document.querySelectorAll('[data-service-flip]').forEach(card => {
    const front = card.querySelector('.svc-front');
    const back = card.querySelector('.svc-back');
    const button = card.querySelector('.svc-flip-toggle');
    let touchStart = null;
    let suppressClickUntil = 0;

    function setFlipped(flipped) {
      card.classList.toggle('is-flipped', flipped);
      front.inert = flipped;
      back.inert = !flipped;
      front.setAttribute('aria-hidden', String(flipped));
      back.setAttribute('aria-hidden', String(!flipped));
      button.setAttribute('aria-pressed', String(flipped));
      button.setAttribute('aria-label', `${flipped ? 'Show service details' : 'Show sample project'}: ${card.dataset.service}`);
      button.title = flipped ? 'Show service details' : 'Show sample project';
      if (flipped) back.querySelector('img').loading = 'eager';
    }

    card.prepend(button);
    back.hidden = false;
    button.hidden = false;
    card.classList.add('is-flip-ready');
    setFlipped(false);

    card.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && hoverPointer.matches && !card.contains(document.activeElement)) {
        setFlipped(true);
      }
    });
    card.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && hoverPointer.matches && !card.contains(document.activeElement)) {
        setFlipped(false);
      }
    });
    card.addEventListener('focusout', event => {
      if (hoverPointer.matches && !card.contains(event.relatedTarget) && !card.matches(':hover')) {
        setFlipped(false);
      }
    });
    button.addEventListener('click', () => setFlipped(!card.classList.contains('is-flipped')));
    card.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !card.classList.contains('is-flipped')) return;
      event.preventDefault();
      if (back.contains(document.activeElement)) button.focus();
      setFlipped(false);
    });

    // Passive touch listeners preserve native page scrolling during the swipe.
    card.addEventListener('touchstart', event => {
      touchStart = null;
      if (event.touches.length !== 1 || event.target.closest('button')) return;
      const touch = event.touches[0];
      touchStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: performance.now() };
    }, { passive: true });
    card.addEventListener('touchend', event => {
      if (!touchStart) return;
      const start = touchStart;
      touchStart = null;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === start.id);
      if (!touch || event.touches.length || performance.now() - start.time > 1200) return;
      const dy = touch.clientY - start.y;
      const dx = Math.abs(touch.clientX - start.x);
      if (dy < 48 || dx > dy * .65) return;
      suppressClickUntil = performance.now() + 500;
      if (front.contains(document.activeElement) || back.contains(document.activeElement)) button.focus({ preventScroll: true });
      setFlipped(!card.classList.contains('is-flipped'));
    }, { passive: true });
    card.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
    card.addEventListener('click', event => {
      if (event.detail > 0 && performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  });
})();
