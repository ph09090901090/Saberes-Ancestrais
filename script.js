const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

// ---------- Tema (claro/escuro/sistema) ----------
function applyTheme(theme){
  const root = document.documentElement;
  const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if(theme === 'system'){
    root.dataset.theme = sysDark ? 'dark' : '';
  } else {
    root.dataset.theme = theme === 'dark' ? 'dark' : '';
  }

  // manter botão ativo
  $$('.segmented__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.theme === theme);
  });
}

function initTheme(){
  const key = 'sar_theme';
  const saved = localStorage.getItem(key);
  const theme = saved || 'system';
  applyTheme(theme);

  // se system, marcar botão correto
  $$('.segmented__btn').forEach(btn => {
    btn.classList.toggle('is-active', (saved ? saved : 'system') === btn.dataset.theme);
  });

  $$('.segmented__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.theme;
      localStorage.setItem(key, t);
      applyTheme(t);
    });
  });

  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const saved2 = localStorage.getItem(key) || 'system';
      if(saved2 === 'system') applyTheme('system');
    });
  }
}

// ---------- Tamanho de fonte ----------
function initFont(){
  const key = 'sar_font';
  const root = document.documentElement;
  const valueEl = $('#fontValue');
  const min = 85;
  const max = 120;

  let saved = parseInt(localStorage.getItem(key) || '100', 10);
  saved = Math.max(min, Math.min(max, saved));

  root.style.setProperty('--fs-base', saved);
  if(valueEl) valueEl.textContent = saved + '%';

  $$('.font__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.font;
      let current = parseInt(root.style.getPropertyValue('--fs-base') || '100', 10);
      current = Number.isFinite(current) ? current : 100;
      current += dir === 'up' ? 5 : -5;
      current = Math.max(min, Math.min(max, current));
      root.style.setProperty('--fs-base', current);
      if(valueEl) valueEl.textContent = current + '%';
      localStorage.setItem(key, String(current));
    });
  });
}

// ---------- Navbar responsiva ----------
function initNav(){
  const toggle = $('.nav__toggle');
  const menu = $('#nav-menu');
  if(!toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });

  // fechar ao clicar em link
  $$('#nav-menu a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  // fechar no resize para desktop
  window.addEventListener('resize', () => {
    if(window.innerWidth > 720) setOpen(false);
  });
}

// ---------- Destaque da seção ativa ----------
function initActiveSection(){
  const anchors = $$('#nav-menu a[data-section]');
  const sections = anchors
    .map(a => document.getElementById(a.dataset.section))
    .filter(Boolean);

  if(!sections.length) return;

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];

    if(!visible) return;
    const id = visible.target.id;
    anchors.forEach(a => a.classList.toggle('is-active', a.dataset.section === id));
  }, { root: null, threshold: [0.2, 0.35, 0.5] });

  sections.forEach(s => io.observe(s));
}

// ---------- Progress bar + voltar ao topo ----------
function initProgressAndTop(){
  const bar = $('#progressBar');
  const toTop = $('#toTop');

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (scrollTop / max) * 100 : 0;
    if(bar) bar.style.width = pct + '%';

    if(toTop){
      toTop.hidden = scrollTop < 650;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if(toTop){
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // link do footer
  const backFooter = $('#backToTopFooter');
  if(backFooter) backFooter.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
}

// ---------- Scroll suave (fallback) ----------
function initSmoothScroll(){
  // browser já faz, mas preserva para âncoras com foco
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    const href = a.getAttribute('href');
    if(!href || href === '#') return;

    const target = document.querySelector(href);
    if(target){
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', href);
    }
  });
}

// ---------- Animações discretas ----------
function initRevealOnScroll(){
  const items = $$('[data-observe]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if(en.isIntersecting){
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(i => io.observe(i));
}

// ---------- Lightbox (Galeria) ----------
function initGallery(){
  const modal = $('#modal');
  const backdrop = $('.modal__backdrop');
  const closeBtn = $('[data-close]');
  const modalImg = $('#modalImg');
  const modalTitle = $('#modalTitle');

  const open = (src, title) => {
    if(!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modalImg.src = src;
    if(modalImg) modalImg.alt = title || 'Imagem';
    if(modalTitle) modalTitle.textContent = title || 'Imagem';
  };

  const close = () => {
    if(!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if(modalImg) modalImg.src = '';
  };

  $$('.gItem').forEach(fig => {
    const img = $('img', fig);
    const title = fig.dataset.title || img?.alt || 'Imagem';
    const src = img?.src;

    const handler = () => {
      if(src) open(src, title);
    };

    fig.addEventListener('click', handler);
    fig.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') handler();
    });
  });

  if(backdrop) backdrop.addEventListener('click', close);
  if(closeBtn) closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal && !modal.hidden) close();
  });
}

// ---------- FAQ accordion ----------
// details/summary já é nativo e acessível. Nada necessário.

