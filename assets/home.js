(function () {
  // Five phases switching
  var steps = Array.prototype.slice.call(document.querySelectorAll('.fp-step'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.fp-panel'));
  var progress = document.getElementById('fp-progress');
  function pick(i) {
    panels.forEach(function (p, k) { p.hidden = k !== i; });
    steps.forEach(function (b, k) {
      b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      var dot = b.querySelector('.fp-dot');
      if (dot) dot.style.backgroundColor = k === i ? '#FFFFFF' : '#111111';
    });
    if (progress) progress.style.width = (i * 25) + '%';
  }
  steps.forEach(function (b, k) { b.addEventListener('click', function () { pick(k); }); });

  // Shader opening
  var c = document.getElementById('gl');
  var src = document.querySelector('#top img');
  if (!c || !src) return;
  var gl = null;
  try { gl = c.getContext('webgl', { antialias: false, premultipliedAlpha: false }); } catch (e) { gl = null; }
  if (!gl) return;
  var vs = 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }';
  var fs = [
    'precision mediump float;',
    'uniform sampler2D u_tex; uniform vec2 u_res; uniform float u_t; uniform float u_ia;',
    'float m(float x){ return 1.0 - abs(mod(x, 2.0) - 1.0); }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);',
    '  p.y = -p.y;',
    '  p *= 1.15 + 0.45 * sin(u_t * 0.13);',
    '  float a = 0.04 + 0.10 * (0.5 + 0.5 * sin(u_t * 0.21));',
    '  p.x += a * sin(p.y * 3.2 + u_t * 0.55);',
    '  p.y += a * 0.8 * sin(p.x * 2.6 - u_t * 0.43);',
    '  vec2 q = p / vec2(u_ia, 1.0) + 0.5;',
    '  q.x += 0.02 * u_t;',
    '  gl_FragColor = texture2D(u_tex, vec2(m(q.x), m(q.y)));',
    '}'
  ].join('\n');
  function mk(type, s) {
    var sh = gl.createShader(type); gl.shaderSource(sh, s); gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }
  var v = mk(gl.VERTEX_SHADER, vs), f = mk(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(pr, 'u_res'), uT = gl.getUniformLocation(pr, 'u_t'), uIa = gl.getUniformLocation(pr, 'u_ia');
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var heroVisible = true;
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(c);
  var img = new Image();
  img.onload = function () {
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1f(uIa, img.width / img.height);
    var start = performance.now();
    function draw(t) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h); gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    c.style.opacity = '1';
    if (reduce) { draw(6.0); window.addEventListener('resize', function () { draw(6.0); }); return; }
    (function loop() {
      if (heroVisible) draw((performance.now() - start) / 1000);
      requestAnimationFrame(loop);
    })();
  };
  img.src = src.getAttribute('src');
})();
