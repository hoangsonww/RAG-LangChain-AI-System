/**
 * RAG AI System - Interactive Scripts
 * Handles navigation, tabs, animations, and user interactions
 */

(function () {
  "use strict";

  // ========== Mobile Menu Toggle ==========
  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const navMenu = document.querySelector(".nav-menu");

  if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      navMenu.classList.toggle("active");
      const icon = mobileMenuToggle.querySelector("i");

      if (icon) {
        if (navMenu.classList.contains("active")) {
          icon.classList.remove("fa-bars");
          icon.classList.add("fa-times");
        } else {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      }

      console.log("Mobile menu toggled:", navMenu.classList.contains("active"));
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        navMenu.classList.contains("active") &&
        !navMenu.contains(e.target) &&
        !mobileMenuToggle.contains(e.target)
      ) {
        navMenu.classList.remove("active");
        const icon = mobileMenuToggle.querySelector("i");
        if (icon) {
          icon.classList.remove("fa-times");
          icon.classList.add("fa-bars");
        }
      }
    });
  } else {
    console.error("Mobile menu elements not found:", {
      toggle: !!mobileMenuToggle,
      menu: !!navMenu,
    });
  }

  // ========== Smooth Scrolling for Navigation Links ==========
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (href === "#" || href === "") return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navbar = document.querySelector(".navbar");
        const navbarHeight = navbar ? navbar.offsetHeight : 70;
        const targetPosition = target.offsetTop - navbarHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // Close mobile menu if open
        const navMenuElement = document.querySelector(".nav-menu");
        const toggleElement = document.getElementById("mobileMenuToggle");

        if (navMenuElement && navMenuElement.classList.contains("active")) {
          navMenuElement.classList.remove("active");
          const icon = toggleElement ? toggleElement.querySelector("i") : null;
          if (icon) {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
          }
        }
      }
    });
  });

  // ========== Navbar Background on Scroll ==========
  const navbar = document.querySelector(".navbar");
  const scrollProgressContainer = document.querySelector(
    ".scroll-progress-container",
  );

  function updateNavbarStyle() {
    if (!navbar) return;

    if (window.scrollY > 50) {
      navbar.style.background = "rgba(10, 14, 39, 0.98)";
      navbar.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.3)";
    } else {
      navbar.style.background = "rgba(10, 14, 39, 0.95)";
      navbar.style.boxShadow = "none";
    }
  }

  // ========== Scroll Progress Bar ==========
  const scrollProgressBar = document.getElementById("scrollProgressBar");

  function updateScrollProgress() {
    if (!scrollProgressBar) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Calculate scroll percentage
    const scrollPercentage =
      (scrollTop / (documentHeight - windowHeight)) * 100;
    scrollProgressBar.style.width = `${Math.min(Math.max(scrollPercentage, 0), 100)}%`;
  }

  // ========== Active Navigation Link on Scroll ==========
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  function updateActiveNavLink() {
    if (!sections.length || !navLinks.length) return;

    // Get current scroll position with offset for navbar
    const scrollPosition = window.scrollY + 150;

    let currentSection = "";

    // Find which section is currently in view
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute("id");

      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        currentSection = sectionId;
      }
    });

    // Update active class on navigation links
    navLinks.forEach((link) => {
      link.classList.remove("active");
      const href = link.getAttribute("href");

      if (href === `#${currentSection}`) {
        link.classList.add("active");
      }
    });

    // Special case: if at the very top, highlight Home
    if (window.scrollY < 100) {
      navLinks.forEach((link) => link.classList.remove("active"));
      const homeLink = document.querySelector('.nav-link[href="#hero"]');
      if (homeLink) homeLink.classList.add("active");
    }
  }

  // ========== Combined Scroll Handler for Performance ==========
  let ticking = false;

  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateNavbarStyle();
        updateScrollProgress();
        updateActiveNavLink();
        ticking = false;
      });
      ticking = true;
    }
  }

  // Add scroll event listener
  window.addEventListener("scroll", handleScroll, { passive: true });

  // Initial call to set correct state on page load
  setTimeout(() => {
    updateNavbarStyle();
    updateScrollProgress();
    updateActiveNavLink();
  }, 100);

  // ========== Tab Functionality ==========
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked button and corresponding content
      button.classList.add("active");
      const targetContent = document.getElementById(`${targetTab}-tab`);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // ========== Back to Top Button ==========
  const backToTopButton = document.getElementById("backToTop");

  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.add("visible");
      } else {
        backToTopButton.classList.remove("visible");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // ========== Intersection Observer for Fade-in Animations ==========
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation (excluding conversation/message elements)
  const animateElements = document.querySelectorAll(
    ".feature-card, .resource-card, .comparison-card, .tech-category, .step",
  );

  animateElements.forEach((el) => {
    observer.observe(el);
  });

  // ========== Stats Counter Animation ==========
  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  const statObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statValue = entry.target.querySelector(".stat-value");
          const text = statValue.textContent;
          const number = parseInt(text);

          if (!isNaN(number)) {
            statValue.textContent = "0";
            animateCounter(statValue, number);
          }

          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  document.querySelectorAll(".stat-item").forEach((stat) => {
    statObserver.observe(stat);
  });

  // ========== Copy Code to Clipboard ==========
  function addCopyButtons() {
    const codeBlocks = document.querySelectorAll('pre[class*="language-"]');

    codeBlocks.forEach((block) => {
      // Skip if already wrapped
      if (block.parentElement.classList.contains("code-block-wrapper")) return;

      // Create wrapper for button positioning
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      // Wrap the code block
      block.parentNode.insertBefore(wrapper, block);
      wrapper.appendChild(block);

      // Create copy button
      const button = document.createElement("button");
      button.className = "copy-button";
      button.innerHTML = '<i class="fas fa-copy"></i> Copy';
      button.setAttribute("aria-label", "Copy code to clipboard");

      // Insert button into wrapper (it will position absolute to wrapper)
      wrapper.insertBefore(button, block);

      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const code = block.querySelector("code").textContent;

        try {
          await navigator.clipboard.writeText(code);
          button.innerHTML = '<i class="fas fa-check"></i> Copied!';
          button.style.background = "rgba(76, 175, 80, 0.2)";
          button.style.borderColor = "rgba(76, 175, 80, 0.4)";
          button.style.color = "#4caf50";

          setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i> Copy';
            button.style.background = "rgba(102, 126, 234, 0.2)";
            button.style.borderColor = "rgba(102, 126, 234, 0.4)";
            button.style.color = "#667eea";
          }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
          button.innerHTML = '<i class="fas fa-times"></i> Failed';
          button.style.background = "rgba(244, 67, 54, 0.2)";
          button.style.borderColor = "rgba(244, 67, 54, 0.4)";
          button.style.color = "#f44336";
        }
      });

      button.addEventListener("mouseenter", () => {
        if (!button.innerHTML.includes("Copied")) {
          button.style.background = "rgba(102, 126, 234, 0.3)";
          button.style.transform = "translateY(-2px)";
        }
      });

      button.addEventListener("mouseleave", () => {
        if (!button.innerHTML.includes("Copied")) {
          button.style.background = "rgba(102, 126, 234, 0.2)";
          button.style.transform = "translateY(0)";
        }
      });
    });
  }

  // Add copy buttons after a short delay to ensure code blocks are rendered
  setTimeout(addCopyButtons, 1000);

  // ========== External Link Indicators ==========
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    if (!link.querySelector(".external-icon")) {
      const icon = document.createElement("i");
      icon.className = "fas fa-external-link-alt external-icon";
      icon.style.cssText =
        "margin-left: 0.25rem; font-size: 0.75em; opacity: 0.7;";
      link.appendChild(icon);
    }
  });

  // ========== Feature Card Tilt Effect ==========
  // Exclude demo-card to prevent animation on conversation examples
  const featureCards = document.querySelectorAll(
    ".feature-card, .resource-card",
  );

  featureCards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform =
        "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
    });
  });

  // ========== Parallax Effect for Hero Background ==========
  const heroBackground = document.querySelector(".hero-background");

  if (heroBackground) {
    window.addEventListener("scroll", () => {
      const scrolled = window.scrollY;
      const parallaxSpeed = 0.5;
      heroBackground.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
    });
  }

  // ========== Dynamic Year in Footer ==========
  const currentYear = new Date().getFullYear();
  const yearElements = document.querySelectorAll(".current-year");
  yearElements.forEach((el) => {
    el.textContent = currentYear;
  });

  // ========== Loading Animation Complete ==========
  window.addEventListener("load", () => {
    document.body.classList.add("loaded");

    // Trigger animations for visible elements
    const visibleElements = document.querySelectorAll(
      ".hero-content > *, .stats",
    );
    visibleElements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, index * 100);
    });
  });

  // ========== Console Message ==========
  console.log(
    "%c🤖 RAG AI System",
    "font-size: 24px; font-weight: bold; color: #667eea;",
  );
  console.log(
    "%cWelcome to the Advanced RAG AI System!",
    "font-size: 14px; color: #b8c1ec;",
  );
  console.log(
    "%cBuilt with React, Flask, LangChain, and Ollama",
    "font-size: 12px; color: #8892b8;",
  );
  console.log(
    "%cGitHub: https://github.com/hoangsonww/RAG-LangChain-AI-System",
    "font-size: 12px; color: #4facfe;",
  );

  // Debug scroll features
  console.log(
    "%c✅ Scroll Progress Bar:",
    scrollProgressBar ? "Initialized" : "❌ Not found",
    "color: #4caf50",
  );
  console.log(
    "%c✅ Navigation Links:",
    navLinks.length > 0 ? `Found ${navLinks.length} links` : "❌ Not found",
    "color: #4caf50",
  );
  console.log(
    "%c✅ Sections:",
    sections.length > 0 ? `Found ${sections.length} sections` : "❌ Not found",
    "color: #4caf50",
  );

  // Debug mobile menu
  console.log(
    "%c✅ Mobile Menu Toggle:",
    mobileMenuToggle ? "Found" : "❌ Not found",
    "color: #4caf50",
  );
  console.log(
    "%c✅ Nav Menu:",
    navMenu ? "Found" : "❌ Not found",
    "color: #4caf50",
  );

  // ========== Performance Monitoring ==========
  if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "largest-contentful-paint") {
          console.log("LCP:", entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  }

  // ========== Keyboard Navigation ==========
  document.addEventListener("keydown", (e) => {
    // Escape key closes mobile menu
    if (e.key === "Escape" && navMenu.classList.contains("active")) {
      navMenu.classList.remove("active");
      const icon = mobileMenuToggle.querySelector("i");
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }

    // Ctrl/Cmd + K for search (placeholder for future implementation)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      console.log("Search functionality - Coming soon!");
    }
  });

  // ========== Theme Toggle (Future Enhancement) ==========
  // Placeholder for light/dark theme toggle
  function initThemeToggle() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  // ========== Error Handling for External Resources ==========
  window.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName === "SCRIPT" || e.target.tagName === "LINK") {
        console.warn("Failed to load resource:", e.target.src || e.target.href);
      }
    },
    true,
  );

  // ========== Initialize All Features ==========
  function init() {
    console.log("🚀 Initializing RAG AI System Wiki...");

    // Set initial styles for animated elements
    const animatedElements = document.querySelectorAll(
      ".hero-content > *, .stats",
    );
    animatedElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    });

    // Initialize theme
    initThemeToggle();

    // Initialize scroll features
    setTimeout(() => {
      console.log("🔄 Initializing scroll features...");
      updateNavbarStyle();
      updateScrollProgress();
      updateActiveNavLink();
      console.log("✅ Scroll features initialized!");
    }, 200);

    console.log("✅ Initialization complete!");
  }

  // Run initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ========== Service Worker Registration (Optional) ==========
  if ("serviceWorker" in navigator && window.location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("ServiceWorker registered:", registration);
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed:", err);
        });
    });
  }

  // ========== Analytics (Placeholder) ==========
  function trackPageView() {
    // Placeholder for analytics integration
    console.log("Page view tracked");
  }

  function trackEvent(category, action, label) {
    // Placeholder for event tracking
    console.log("Event tracked:", category, action, label);
  }

  // Track initial page view
  trackPageView();

  // Track button clicks
  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.textContent.trim();
      trackEvent("Button", "Click", text);
    });
  });

  // ========== Expose Utilities to Global Scope ==========
  window.RAGSystem = {
    version: "1.0.0",
    trackEvent,
    trackPageView,
  };
})();
