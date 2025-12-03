import './styles.scss';

// FAQ accordion logic (single open item, first click works).
const initFaqAccordion = () => {
  const faqItems = Array.from(document.querySelectorAll('.faq .q'));
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const head = item.querySelector('.q-head');
    const body = item.querySelector('.q-body');
    if (!head || !body) return;

    head.setAttribute('aria-expanded', 'false');
    body.style.maxHeight = '0px';
    body.style.opacity = '0';

    head.addEventListener('click', () => {
      const isOpen = head.getAttribute('aria-expanded') === 'true';

      faqItems.forEach((otherItem) => {
        const otherHead = otherItem.querySelector('.q-head');
        const otherBody = otherItem.querySelector('.q-body');
        if (!otherHead || !otherBody) return;
        otherHead.setAttribute('aria-expanded', 'false');
        otherItem.classList.remove('open');
        otherBody.style.maxHeight = '0px';
        otherBody.style.opacity = '0';
      });

      if (isOpen) return;

      head.setAttribute('aria-expanded', 'true');
      item.classList.add('open');
      body.style.maxHeight = `${body.scrollHeight}px`;
      body.style.opacity = '1';
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initFaqAccordion();
});



// burger menu

const burger = document.getElementById('burger');
const closeBtn = document.getElementById('close-mobile-menu');
const content = document.getElementById('mobile-content');

if (burger && closeBtn && content) {
  const openMenu = () => content.classList.add('open');
  const closeMenu = () => content.classList.remove('open');

  burger.addEventListener('click', () => {
    openMenu();
  });

  closeBtn.addEventListener('click', () => {
    closeMenu();
  });

  const menuLinks = content.querySelectorAll('.menu a');
  menuLinks.forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('click', (event) => {
    if (!content.classList.contains('open')) return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickInsideMenu = content.contains(target);
    const clickOnBurger = burger.contains(target);

    if (!clickInsideMenu && !clickOnBurger) {
      closeMenu();
    }
  });
}


const swiper = new Swiper('.gallery-slider', {
    loop: true,
    loopedSlides: 5,
    centeredSlides: true,
    centeredSlidesBounds: true,
    initialSlide: 2,
    spaceBetween: 24,
    slidesPerView: 1,
    autoplay: {
      delay: 3000,
    },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
      0:   { slidesPerView: 1.3, centeredSlides: true },
      576: { slidesPerView: 2.5 },
      768: { slidesPerView: 4 },
    }
});