// ---------- Quiz + certificado (PNG) ----------
function createCertPNG({name, scorePct, themeDark}){
  // Canvas para gerar um PNG simbólico com selo
  const canvas = document.createElement('canvas');
  const w = 1200;
  const h = 760;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const bg = themeDark ? '#0b1512' : '#F5F1E8';
  const text = themeDark ? '#eaf2ee' : '#10281e';
  const muted = themeDark ? 'rgba(234,242,238,0.72)' : 'rgba(16,40,30,0.72)';
  const border = themeDark ? 'rgba(234,242,238,0.18)' : 'rgba(16,40,30,0.14)';
  const gold = '#F5C86B';
  const green = '#0f3a2b';

  ctx.fillStyle = bg;
  ctx.fillRect(0,0,w,h);

  // borda suave
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  const pad = 44;
  roundRect(ctx, pad, pad, w-2*pad, h-2*pad, 34);
  ctx.stroke();

  // selo
  const cx = w-220;
  const cy = 170;
  ctx.save();
  ctx.fillStyle = 'rgba(245,200,107,0.18)';
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,200,107,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.font = '72px Georgia';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏛️', cx, cy);
  ctx.restore();

  // título
  ctx.fillStyle = text;
  ctx.font = '56px Merriweather';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Certificado Simbólico', pad+22, pad+24);

  // subtítulo
  ctx.fillStyle = muted;
  ctx.font = '28px Poppins';
  ctx.fillText('Saberes Ancestrais e Resiliência', pad+22, pad+96);

  // destaque
  ctx.fillStyle = gold;
  ctx.font = '92px Georgia';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${scorePct}%`, pad+22, pad+210);

  // texto principal
  ctx.fillStyle = text;
  ctx.font = '34px Poppins';
  ctx.fillText('Você demonstrou compreensão sobre', pad+22, pad+310);
  ctx.fillStyle = muted;
  ctx.font = '26px Poppins';
  ctx.fillText('Diáspora Africana, racismo ambiental e soluções sustentáveis.', pad+22, pad+360);

  // nome
  ctx.fillStyle = text;
  ctx.font = '40px Merriweather';
  ctx.fillText('Entregue para:', pad+22, pad+470);
  ctx.fillStyle = text;
  ctx.font = '44px Poppins';
  ctx.fillText(name || 'Participante', pad+22, pad+535);

  // rodapé
  ctx.fillStyle = muted;
  ctx.font = '22px Poppins';
  const dateStr = new Date().toLocaleDateString('pt-BR');
  ctx.fillText(`Data: ${dateStr}`, pad+22, h-pad-54);

  // marca
  ctx.fillStyle = 'rgba(15,58,43,0.12)';
  ctx.font = '92px Georgia';
  ctx.textAlign = 'right';
  ctx.fillText('SAR', w-pad-22, h-pad-54);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r){
  const radius = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius, y);
  ctx.arcTo(x+w, y, x+w, y+h, radius);
  ctx.arcTo(x+w, y+h, x, y+h, radius);
  ctx.arcTo(x, y+h, x, y, radius);
  ctx.arcTo(x, y, x+w, y, radius);
  ctx.closePath();
}

function initQuiz(){
  const form = $('#quizForm');
  const resultWrap = $('#quizResult');
  const scoreBadge = $('#scoreBadge');
  const scoreSummary = $('#scoreSummary');
  const cert = $('#cert');
  const certName = $('#certName');
  const certDate = $('#certDate');
  const resetBtn = $('#resetQuiz');
  const downloadBtn = $('#downloadCert');

  if(!form) return;

  // gabarito
  const answers = { q1: 'b', q2: 'b', q3: 'b', q4: 'b' };

  const getSelected = (qName) => {
    const checked = form.querySelector(`input[name="${qName}"]:checked`);
    return checked ? checked.value : null;
  };

  const grade = () => {
    const keys = Object.keys(answers);
    let correct = 0;
    keys.forEach(k => {
      const sel = getSelected(k);
      if(sel && sel === answers[k]) correct++;
    });
    const pct = Math.round((correct / keys.length) * 100);
    return { correct, total: keys.length, pct };
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const { pct } = grade();

    if(resultWrap) resultWrap.hidden = false;
    if(scoreBadge) scoreBadge.textContent = pct + '%';

    const summaryTxt = pct >= 70
      ? 'Você atingiu 70% ou mais — parabéns pela compreensão e pelo cuidado com o tema.'
      : 'Boa! Continue explorando as seções do site. A aprendizagem é um caminho.';

    if(scoreSummary) scoreSummary.textContent = summaryTxt;

    const themeDark = document.documentElement.dataset.theme === 'dark';
    const name = $('#name')?.value?.trim() || 'Participante';

    if(cert){
      if(pct >= 70){
        cert.hidden = false;
        if(certName) certName.textContent = name || 'Participante';
        if(certDate) certDate.textContent = new Date().toLocaleDateString('pt-BR');

        // preparar download
        const dataUrl = createCertPNG({ name: name || 'Participante', scorePct: pct, themeDark });
        downloadBtn.disabled = false;
        downloadBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `certificado-simb${pct}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        };
      } else {
        cert.hidden = true;
        if(downloadBtn) downloadBtn.disabled = true;
      }
    }
  });

  if(resetBtn){
    resetBtn.addEventListener('click', () => {
      form.reset();
      if(resultWrap) resultWrap.hidden = true;
      if(cert) cert.hidden = true;
      if(downloadBtn){ downloadBtn.disabled = false; downloadBtn.onclick = null; }
    });
  }
}

// ---------- Contato (demo) ----------
function initContact(){
  const form = $('#contactForm');
  const status = $('#contactStatus');
  if(!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name')?.value?.trim() || 'você';
    if(status){
      status.textContent = `Mensagem pronta para envio (demo). Obrigado, ${name}!`;
    }
    form.reset();
  });
}

// ---------- Boot ----------
function boot(){
  // year
  const y = $('#year');
  if(y) y.textContent = new Date().getFullYear();

  initTheme();
  initFont();
  initNav();
  initActiveSection();
  initProgressAndTop();
  initSmoothScroll();
  initRevealOnScroll();
  initGallery();
  initQuiz();
  initContact();
}

document.addEventListener('DOMContentLoaded', boot);

