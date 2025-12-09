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

  const token = localStorage.getItem('access_token');
  const username = localStorage.getItem('username');

  // 2. Знаходимо блок кнопок у хедері
  const headerActions = document.querySelector('.header-actions');

  // 3. Якщо користувач залогінений -> міняємо кнопку
  if (token && username && headerActions) {
      headerActions.innerHTML = `
          <div style="display: flex; align-items: center; gap: 15px;">
              <a href="/profile/" class="btn-login-combo" style="text-decoration: none; background-color: #ff2e93; color: white; border: none;">
                  <span style="margin-right: 5px;">${username}</span>
                  <i class="fa-solid fa-user-check"></i>
              </a>
              
              <button id="js-logout-btn" style="background: transparent; border: none; cursor: pointer; color: white; font-size: 18px;" title="Вийти">
                  <i class="fa-solid fa-right-from-bracket"></i>
              </button>
          </div>
      `;

      // 4. Логіка кнопки "Вихід"
      const logoutBtn = document.getElementById('js-logout-btn');
      if (logoutBtn) {
          logoutBtn.addEventListener('click', function() {
              // Видаляємо токени
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              localStorage.removeItem('username');

              // Перезавантажуємо сторінку
              window.location.href = "/";
          });
      }
  }

});



