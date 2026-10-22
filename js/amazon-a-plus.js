(() => {
  const mobileScreen = window.matchMedia('(max-width: 640px)').matches;

  document.querySelectorAll('[data-a-plus-project]').forEach(project => {
    const buttons = project.querySelectorAll('[data-select-layout]');
    if (!buttons.length) return;

    const viewer = project.querySelector('.a-plus-viewer');
    const images = viewer.querySelectorAll('[data-layout]');
    const openLink = project.querySelector('.a-plus-open');

    function selectLayout(layout) {
      const activeImage = Array.from(images).find(img => img.dataset.layout === layout);
      if (!activeImage) return;

      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.selectLayout === layout));
      });
      images.forEach(img => { img.hidden = img !== activeImage; });
      viewer.scrollTop = 0;
      viewer.setAttribute('aria-label', `${project.dataset.client} ${layout} artwork`);
      openLink.href = activeImage.src;
      openLink.setAttribute('aria-label', `Open ${project.dataset.client} ${layout} artwork in a new tab`);
    }

    buttons.forEach(button => {
      button.addEventListener('click', () => selectLayout(button.dataset.selectLayout));
    });
    selectLayout(mobileScreen ? 'mobile' : 'desktop');
  });
})();
