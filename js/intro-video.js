(function () {
  const video = document.getElementById('intro-video');
  const button = document.querySelector('.intro-play');
  if (!video || !button) return;

  function syncButton() {
    const label = video.ended ? 'Replay introduction video' : 'Play introduction video';
    button.hidden = !video.paused || Boolean(video.error);
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  // Keep the native player usable if this enhancement is unavailable.
  video.controls = !video.paused;
  syncButton();

  button.addEventListener('click', async function () {
    button.hidden = true;
    video.controls = true;
    try {
      if (video.ended) video.currentTime = 0;
      await video.play();
      video.focus({ preventScroll: true });
    } catch {
      syncButton();
      if (!button.hidden) button.focus({ preventScroll: true });
    }
  });

  ['play', 'playing', 'pause', 'ended', 'seeked'].forEach(event => video.addEventListener(event, syncButton));
  video.addEventListener('error', function () {
    video.controls = true;
    syncButton();
  });
}());
