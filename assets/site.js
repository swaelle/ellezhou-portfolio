(function () {
  var nav = document.getElementById('topnav');
  var shownBy = 'top', mouseTop = false, lastY = window.scrollY, lastT = performance.now();
  function showNav(on, by) {
    if (on) shownBy = by || 'scroll';
    if (nav) nav.style.transform = on ? 'translateY(0)' : 'translateY(-100%)';
  }
  window.addEventListener('scroll', function () {
    var y = window.scrollY, now = performance.now();
    var dy = y - lastY, dt = Math.max(now - lastT, 1);
    if (y <= 10) showNav(true, 'top');
    else if (dy > 4 && !mouseTop) showNav(false);
    else if (dy < 0 && (-dy / dt) > 0.9) showNav(true, 'scroll');
    lastY = y; lastT = now;
  }, { passive: true });

  var mq = function (q) { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  var trailOn = !mq('(hover: none)') && !mq('(prefers-reduced-motion: reduce)');
  var dots = [0, 1, 2, 3].map(function (i) { return document.getElementById('trail' + i); });
  var pos = dots.map(function () { return { x: -100, y: -100 }; });
  var target = { x: -100, y: -100 }, seen = false, visible = false;

  document.addEventListener('mousemove', function (e) {
    if (e.clientY < 72) {
      if (!mouseTop) { mouseTop = true; showNav(true, 'mouse'); }
    } else if (mouseTop) {
      mouseTop = false;
      if (shownBy === 'mouse' && window.scrollY > 10) showNav(false);
    }
    if (!trailOn) return;
    target.x = e.clientX; target.y = e.clientY;
    if (!seen) { seen = true; pos.forEach(function (p) { p.x = e.clientX; p.y = e.clientY; }); }
    visible = true;
  });
  document.documentElement.addEventListener('mouseleave', function () { visible = false; });

  if (!trailOn || !dots[0]) return;
  (function tick() {
    pos[0].x += (target.x - pos[0].x) * 0.5; pos[0].y += (target.y - pos[0].y) * 0.5;
    for (var i = 1; i < pos.length; i++) {
      pos[i].x += (pos[i - 1].x - pos[i].x) * 0.32;
      pos[i].y += (pos[i - 1].y - pos[i].y) * 0.32;
    }
    for (var j = 0; j < dots.length; j++) {
      if (!dots[j]) continue;
      dots[j].style.transform = 'translate3d(' + pos[j].x + 'px,' + pos[j].y + 'px,0)';
      dots[j].style.opacity = visible ? '1' : '0';
    }
    requestAnimationFrame(tick);
  })();
})();
