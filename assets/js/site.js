// Small helpers for the inner pages. No dependencies.

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// images that may be refused by their host (e.g. Google Drive) fall back to a local photo
document.querySelectorAll('img[data-fallback]').forEach((img) => {
  const swap = () => {
    if (img.dataset.swapped) return;
    img.dataset.swapped = '1';
    img.src = img.dataset.fallback;
  };
  img.addEventListener('error', swap);
  if (img.complete && img.naturalWidth === 0) swap();
});

/* ---------- photos: lightbox ---------- */
const box = document.querySelector('.lightbox');
if (box && typeof box.showModal === 'function') {
  const big = box.querySelector('img');
  const cap = box.querySelector('.cap');
  document.querySelectorAll('.shot button[data-full]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const thumb = btn.querySelector('img');
      big.src = btn.dataset.full;
      big.alt = thumb.alt;
      cap.textContent = btn.closest('figure').querySelector('figcaption')?.textContent || '';
      box.showModal();
    });
  });
  box.querySelector('.close').addEventListener('click', () => box.close());
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
}

/* ---------- contact: inquiry form ---------- */
const form = document.getElementById('inquiry');
if (form) {
  const status = form.querySelector('.status');
  const button = form.querySelector('button[type="submit"]');
  const email = form.dataset.email;

  // contact/?topic=Writing preselects a chip
  const topic = new URLSearchParams(window.location.search).get('topic');
  if (topic) {
    const chip = form.querySelector(`input[name="topic"][value="${CSS.escape(topic)}"]`);
    if (chip) chip.checked = true;
  }

  const mailtoFallback = (data) => {
    const subject = `${data.topic}: ${data.name}`;
    const bodyText = `${data.message}\n\nFrom ${data.name} (${data.email})`;
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._honey) return; // a bot filled the hidden field
    data._subject = `${data.topic} inquiry from ${data.name}`;

    button.disabled = true;
    status.className = 'status label';
    status.textContent = 'Sending…';
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'send failed');
      form.reset();
      status.classList.add('ok');
      status.textContent = 'Received. I’ll get back to you soon.';
    } catch (err) {
      status.innerHTML = '';
      status.append('That didn’t go through. ');
      const a = document.createElement('a');
      a.href = mailtoFallback(data);
      a.textContent = 'Send it by email instead →';
      status.append(a);
    } finally {
      button.disabled = false;
    }
  });
}
