document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('menu-toggle');
  const offcanvas = document.getElementById('offcanvas');
  const closeBtn = document.getElementById('close-menu');
  const backdrop = document.getElementById('offcanvas-backdrop');

  function openMenu(){
    offcanvas.classList.add('open');
    offcanvas.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    offcanvas.classList.remove('open');
    offcanvas.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  // close on Esc
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeMenu();
  });
});
