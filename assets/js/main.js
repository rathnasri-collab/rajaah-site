/* Raja Krishnamoorthy — site behaviour (no dependencies) */
(function () {
  'use strict';

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setOpen(false); });
  }

  /* ---------- Scroll reveal ---------- */
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if (items.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      items.forEach(function (el) { io.observe(el); });
    } else {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Contact form ---------- */
  var form = document.getElementById('enquiry-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Pre-select enquiry type from ?topic=
  try {
    var topic = new URLSearchParams(window.location.search).get('topic');
    var sel = form.elements['topic'];
    if (topic && sel) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === topic) { sel.selectedIndex = i; break; }
      }
    }
  } catch (err) { /* ignore */ }

  function setError(field, msg) {
    var box = document.getElementById(field.id + '-error');
    if (box) box.textContent = msg || '';
    if (msg) field.setAttribute('aria-invalid', 'true'); else field.removeAttribute('aria-invalid');
  }

  function validate() {
    var ok = true, first = null;
    var name = form.elements['name'], email = form.elements['email'], message = form.elements['message'];
    var checks = [
      [name, name.value.trim().length >= 2, 'Please enter your name.'],
      [email, emailRe.test(email.value.trim()), 'Please enter a valid email address.'],
      [message, message.value.trim().length >= 10, 'Please tell us a little more (at least 10 characters).']
    ];
    checks.forEach(function (c) {
      if (c[1]) { setError(c[0], ''); }
      else { setError(c[0], c[2]); ok = false; if (!first) first = c[0]; }
    });
    if (first) first.focus();
    return ok;
  }

  function show(kind, html) {
    status.className = 'form-status ' + (kind === 'ok' ? 'is-ok' : 'is-err');
    status.innerHTML = html;
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    if (!validate()) return;

    var label = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    fetch(form.getAttribute('action'), {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'fetch' }
    })
      .then(function (res) {
        return res.json().catch(function () { return { ok: false }; }).then(function (data) { return { res: res, data: data }; });
      })
      .then(function (r) {
        if (r.res.ok && r.data && r.data.ok) {
          form.reset();
          show('ok', 'Thank you — your message has been sent. Raja’s team will get back to you shortly.');
        } else {
          var msg = (r.data && r.data.error) ? r.data.error : 'Sorry, we couldn’t send your message just now.';
          show('err', msg + ' Please email <a href="mailto:raja@rajaah.com">raja@rajaah.com</a> or call <a href="tel:+919840277362">+91-98402-77362</a>.');
        }
      })
      .catch(function () {
        show('err', 'Sorry, we couldn’t reach the server. Please email <a href="mailto:raja@rajaah.com">raja@rajaah.com</a> or call <a href="tel:+919840277362">+91-98402-77362</a>.');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.innerHTML = label;
        status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
  });
})();
