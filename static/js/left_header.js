document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('menu-toggle');
  const offcanvas = document.getElementById('offcanvas');
  const closeBtn = document.getElementById('close-menu');
  const backdrop = document.getElementById('offcanvas-backdrop');
  const siteHeader = document.querySelector('.site-header');

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function openMenu() {
    const scrollbarWidth = getScrollbarWidth();
    let headerWidth = 'auto';
    if (siteHeader) {
      headerWidth = siteHeader.offsetWidth;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    if (siteHeader) {
      siteHeader.style.width = `${headerWidth}px`;
    }

    offcanvas.classList.add('open');
    offcanvas.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    offcanvas.classList.remove('open');
    offcanvas.setAttribute('aria-hidden', 'true');

    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';

    if (siteHeader) {
      siteHeader.style.width = '';
    }
  }

  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
});