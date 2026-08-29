(function () {
  var root = document.querySelector('[data-bg-component="hero-video"]');
  if (!root) return;
  var video = root.querySelector('video');
  var poster = root.querySelector('.bg-hero-video__poster');
  if (!video || !poster) return;

  if (root.getAttribute('data-enabled') !== 'true') {
    root.setAttribute('hidden', '');
    return;
  }

  function showPoster() {
    root.classList.remove('is-playing');
    poster.removeAttribute('hidden');
  }

  video.addEventListener('playing', function () {
    root.classList.add('is-playing');
    poster.setAttribute('hidden', '');
  });
  video.addEventListener('error', showPoster);
  video.addEventListener('stalled', showPoster);
  video.addEventListener('emptied', showPoster);
})();
