// ============================================================
//  JARVIS MUSIC — App Logic
// ============================================================

// ---------- State ----------
const state = {
  currentTrack: null,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,
  progress: 0,
  volume: 70,
  likedTracks: new Set(TOP_TRACKS.filter((t) => t.liked).map((t) => t.id)),
  progressTimer: null,
};

// ---------- Helpers ----------
function $(id) {
  return document.getElementById(id);
}

function colorWithAlpha(hex, alpha = 0.3) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------- Navigation ----------
function navigateTo(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));

  const pageEl = $(`page-${page}`);
  if (pageEl) pageEl.classList.add("active");

  document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach((n) =>
    n.classList.add("active")
  );

  if (page === "liked") renderLikedTracks();
}

// ---------- Render: Sidebar Playlists ----------
function renderSidebarPlaylists() {
  const container = $("sidebarPlaylists");
  container.innerHTML = PLAYLISTS.map(
    (pl) => `
    <li class="nav-item" data-page="home" onclick="navigateTo('home')">
      <i class="fa-solid fa-music"></i>
      <span>${pl.title}</span>
    </li>`
  ).join("");
}

// ---------- Render: Quick Grid ----------
function renderQuickGrid() {
  const container = $("quickGrid");
  container.innerHTML = QUICK_ACCESS.map(
    (qa) => `
    <div class="quick-card" onclick="handleQuickCard('${qa.id}')">
      <div class="quick-thumb" style="background: ${qa.color}">${qa.emoji}</div>
      <span class="quick-title">${qa.title}</span>
      <button class="quick-play"><i class="fa-solid fa-play"></i></button>
    </div>`
  ).join("");
}

// ---------- Render: Card Row ----------
function renderCardRow(containerId, items) {
  const container = $(containerId);
  container.innerHTML = items
    .map(
      (item) => `
    <div class="card" onclick="handleCardClick('${item.id}')">
      <div class="card-cover" style="background: linear-gradient(135deg, ${item.color}, #0d0d0d)">
        <span>${item.emoji}</span>
        <button class="card-play" onclick="event.stopPropagation(); playFromCard('${item.id}')">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-title">${item.title}</div>
      <div class="card-sub">${item.description || item.artist || item.type || ""}</div>
    </div>`
    )
    .join("");
}

// ---------- Render: Track List ----------
function renderTrackList(containerId, tracks) {
  const container = $(containerId);
  container.innerHTML = tracks
    .map(
      (track, i) => `
    <div class="track-item" id="track-${track.id}" onclick="playTrack('${track.id}')">
      <span class="track-num">${i + 1}</span>
      <span class="track-play-icon"><i class="fa-solid fa-play"></i></span>
      <div class="track-cover" style="background: linear-gradient(135deg, ${track.color}, #1a1a1a)">${track.emoji}</div>
      <div class="track-meta">
        <div class="track-name">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
      </div>
      <div class="track-album">${track.album}</div>
      <button class="track-like ${state.likedTracks.has(track.id) ? "liked" : ""}"
        onclick="event.stopPropagation(); toggleLike('${track.id}', this)">
        <i class="${state.likedTracks.has(track.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>
      </button>
      <div class="track-duration">${track.duration}</div>
    </div>`
    )
    .join("");
}

// ---------- Render: Genre Grid ----------
function renderGenreGrid() {
  const container = $("genreGrid");
  container.innerHTML = GENRES.map(
    (g) => `
    <div class="genre-card" style="background: linear-gradient(135deg, ${g.color}cc, ${g.color}55)">
      <span>${g.name}</span>
      <span class="genre-icon">${g.emoji}</span>
    </div>`
  ).join("");
}

