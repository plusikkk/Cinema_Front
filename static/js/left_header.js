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
    if (siteHeader) headerWidth = siteHeader.offsetWidth;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    if (siteHeader) siteHeader.style.width = `${headerWidth}px`;

    offcanvas.classList.add('open');
    offcanvas.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    offcanvas.classList.remove('open');
    offcanvas.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
    if (siteHeader) siteHeader.style.width = '';
  }

  if (toggle) toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });


  // ВІКНО ВИХОДУ
  const modalOverlay = document.getElementById('global-logout-modal');
  const btnCancel = document.getElementById('btn-global-cancel');
  const btnConfirm = document.getElementById('btn-global-confirm');

  function openLogoutModal() {
      if (modalOverlay) modalOverlay.classList.add('active');
      closeMenu();
  }

  function closeLogoutModal() {
      if (modalOverlay) modalOverlay.classList.remove('active');
  }

  if (btnCancel) btnCancel.addEventListener('click', closeLogoutModal);
  if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
          if (e.target === modalOverlay) closeLogoutModal();
      });
  }
  if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('username');
          window.location.href = "/";
      });
  }


  // АВТОРИЗАЦІЯ
  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');

  const headerActions = document.querySelector('.header-actions');

  if (token && username && headerActions) {
      headerActions.innerHTML = `
          <div class="auth-buttons-container">
              <a href="/profile/" class="btn-login-combo btn-profile-logged">
                  <span class="user-name-text">${username}</span>
                  <i class="fa-solid fa-user-astronaut"></i>
              </a>
              
              <button id="js-logout-btn" class="btn-icon btn-logout-header" title="Вийти">
                  <i class="fa-solid fa-right-from-bracket"></i>
              </button>
          </div>
      `;

      const logoutBtn = document.getElementById('js-logout-btn');
      if (logoutBtn) {
          logoutBtn.addEventListener('click', (e) => {
              e.preventDefault();
              openLogoutModal();
          });
      }
  }

  const mobileAuthContainer = document.getElementById('mobile-auth-container');
  if (token && username && mobileAuthContainer) {
      mobileAuthContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px;">
              <a href="/profile/" class="btn-primary" style="text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px;">
                  <i class="fa-solid fa-user-astronaut"></i>
                  <span>${username}</span>
              </a>
          </div>
      `;
  }
});