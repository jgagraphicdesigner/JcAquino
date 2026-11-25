(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-listing-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carnivore-slides');
    const slides = [...track.children];
    const counter = carousel.querySelector('[data-slide-count]');
    const current = () => Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth));
    let scrollTimer;

    function move(index) {
      const next = (index + slides.length) % slides.length;
      track.scrollTo({
        left: next * track.clientWidth,
        behavior: reducedMotion.matches || Math.abs(next - current()) > 1 ? 'instant' : 'smooth'
      });
    }

    function updateCounter() {
      clearTimeout(scrollTimer);
      const value = `${current() + 1} / ${slides.length}`;
      if (counter.textContent !== value) counter.textContent = value;
    }
    track.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateCounter, 100);
    }, { passive: true });
    track.addEventListener('scrollend', updateCounter);
    carousel.querySelectorAll('[data-slide-step]').forEach(button => {
      button.addEventListener('click', () => move(current() + Number(button.dataset.slideStep)));
    });
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      const index = { ArrowLeft: current() - 1, ArrowRight: current() + 1, Home: 0, End: slides.length - 1 }[event.key];
      if (index === undefined) return;
      event.preventDefault();
      move(index);
    });
    track.dataset.enhanced = '';
    counter.parentElement.hidden = false;
  });

  document.querySelectorAll('[data-aplus-comparison]').forEach(comparison => {
    const moduleSelect = comparison.querySelector('[data-module-select]');
    const moduleNote = comparison.querySelector('[data-module-note]');
    const screens = comparison.querySelectorAll('[data-aplus-scroll]');

    function showModule() {
      const selected = moduleSelect.selectedOptions[0];
      screens.forEach(screen => {
        const image = screen.querySelector('img:not([hidden])');
        const position = selected.dataset[screen.dataset.aplusScroll];
        screen.scrollTop = Number(position) * image.offsetHeight;
      });
      moduleNote.textContent = selected.dataset.before === ''
        ? `The original has no dedicated ${selected.textContent.toLowerCase()} module. The After preview shows the addition.`
        : '';
    }

    moduleSelect.closest('.carnivore-module-control').hidden = false;
    moduleSelect.addEventListener('change', showModule);
    screens.forEach(screen => {
      screen.querySelectorAll('img').forEach(image => image.addEventListener('load', showModule));
    });
    showModule();
  });

  const artworkButtons = [...document.querySelectorAll('[data-carnivore-layout]')];
  const mobileArtwork = window.matchMedia('(max-width: 640px)');
  function selectArtwork(layout) {
    document.querySelectorAll('[data-carnivore-document]').forEach(viewer => {
      viewer.dataset.format = layout;
      viewer.querySelectorAll('[data-carnivore-artwork]').forEach(image => {
        image.hidden = image.dataset.carnivoreArtwork !== layout;
      });
      viewer.scrollTop = 0;
    });
    artworkButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.carnivoreLayout === layout));
    });
    document.querySelectorAll('[data-carnivore-full-layout]').forEach(link => {
      link.href = link.dataset[layout + 'Href'];
    });
    document.querySelectorAll('[data-module-select]').forEach(select => {
      select.dispatchEvent(new Event('change'));
    });
  }
  artworkButtons.forEach(button => button.addEventListener('click', () => selectArtwork(button.dataset.carnivoreLayout)));
  if (artworkButtons.length) {
    document.querySelectorAll('.carnivore-layout-switch').forEach(group => { group.hidden = false; });
    selectArtwork(mobileArtwork.matches ? 'mobile' : 'desktop');
    mobileArtwork.addEventListener('change', event => selectArtwork(event.matches ? 'mobile' : 'desktop'));
  }

  const tabs = document.querySelector('[data-comparison-tabs]');
  if (!tabs) return;

  const buttons = [...tabs.querySelectorAll('button')];
  const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
  if (!panels.length || panels.some(panel => !panel)) return;

  function select(index, focus = false) {
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) buttons[index].focus();
  }

  tabs.setAttribute('role', 'tablist');
  buttons.forEach((button, i) => {
    button.setAttribute('role', 'tab');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', button.id);
    button.addEventListener('click', () => select(i));
    button.addEventListener('keydown', event => {
      const next = {
        ArrowLeft: (i + buttons.length - 1) % buttons.length,
        ArrowRight: (i + 1) % buttons.length,
        Home: 0,
        End: buttons.length - 1
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
  select(0);
  tabs.closest('.carnivore-section').classList.add('carnivore-enhanced');
  tabs.hidden = false;
})();