// ---------- Render: Library ----------
function renderLibrary() {
  const container = $("libraryList");
  const items = [
    ...PLAYLISTS.map((p) => ({ ...p, type: "Playlist", meta: `Playlist · ${p.trackCount} songs` })),
    ...NEW_RELEASES.map((r) => ({ ...r, type: "Album", meta: `Album · ${r.artist}` })),
  ];

  container.innerHTML = items
    .map(
      (item) => `
    <div class="library-item">
      <div class="library-thumb" style="background: linear-gradient(135deg, ${item.color}, #1a1a1a)">${item.emoji}</div>
      <div class="library-info">
        <div class="lib-name">${item.title}</div>
        <div class="lib-meta">${item.meta}</div>
      </div>
    </div>`
    )
    .join("");
}

// ---------- Render: Liked Tracks ----------
function renderLikedTracks() {
  const liked = TOP_TRACKS.filter((t) => state.likedTracks.has(t.id));
  $("likedCount").textContent = liked.length;
  renderTrackList("likedTracks", liked);
}

// ---------- Render: Hero ----------
function renderHero() {
  const featured = PLAYLISTS[0];
  $("heroTitle").textContent = featured.title;
  $("heroSub").textContent = featured.description;
}

// ---------- Play Logic ----------
function playTrack(trackId) {
  const track = TOP_TRACKS.find((t) => t.id === trackId);
  if (!track) return;

  // Remove playing state from previous track
  document.querySelectorAll(".track-item.playing").forEach((el) =>
    el.classList.remove("playing")
  );

  state.currentTrack = track;
  state.isPlaying = true;
  state.progress = 0;

  // Mark current track
  const trackEl = $(`track-${trackId}`);
  if (trackEl) trackEl.classList.add("playing");

  // Update now playing bar
  $("npTitle").textContent = track.title;
  $("npArtist").textContent = track.artist;
  $("npCover").style.background = `linear-gradient(135deg, ${track.color}, #1a1a1a)`;
  $("npCover").innerHTML = `<span style="font-size:22px">${track.emoji}</span>`;
  $("npLike").innerHTML = `<i class="${state.likedTracks.has(track.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
  $("npLike").style.color = state.likedTracks.has(track.id) ? "var(--accent)" : "";
  $("totalTime").textContent = track.duration;

  updatePlayPauseBtn();
  startProgressSimulation(track.duration);
}

function playFromCard(cardId) {
  const track = TOP_TRACKS[Math.floor(Math.random() * TOP_TRACKS.length)];
  playTrack(track.id);
}

function handleCardClick(cardId) {
  // Scroll into view / could navigate to detail page
}

function handleQuickCard(qaId) {
  const track = TOP_TRACKS[Math.floor(Math.random() * TOP_TRACKS.length)];
  playTrack(track.id);
}

function togglePlayPause() {
  if (!state.currentTrack) {
    playTrack(TOP_TRACKS[0].id);
    return;
  }
  state.isPlaying = !state.isPlaying;
  updatePlayPauseBtn();
  if (state.isPlaying) {
    startProgressSimulation(state.currentTrack.duration);
  } else {
    clearInterval(state.progressTimer);
  }
}

function updatePlayPauseBtn() {
  const btn = $("playPauseBtn");
  btn.innerHTML = state.isPlaying
    ? `<i class="fa-solid fa-pause"></i>`
    : `<i class="fa-solid fa-play"></i>`;
}

function skipTrack(direction) {
  if (!state.currentTrack) return;
  const idx = TOP_TRACKS.findIndex((t) => t.id === state.currentTrack.id);
  let next;
  if (state.isShuffle) {
    next = TOP_TRACKS[Math.floor(Math.random() * TOP_TRACKS.length)];
  } else {
    const newIdx = (idx + direction + TOP_TRACKS.length) % TOP_TRACKS.length;
    next = TOP_TRACKS[newIdx];
  }
  playTrack(next.id);
}

// ---------- Progress Simulation ----------
function parseDuration(str) {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function startProgressSimulation(duration) {
  clearInterval(state.progressTimer);
  const totalSec = parseDuration(duration);
  let elapsed = 0;

  state.progressTimer = setInterval(() => {
    if (!state.isPlaying) return;
    elapsed += 1;
    if (elapsed >= totalSec) {
      clearInterval(state.progressTimer);
      if (state.isRepeat) {
        playTrack(state.currentTrack.id);
      } else {
        skipTrack(1);
      }
      return;
    }
    const pct = (elapsed / totalSec) * 100;
    $("progressFill").style.width = `${pct}%`;
    $("currentTime").textContent = formatTime(elapsed);
  }, 1000);
}

// ---------- Like Toggle ----------
function toggleLike(trackId, btnEl) {
  if (state.likedTracks.has(trackId)) {
    state.likedTracks.delete(trackId);
    btnEl.classList.remove("liked");
    btnEl.innerHTML = `<i class="fa-regular fa-heart"></i>`;
  } else {
    state.likedTracks.add(trackId);
    btnEl.classList.add("liked");
    btnEl.innerHTML = `<i class="fa-solid fa-heart"></i>`;
  }
  // Update NP bar like button if this is the current track
  if (state.currentTrack && state.currentTrack.id === trackId) {
    $("npLike").innerHTML = `<i class="${state.likedTracks.has(trackId) ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
    $("npLike").style.color = state.likedTracks.has(trackId) ? "var(--accent)" : "";
  }
}

