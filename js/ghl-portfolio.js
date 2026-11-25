(() => {
  const preview = document.querySelector('[data-funnel-preview]');
  if (preview) {
    const pages = {
      book: { title: 'Free Book Offer', description: 'The revised Positively Geared paperback, $12 postage and handling, author credibility, reader reviews, and the optional $7 Set for Life upgrade with an audiobook bonus.', url: 'freebestsellingbook', desktop: [1425,13429], mobile: [390,12000] },
      discovery: { title: 'Free Discovery Call', description: 'The post-order invitation introduces the team, explains their buying approach, and brings the visitor to an embedded booking calendar.', url: 'freediscoverycall', desktop: [1425,10082], mobile: [390,12000] },
      confirmation: { title: 'Booking Confirmation', description: 'A dedicated booked-call page sets expectations, gives preparation steps, and keeps the visitor connected through the podcast and social channels.', url: 'confirmation', desktop: [1425,3362], mobile: [375,5140] }
    };
    const tabs = [...preview.querySelectorAll('[data-funnel-page]')];
    const layouts = [...preview.querySelectorAll('[data-funnel-layout]')];
    const viewer = preview.querySelector('.a-plus-viewer');
    const image = viewer.querySelector('img');
    const mockup = preview.querySelector('.a-plus-mockup');
    const open = preview.querySelector('.a-plus-open');
    let page = 'book';
    let layout = matchMedia('(max-width:640px)').matches ? 'mobile' : 'desktop';

    function render() {
      const selected = pages[page];
      image.src = `assets/projects/positively-geared-funnel/${page}-${layout}.webp`;
      [image.width,image.height] = selected[layout];
      image.alt = `${selected.title}: ${layout} page capture`;
      viewer.setAttribute('aria-label', `${selected.title} ${layout} preview`);
      viewer.scrollTop = 0;
      mockup.dataset.device = layout;
      mockup.setAttribute('aria-label', `${selected.title} ${layout === 'mobile' ? 'iPhone' : 'MacBook'} mockup`);
      preview.querySelector('[data-page-title]').textContent = selected.title;
      preview.querySelector('[data-page-description]').textContent = selected.description;
      preview.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby', `pg-tab-${page}`);
      preview.querySelector('[data-page-live]').href = `https://www.auspropertyprofessionals-invest.com.au/${selected.url}`;
      preview.querySelector('[data-page-note]').textContent = layout === 'mobile' && page !== 'confirmation' ? 'Mobile page capture, November 2026. First 12,000 pixels shown.' : 'Page capture, November 2026.';
      open.href = image.src;
      open.setAttribute('aria-label', `Open ${selected.title} ${layout} screenshot`);
      tabs.forEach(tab => {
        const active = tab.dataset.funnelPage === page;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      layouts.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.funnelLayout === layout)));
    }
    tabs.forEach((tab,index) => {
      tab.addEventListener('click', () => { page = tab.dataset.funnelPage; render(); });
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus();
      });
    });
    layouts.forEach(button => button.addEventListener('click', () => { layout = button.dataset.funnelLayout; render(); }));
    render();
  }

  const dialog = document.querySelector('.pg-shot-dialog');
  if (!dialog) return;
  let opener;
  document.querySelectorAll('[data-workflow-shot]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    opener = link;
    dialog.querySelector('h2').textContent = link.dataset.workflowShot;
    const image = dialog.querySelector('.pg-shot-scroll img');
    const scroll = dialog.querySelector('.pg-shot-scroll');
    const centerFlow = () => { scroll.scrollLeft = Math.max(0, image.clientWidth * .51 - scroll.clientWidth / 2); };
    image.onload = centerFlow;
    image.src = link.href;
    image.alt = `${link.dataset.workflowShot}: original GHL builder screenshot`;
    dialog.showModal();
    if (image.complete) centerFlow();
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => opener?.focus());
})();
