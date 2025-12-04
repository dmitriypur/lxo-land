import './styles.scss';
import 'swiper/css/bundle';
import './js/watcher.js';

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

const sanitizeNameValue = (value) => value.replace(/[^А-Яа-яЁё\s-]/g, '');

const initGallerySlider = async () => {
  const sliderEl = document.querySelector('.gallery-slider');
  if (!sliderEl) return;

  try {
    const { default: Swiper } = await import('swiper/bundle');
    // eslint-disable-next-line no-new
    new Swiper('.gallery-slider', {
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
      // navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      breakpoints: {
        0: { slidesPerView: 1.3, centeredSlides: true },
        576: { slidesPerView: 2.5 },
        768: { slidesPerView: 4 },
      },
    });
  } catch (error) {
    console.error('Не удалось загрузить слайдер', error);
  }
};

const formatPhoneValue = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  let normalized = digits;
  if (normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`;
  } else if (!normalized.startsWith('7')) {
    normalized = `7${normalized}`;
  }

  normalized = normalized.slice(0, 11);
  let formatted = '+7';
  const rest = normalized.slice(1);

  if (rest.length) {
    formatted += ` (${rest.slice(0, Math.min(3, rest.length))}`;
  }

  if (rest.length >= 3) {
    const mid = rest.slice(3, 6);
    formatted += `) ${mid}`;
  }

  if (rest.length >= 6) {
    const next = rest.slice(6, 8);
    formatted += ` ${next}`;
  }

  if (rest.length >= 8) {
    const tail = rest.slice(8, 10);
    formatted += ` ${tail}`;
  }

  return formatted.trim();
};

const initCtaFormValidation = () => {
  const form = document.querySelector('.cta .form');
  if (!form) return;

  const nameInput = form.querySelector('#name');
  const phoneInput = form.querySelector('#phone');
  const agreeInputs = Array.from(form.querySelectorAll('input[name="agree"]'));
  const agreeWrappers = Array.from(form.querySelectorAll('[data-field="agree"]'));

  const errorBlocks = {
    name: Array.from(form.querySelectorAll('[data-error-for="name"]')),
    phone: Array.from(form.querySelectorAll('[data-error-for="phone"]')),
    agree: Array.from(form.querySelectorAll('[data-error-for="agree"]')),
  };

  const setFieldError = (field, message) => {
    errorBlocks[field]?.forEach((el) => {
      el.textContent = message;
    });
  };

  const toggleAgreeError = (hasError) => {
    agreeWrappers.forEach((wrapper) => wrapper.classList.toggle('has-error', hasError));
  };

  const validateName = () => {
    if (!nameInput) return true;
    const sanitized = sanitizeNameValue(nameInput.value);
    if (sanitized !== nameInput.value) {
      nameInput.value = sanitized;
    }
    const trimmed = sanitized.trim();
    let message = '';
    if (!trimmed) {
      message = 'Укажите имя';
    }
    nameInput.classList.toggle('input--invalid', Boolean(message));
    setFieldError('name', message);
    return !message;
  };

  const validatePhone = () => {
    if (!phoneInput) return true;
    const digits = phoneInput.value.replace(/\D/g, '');
    let message = '';
    if (digits.length < 11) {
      message = 'Введите номер полностью';
    }
    phoneInput.classList.toggle('input--invalid', Boolean(message));
    setFieldError('phone', message);
    return !message;
  };

  const validateAgree = () => {
    if (!agreeInputs.length) return true;
    const isChecked = agreeInputs.some((input) => input.checked);
    const message = isChecked ? '' : 'Нужно ваше согласие';
    toggleAgreeError(Boolean(message));
    setFieldError('agree', message);
    return isChecked;
  };

  const handlePhoneInput = () => {
    if (!phoneInput) return;
    const formatted = formatPhoneValue(phoneInput.value);
    phoneInput.value = formatted;
    validatePhone();
  };

  const syncAgreeInputs = (source) => {
    agreeInputs.forEach((input) => {
      if (input !== source) {
        input.checked = source.checked;
      }
    });
  };

  nameInput?.addEventListener('input', validateName);
  phoneInput?.addEventListener('input', handlePhoneInput);
  phoneInput?.addEventListener('focus', () => {
    if (!phoneInput.value) {
      phoneInput.value = '+7 (';
    }
  });
  phoneInput?.addEventListener('blur', () => {
    if (phoneInput.value.replace(/\D/g, '').length <= 1) {
      phoneInput.value = '';
    }
    validatePhone();
  });

  agreeInputs.forEach((input) => {
    input.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      syncAgreeInputs(target);
      validateAgree();
    });
  });

  form.addEventListener('submit', (event) => {
    const isValid = [validateName(), validatePhone(), validateAgree()].every(Boolean);
    if (!isValid) {
      event.preventDefault();
      const firstErrorInput = form.querySelector('.input--invalid');
      if (firstErrorInput instanceof HTMLElement) {
        firstErrorInput.focus();
      } else {
        const visibleAgreeInput = agreeInputs.find((input) => input.offsetParent !== null);
        visibleAgreeInput?.focus();
      }
    }
  });
};

const initLazyMap = () => {
  const iframe = document.querySelector('#map-container iframe[data-map-src]');
  if (!iframe) return;

  const loadMap = () => {
    const mapSrc = iframe.dataset.mapSrc;
    if (mapSrc) {
      iframe.src = mapSrc;
      iframe.removeAttribute('data-map-src');
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMap();
          obs.disconnect();
        }
      });
    }, { rootMargin: '200px 0px' });

    observer.observe(document.querySelector('#map') ?? iframe);
  } else {
    loadMap();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initFaqAccordion();
  initGallerySlider();
  initCtaFormValidation();
  initLazyMap();
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


// Конфигурация телефонов по UTM
const UTM_PHONE_MAP = {
  // Пример: { source: 'yandex', medium: 'cpc' } → телефон
  'yandex_karty': '+7 (495) 145-74-92',
  'yandex': {
    'cpc': '+7 (495) 123-45-67',
    'seo': '+7 (495) 987-65-43',
  },
  'google': {
    'cpc': '+7 (495) 111-22-33',
    'organic': '+7 (495) 333-22-11',
  },
  'vk': '+7 (495) 555-66-77',
  'telegram': '+7 (495) 777-88-99',
  // ... другие источники
  'default': '+7 (8332) 21-88-22', // телефон по умолчанию
};

// Извлечение параметров UTM из URL
function getUTMParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');

  return { utmSource, utmMedium };
}

// Получение телефона по UTM
function getPhoneByUTM(utmSource, utmMedium) {
  if (!utmSource) return UTM_PHONE_MAP.default;

  const sourceConfig = UTM_PHONE_MAP[utmSource];

  // Если для источника задан конкретный телефон (не объект)
  if (typeof sourceConfig === 'string') {
    return sourceConfig;
  }

  // Если источник — объект с medium
  if (sourceConfig && typeof sourceConfig === 'object' && utmMedium) {
    return sourceConfig[utmMedium] || UTM_PHONE_MAP.default;
  }

  return UTM_PHONE_MAP.default;
}

// Сохранение UTM и телефона в сессию
function saveUTMToSession(utmSource, utmMedium, phone) {
  sessionStorage.setItem('utm_source', utmSource);
  sessionStorage.setItem('utm_medium', utmMedium);
  sessionStorage.setItem('phone', phone);
}

// Чтение из сессии
function getSavedPhone() {
  return sessionStorage.getItem('phone') || UTM_PHONE_MAP.default;
}

// Основная функция инициализации
function initUTMPhone() {
  const { utmSource, utmMedium } = getUTMParams();

  let phone;

  if (utmSource) {
    // Пришёл UTM — определяем телефон и сохраняем
    phone = getPhoneByUTM(utmSource, utmMedium);
    saveUTMToSession(utmSource, utmMedium, phone);
  } else {
    // Нет UTM в URL — берём из сессии
    phone = getSavedPhone();
  }

  // Подставляем телефон на страницу
  // Пример: ищем элемент с data-phone="target"
  document.querySelectorAll('[data-phone="target"]').forEach(el => {
    el.textContent = phone;
    el.href = `tel:${phone.replace(/\D/g, '')}`; // для ссылки tel:+74951234567
  });
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', initUTMPhone);




// Отправка формы

document.getElementById('callback-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  try {
    const response = await fetch(import.meta.env.VITE_API_BASE_URL + '/events?action=callrequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LO-Token': import.meta.env.VITE_LO_TOKEN,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log(response);
      form.reset();
    } else {
      alert('Ошибка при отправке.');
    }
  } catch (error) {
    console.error('Ошибка:', error);
    alert('Не удалось подключиться к серверу.');
  }
});