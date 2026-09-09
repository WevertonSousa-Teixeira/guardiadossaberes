/* Raiz que Conta: interações sem framework, preservando o gesto editorial da versão anterior. */
(function () {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
  const cards = $$(".plant-card");
  const search = $("#plant-search");
  const clearSearch = $("#clear-search");
  const emptyState = $("#empty-state");
  const clearFilters = $("#clear-filters");
  const modal = $("#plant-modal");
  const modalClose = $("#modal-close");
  const menuToggle = $("#menu-toggle");
  const nav = $("#main-nav");
  let activeCategory = "Todas";
  let currentAudio = null;

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "local-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("local-toast--visible"));
    window.setTimeout(() => {
      toast.classList.remove("local-toast--visible");
      window.setTimeout(() => toast.remove(), 200);
    }, 2700);
  }

  function updateCatalog() {
    const query = (search.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const matchesCategory = activeCategory === "Todas" || card.dataset.category === activeCategory;
      const matchesQuery = !query || card.dataset.name.toLowerCase().includes(query);
      const shouldShow = matchesCategory && matchesQuery;
      card.hidden = !shouldShow;
      if (shouldShow) visible += 1;
    });
    emptyState.hidden = visible !== 0;
    clearSearch.hidden = !query;
  }

  function setCategory(category, button) {
    activeCategory = category;
    $$(".category-tab").forEach((item) => item.classList.remove("category-tab--active"));
    button.classList.add("category-tab--active");
    updateCatalog();
  }

  function fillModal(card) {
    const plant = JSON.parse(card.dataset.plant);
    $("#modal-image").src = `assets/${plant.image}`;
    $("#modal-image").alt = `Detalhe de ${plant.name}`;
    $("#modal-status").textContent = plant.status;
    $("#modal-status").className = `status-pill status-pill--${plant.status_tone}`;
    $("#plant-modal-title").textContent = plant.name;
    $("#modal-scientific").textContent = plant.scientific;
    $("#modal-description").textContent = plant.description;
    $("#modal-family").textContent = plant.family;
    $("#modal-uses").textContent = plant.uses;
    configureAudio(plant);
    modal.hidden = false;
    document.body.classList.add("modal-open");
    modalClose.focus();
  }

  function configureAudio(plant) {
    const player = $("#audio-player");
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (!plant.audio) {
      player.className = "audio-player audio-player--pending";
      player.innerHTML = '<div class="audio-player__pending-icon">◖</div><div class="audio-player__pending-copy"><strong>Relato oral em preparação</strong><span>Aguardando autorização e publicação da voz da guardiã.</span></div><span class="audio-player__pending-tag">EM BREVE</span>';
      return;
    }
    player.className = "audio-player";
    player.innerHTML = '<button class="audio-player__play" type="button" aria-label="Ouvir relato">▶</button><div class="audio-player__body"><div class="audio-player__heading"><strong>Voz da guardiã</strong><span>relato oral</span></div><input class="audio-player__range" type="range" min="0" value="0" step="0.1" aria-label="Progresso do áudio"><div class="audio-player__times"><span>00:00</span><span>00:00</span></div></div><span class="audio-player__volume">◖</span>';
    const audio = new Audio(`assets/${plant.audio}`);
    currentAudio = audio;
    const playButton = $(".audio-player__play", player);
    const range = $(".audio-player__range", player);
    const times = $$(".audio-player__times span", player);
    const format = (seconds) => Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString().slice(14, 19) : "00:00";
    audio.addEventListener("loadedmetadata", () => { range.max = audio.duration || 0; times[1].textContent = format(audio.duration); });
    audio.addEventListener("timeupdate", () => { range.value = audio.currentTime; times[0].textContent = format(audio.currentTime); range.style.setProperty("--audio-progress", `${(audio.currentTime / audio.duration) * 100}%`); });
    audio.addEventListener("ended", () => { playButton.textContent = "▶"; });
    audio.addEventListener("error", () => showToast("Não foi possível carregar este relato."));
    playButton.addEventListener("click", async () => {
      try {
        if (audio.paused) { await audio.play(); playButton.textContent = "Ⅱ"; }
        else { audio.pause(); playButton.textContent = "▶"; }
      } catch { showToast("A reprodução não pôde ser iniciada."); }
    });
    range.addEventListener("input", () => { audio.currentTime = Number(range.value); });
  }

  function closeModal() {
    if (currentAudio) currentAudio.pause();
    currentAudio = null;
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  $$(".plant-open").forEach((button) => button.addEventListener("click", () => fillModal(button.closest(".plant-card"))));
  $$(".category-tab").forEach((button) => button.addEventListener("click", () => setCategory(button.dataset.category, button)));
  search.addEventListener("input", updateCatalog);
  clearSearch.addEventListener("click", () => { search.value = ""; updateCatalog(); search.focus(); });
  clearFilters.addEventListener("click", () => { search.value = ""; activeCategory = "Todas"; $$(".category-tab").forEach((item, index) => item.classList.toggle("category-tab--active", index === 0)); updateCatalog(); });
  modalClose.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !modal.hidden) closeModal(); });
  menuToggle.addEventListener("click", () => { const open = nav.classList.toggle("main-nav--open"); menuToggle.setAttribute("aria-expanded", String(open)); });
  $$('[data-scroll]').forEach((element) => element.addEventListener("click", () => { const target = $(element.dataset.scroll); if (target) target.scrollIntoView({ behavior: "smooth" }); }));
  $$('[data-toast]').forEach((element) => element.addEventListener("click", () => showToast(element.dataset.toast)));
  $$(".main-nav a").forEach((link) => link.addEventListener("click", () => { nav.classList.remove("main-nav--open"); menuToggle.setAttribute("aria-expanded", "false"); }));
})();
