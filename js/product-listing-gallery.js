(() => {
  const assetBase = 'assets/projects/product-images-packaging-label-design/';
  const version = '20260512-packaging-refresh-v2';
  // Only listing-image ranges are included; standalone print labels stay out of this gallery.
  const collections = [
    { slug: 'curosleep', name: 'Curosleep', count: 9, note: 'Product features, lifestyle imagery, and comparison graphics for a sleep-support brand.' },
    { slug: 'fuel-good', name: 'Fuel Good', count: 4, note: 'Benefit graphics, comparisons, and lifestyle compositions for electrolyte chews.' },
    { slug: 'lumiquor', name: 'Lumiquor', count: 7, note: 'Pet supplement listing images with product benefits, ingredients, and customer-story layouts.' },
    { slug: 'mb1', name: 'MB1', count: 13, note: 'Supplement product imagery, feature breakdowns, and comparison layouts.' },
    { slug: 'mr-bugz', name: 'Mr Bugz', count: 7, note: 'Product details, setup steps, and lifestyle scenes for an indoor insect-trap listing.' },
    { slug: 'puproot', name: 'Puproot', count: 5, note: 'Pet product listing images with ingredient, benefit, and product-use layouts.' },
    { slug: 'sofyre', name: 'Sofyre', count: 7, note: 'Product-focused listing images with feature comparisons and application settings.' }
  ];
  const pad = number => String(number).padStart(2, '0');
  const imageSrc = (brand, index) => `${assetBase}${brand.slug}/${pad(index + 1)}.jpg?v=${version}`;
  const imageTitle = (brand, index) => `${brand.name} Product Listing Image ${pad(index + 1)}`;
  const gallery = document.getElementById('pp-gallery');

  document.querySelector('[data-listing-count]').textContent = `${collections.reduce((sum, brand) => sum + brand.count, 0)} Listing Images`;
  document.getElementById('pp-brand-nav').innerHTML = collections.map(brand =>
    `<a href="work/product-images-packaging-label-design/#${brand.slug}">${brand.name}</a>`
  ).join('');
  gallery.innerHTML = collections.map((brand, brandIndex) => `
    <section class="pp-brand" id="${brand.slug}" aria-labelledby="${brand.slug}-title">
      <div class="pp-brand-head">
        <div class="pp-num">${pad(brandIndex + 1)}</div>
        <div class="pp-brand-copy"><h2 id="${brand.slug}-title">${brand.name}</h2><p>${brand.note}</p></div>
        <button class="pp-brand-open" type="button" data-brand="${brand.slug}" data-index="0" aria-label="View all ${brand.count} ${brand.name} product listing images">View gallery (${brand.count})<img src="assets/icons/chevron-right.svg" alt="" aria-hidden="true"></button>
      </div>
      <div class="pp-grid">
        ${Array.from({ length: brand.count }, (_, index) => `
          <figure class="pp-card">
            <button class="pp-preview" type="button" data-brand="${brand.slug}" data-index="${index}" aria-label="Open ${imageTitle(brand, index)}">
              <img src="${imageSrc(brand, index)}" alt="${imageTitle(brand, index)}" loading="lazy" decoding="async">
            </button>
            <figcaption><span>${pad(index + 1)}</span><strong>${brand.name} Listing Image</strong></figcaption>
          </figure>
        `).join('')}
      </div>
    </section>
  `).join('');

  const dialog = document.getElementById('pp-dialog');
  const image = document.getElementById('pp-dialog-img');
  const title = document.getElementById('pp-dialog-title');
  const count = document.getElementById('pp-dialog-count');
  const original = document.getElementById('pp-dialog-open');
  const thumbnails = document.getElementById('pp-dialog-thumbnails');
  const imageWrap = dialog.querySelector('.pp-dialog-image-wrap');
  const loader = dialog.querySelector('.pp-dialog-loader');
  const error = dialog.querySelector('.pp-dialog-error');
  const stage = dialog.querySelector('.pp-dialog-stage');
  let activeBrand = null;
  let activeIndex = 0;
  let opener = null;
  let renderToken = 0;
  let touchStart = null;

  function showSlide(index) {
    if (!activeBrand) return;
    activeIndex = (index + activeBrand.count) % activeBrand.count;
    const token = ++renderToken;
    const src = imageSrc(activeBrand, activeIndex);
    count.textContent = `Image ${activeIndex + 1} of ${activeBrand.count}`;
    imageWrap.setAttribute('aria-busy', 'true');
    loader.hidden = false;
    error.hidden = true;
    image.hidden = false;
    image.alt = imageTitle(activeBrand, activeIndex);
    original.href = src;
    original.setAttribute('aria-label', `Open full-size ${image.alt} in a new tab`);
    error.querySelector('a').href = src;

    function finish(failed) {
      if (token !== renderToken) return;
      imageWrap.setAttribute('aria-busy', 'false');
      loader.hidden = true;
      error.hidden = !failed;
      image.hidden = failed;
    }
    image.onload = () => finish(false);
    image.onerror = () => finish(true);
    image.src = src;
    if (image.complete && image.naturalWidth) finish(false);

    thumbnails.querySelectorAll('button').forEach((button, index) => {
      button.setAttribute('aria-current', String(index === activeIndex));
    });
    thumbnails.children[activeIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    for (const offset of [-1, 1]) {
      const neighbor = new Image();
      neighbor.src = imageSrc(activeBrand, (activeIndex + offset + activeBrand.count) % activeBrand.count);
    }
  }

  function openGallery(button) {
    const brand = collections.find(item => item.slug === button.dataset.brand);
    if (!brand) return;
    const index = Number(button.dataset.index);
    if (typeof dialog.showModal !== 'function') {
      window.open(imageSrc(brand, index), '_blank', 'noopener');
      return;
    }
    activeBrand = brand;
    opener = button;
    title.textContent = brand.name;
    stage.setAttribute('aria-label', `${brand.name} product listing images`);
    thumbnails.setAttribute('aria-label', `${brand.name} images`);
    thumbnails.innerHTML = Array.from({ length: brand.count }, (_, imageIndex) => `
      <button class="pp-dialog-thumbnail" type="button" data-index="${imageIndex}" aria-label="View ${brand.name} image ${imageIndex + 1}" aria-current="false" title="${brand.name} image ${imageIndex + 1}">
        <img src="${imageSrc(brand, imageIndex)}" alt="" loading="lazy" decoding="async">
      </button>
    `).join('');
    document.body.classList.add('pp-gallery-open');
    dialog.showModal();
    showSlide(index);
  }

  gallery.addEventListener('click', event => {
    const button = event.target.closest('.pp-preview, .pp-brand-open');
    if (button) openGallery(button);
  });
  dialog.querySelector('.pp-dialog-prev').addEventListener('click', () => showSlide(activeIndex - 1));
  dialog.querySelector('.pp-dialog-next').addEventListener('click', () => showSlide(activeIndex + 1));
  dialog.querySelector('.pp-dialog-close').addEventListener('click', () => dialog.close());
  thumbnails.addEventListener('click', event => {
    const button = event.target.closest('button[data-index]');
    if (button) showSlide(Number(button.dataset.index));
  });
  dialog.addEventListener('keydown', event => {
    if (!activeBrand || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') showSlide(0);
    else if (event.key === 'End') showSlide(activeBrand.count - 1);
    else showSlide(activeIndex + (event.key === 'ArrowRight' ? 1 : -1));
    if (event.target.closest('.pp-dialog-thumbnail')) thumbnails.children[activeIndex]?.focus();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    ++renderToken;
    activeBrand = null;
    touchStart = null;
    document.body.classList.remove('pp-gallery-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });

  stage.addEventListener('touchstart', event => {
    touchStart = null;
    if (event.touches.length !== 1 || event.target.closest('button')) return;
    const touch = event.touches[0];
    touchStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: performance.now() };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart) return;
    const start = touchStart;
    touchStart = null;
    const touch = Array.from(event.changedTouches).find(item => item.identifier === start.id);
    if (!touch || event.touches.length || performance.now() - start.time > 1200) return;
    const dx = touch.clientX - start.x;
    if (Math.abs(dx) < 48 || Math.abs(touch.clientY - start.y) > Math.abs(dx) * .65) return;
    showSlide(activeIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
})();
