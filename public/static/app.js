/* ============================================
   POUSINOX - Fixador de Porcelanato
   JavaScript Principal
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- NAVBAR SCROLL ---- */
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(15, 15, 26, 0.98)';
      navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.3)';
    } else {
      navbar.style.background = 'rgba(15, 15, 26, 0.95)';
      navbar.style.boxShadow = 'none';
    }
  });

  /* ---- HAMBURGER MENU ---- */
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.navbar-nav');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      spans.forEach(s => s.style.background = navMenu.classList.contains('open') ? '#e8751a' : '#fff');
    });

    // Close on link click
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('open'));
    });
  }

  /* ---- SCROLL TO TOP ---- */
  const scrollTopBtn = document.querySelector('.scroll-top');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) scrollTopBtn.classList.add('visible');
      else scrollTopBtn.classList.remove('visible');
    });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- ANIMATE ON SCROLL ---- */
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animateElements.forEach(el => observer.observe(el));
  } else {
    animateElements.forEach(el => el.classList.add('in-view'));
  }

  /* ---- SMOOTH SCROLL FOR ANCHOR LINKS ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ---- COUNTER ANIMATION ---- */
  function animateCounter(el, target, duration = 1500) {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        el.textContent = target;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(start);
      }
    }, 16);
  }

  const counterElements = document.querySelectorAll('[data-counter]');
  if (counterElements.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute('data-counter'));
          animateCounter(entry.target, target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterElements.forEach(el => counterObserver.observe(el));
  }

  /* ---- VIDEO PLACEHOLDER CLICK ---- */
  document.querySelectorAll('.video-embed-placeholder').forEach(placeholder => {
    placeholder.addEventListener('click', function () {
      const videoUrl = this.getAttribute('data-video-url');
      if (videoUrl) {
        const iframe = document.createElement('iframe');
        iframe.src = videoUrl;
        iframe.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        this.style.position = 'relative';
        this.innerHTML = '';
        this.appendChild(iframe);
      } else {
        this.querySelector('p') && (this.querySelector('p').textContent = 'Adicione a URL do vídeo no atributo data-video-url');
      }
    });
  });

  /* ---- FORM SUBMIT ---- */
  const leadForm = document.getElementById('lead-form');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Enviando...';
      btn.disabled = true;
      // Simula envio - integrar com backend real
      setTimeout(() => {
        btn.textContent = '✓ Mensagem enviada!';
        btn.style.background = '#10b981';
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          btn.style.background = '';
          leadForm.reset();
        }, 3000);
      }, 1500);
    });
  }

});