// ---------- Volume Control ----------
function setupVolumeBar() {
  const bar = document.querySelector(".volume-bar");
  bar.addEventListener("click", (e) => {
    const rect = bar.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    state.volume = Math.max(0, Math.min(100, pct));
    $("volumeFill").style.width = `${state.volume}%`;
  });
}

// ---------- Progress Bar Click ----------
function setupProgressBar() {
  const bar = $("progressBar");
  bar.addEventListener("click", (e) => {
    if (!state.currentTrack) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const totalSec = parseDuration(state.currentTrack.duration);
    const newElapsed = Math.floor(pct * totalSec);
    $("progressFill").style.width = `${pct * 100}%`;
    $("currentTime").textContent = formatTime(newElapsed);
  });
}

// ---------- Search ----------
function setupSearch() {
  $("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (q.length > 0) {
      navigateTo("search");
    }
  });
}

// ---------- Event Listeners ----------
function setupEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.addEventListener("click", () => navigateTo(item.dataset.page));
  });

  // NP Controls
  $("playPauseBtn").addEventListener("click", togglePlayPause);
  $("nextBtn").addEventListener("click", () => skipTrack(1));
  $("prevBtn").addEventListener("click", () => skipTrack(-1));

  $("shuffleBtn").addEventListener("click", () => {
    state.isShuffle = !state.isShuffle;
    $("shuffleBtn").classList.toggle("active", state.isShuffle);
  });

  $("repeatBtn").addEventListener("click", () => {
    state.isRepeat = !state.isRepeat;
    $("repeatBtn").classList.toggle("active", state.isRepeat);
  });

  $("npLike").addEventListener("click", () => {
    if (!state.currentTrack) return;
    const btn = $("npLike");
    toggleLike(state.currentTrack.id, { classList: { has: () => state.likedTracks.has(state.currentTrack.id), add: () => {}, remove: () => {} }, innerHTML: "" });
    btn.innerHTML = `<i class="${state.likedTracks.has(state.currentTrack.id) ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
    btn.style.color = state.likedTracks.has(state.currentTrack.id) ? "var(--accent)" : "";
  });

  // Hero play
  $("heroPlayBtn").addEventListener("click", () => playTrack(TOP_TRACKS[0].id));

  // Library filter chips
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
    });
  });

  setupVolumeBar();
  setupProgressBar();
  setupSearch();
}

// ---------- Init ----------
function init() {
  renderHero();
  renderSidebarPlaylists();
  renderQuickGrid();
  renderCardRow("featuredPlaylists", PLAYLISTS);
  renderTrackList("topTracks", TOP_TRACKS);
  renderCardRow("newReleases", NEW_RELEASES);
  renderCardRow("recentlyPlayed", RECENTLY_PLAYED);
  renderGenreGrid();
  renderLibrary();
  setupEventListeners();
}

document.addEventListener("DOMContentLoaded", init);
