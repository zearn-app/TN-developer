// ============ LOADER ============
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hide'), 700);
});

// ============ CURSOR GLOW ============
const glow = document.getElementById('cursorGlow');
window.addEventListener('mousemove', (e) => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

// ============ NAV ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.querySelector('.nav-links');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 8px 30px rgba(0,0,0,0.35)' : 'none';
});

// ============ TYPING ANIMATION ============
const typeTarget = document.getElementById('typeTarget');
const name = 'Zoroz';
let ti = 0;
function typeLoop() {
  if (ti <= name.length) {
    typeTarget.textContent = name.slice(0, ti);
    ti++;
    setTimeout(typeLoop, 140);
  }
}
setTimeout(typeLoop, 900);

// ============ FLOATING CODE SYMBOLS ============
const particlesEl = document.getElementById('particles');
const symbols = ['{ }', '< >', '.css', '.pt', '/>', '{ }'];
function spawnParticle() {
  const s = document.createElement('span');
  s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  s.style.left = Math.random() * 100 + '%';
  s.style.fontSize = (0.9 + Math.random() * 1.2) + 'rem';
  const dur = 10 + Math.random() * 10;
  s.style.animationDuration = dur + 's';
  particlesEl.appendChild(s);
  setTimeout(() => s.remove(), dur * 1000);
}
for (let i = 0; i < 8; i++) setTimeout(spawnParticle, i * 900);
setInterval(spawnParticle, 1600);

// ============ BLOB CANVAS BACKGROUND ============
const canvas = document.getElementById('blobCanvas');
const ctx = canvas.getContext('2d');
let w, h;
function resize() {
  w = canvas.width = canvas.offsetWidth;
  h = canvas.height = canvas.offsetHeight;
}
resize();
window.addEventListener('resize', resize);

const blobs = [
  { x: 0.25, y: 0.35, r: 220, dx: 0.00018, dy: 0.00013, c: '108,59,255' },
  { x: 0.75, y: 0.3, r: 260, dx: -0.00014, dy: 0.0002, c: '156,107,255' },
  { x: 0.5, y: 0.75, r: 200, dx: 0.00016, dy: -0.00017, c: '90,40,220' },
];
let t = 0;
function animateBlobs() {
  t += 1;
  ctx.clearRect(0, 0, w, h);
  blobs.forEach((b, i) => {
    const bx = (b.x + Math.sin(t * b.dx * 10 + i) * 0.06) * w;
    const by = (b.y + Math.cos(t * b.dy * 10 + i) * 0.06) * h;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
    grad.addColorStop(0, `rgba(${b.c},0.35)`);
    grad.addColorStop(1, `rgba(${b.c},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.fill();
  });
  requestAnimationFrame(animateBlobs);
}
animateBlobs();

// ============ SCROLL REVEAL ============
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ============ COUNTER ANIMATION ============
const counters = document.querySelectorAll('.stat-num');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = Math.max(1, Math.ceil(target / 40));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(iv); }
        el.textContent = cur + suffix;
      }, 30);
      counterIO.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(el => counterIO.observe(el));

// ============ SKILL BARS ============
const bars = document.querySelectorAll('.bar-fill');
const barIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.width = entry.target.dataset.fill + '%';
      barIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
bars.forEach(el => barIO.observe(el));

// ============ 3D TILT ON PROJECT CARDS ============
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ============ MAGNETIC BUTTONS ============
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  });
  btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
});
    
