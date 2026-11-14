// Вкладки «Продукт / Как я работаю»: клик и стрелки, как у нативного таблиста.
// Подложка выбранной вкладки переезжает, а панели меняются с коротким уходом и мягким входом
// со стороны той вкладки, куда переключились.
const calm = matchMedia('(prefers-reduced-motion: reduce)');
function syncPills(instant) {
  document.querySelectorAll('.tabs').forEach(list => {
    let pill = list.querySelector('.tabs__pill');
    if (!pill) { pill = document.createElement('span'); pill.className = 'tabs__pill'; pill.setAttribute('aria-hidden', 'true'); list.prepend(pill); }
    const on = list.querySelector('[aria-selected="true"]');
    if (!on || !on.offsetWidth) return;
    if (instant) pill.style.transition = 'none';
    pill.style.width = on.offsetWidth + 'px';
    pill.style.transform = `translateX(${on.offsetLeft - 4}px)`;
    list.classList.add('has-pill');
    if (instant) { void pill.offsetWidth; pill.style.transition = ''; }
  });
}
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return;
  const panelOf = t => document.getElementById(t.getAttribute('aria-controls'));
  let current = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];
  let leaving = null;
  const select = (tab, focus) => {
    if (focus) tab.focus();
    if (tab === current) return;
    const dir = tabs.indexOf(tab) > tabs.indexOf(current) ? 1 : -1;
    const from = panelOf(current), to = panelOf(tab);
    current = tab;
    tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    syncPills();
    // если прошлое переключение ещё идёт — доводим его мгновенно
    if (leaving) { leaving.cancel(); leaving = null; }
    tabs.forEach(t => { const p = panelOf(t); p.getAnimations().forEach(a => a.cancel()); if (p !== from) p.hidden = true; });
    const show = () => {
      from.hidden = true; to.hidden = false;
      revealAll(to);
      window.dispatchEvent(new Event('scroll'));
      if (!calm.matches) to.animate(
        [{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    };
    if (calm.matches || from.hidden) return show();
    leaving = from.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 12}px)` }],
      { duration: 140, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    leaving.onfinish = () => { leaving.cancel(); leaving = null; show(); };
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) select(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  syncPills(true);
  addEventListener('resize', () => syncPills(true));
  document.addEventListener('langchange', () => syncPills());
  if (document.fonts) document.fonts.ready.then(() => syncPills(true));
})();

// Появление блоков при прокрутке. Без скрипта всё видно сразу.
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(entries => entries.forEach(e => {
      const el = e.target;
      if (e.isIntersecting) {
        el.classList.add('is-in');
        clearTimeout(el._done);
        el._done = setTimeout(() => el.classList.add('is-done'), 1200);
      } else if (e.boundingClientRect.top > 0) {
        // ушёл вниз за экран (прокрутили вверх) — сбрасываем, чтобы сыграть снова
        clearTimeout(el._done);
        el.classList.remove('is-in', 'is-done');
      }
    }), { rootMargin: '0px 0px -18% 0px', threshold: 0 })
  : null;
function revealAll(root) {
  root.querySelectorAll('.reveal:not(.is-in)').forEach(el => io ? io.observe(el) : el.classList.add('is-in'));
}
revealAll(document);

// Шапка: наверху логотип и кнопки стоят по краям колонки,
// при прокрутке расходятся к краям экрана, а в центр приезжают вкладки.
(() => {
  const bar = document.querySelector('.bar');
  if (!bar) return;
  const mark = bar.querySelector('.wordmark');
  const end = bar.querySelector('.bar__end');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  // Наверху элементы стоят по краям героя, при прокрутке расходятся до краёв карточек
  const hero = document.querySelector('.hero__grid, .cs-hero__grid');
  const inset = () => {
    if (!hero || innerWidth < 861) return 0;
    return Math.max(0, hero.getBoundingClientRect().left - bar.firstElementChild.getBoundingClientRect().left);
  };
  let spread = null;
  const place = () => {
    const open = scrollY > 24;
    if (open === spread) return;
    spread = open;
    bar.classList.toggle('is-scrolled', open);
    const x = open ? 0 : inset();
    mark.style.transform = `translateX(${x}px)`;
    end.style.transform = `translateX(${-x}px)`;
  };
  const relayout = () => { spread = null; place(); };
  addEventListener('scroll', place, { passive: true });
  addEventListener('resize', relayout);
  // первая расстановка без анимации
  mark.style.transition = end.style.transition = 'none';
  place();
  requestAnimationFrame(() => requestAnimationFrame(() => { mark.style.transition = end.style.transition = ''; }));

  // копия вкладок в шапке
  const tabs = document.querySelector('.tabs');
  const slot = bar.querySelector('[data-bar-tabs]');
  if (!tabs || !slot) return;
  const copy = tabs.cloneNode(true);
  copy.removeAttribute('role');
  copy.querySelectorAll('[role]').forEach(b => {
    const real = document.getElementById(b.id);
    b.removeAttribute('id'); b.removeAttribute('role'); b.removeAttribute('aria-controls');
    b.tabIndex = -1;
    b.addEventListener('click', () => {
      real.click();
      document.getElementById('work').scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth' });
    });
    new MutationObserver(() => { b.setAttribute('aria-selected', real.getAttribute('aria-selected')); syncPills(); })
      .observe(real, { attributes: true, attributeFilter: ['aria-selected'] });
  });
  slot.append(copy);
  syncPills(true);
  new IntersectionObserver(([e]) => bar.classList.toggle('is-docked', !e.isIntersecting && e.boundingClientRect.top < 0))
    .observe(tabs);
})();

// Карточки кейсов привязаны к прокрутке: состояние зависит от того, где карточка на экране.
// Поэтому при прокрутке вверх они уходят тем же путём, каким пришли.
// Значение догоняет цель с небольшой инерцией, чтобы движение было мягким, а не рваным.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cards = [...document.querySelectorAll('.fig-card')];
  if (!cards.length) return;
  const clamp = v => Math.min(1, Math.max(0, v));
  const ease = p => 1 - Math.pow(1 - p, 3);
  const state = new Map(cards.map((c, i) => [c, { cur: 0, side: i % 2 ? 1 : -1, parts: [...c.querySelectorAll('.case__head > *, .case__open, .how__item > *')], media: c.querySelector('.case__demo > *'), clipEl: c.querySelector('.case--taxi > .case__bg') }]));
  const radius = () => getComputedStyle(document.documentElement).getPropertyValue('--radius-card').trim() || '32px';
  let r = radius();

  const target = c => {
    if (!c.offsetParent) return 1;
    const top = c.getBoundingClientRect().top, vh = innerHeight;
    // 0 — верх карточки у нижнего края экрана, 1 — поднялся на 45% высоты экрана
    return clamp((vh - top) / (vh * 0.45));
  };
  const paint = (c, s) => {
    const p = s.cur, e = ease(p), k = 1 - e;
    c.style.opacity = Math.min(1, p * 2.2);
    // в покое снимаем transform совсем: иначе Safari держит слой и теряет рамку выделения по краю
    c.style.transform = k < 0.001 ? '' : `translateY(${k * 96}px) scale(${0.92 + 0.08 * e}) rotate(${s.side * k * 1.5}deg)`;
    // у карточки с телефоном, выходящим за край, маску ставим на фон, а не на всю карточку,
    // иначе маска обрезает телефон сверху
    (s.clipEl || c).style.clipPath = k < 0.001 ? '' : `inset(${k * 18}% ${k * 8}% 0 ${k * 8}% round ${r})`;
    s.parts.forEach((el, i) => {
      const q = ease(clamp((p - 0.3 - i * 0.08) / 0.45));
      el.style.opacity = q;
      el.style.transform = q > 0.999 ? '' : `translateY(${(1 - q) * 24}px)`;
    });
    if (s.media) {
      const m = ease(clamp((p - 0.35) / 0.6));
      s.media.style.opacity = m;
      s.media.style.transform = m > 0.999 ? '' : `translateY(${(1 - m) * 64}px) scale(${1.06 - 0.06 * m})`;
    }
  };

  let raf = 0;
  const tick = () => {
    raf = 0;
    let moving = false;
    for (const [c, s] of state) {
      const t = target(c), d = t - s.cur;
      if (Math.abs(d) > 0.001) { s.cur += d * 0.16; moving = true; } else s.cur = t;
      paint(c, s);
    }
    if (moving) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { r = radius(); kick(); });
  // стартовое положение без инерции: то, что уже на экране, сразу видно
  for (const [c, s] of state) { s.cur = target(c) > 0.99 ? 1 : 0; paint(c, s); }
  kick();
})();

// Тема и язык: переключатели в шапке, выбор запоминаем
(() => {
  const d = document.documentElement;
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  document.querySelectorAll('[data-toggle-theme]').forEach(b => b.addEventListener('click', () => {
    const next = d.dataset.theme === 'dark' ? 'light' : 'dark';
    d.dataset.theme = next; save('theme', next);
  }));
  document.querySelectorAll('[data-toggle-lang]').forEach(b => b.addEventListener('click', () => {
    const next = d.dataset.lang === 'en' ? 'ru' : 'en';
    d.dataset.lang = next; d.lang = next; save('lang', next);
    document.title = d.dataset['title' + (next === 'en' ? 'En' : 'Ru')] || document.title;
    document.dispatchEvent(new Event('langchange'));
  }));
})();

// Цена как счётчик: меняются только те цифры, что изменились.
// Цена растёт — цифра уезжает вверх, новая приходит снизу; падает — наоборот.
const still = matchMedia('(prefers-reduced-motion: reduce)');
const roll = (out, prev, next, dir) => {
  const text = document.createElement('span'); text.className = 'visually-hidden'; text.textContent = next;
  const vis = document.createElement('span'); vis.className = 'roll'; vis.setAttribute('aria-hidden', 'true');
  const animate = dir && !still.matches && prev;
  const off = next.length - prev.length;
  let k = 0;
  [...next].reverse().forEach((ch, ri) => {
    const i = next.length - 1 - ri, was = prev[i - off];
    const span = document.createElement('span');
    if (!animate || !/\d/.test(ch) || ch === was) { span.textContent = ch; vis.prepend(span); return; }
    span.className = 'roll__slot';
    const col = document.createElement('span'); col.className = 'roll__col';
    const a = document.createElement('span'), b = document.createElement('span');
    a.textContent = was && /\d/.test(was) ? was : '\u00a0'; b.textContent = ch;
    if (dir > 0) col.append(a, b); else col.append(b, a);
    span.append(col); vis.prepend(span);
    const from = dir > 0 ? '0%' : '-50%', to = dir > 0 ? '-50%' : '0%';
    col.animate([{ transform: `translateY(${from})` }, { transform: `translateY(${to})` }],
      { duration: 300, delay: k++ * 30, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' });
  });
  out.replaceChildren(text, vis);
};

// Живые куски интерфейса в карточках
(() => {
  const lang = () => document.documentElement.dataset.lang === 'en' ? 'en' : 'ru';
  const t = (ru, en) => lang() === 'en' ? en : ru;
  const rub = n => n.toLocaleString('ru-RU') + ' ₽';
  const renders = [];

  // Цена как счётчик: меняются только те цифры, что изменились.
  // Цена растёт — цифра уезжает вверх, новая приходит снизу; падает — наоборот.
  // Новое нажатие во время анимации просто пересобирает число из текущего значения.
  // Такси: шаг 30 ₽, потолок 9999 ₽, подсказка о рыночной цене
  document.querySelectorAll('[data-taxi]').forEach(el => {
    let price = 450;
    const out = el.querySelector('[data-price]'), hint = el.querySelector('[data-hint]');
    const minus = el.querySelector('[data-step="-30"]'), plus = el.querySelector('[data-step="30"]');
    let shown = '';
    const render = (dir) => {
      const next = rub(price);
      roll(out, shown, next, dir);
      shown = next;
      const low = price < 420;
      hint.classList.toggle('is-low', low);
      hint.textContent = low ? t('Ниже рынка: водитель может не взять заказ', 'Below market: drivers may skip it')
        : price > 480 ? t('Выше рынка: машина найдётся быстрее', 'Above market: a car comes faster')
        : t('Рыночная цена 420–480 ₽', 'Typical fare 420–480 ₽');
      minus.disabled = price <= 90; plus.disabled = price >= 9999;
    };
    el.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => {
      const s = +b.dataset.step; price = Math.min(9999, Math.max(90, price + s)); render(s);
    }));
    render(); renders.push(() => render());
  });

  // Доставка: пять стадий заказа, нажатие переключает
  const stages = [
    ['Заказ оформлен', 'Order placed', '~35'], ['Ресторан принял заказ', 'Restaurant accepted', '~32'],
    ['Готовится', 'Cooking', '~25'], ['Заказ готов', 'Order is ready', '~15'], ['Курьер везёт заказ', 'Courier is on the way', '~8'],
    ['Заказ доставлен', 'Delivered', '']
  ];
  document.querySelectorAll('[data-la]').forEach(el => {
    let i = 0;
    const st = el.querySelector('[data-la-stage]'), eta = el.querySelector('[data-la-eta]'), bars = [...el.querySelectorAll('.ui-la__bar i')];
    const render = () => {
      const s = stages[i];
      st.textContent = t(s[0], s[1]);
      eta.textContent = s[2] ? `${s[2]} ${t('мин', 'min')}` : t('Готово', 'Done');
      bars.forEach((b, k) => b.classList.toggle('on', i === 5 || k <= i));
    };
    el.addEventListener('click', () => { i = (i + 1) % stages.length; render(); });
    render(); renders.push(render);
  });

  // Кошелёк: одна модель, три продукта
  const wallets = {
    driver: { sum: 1250, ru: 'Можно выходить на линию', en: 'Ready to go online' },
    courier: { sum: -1250, ru: 'Минус в пределах лимита −5 000 ₽. Пополните до конца смены', en: 'In the red within the −5,000 ₽ limit. Top up before the shift ends' },
    rest: { sum: 12480.5, ru: 'Списания за заказы идут с этого баланса', en: 'Order fees are charged from this balance' }
  };
  document.querySelectorAll('[data-wallet]').forEach(el => {
    let key = 'driver';
    const card = el.querySelector('[data-w-card]'), sum = el.querySelector('[data-w-sum]'), state = el.querySelector('[data-w-state]');
    const btns = [...el.querySelectorAll('[data-w]')];
    const render = () => {
      const w = wallets[key];
      sum.textContent = (w.sum < 0 ? '−' : '') + Math.abs(w.sum).toLocaleString('ru-RU', { minimumFractionDigits: 2 }) + ' ₽';
      state.textContent = t(w.ru, w.en);
      card.classList.toggle('is-minus', w.sum < 0);
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.w === key));
    };
    btns.forEach(b => b.addEventListener('click', () => { key = b.dataset.w; render(); }));
    render(); renders.push(render);
  });

  // Crispy → кухня: метка и иконка типа выдачи на карточке заказа
  const icons = {
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="#1C1C1F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    here: '<svg viewBox="0 0 24 24" fill="none" stroke="#1C1C1F" stroke-width="1.8" stroke-linecap="round"><path d="M3 14h18"/><path d="M5 14l1 4h12l1-4"/><path d="M12 6v3"/><circle cx="12" cy="11" r="2"/></svg>'
  };
  document.querySelectorAll('[data-order]').forEach(el => {
    let mode = 'go';
    const chip = el.querySelector('[data-o-chip]'), icon = el.querySelector('[data-o-icon]'), card = el.querySelector('.ui-order__card');
    const btns = [...el.querySelectorAll('[data-o]')];
    const render = (anim) => {
      chip.textContent = mode === 'go' ? t('С собой', 'To go') : t('В ресторане', 'Dine in');
      icon.innerHTML = icons[mode];
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.o === mode));
      if (anim) { card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip'); }
    };
    btns.forEach(b => b.addEventListener('click', () => { if (mode !== b.dataset.o) { mode = b.dataset.o; render(true); } }));
    render(); renders.push(() => render());
  });

  // Rim Group: было / стало
  document.querySelectorAll('[data-rim]').forEach(el => {
    const page = el.querySelector('[data-rim-page]'), btns = [...el.querySelectorAll('[data-r]')];
    btns.forEach(b => b.addEventListener('click', () => {
      page.dataset.rimPage = b.dataset.r;
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
  });

  document.addEventListener('langchange', () => renders.forEach(r => r()));
})();

// Свечение внутри карточки идёт за курсором
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.querySelectorAll('.case').forEach(card => {
    let raf = 0, x = 0, y = 0;
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      x = e.clientX - r.left; y = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
      });
    });
  });
})();

// Кейс: плавающая кнопка к живому интерфейсу. Прячется, пока телефон на экране и у подвала
(() => {
  const btn = document.querySelector('[data-float]');
  const target = btn && document.querySelector(btn.getAttribute('href'));
  if (!btn || !target || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  const update = () => btn.classList.toggle('is-hidden', seen.size > 0);
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); update(); });
  [target, document.querySelector('.foot')].forEach(el => el && io.observe(el));
  btn.classList.add('is-hidden');
  btn.addEventListener('click', e => {
    e.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
})();

// Раскрывающиеся блоки: высота меняется плавно, контент ниже съезжает вместе с ней.
// Повторный клик во время анимации разворачивает её из текущей высоты, без рывка.
(() => {
  document.querySelectorAll('details.cs-more').forEach(el => {
    const sum = el.querySelector('summary');
    let anim = null;
    const run = open => {
      const start = el.getBoundingClientRect().height;
      if (anim) anim.cancel();
      el.open = true;
      el.classList.toggle('is-closing', !open);
      const full = el.scrollHeight;
      const end = open ? full : sum.offsetHeight;
      if (calm.matches) { el.open = open; el.classList.remove('is-closing'); return; }
      el.style.overflow = 'hidden';
      anim = el.animate({ height: [start + 'px', end + 'px'] },
        { duration: open ? 420 : 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      anim.onfinish = () => { anim = null; el.open = open; el.classList.remove('is-closing'); el.style.overflow = ''; };
      anim.oncancel = () => { el.style.overflow = ''; };
    };
    sum.addEventListener('click', e => {
      e.preventDefault();
      run(anim ? el.classList.contains('is-closing') : !el.open);
    });
  });
})();

/* Экран кейса крупно: клик по миниатюре открывает её в модальном окне */
(() => {
  const d = document;
  let lb, pic;
  const open = img => {
    if (!lb) {
      lb = d.createElement('dialog'); lb.className = 'lb';
      const en = d.documentElement.lang === 'en';
      lb.innerHTML = '<img alt=""><button class="lb__close" type="button">×</button>';
      lb.querySelector('.lb__close').setAttribute('aria-label', en ? 'Close' : 'Закрыть');
      pic = lb.querySelector('img');
      lb.addEventListener('click', e => { if (e.target !== pic) lb.close(); });
      d.body.appendChild(lb);
    }
    pic.src = img.currentSrc || img.src; pic.alt = img.alt;
    lb.classList.toggle('lb--tall', img.naturalHeight / img.naturalWidth > 1.6 && img.naturalWidth > 1000);
    lb.showModal();
    lb.scrollTop = 0;
  };
  d.addEventListener('click', e => {
    const b = e.target.closest('.zoom');
    if (!b) return;
    e.preventDefault();
    open(b.querySelector('img'));
  });
})();

// Обложка кейса: трейлер играет, пока виден; главы подсвечиваются по времени и перематывают ролик
document.querySelectorAll('[data-trailer]').forEach(box => {
  const v = box.querySelector('video');
  if (!v) return;
  const items = [...box.querySelectorAll('[data-chapters] li')];
  const marks = items.map(li => +li.querySelector('button').dataset.t);
  const now = box.querySelector('[data-chapter-now]');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, cur = -1, visible = false;
  const tick = () => {
    const t = v.currentTime, end = v.duration || 22;
    let i = marks.length - 1; while (i > 0 && t < marks[i]) i--;
    const next = marks[i + 1] ?? end;
    if (i !== cur) {
      items.forEach((li, k) => li.classList.toggle('is-on', k === i));
      if (now && items[i]) now.innerHTML = items[i].querySelector('button').innerHTML;
      cur = i;
    }
    if (items[i]) {
      const p = Math.min(1, Math.max(0, (t - marks[i]) / (next - marks[i])));
      // у полоски скруглённые концы: на нулевой ширине они рисуют точку, поэтому прячем
      items[i].style.setProperty('--p', p.toFixed(3));
      items[i].style.setProperty('--o', p > 0.012 ? '1' : '0');
    }
    if (!v.paused) raf = requestAnimationFrame(tick);
  };
  v.addEventListener('play', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); });
  v.addEventListener('seeked', tick);
  const play = () => { const p = v.play(); p && p.catch(() => {}); };
  items.forEach((li, k) => li.querySelector('button').addEventListener('click', () => { v.currentTime = marks[k] + 0.01; tick(); play(); }));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      visible = e.isIntersecting;
      if (!visible) v.pause(); else if (!calm.matches) play();
    }), { threshold: 0.35 }).observe(box);
  } else if (!calm.matches) play();
});

// Декор доставки: машинка стоит на пунктире и смотрит по направлению пути
document.querySelectorAll('.deliv-deco__car').forEach(car => {
  const path = car.closest('svg').querySelector('.deliv-deco__path');
  if (!path || !path.getTotalLength) return;
  const L = path.getTotalLength(), at = L * (+car.dataset.at || 0.5);
  const a = path.getPointAtLength(at - 2), b = path.getPointAtLength(at + 2);
  const deg = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90;
  car.setAttribute('transform', `translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2}) rotate(${deg})`);
});

// Живой прототип цены в кейсе такси: реальные экраны, живыми остаются сумма, подсказка и состояние
(() => {
  const REC = 230, MIN = 30, MAX = 9999;
  const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  const flash = (el, cls, ms) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
  document.querySelectorAll('[data-proto]').forEach(root => {
    const host = root.closest('.cs-try__phone') || root;
    const q = s => root.querySelector(s);
    const amount = q('[data-amount]'), hint = q('[data-hint]'), rows = root.querySelectorAll('[data-price-row]'), sp = q('[data-search-price]');
    const pills = { '-30': q('[data-act="-30"]'), '30': q('[data-act="30"]') };
    const scr = { fare: q('[data-scr="fare"]'), map: q('[data-scr="map"]'), search: q('[data-scr="search"]') };
    const seen = new WeakMap();
    const put = (el, next, dir) => { if (!el) return; roll(el, seen.get(el) || '', next, dir); seen.set(el, next); };
    let digits = '450', fare = 450, offer = 450;
    const clamp = n => Math.min(MAX, Math.max(MIN, n));
    const val = () => Math.min(MAX, +digits || 0);
    const paintSheet = (dir) => {
      put(amount, fmt(val()), dir);
      const low = val() < REC;
      const next = low ? 'Низкая цена — ждать дольше. Рекомендуем ' + REC + ' ₽' : 'Хорошая цена — водители откликнутся быстрее';
      if (hint.textContent !== next) { hint.textContent = next; flash(hint, 'is-swap', 420); }
      hint.classList.toggle('is-low', low);
    };
    const paintMap = (dir) => {
      rows.forEach(r => put(r, fmt(fare) + ', наличными', dir));
      root.querySelectorAll('[data-map]').forEach(c => c.classList.toggle('is-on', c.dataset.map === (fare < REC ? 'low' : 'good')));
    };
    const paintSearch = (dir) => { put(sp, fmt(offer) + ' ₽', dir); if (dir) flash(sp, 'is-bump', 520); };
    const go = (name) => {
      root.dataset.screen = name;
      Object.entries(scr).forEach(([k, el]) => { if (el) el.inert = k !== name; });
    };
    const bump = (d) => {
      const s = root.dataset.screen, now = s === 'search' ? offer : s === 'map' ? fare : val(), next = clamp(now + d);
      const pill = pills[d > 0 ? '30' : '-30'];
      if (next === now) { flash(pill, 'is-stuck', 420); return; }
      flash(pill, 'is-press', 480);
      if (s === 'search') { offer = next; paintSearch(d); }
      else if (s === 'map') { fare = next; offer = next; paintMap(d); paintSearch(0); }
      else { digits = String(next); paintSheet(d); }
    };
    host.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || !host.contains(b)) return;
      const k = b.dataset.key, a = b.dataset.act;
      if (k) { const was = val(); digits = digits.length >= 4 || digits === '0' ? k : digits + k; paintSheet(val() > was ? 1 : -1); return; }
      if (a === 'bs') { const was = val(); digits = digits.slice(0, -1) || '0'; paintSheet(val() > was ? 1 : -1); return; }
      if (a === '30' || a === '-30') { bump(+a); return; }
      if (a === 'done' || a === 'close') { const was = fare; if (a === 'done') fare = Math.max(MIN, val()); offer = fare; paintMap(fare === was ? 0 : fare > was ? 1 : -1); paintSearch(0); go('map'); return; }
      if (a === 'open') { digits = String(fare); paintSheet(0); go('fare'); return; }
      if (a === 'search') { offer = fare; paintSearch(0); go('search'); return; }
      if (a === 'cancel') { const was = fare; fare = offer; paintMap(fare === was ? 0 : fare > was ? 1 : -1); go('map'); return; }
    });
    paintSheet(0); paintMap(0); paintSearch(0); go('search');
  });
})();

// Панель слоёв у длинного кейса: рейка из засечек, по наведению — список фреймов
(() => {
  const secs = [...document.querySelectorAll('[data-nav]')];
  if (secs.length < 5) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.6 1v3.6H1v1.4h4.6v4.4H1v1.4h4.6V15H7v-3.2h3.4V15h1.4v-3.2H15v-1.4h-3.2V6H15V4.6h-3.2V1h-1.4v3.6H7V1H5.6Zm1.4 5h3.4v4.4H7V6Z"/></svg>';
  const en = document.documentElement.dataset.lang === 'en';

  const nav = document.createElement('nav');
  nav.className = 'layers';
  nav.setAttribute('aria-label', en ? 'Case sections' : 'Разделы кейса');
  const list = document.createElement('ol');
  list.className = 'layers__list';
  nav.append(list);

  const links = secs.map(sec => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + (sec.id || sec.getAttribute('aria-labelledby'));
    a.className = 'layers__item';
    a.innerHTML = '<i class="layers__tick" aria-hidden="true"></i><span class="layers__name">' + ICON +
      '<span lang="ru">' + sec.dataset.nav + '</span><span lang="en">' + (sec.dataset.navEn || sec.dataset.nav) + '</span></span>';
    a.addEventListener('click', e => {
      e.preventDefault();
      sec.scrollIntoView({ behavior: calm.matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', a.getAttribute('href'));
    });
    li.append(a); list.append(li);
    return a;
  });
  document.body.append(nav);

  const pick = () => {
    const line = innerHeight * 0.3;
    let i = -1;
    secs.forEach((s, k) => { if (s.getBoundingClientRect().top <= line) i = k; });
    links.forEach((a, k) => { a.classList.toggle('is-on', k === i); if (k === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    nav.classList.toggle('is-lit', scrollY > innerHeight * 0.6);
  };
  let tick = 0;
  const onScroll = () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0; pick(); grow(); }); };

  // на узких экранах рейки нет — там прогресс чтения тонкой линией сверху
  const bar = document.createElement('i');
  bar.className = 'readbar'; bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  const grow = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h).toFixed(4) : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { pick(); grow(); }, { passive: true });
  pick(); grow();
})();
