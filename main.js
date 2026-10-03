document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const topbar = document.querySelector(".topbar");
  const scrollProgress = document.querySelector(".scroll-progress");
  const navToggle = document.querySelector(".nav-toggle");
  const navPanel = document.querySelector(".nav-panel");

  const updateScrollState = () => {
    const scrolled = window.scrollY > 24;
    topbar?.classList.toggle("scrolled", scrolled);

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    if (scrollProgress) scrollProgress.style.width = `${Math.min(progress, 100)}%`;
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  navToggle?.addEventListener("click", () => {
    const open = navPanel?.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest(".nav-panel") && !target.closest(".nav-toggle")) {
      navPanel?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });

  const revealEls = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  const tickerText = document.getElementById("tickerText");
  const tickerMessages = [
    "Trusted by 40+ departments across Britain",
    "Now licensed by the Department of Magical Law Enforcement",
    "Calibrated beneath the Black Lake"
  ];
  let tickerIndex = 0;

  setInterval(() => {
    tickerIndex = (tickerIndex + 1) % tickerMessages.length;
    if (tickerText) tickerText.textContent = tickerMessages[tickerIndex];
  }, 4000);

  const counters = document.querySelectorAll("[data-count]");
  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number(element.dataset.count || 0);

        let current = 0;
        const step = Math.max(1, Math.ceil(target / 60));

        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          element.textContent = String(current);
        }, 24);

        countObserver.unobserve(element);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => countObserver.observe(el));

  if (window.matchMedia("(pointer: fine)").matches) {
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(ring);

    document.addEventListener("pointermove", (event) => {
      ring.style.left = `${event.clientX}px`;
      ring.style.top = `${event.clientY}px`;
    });

    document.querySelectorAll("a, button, input, textarea, select").forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("active"));
      el.addEventListener("pointerleave", () => ring.classList.remove("active"));
    });
  }

  const ambientButton = document.createElement("button");
  ambientButton.type = "button";
  ambientButton.className = "btn btn-secondary ambient-toggle";
  ambientButton.textContent = "Candle glow";
  ambientButton.style.position = "fixed";
  ambientButton.style.left = "18px";
  ambientButton.style.bottom = "22px";
  ambientButton.style.zIndex = "90";
  ambientButton.setAttribute("aria-label", "Toggle ambient candle glow");

  let ambientOn = true;
  document.body.appendChild(ambientButton);

  ambientButton.addEventListener("click", () => {
    ambientOn = !ambientOn;
    document.body.classList.toggle("ambient-off", !ambientOn);
    ambientButton.textContent = ambientOn ? "Candle glow" : "Glow off";
    showToast(ambientOn ? "The candles are bright again." : "Ambient glow dimmed.");
  });

  const toastContainer = document.querySelector(".toast-container");
  function showToast(message) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2200);
  }

  const orderModal = document.getElementById("orderModal");
  const orderForm = document.getElementById("orderForm");
  const totalDisplay = document.getElementById("orderTotal");
  const orderEdition = orderForm?.elements.namedItem("edition");
  const orderQty = orderForm?.elements.namedItem("quantity");
  const orderAddons = orderForm?.querySelectorAll("[data-addon]");
  const orderButtons = document.querySelectorAll(".order-btn");
  const modalClose = document.querySelector(".modal-close");

  const priceMap = {
    "Field Edition": 350,
    "Auror Pro": 600,
    "Castle Master": 1800
  };

  function updateOrderTotal() {
    if (!orderEdition || !orderQty || !totalDisplay) return;
    const base = priceMap[orderEdition.value] || 0;
    const qty = Number(orderQty.value) || 1;
    let total = base * qty;

    orderAddons?.forEach((checkbox) => {
      if (checkbox.checked) total += Number(checkbox.value) * qty;
    });

    totalDisplay.textContent = `${total} G`;
  }

  orderEdition?.addEventListener("change", updateOrderTotal);
  orderQty?.addEventListener("input", updateOrderTotal);
  orderAddons?.forEach((box) => box.addEventListener("change", updateOrderTotal));

  orderButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tier = button.dataset.orderTier;
      if (tier && orderEdition) orderEdition.value = tier;
      updateOrderTotal();
      orderModal?.classList.add("visible");
      orderModal?.setAttribute("aria-hidden", "false");
    });
  });

  function closeModal() {
    orderModal?.classList.remove("visible");
    orderModal?.setAttribute("aria-hidden", "true");
  }

  modalClose?.addEventListener("click", closeModal);
  orderModal?.addEventListener("click", (event) => {
    if (event.target === orderModal) closeModal();
  });

  orderForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = orderForm.elements.namedItem("name")?.value.trim();
    const address = orderForm.elements.namedItem("address")?.value.trim();
    if (!name || !address) {
      showToast("Please fill in your name and owl address.");
      return;
    }

    const orderNumber = `OS-${new Date().getFullYear()}-${String(new Date().getDate()).padStart(2, "0")}${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    showToast("Your order has been dispatched by owl. (Demo only. No real order was placed.)");
    closeModal();
    orderForm.reset();
    setTimeout(() => showToast(`Order reference: ${orderNumber}`), 300);
    updateOrderTotal();
  });

  const serviceForm = document.getElementById("serviceForm");
  const servicePrice = document.getElementById("servicePrice");
  const serviceTabs = document.querySelectorAll(".service-tab");
  const serviceTypeSelect = serviceForm?.elements.namedItem("serviceType");
  const urgencySelect = serviceForm?.elements.namedItem("urgency");

  const servicePricing = {
    single: { standard: 80, priority: 100, emergency: 128 },
    floor: { standard: 320, priority: 400, emergency: 512 },
    estate: { standard: 900, priority: 1125, emergency: 1440 }
  };

  function updateServicePrice() {
    if (!serviceTypeSelect || !urgencySelect || !servicePrice) return;
    const type = serviceTypeSelect.value;
    const urgency = urgencySelect.value;
    const price = servicePricing[type]?.[urgency] ?? 80;
    servicePrice.textContent = `${price} G`;
  }

  serviceTypeSelect?.addEventListener("change", updateServicePrice);
  urgencySelect?.addEventListener("change", updateServicePrice);

  serviceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      serviceTabs.forEach((item) => item.classList.toggle("active", item === tab));
      const value = tab.dataset.service;
      if (serviceTypeSelect) {
        if (value === "single") serviceTypeSelect.value = "single";
        if (value === "floor") serviceTypeSelect.value = "floor";
        if (value === "estate") serviceTypeSelect.value = "estate";
      }
      updateServicePrice();
    });
  });

  serviceForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(serviceForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const date = String(formData.get("date") || "").trim();

    if (!name || !email || !location || !date) {
      showToast("Please complete all service-request fields.");
      return;
    }

    const ref = `SR-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    showToast("Request received. A licensed Omni-Scope Operator will owl you within one day.");
    setTimeout(() => showToast(`Reference: ${ref}`), 300);
    serviceForm.reset();
    updateServicePrice();
  });

  updateServicePrice();
  updateOrderTotal();

  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    btn?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      faqItems.forEach((faq) => faq.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  const testimonials = document.querySelectorAll(".testimonial");
  const dots = document.querySelectorAll(".dot");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");

  let testimonialIndex = 0;
  function showTestimonial(index) {
    testimonials.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  prevBtn?.addEventListener("click", () => {
    testimonialIndex = (testimonialIndex - 1 + testimonials.length) % testimonials.length;
    showTestimonial(testimonialIndex);
  });

  nextBtn?.addEventListener("click", () => {
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
    showTestimonial(testimonialIndex);
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      testimonialIndex = i;
      showTestimonial(testimonialIndex);
    });
  });

  let carouselTimer = setInterval(() => {
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
    showTestimonial(testimonialIndex);
  }, 6000);

  const carousel = document.querySelector(".testimonial-carousel");
  carousel?.addEventListener("mouseenter", () => clearInterval(carouselTimer));
  carousel?.addEventListener("mouseleave", () => {
    clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
      testimonialIndex = (testimonialIndex + 1) % testimonials.length;
      showTestimonial(testimonialIndex);
    }, 6000);
  });

  let typed = "";
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key.length === 1) typed += key;
    if (typed.length > 5) typed = typed.slice(-5);

    if (typed === "lumos") {
      showToast("Lumos! Glow intensified.");
      body.classList.add("lumos-mode");
      setTimeout(() => body.classList.remove("lumos-mode"), 3000);
      typed = "";
    }

    if (typed === "nox") {
      showToast("Nox. The chamber dims.");
      body.classList.remove("lumos-mode");
      typed = "";
    }
  });

  document.querySelectorAll("a, button, input, select, textarea").forEach((el) => {
    el.addEventListener("focus", () => {
      el.style.outline = "2px solid rgba(240,210,122,0.65)";
      el.style.outlineOffset = "2px";
    });
    el.addEventListener("blur", () => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    });
  });

  setTimeout(() => {
    revealEls.forEach((el) => {
      if (!el.classList.contains("visible")) el.classList.add("visible");
    });
  }, 80);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    body.classList.add("reduced-motion");
  }
});
