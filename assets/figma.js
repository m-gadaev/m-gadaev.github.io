// Вариант «Сайт как файл в Figma»: декоративный слой поверх обычного сайта.
// Фреймы с подписью и размером, выделение при наведении, мерка до соседнего фрейма,
// линейки, курсоры соавторов, комментарий и панель инструментов. Нажать ничего нельзя.
(() => {
  const d = document;
  const svg = (paths, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${paths}</svg>`;
  const ICON = {
    frame: '<line x1="22" x2="2" y1="6" y2="6"/><line x1="22" x2="2" y1="18" y2="18"/><line x1="6" x2="6" y1="2" y2="22"/><line x1="18" x2="18" y1="2" y2="22"/>',
    move: '<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/>',
    rect: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    pen: '<path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/>',
    text: '<path d="M12 4v16"/><path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/><path d="M9 20h6"/>',
    comment: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>'
  };
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const calmMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // Фреймы
  const frames = [...d.querySelectorAll('[data-fig]')];
  frames.forEach(f => {
    f.classList.add('fig-frame');
    const label = d.createElement('span'); label.className = 'fig-label'; label.setAttribute('aria-hidden', 'true');
    label.innerHTML = svg(ICON.frame) + '<span></span>'; label.lastChild.textContent = f.dataset.fig;
    const sel = d.createElement('span'); sel.className = 'fig-sel'; sel.setAttribute('aria-hidden', 'true'); sel.innerHTML = '<i></i><i></i><i></i><i></i>';
    const size = d.createElement('span'); size.className = 'fig-size'; size.setAttribute('aria-hidden', 'true');
    f.append(label, sel, size);
    f._size = size;
  });
  const measure = () => frames.forEach(f => {
    // размер — по самой карточке внутри, если фрейм её обёртка
    const box = (f.classList.contains('fig-card') && f.firstElementChild) || f;
    f._size.textContent = `${Math.round(box.offsetWidth)} × ${Math.round(box.offsetHeight)}`;
    f.querySelector(':scope > .fig-gap')?.remove();
    f._gap = null;
    f.classList.remove('has-gap');
    const next = f.nextElementSibling;
    if (next && next.matches('[data-fig]') && !next.hidden && f.offsetParent) {
      // по раскладке, а не по экрану: карточки во время анимации сдвинуты transform
      const gap = Math.round(next.offsetTop - f.offsetTop - f.offsetHeight);
      if (gap > 8) {
        const g = d.createElement('span'); g.className = 'fig-gap'; g.setAttribute('aria-hidden', 'true');
        g.style.height = gap + 'px'; g.innerHTML = `<b>${gap}</b>`;
        f.append(g); f.classList.add('has-gap');
        f._gap = { el: g, label: g.firstChild, next, rest: gap };
      }
    }
  });
  if ('ResizeObserver' in window) { let t; const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(measure, 80); }); frames.forEach(f => ro.observe(f)); }
  addEventListener('load', measure);
  d.querySelectorAll('[role="tab"]').forEach(t => t.addEventListener('click', () => setTimeout(measure, 600)));

  // Мерка до следующего фрейма живая: пока соседняя карточка въезжает при прокрутке,
  // считаем расстояние по тому, где она видна сейчас (с учётом сдвига и маски), и оно сходится к реальному
  const seenTop = el => {
    const r = el.getBoundingClientRect();
    const m = /inset\(([\d.]+)%/.exec(el.style.clipPath || '');
    return r.top + (m ? (+m[1] / 100) * r.height : 0);
  };
  const liveGap = f => {
    const g = f._gap; if (!g) return;
    let v = seenTop(g.next) - f.getBoundingClientRect().bottom;
    if (Math.abs(v - g.rest) < 1) v = g.rest;
    v = Math.max(0, Math.round(v));
    g.el.style.height = v + 'px'; g.label.textContent = v;
    // подпись держим в видимой части линии, если мерка уходит за низ экрана
    const seen = Math.max(0, Math.min(v, innerHeight - f.getBoundingClientRect().bottom - 16));
    g.label.style.top = (seen / 2) + 'px';
  };
  let gapLoop = 0;
  const watchGap = f => {
    cancelAnimationFrame(gapLoop);
    const step = () => { if (!f.classList.contains('is-sel')) return; liveGap(f); gapLoop = requestAnimationFrame(step); };
    step();
  };

  // Линейки
  const rx = d.createElement('div'), ry = d.createElement('div'), corner = d.createElement('div');
  rx.className = 'fig-ruler fig-ruler--x'; ry.className = 'fig-ruler fig-ruler--y'; corner.className = 'fig-ruler__corner';
  [rx, ry, corner].forEach(el => el.setAttribute('aria-hidden', 'true'));
  const bx = d.createElement('span'), by = d.createElement('span'); bx.className = by.className = 'fig-ruler__band';
  d.body.append(rx, ry, corner);
  const origin = () => (d.querySelector('.bar__in')?.getBoundingClientRect().left || 0);
  const drawX = () => {
    const o = origin(), w = innerWidth; let html = '';
    for (let v = -Math.floor(o / 10) * 10; v + o < w; v += 10) {
      const x = o + v - 20; if (x < 0) continue;
      html += `<i class="${v % 100 === 0 ? 'big' : ''}" style="left:${x}px"></i>`;
      if (v % 100 === 0) html += `<b style="left:${x}px">${v}</b>`;
    }
    rx.innerHTML = html; rx.append(bx);
  };
  const drawY = () => {
    const s = scrollY, h = innerHeight; let html = '';
    for (let v = Math.floor(s / 10) * 10; v < s + h; v += 10) {
      const y = v - s; if (y < 0) continue;
      html += `<i class="${v % 100 === 0 ? 'big' : ''}" style="top:${y}px"></i>`;
      if (v % 100 === 0) html += `<b style="top:${y}px">${v}</b>`;
    }
    ry.innerHTML = html; ry.append(by);
  };
  let active = null;
  const band = () => {
    if (!active) { bx.classList.remove('on'); by.classList.remove('on'); return; }
    const r = ((active.classList.contains('fig-card') && active.firstElementChild) || active).getBoundingClientRect();
    bx.style.left = (r.left - 20) + 'px'; bx.style.width = r.width + 'px';
    by.style.top = (r.top - 20) + 'px'; by.style.height = r.height + 'px';
    bx.classList.add('on'); by.classList.add('on');
  };
  let raf = 0;
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawY(); band(); }); }, { passive: true });
  addEventListener('resize', () => { drawX(); drawY(); measure(); });
  drawX(); drawY();

  // Выделение. Мышь: при наведении, как в Figma. Палец: только там, куда нажал, и держится, пока не нажмёшь в другое место.
  // Раньше на телефоне выделялся фрейм посередине экрана, и рамка оказывалась на соседней карточке — убрано.
  // Слушаем pointer-события с типом указателя: Safari при тапе шлёт ещё и mouseenter, его не трогаем.
  const pickable = frames.filter(f => !f.hasAttribute('data-fig-selected'));
  const select = f => {
    frames.forEach(x => x !== f && x.classList.remove('is-sel'));
    if (!f) { active = null; band(); return; }
    f.classList.add('is-sel'); active = f; band(); watchGap(f);
  };
  pickable.forEach(f => {
    f.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') select(f); });
    f.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && active === f) { f.classList.remove('is-sel'); active = null; band(); } });
  });
  d.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    // самый вложенный фрейм под пальцем; всегда выделенный аватар пропускаем, берём его родителя
    let f = e.target.closest('[data-fig]');
    while (f && f.hasAttribute('data-fig-selected')) f = f.parentElement.closest('[data-fig]');
    select(f || null);
  }, { passive: true });

  // Курсоры соавторов
  const cursor = (cls, color, ru, en) => {
    const c = d.createElement('div'); c.className = 'fig-cursor ' + cls; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 2.5 19.5 10l-6.8 1.9L9.6 19z" fill="${color}" stroke="#F7F7F6" stroke-width="1.5" stroke-linejoin="round"/></svg><span style="background:${color}"><span lang="ru">${ru}</span><span lang="en">${en}</span></span>`;
    return c;
  };
  // Курсоры живут на полях холста слева и справа от контента и едут вместе с тобой по странице.
  // При прокрутке они чуть отстают и догоняют — видно, что соавторы «листают» файл вместе с тобой.
  // Только на главной (в кейсе мешают читать) и только если поля достаточно широкие, чтобы не залезать на карточки.
  if (d.querySelector('.hero')) {
    const pm = cursor('fig-cursor--a fig-cursor--fixed fig-cursor--left', '#9747FF', 'Продакт', 'PM');
    const dev = cursor('fig-cursor--b fig-cursor--fixed fig-cursor--right', '#14AE5C', 'Разработчик', 'Developer');
    d.body.append(pm, dev);
    const content = d.querySelector('.bar__in');
    const fit = () => {
      const gutter = content ? content.getBoundingClientRect().left - 20 : 0; // минус линейка
      // поле широкое — курсор с подписью; поуже — одна стрелка; совсем узкое — прячем
      [pm, dev].forEach(c => c.classList.remove('is-off', 'is-mini'));
      [pm, dev].forEach(c => {
        if (gutter >= c.offsetWidth + 6) return;
        c.classList.add(gutter >= 34 ? 'is-mini' : 'is-off');
      });
      // ставим посередине поля: между краем экрана (за линейкой) и краем контента
      const r = content.getBoundingClientRect(), edge = 20;
      pm.style.left = Math.round(edge + (r.left - edge - pm.offsetWidth) / 2) + 'px';
      dev.style.left = Math.round(r.right + (innerWidth - r.right - dev.offsetWidth) / 2) + 'px';
    };
    fit(); addEventListener('resize', fit); addEventListener('load', fit);
    if (d.fonts) d.fonts.ready.then(fit); // до загрузки шрифта подписи шире, пересчитываем
    // отставание при прокрутке: смещение против направления, затем пружинкой к нулю
    let lag = 0, lastY = scrollY, raf2 = 0;
    const tick = () => {
      lag *= 0.88;
      [[pm, 1], [dev, 1.35]].forEach(([c, k]) => { c.style.translate = `0 ${(lag * k).toFixed(1)}px`; });
      raf2 = Math.abs(lag) > 0.3 ? requestAnimationFrame(tick) : 0;
    };
    if (!calmMotion.matches) addEventListener('scroll', () => {
      const dy = scrollY - lastY; lastY = scrollY;
      lag = Math.max(-90, Math.min(90, lag - dy * 0.6));
      if (!raf2) raf2 = requestAnimationFrame(tick);
    }, { passive: true });
  }



  // Подсказку-комментарий убрали: она перекрывала интерактивный экран.


  // Вся карточка открывает кейс. Кнопки, ссылки и живые элементы внутри работают как раньше;
  // выделенный текст не считается кликом; Cmd/Ctrl и средняя кнопка открывают в новой вкладке
  d.querySelectorAll('.case').forEach(card => {
    const link = card.querySelector('.case__open'); if (!link) return;
    card.classList.add('is-link');
    const skip = e => e.target.closest('a, button, input, select, textarea, label, summary, [role="button"], [data-step], .fig-pin')
      || String(getSelection && getSelection()).length > 0;
    card.addEventListener('click', e => {
      if (skip(e) || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || link.target === '_blank') window.open(link.href, '_blank', 'noopener'); else location.href = link.href;
    });
    card.addEventListener('auxclick', e => { if (e.button === 1 && !skip(e)) window.open(link.href, '_blank', 'noopener'); });
  });

  // Панель внизу: настоящие кнопки, которых нет в шапке. Подсказки как в Figma, на телефоне — тост.
  const ICON2 = {
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
    hand: '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'
  };
  const lang = () => d.documentElement.dataset.lang === 'en' ? 'en' : 'ru';
  const t = (ru, en) => lang() === 'en' ? en : ru;
  const go = el => el && el.scrollIntoView({ behavior: calmMotion.matches ? 'auto' : 'smooth', block: 'start' });
  const toast = (() => {
    const el = d.createElement('div'); el.className = 'fig-toast'; el.setAttribute('role', 'status'); d.body.append(el);
    let timer; return text => { el.textContent = text; el.classList.add('on'); clearTimeout(timer); timer = setTimeout(() => el.classList.remove('on'), 2200); };
  })();
  // копирование: сначала старый синхронный способ (работает в любом контексте клика), потом Clipboard API
  const copy = async text => {
    const ta = d.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    d.body.append(ta); ta.select(); let ok = false;
    try { ok = d.execCommand('copy'); } catch (e) {}
    ta.remove();
    if (ok || !navigator.clipboard) return ok;
    try { await Promise.race([navigator.clipboard.writeText(text), new Promise((_, no) => setTimeout(no, 1000))]); return true; } catch (e) { return false; }
  };
  const mail = (d.querySelector('a[href^="mailto:"]')?.getAttribute('href') || 'mailto:muhammadgadaev376@gmail.com').slice(7);
  const tab = id => { const b = d.getElementById(id); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); };

  // разметка (линейки, подписи, мерки) — включена по умолчанию, выбор помним
  const root = d.documentElement;
  let clean = false; try { clean = localStorage.getItem('fig-clean') === '1'; } catch (e) {}
  root.classList.toggle('fig-clean', clean);

  const isCase = !!d.querySelector('.cs-hero');
  // «Наверх» на всех страницах: в кейсе скролл длинный, а назад ведут стрелка у шапки и логотип
  const up = { icon: ICON2.up, ru: 'Наверх', en: 'Back to top', run: () => scrollTo({ top: 0, behavior: calmMotion.matches ? 'auto' : 'smooth' }) };
  const items = isCase ? [
    up,
    { icon: ICON2.hand, ru: 'Попробовать цену', en: 'Try the fare', wide: true, run: () => { const el = d.getElementById('try'); el && el.scrollIntoView({ behavior: calmMotion.matches ? 'auto' : 'smooth', block: 'center' }); } },
  ] : [up];
  items.push(
    { icon: ICON2.mail, ru: 'Скопировать почту', en: 'Copy email', run: async () => toast(await copy(mail) ? t('Почта скопирована: ', 'Email copied: ') + mail : mail) },
    { icon: ICON2.link, ru: 'Скопировать ссылку на страницу', en: 'Copy page link', run: async () => toast(await copy(location.href.split('#')[0]) ? t('Ссылка скопирована', 'Link copied') : location.href) },
    'sep',
    { icon: ICON2.ruler, ru: 'Разметка: линейки и размеры', en: 'Markup: rulers and sizes', toggle: true, run: b => {
      clean = !clean; root.classList.toggle('fig-clean', clean); b.setAttribute('aria-pressed', String(!clean));
      try { localStorage.setItem('fig-clean', clean ? '1' : '0'); } catch (e) {}
      toast(clean ? t('Разметка скрыта', 'Markup hidden') : t('Разметка включена', 'Markup on'));
    } }
  );
  const bar = d.createElement('nav'); bar.className = 'fig-tools';
  bar.setAttribute('aria-label', t('Быстрые действия', 'Quick actions'));
  items.forEach(it => {
    if (it === 'sep') { bar.append(d.createElement('hr')); return; }
    const b = d.createElement('button'); b.type = 'button'; b.className = 'fig-tool' + (it.wide ? ' fig-tool--wide' : '');
    const name = () => t(it.ru, it.en);
    b.innerHTML = svg(it.icon) + (it.wide ? `<span class="fig-tool__text"><span lang="ru">${it.ru}</span><span lang="en">${it.en}</span></span>` : '') + `<span class="fig-tip" aria-hidden="true"><span lang="ru">${it.ru}</span><span lang="en">${it.en}</span></span>`;
    b.setAttribute('aria-label', name());
    d.addEventListener('langchange', () => b.setAttribute('aria-label', name()));
    if (it.toggle) b.setAttribute('aria-pressed', String(!clean));
    b.addEventListener('click', () => it.run(b));
    bar.append(b);
  });
  d.body.append(bar);
})();
