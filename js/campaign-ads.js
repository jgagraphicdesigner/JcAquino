(() => {
  const videos = document.querySelectorAll('#video-ads video');
  videos.forEach(video => {
    video.addEventListener('play', () => {
      videos.forEach(other => {
        if (other !== video) other.pause();
      });
    });
  });
})();
