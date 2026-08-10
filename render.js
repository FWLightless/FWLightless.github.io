/**
 * Developer Portfolio & Resource Hub Dynamic Engine
 */

(function () {
  // 全局状态管理
  const state = {
    currentLang: localStorage.getItem('app_lang') || 'zh',
    currentTheme: localStorage.getItem('app_theme') || 'light',
    data: null
  };

  // DOM 元素引用
  const elements = {
    themeToggleBtn: document.getElementById('theme-toggle'),
    langToggleBtn: document.getElementById('lang-toggle'),
    portfolioContainer: document.getElementById('portfolio-container'),
    timelineContainer: document.getElementById('timeline-container'),
    skillsContainer: document.getElementById('skills-container'),
    resourcesContainer: document.getElementById('resources-container'),
    modal: document.getElementById('global-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body-content'),
    modalCloseBtn: document.getElementById('modal-close-btn')
  };

  /* ==========================================================================
     1. 初始化与数据加载 (Fetch Data with Local CORS Fallback)
     ========================================================================== */
  async function init() {
    setupTheme(state.currentTheme);
    bindEvents();

    try {
      const response = await fetch('./data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      state.data = await response.json();
      
      // 初次全量渲染
      renderAll();
      setupScrollSpy();
    } catch (error) {
      console.error('Data loading failed:', error);
      showCORSErrorNotification();
    }
  }

  function showCORSErrorNotification() {
    const errorHTML = `
      <div style="padding: 2rem; background: rgba(239,68,68,0.1); border: 1px solid #ef4444; border-radius: 8px; margin: 2rem 0;">
        <h3 style="color: #ef4444; margin-bottom: 0.5rem;">数据加载失败 (CORS Error)</h3>
        <p>检测到您可能直接通过 file:// 协议打开了 HTML 文件，导致 fetch() 被浏览器安全策略阻断。</p>
        <p style="margin-top: 0.5rem; font-family: monospace;">请在终端运行：<strong>python3 -m http.server 8000</strong> 或使用 Live Server 预览。</p>
      </div>
    `;
    elements.portfolioContainer.innerHTML = errorHTML;
  }

  /* ==========================================================================
     2. 核心全量重绘引擎 (Dynamic Language DOM Re-hydration)
     ========================================================================== */
  function renderAll() {
    if (!state.data) return;
    const lang = state.currentLang;

    // 渲染 Hero
    document.getElementById('hero-title').innerHTML = state.data.hero.title[lang];
    document.getElementById('hero-subtitle').textContent = state.data.hero.subtitle[lang];

    // 更新静态 I18N 元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const keyPath = el.getAttribute('data-i18n').split('.');
      let val = state.data;
      keyPath.forEach(k => { val = val ? val[k] : null; });
      if (val && val[lang]) el.textContent = val[lang];
    });

    // 渲染动态模块
    renderPortfolio(lang);
    renderTimeline(lang);
    renderSkills(lang);
    renderResources(lang);
    
    // 更新语言按钮状态
    elements.langToggleBtn.textContent = lang === 'zh' ? 'EN' : '中文';
  }

  /* ==========================================================================
     3. 模块渲染器 (Render Functions)
     ========================================================================== */
  function renderPortfolio(lang) {
    elements.portfolioContainer.innerHTML = state.data.portfolio.map(item => `
      <article class="card">
        <div class="card-img-wrapper">
          <img class="card-img" src="${item.thumbnail}" alt="${item.title[lang]}" loading="lazy" width="400" height="225">
        </div>
        <div class="card-body">
          <h3 class="card-title">${item.title[lang]}</h3>
          <p class="card-desc">${item.description[lang]}</p>
          <div class="tag-group">
            ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div style="margin-top: auto; display: flex; gap: 0.5rem;">
            <button class="btn-control open-modal-btn" data-id="${item.id}" style="width: 100%;">
              ${lang === 'zh' ? '查看详情' : 'View Details'}
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderTimeline(lang) {
    elements.timelineContainer.innerHTML = state.data.timeline.map(item => `
      <div class="timeline-item">
        <span class="timeline-date">${item.period}</span>
        <h3 class="timeline-title">${item.role[lang]}</h3>
        <h4 class="timeline-subtitle">${item.company[lang]}</h4>
        <p style="font-size: var(--step--1); color: var(--text-secondary);">${item.description[lang]}</p>
      </div>
    `).join('');
  }

  function renderSkills(lang) {
    elements.skillsContainer.innerHTML = state.data.skills.map(group => `
      <div class="card" style="padding: 1.5rem;">
        <h3 style="font-size: var(--step-0); margin-bottom: 1rem; color: var(--accent-color);">${group.category[lang]}</h3>
        <ul style="list-style: none; padding: 0;">
          ${group.items.map(skill => `
            <li style="margin-bottom: 0.5rem; font-size: var(--step--1); display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: var(--accent-color);">✓</span> ${skill}
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
  }

  function renderResources(lang) {
    elements.resourcesContainer.innerHTML = state.data.resources.map(item => `
      <article class="card">
        <div class="card-body">
          <h3 class="card-title">${item.title[lang]}</h3>
          <p class="card-desc">${item.description[lang]}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${item.fileSize}</span>
            <a href="${item.downloadUrl}" target="_blank" class="btn-control" style="text-decoration: none; background: var(--accent-color); color: #fff; border: none;">
              ${lang === 'zh' ? '下载资源' : 'Download'}
            </a>
          </div>
        </div>
      </article>
    `).join('');
  }

  /* ==========================================================================
     4. IntersectionObserver 导航 Scrollspy 高亮逻辑
     ========================================================================== */
  function setupScrollSpy() {
    const sections = document.querySelectorAll('section, footer');
    const navLinks = document.querySelectorAll('.nav-link');

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  /* ==========================================================================
     5. 事件绑定与交互逻辑 (Modal, Theme, Lang)
     ========================================================================== */
  function bindEvents() {
    // 主题切换
    elements.themeToggleBtn.addEventListener('click', () => {
      state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
      setupTheme(state.currentTheme);
    });

    // 语言切换
    elements.langToggleBtn.addEventListener('click', () => {
      state.currentLang = state.currentLang === 'zh' ? 'en' : 'zh';
      localStorage.setItem('app_lang', state.currentLang);
      renderAll();
    });

    // 事件委托：作品集 Modal 打开
    elements.portfolioContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('open-modal-btn')) {
        const id = e.target.getAttribute('data-id');
        openModal(id);
      }
    });

    // Modal 关闭
    elements.modalCloseBtn.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
      if (e.target === elements.modal) closeModal();
    });
  }

  function setupTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeToggleBtn.textContent = theme === 'light' ? '🌙' : '☀️';
    localStorage.setItem('app_theme', theme);
  }

  function openModal(projectId) {
    const project = state.data.portfolio.find(p => p.id === projectId);
    if (!project) return;

    const lang = state.currentLang;
    elements.modalTitle.textContent = project.title[lang];
    elements.modalBody.innerHTML = `
      <p style="margin-bottom: 1rem;">${project.details[lang]}</p>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        ${project.links.demo ? `<a href="${project.links.demo}" target="_blank" class="btn-control" style="background:var(--accent-color); color:#fff; text-decoration:none;">Live Demo</a>` : ''}
        ${project.links.github ? `<a href="${project.links.github}" target="_blank" class="btn-control" style="text-decoration:none;">GitHub Repo</a>` : ''}
        ${project.links.pan ? `<span style="font-size:0.85rem; color:var(--text-secondary); align-self:center;">网盘: ${project.links.pan}</span>` : ''}
      </div>
    `;
    elements.modal.classList.add('active');
    elements.modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    elements.modal.classList.remove('active');
    elements.modal.setAttribute('aria-hidden', 'true');
  }

  // 启动应用
  document.addEventListener('DOMContentLoaded', init);
})();