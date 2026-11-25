(() => {
  const form = document.getElementById('questionnaire-form');
  if (!form) return;
  const config = window.JC_QUESTIONNAIRE_CONFIG || { mode: 'preview', endpoint: '' };
  const steps = [...form.querySelectorAll('[data-step]')];
  const navigation = [...document.querySelectorAll('[data-step-link]')];
  const progress = document.querySelector('.questionnaire-progress');
  const review = form.querySelector('.questionnaire-review');
  const complete = document.querySelector('.questionnaire-complete');
  const errors = document.getElementById('questionnaire-errors');
  const next = form.querySelector('[data-next]');
  const back = form.querySelector('[data-back]');
  const consent = form.elements.namedItem('consent');
  const sections = [
    { title: 'Amazon account', fields: [
      ['brand_registration', 'Amazon Brand Registry'],
      ['premium_a_plus', 'Premium A+ unlocked']
    ] },
    { title: 'The basics', fields: [
      ['name', 'Full name'], ['email', 'Contact email'],
      ['brand_name', 'Brand name'], ['product_name', 'Product name'],
      ['brand_website', 'Brand website URL'], ['amazon_listing', 'Amazon listing URL or ASIN'],
      ['marketplace', 'Marketplace region'], ['social_links', 'Social media links']
    ] },
    { title: 'Your product', fields: [
      ['product_problem', 'Product and problem it solves'],
      ['differentiator', 'What sets it apart'],
      ['usp_1', 'Selling point 1'], ['usp_2', 'Selling point 2'], ['usp_3', 'Selling point 3'],
      ['usp_4', 'Selling point 4'], ['usp_5', 'Selling point 5'],
      ['third_party_evidence', 'Third-party backing']
    ] },
    { title: 'Your customers', fields: [
      ['ideal_customer', 'Ideal customer'], ['not_for', 'Who it is not for'],
      ['biggest_objection', 'Biggest buying objection'],
      ['customer_review_1', 'Customer review 1'], ['customer_review_2', 'Customer review 2'],
      ['customer_review_3', 'Customer review 3'], ['customer_review_4', 'Customer review 4'],
      ['customer_review_5', 'Customer review 5']
    ] },
    { title: 'Project details', fields: [
      ['services', 'Services requested'], ['brand_assets', 'Available brand assets'],
      ['asset_links', 'Brand asset links'], ['competitor_links', 'Competitor links and notes'],
      ['deadline', 'Preferred deadline'], ['additional_notes', 'Additional notes']
    ] }
  ];
  const labels = new Map(sections.flatMap(section => section.fields));
  let current = 0;
  let furthest = 0;
  let dirty = false;
  let sending = false;
  let delivered = false;
  const preview = config.mode === 'preview';

  // Only explicit live configuration can send to the approved provider.
  function deliveryEndpoint() {
    if (config.mode !== 'live') return null;
    try {
      const url = new URL(config.endpoint);
      return url.origin === 'https://formspree.io' &&
        /^\/f\/[a-z0-9]{6,32}$/.test(url.pathname) &&
        !url.username && !url.password && !url.search && !url.hash
        ? url.href : null;
    } catch { return null; }
  }

  function values(name) {
    return new FormData(form).getAll(name).filter(value => typeof value === 'string' && value.trim()).join('\n');
  }

  function clearErrors() {
    errors.hidden = true;
    errors.replaceChildren();
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  }

  function showErrors(items, heading = 'Please check the following:') {
    clearErrors();
    const title = document.createElement('strong');
    title.textContent = heading;
    errors.append(title);
    if (items.length) {
      const list = document.createElement('ul');
      items.forEach(({ field, message }) => {
        field.setAttribute('aria-invalid', 'true');
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.textContent = message;
        link.href = new URL('#' + field.id, location.href).href;
        link.addEventListener('click', event => {
          event.preventDefault();
          const details = field.closest('details');
          if (details) details.open = true;
          field.focus();
        });
        item.append(link);
        list.append(item);
      });
      errors.append(list);
    }
    errors.hidden = false;
    if (items.length) items[0].field.focus({ preventScroll: true });
    errors.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function validateStep(index) {
    const result = [];
    const seen = new Set();
    const serviceGroup = steps[index].querySelector('[data-required-options]');
    if (serviceGroup) {
      serviceGroup.querySelector('input').setCustomValidity(values('services') ? '' : 'Select at least one service.');
    }
    steps[index].querySelectorAll('input, textarea').forEach(field => {
      if (seen.has(field.name)) return;
      seen.add(field.name);
      if (!['radio', 'checkbox'].includes(field.type)) {
        field.setCustomValidity(field.required && !field.value.trim() ? 'This field is required.' : '');
      }
      if (field.validity.valid) return;
      const label = labels.get(field.name) || field.name;
      let message = label + ': please complete this field.';
      if (field.type === 'radio') message = label + ': select an answer.';
      else if (field.type === 'email') message = label + ': enter a valid email address.';
      else if (field.type === 'url') message = label + ': enter a full URL, including https://.';
      else if (field.name === 'services') message = 'Select at least one service.';
      result.push({ field, message });
    });
    return result;
  }

  function goTo(index, focus = true) {
    clearErrors();
    current = index;
    furthest = Math.max(furthest, Math.min(index, 4));
    form.hidden = false;
    complete.hidden = true;
    review.hidden = index !== 5;
    consent.required = index === 5;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    navigation.forEach((button, i) => {
      button.disabled = sending || i > furthest;
      button.classList.toggle('is-complete', i < index);
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    progress.querySelector('progress').value = Math.min(index + 1, 5);
    document.querySelector('[data-step-status]').textContent = index === 5 ? '5 of 5 complete' : 'Step ' + (index + 1) + ' of 5';
    document.querySelector('[data-progress-label]').textContent = index === 5 ? 'Review your answers' : sections[index].title;
    back.hidden = index === 0;
    next.querySelector('span').textContent = index === 5
      ? (preview ? 'Finish preview' : 'Send questionnaire')
      : index === 4 ? 'Review answers' : 'Continue';
    if (index === 5) renderReview();
    if (focus) {
      const heading = index === 5 ? document.getElementById('questionnaire-review-title') : steps[index].querySelector('.questionnaire-step-title');
      heading.focus({ preventScroll: true });
      document.getElementById('questionnaire-start').scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function renderReview() {
    const target = document.querySelector('[data-review-answers]');
    target.replaceChildren();
    sections.forEach((section, index) => {
      const block = document.createElement('div');
      block.className = 'questionnaire-review-block';
      const header = document.createElement('div');
      header.className = 'questionnaire-review-heading';
      const title = document.createElement('h3');
      title.textContent = String(index + 1).padStart(2, '0') + ' / ' + section.title;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'questionnaire-icon-button';
      edit.setAttribute('aria-label', 'Edit ' + section.title.toLowerCase());
      edit.title = 'Edit ' + section.title.toLowerCase();
      const icon = document.createElement('img');
      icon.src = 'assets/icons/pencil-line.svg';
      icon.width = icon.height = 16;
      icon.alt = '';
      edit.append(icon);
      edit.addEventListener('click', () => goTo(index));
      header.append(title, edit);
      const list = document.createElement('dl');
      section.fields.forEach(([name, label]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        term.textContent = label;
        const description = document.createElement('dd');
        description.textContent = values(name) || 'Not provided';
        row.append(term, description);
        list.append(row);
      });
      block.append(header, list);
      target.append(block);
    });
  }

  function report() {
    return [
      'JC AQUINO - PRODUCT & BRAND QUESTIONNAIRE',
      ...sections.map((section, index) => '\n' + (index + 1) + '. ' + section.title.toUpperCase() + '\n\n' +
        section.fields.map(([name, label]) => label + ':\n' + (values(name) || 'Not provided')).join('\n\n')),
      '\nConsent:\n' + (consent.checked ? consent.value : 'Not yet given')
    ].join('\n');
  }

  function finish(wasSent) {
    delivered = wasSent;
    form.hidden = true;
    complete.hidden = false;
    navigation.forEach(button => { button.disabled = true; button.removeAttribute('aria-current'); });
    document.querySelector('[data-progress-label]').textContent = wasSent ? 'Submitted' : 'Preview complete';
    document.querySelector('[data-complete-label]').textContent = wasSent ? 'Thank you' : 'Local preview';
    document.getElementById('questionnaire-complete-title').textContent = wasSent ? 'Your brief is submitted.' : 'Preview complete.';
    document.querySelector('[data-complete-message]').textContent = wasSent
      ? 'Your questionnaire has been accepted by the form service for JC Aquino. Thank you for sharing your project.'
      : 'No answers were emailed. The form is ready for review; email delivery still needs to be connected.';
    document.getElementById('questionnaire-complete-title').focus({ preventScroll: true });
    document.getElementById('questionnaire-start').scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || delivered) return;
    if (current < 5) {
      const problems = validateStep(current);
      if (problems.length) return showErrors(problems);
      goTo(current + 1);
      return;
    }
    for (let i = 0; i < steps.length; i++) {
      const problems = validateStep(i);
      if (problems.length) { goTo(i); showErrors(problems); return; }
    }
    if (!consent.checked) return showErrors([{ field: consent, message: 'Please confirm that you agree to share these project details.' }]);
    if (form.elements.namedItem('_gotcha').value) {
      showErrors([], 'Your questionnaire was not sent. Please reload the page and try again.');
      return;
    }
    if (preview) return finish(false);
    const endpoint = deliveryEndpoint();
    if (!endpoint) return showErrors([], 'Email delivery is not connected. Nothing was sent; your answers are still here.');

    clearErrors();
    sending = true;
    next.disabled = true;
    back.disabled = true;
    form.setAttribute('aria-busy', 'true');
    navigation.forEach(button => { button.disabled = true; });
    review.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
    const request = new AbortController();
    const timeout = setTimeout(() => request.abort(), 25000);
    const body = {};
    sections.forEach(section => section.fields.forEach(([name]) => { body[name] = values(name); }));
    body.email = body.email.trim();
    body.name = body.name.trim();
    body.subject = 'New product & brand questionnaire';
    body.message = report();
    body.consent = consent.value;
    body._gotcha = '';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: request.signal, credentials: 'omit', redirect: 'error'
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true || result?.errors?.length) {
        showErrors([], response.status === 429
          ? 'Too many submissions. Nothing was confirmed; please wait before trying again.'
          : 'The form service could not accept your questionnaire. Your answers are still here; please try again.');
        return;
      }
      finish(true);
    } catch (error) {
      showErrors([], error.name === 'AbortError'
        ? 'The request timed out. Delivery was not confirmed. Keep a copy of your answers before trying again.'
        : 'Delivery could not be confirmed. Your answers are still here. Please check your connection or download a copy.');
    } finally {
      clearTimeout(timeout);
      sending = false;
      next.disabled = false;
      back.disabled = false;
      form.removeAttribute('aria-busy');
      navigation.forEach((button, i) => { button.disabled = delivered || i > furthest; });
      review.querySelectorAll('button, input').forEach(control => { control.disabled = false; });
    }
  });

  form.querySelectorAll('input, textarea').forEach((field, i) => {
    if (!field.id) field.id = 'questionnaire-field-' + i;
    field.addEventListener('input', () => {
      dirty = true;
      if (!errors.hidden) clearErrors();
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      if (field.name === 'services') form.querySelector('[name="services"]').setCustomValidity('');
    });
  });
  back.addEventListener('click', () => goTo(current - 1));
  navigation.forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.stepLink))));
  document.querySelector('[data-return-review]').addEventListener('click', () => {
    goTo(5);
    if (delivered) {
      next.hidden = true;
      back.hidden = true;
      review.querySelectorAll('button, input').forEach(control => { control.disabled = true; });
      navigation.forEach(button => { button.disabled = true; });
    }
  });
  document.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', () => {
    const blob = new Blob([report()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jc-aquino-product-brand-questionnaire.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  window.addEventListener('beforeunload', event => {
    if (dirty && !delivered && !complete.hidden) return;
    if (dirty && !delivered) { event.preventDefault(); event.returnValue = ''; }
  });

  document.querySelector('[data-delivery-status]').textContent = preview
    ? 'Local preview. No answers will be emailed.'
    : deliveryEndpoint()
      ? 'Project questionnaires for JC Aquino / ' + config.recipient
      : 'Email delivery is not connected. No answers can be sent yet.';
  if (!preview) {
    document.querySelector('[data-processing-note]').textContent = 'Your details will be sent to JC Aquino through Formspree for project planning and follow-up. Please do not include passwords, payment details, or account access.';
  }
  form.noValidate = true;
  next.disabled = false;
  document.querySelector('.questionnaire-step-nav').hidden = false;
  progress.hidden = false;
  form.querySelector('.questionnaire-actions').hidden = false;
  goTo(0, false);
})();
