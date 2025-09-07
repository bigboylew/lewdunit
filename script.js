let zIndex = 10;
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent);

const sounds = {
  'sound-close': new Audio('https://files.catbox.moe/nmgith.mp3'),
  'sound-logon': new Audio('https://files.catbox.moe/7tkpiy.mp3'),
  'sound-error': new Audio('https://files.catbox.moe/2elxeq.mp3'),
  'sound-dooropen': new Audio('dooropen.mp3'),
  'sound-storeopen': new Audio('storeopen.mp3'),
};

// Preload all sounds
for (const soundKey in sounds) {
  sounds[soundKey].load();
}

// One-time unlock to satisfy autoplay policies: silently play/pause each sound on first user interaction
function installAudioUnlockOnce() {
  const handler = () => {
    Object.values(sounds).forEach((a) => {
      try {
        const oldVol = a.volume;
        a.muted = false;
        a.volume = 0;
        a.currentTime = 0;
        const p = a.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            try { a.pause(); a.currentTime = 0; a.volume = oldVol; } catch {}
          }).catch(() => {});
        }
      } catch {}
    });
    window.removeEventListener('pointerdown', handler, true);
    window.removeEventListener('keydown', handler, true);
  };
  window.addEventListener('pointerdown', handler, true);
  window.addEventListener('keydown', handler, true);
}
installAudioUnlockOnce();

// =======================
// Global 3D Music Player Controller
// =======================
let __musicPlayerInit = false;
let playerAudio = null;
const playerState = { playlist: [], index: 0, meta: { artist: '', cover: '' } };

function initMusicPlayerUI() {
  if (__musicPlayerInit) return;
  __musicPlayerInit = true;
  playerAudio = new Audio();
  playerAudio.preload = 'metadata';

  const root = document.getElementById('music-player');
  if (!root) { console.warn('Music player root not found'); return; }
  const art = root.querySelector('#player-album-art');
  const art3d = root.querySelector('.album-art-3d');
  const nowPlaying = root.querySelector('#now-playing');
  const artistName = root.querySelector('#artist-name');
  const progressBar = root.querySelector('.progress-bar');
  const progress = root.querySelector('.progress');
  const curTimeEl = root.querySelector('.current-time');
  const durTimeEl = root.querySelector('.duration');
  const btnPrev = root.querySelector('#prev-btn');
  const btnPlay = root.querySelector('#play-btn');
  const btnNext = root.querySelector('#next-btn');
  const vol = root.querySelector('#volume-slider');
  const btnClose = root.querySelector('#close-player');

  function fmt(s){ s=Math.max(0,Math.floor(s||0)); const m=Math.floor(s/60), ss=s%60; return `${m}:${ss<10?'0':''}${ss}`; }

  function reflectBtn() { if (!playerAudio) return; btnPlay.textContent = playerAudio.paused ? '▶' : '⏸'; }
  function flipArt() { if (!art3d) return; art3d.classList.add('flipping'); setTimeout(()=>art3d.classList.remove('flipping'), 900); }
  function updateMeta() {
    const t = playerState.playlist[playerState.index]; if (!t) return;
    nowPlaying.textContent = t.title || '—'; artistName.textContent = t.artist || playerState.meta.artist || '';
    art.src = t.cover || playerState.meta.cover || '';
  }
  function load(i) {
    if (!playerState.playlist.length) return;
    playerState.index = (i + playerState.playlist.length) % playerState.playlist.length;
    const t = playerState.playlist[playerState.index]; if (!t) return;
    playerAudio.src = t.src; playerAudio.currentTime = 0; playerAudio.load(); updateMeta(); flipArt();
  }
  function play() {
    if (!playerAudio.src && playerState.playlist.length) load(playerState.index);
    reflectBtn(); fadeOutAudiosIn(document.body, 500).then(()=>{ playerAudio.play().then(reflectBtn).catch(()=>{}); });
  }
  function pause() { try { playerAudio.pause(); } catch {} reflectBtn(); }
  function next() { load(playerState.index + 1); play(); }
  function prev() { load(playerState.index - 1); play(); }

  btnPlay.addEventListener('click', () => { if (playerAudio.paused) play(); else pause(); });
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);
  progressBar.addEventListener('click', (e)=>{ const r = progressBar.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (e.clientX - r.left)/r.width)); const d = Math.max(0, playerAudio.duration||0); playerAudio.currentTime = p * d; });
  if (vol) { try { playerAudio.volume = Number(vol.value || 0.7); } catch {} vol.addEventListener('input', ()=>{ try { playerAudio.volume = Number(vol.value || 0.7); } catch {} }); }
  btnClose.addEventListener('click', ()=>{ root.classList.remove('active'); pause(); });

  playerAudio.addEventListener('play', reflectBtn);
  playerAudio.addEventListener('pause', reflectBtn);
  playerAudio.addEventListener('ended', next);
  playerAudio.addEventListener('loadedmetadata', ()=>{ durTimeEl.textContent = fmt(playerAudio.duration||0); });
  playerAudio.addEventListener('timeupdate', ()=>{ curTimeEl.textContent = fmt(playerAudio.currentTime||0); const d = Math.max(0.001, playerAudio.duration||0); const p = Math.min(1, (playerAudio.currentTime||0)/d); progress.style.width = (p*100).toFixed(2)+'%'; });

  root.__player = { load, play, pause, next, prev };
}

function showMusicPlayer(fromImgEl) {
  initMusicPlayerUI(); const root = document.getElementById('music-player'); if (!root) return;
  if (fromImgEl && fromImgEl.getBoundingClientRect) {
    try { const rect = fromImgEl.getBoundingClientRect(); const clone = fromImgEl.cloneNode(true); clone.className='player-fly-clone'; clone.style.left=rect.left+'px'; clone.style.top=rect.top+'px'; clone.style.width=rect.width+'px'; clone.style.height=rect.height+'px'; document.body.appendChild(clone); const target = root.getBoundingClientRect(); const tx=(target.left+20)-rect.left; const ty=(target.top+20)-rect.top; clone.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${tx}px, ${ty}px) scale(0.35)`,opacity:0.3}],{duration:500,easing:'cubic-bezier(0.175, 0.885, 0.32, 1.275)'}).addEventListener('finish',()=>{clone.remove();}); } catch {}
  }
  root.classList.add('active');
}

function setMusicPlaylist(playlist, meta={}) {
  initMusicPlayerUI(); playerState.playlist = (playlist||[]).filter(t=>t&&t.src); playerState.index=0; playerState.meta = { artist: meta.artist||'', cover: meta.cover||'' };
  const root = document.getElementById('music-player'); const vol = root && root.querySelector('#volume-slider'); if (vol) { try { playerAudio.volume = Number(vol.value||0.7); } catch {} }
  const t0 = playerState.playlist[0]; if (t0) { const art=root.querySelector('#player-album-art'); const nowPlaying=root.querySelector('#now-playing'); const artistName=root.querySelector('#artist-name'); art.src=t0.cover||playerState.meta.cover||''; nowPlaying.textContent=t0.title||'—'; artistName.textContent=t0.artist||playerState.meta.artist||''; }
}

function open3DPlayerForRelease(release, fromImgEl) {
  try { initMusicPlayerUI(); } catch {}
  let playlist = []; let meta = {};
  try { if (release && release.id && typeof albumConfigs !== 'undefined' && albumConfigs[release.id]) { const cfg = albumConfigs[release.id]; meta = { artist: cfg.title || release.title || '', cover: cfg.albumCover || release.image || '' }; playlist = (cfg.playlist||[]).map((p,i)=>({ title: p.title || `Track ${i+1}`, artist: cfg.title || '', src: p.src, cover: cfg.albumCover })); } } catch {}
  if (!playlist.length && release && release.id === 'demodisc_01') {
    meta = { artist: 'demodisc_01', cover: 'demodisccover-hq.png' };
    playlist = [
      { title: 'crackers', artist: 'lewd', src: 'crackers.mp3', cover: meta.cover },
      { title: 'puzzle', artist: 'lewd', src: 'puzzle.mp3', cover: meta.cover },
      { title: 'meadowtronic', artist: 'lewd', src: 'meadowtronic.mp3', cover: meta.cover },
      { title: 'slideshow', artist: 'lewd', src: 'slideshow.mp3', cover: meta.cover },
      { title: 'goldentime', artist: 'lewd', src: 'goldentime.mp3', cover: meta.cover },
    ].filter(t=>!!t.src);
  }
  if (!playlist.length && release) { meta = { artist: release.title || '', cover: release.image || '' }; }
  setMusicPlaylist(playlist, meta); showMusicPlayer(fromImgEl); const root = document.getElementById('music-player'); const btn = root && root.querySelector('#play-btn'); if (btn) btn.click();
}

// Fade out all <audio> elements inside a container before pausing them
function fadeOutAudiosIn(container, duration = 800) {
  try {
    const audios = container.querySelectorAll('audio');
    const promises = [];
    audios.forEach((el) => {
      const startVol = el.muted ? 0 : (isNaN(el.volume) ? 1 : el.volume);
      if (startVol <= 0) {
        try { el.pause(); } catch {}
        return;
      }
      const steps = 20;
      const stepDur = Math.max(16, duration / steps);
      let step = 0;
      const wasMuted = el.muted;
      el.muted = false;
      promises.push(new Promise((resolve) => {
        function tick() {
          step += 1;
          const v = Math.max(0, startVol * (1 - step / steps));
          el.volume = v;
          if (step < steps) {
            setTimeout(tick, stepDur);
          } else {
            try { el.pause(); } catch {}
            // restore prior settings for when/if element persists
            el.volume = startVol;
            el.muted = wasMuted;
            resolve();
          }
        }
        tick();
      }));
    });
    return Promise.all(promises);
  } catch {
    return Promise.resolve();
  }
}


// Persistent state for Store music (survives Store window close/reopen)
const storeMusicState = {
  recent: [],      // queue of recently played track indices
  lastIndex: null, // last played track index
};

// Play sound helper function
function playSound(name) {
  const sound = sounds[name];
  if (!sound) return;

  const src = sound.currentSrc || sound.src;
  // Try a fresh instance first – avoids shared state and allows rapid retriggers
  if (src) {
    const inst = new Audio(src);
    try { inst.muted = false; } catch {}
    try { inst.volume = 1; } catch {}
    try { inst.currentTime = 0; } catch {}
    const p1 = inst.play();
    if (p1 && typeof p1.catch === 'function') {
      p1.catch(() => {
        // Fallback: try the original object
        try { sound.currentTime = 0; } catch {}
        try { sound.muted = false; } catch {}
        try { sound.volume = 1; } catch {}
        const p2 = sound.play();
        if (p2 && typeof p2.catch === 'function') {
          p2.catch(() => {
            // Final fallback: clone
            const clone = sound.cloneNode();
            try { clone.currentTime = 0; } catch {}
            try { clone.muted = false; } catch {}
            try { clone.volume = 1; } catch {}
            clone.play().catch(() => {});
          });
        }
      });
    }
    return;
  }
  // No src available; attempt original anyway
  try { sound.currentTime = 0; } catch {}
  try { sound.muted = false; } catch {}
  try { sound.volume = 1; } catch {}
  const p = sound.play();
  if (p && typeof p.catch === 'function') { p.catch(() => {}); }
}


function toggleStartMenu() {
  const menu = document.getElementById('start-menu');

  if (menu.classList.contains('hidden')) {
    // Show menu with fade-in
    menu.classList.remove('hidden');
    menu.style.opacity = '0';
    menu.style.transition = 'opacity 0.25s ease';
    
    requestAnimationFrame(() => {
      menu.style.opacity = '1';
    });
  } else {
    // Fade-out, then hide after transition
    menu.style.opacity = '0';
    menu.addEventListener('transitionend', function handler() {
      menu.classList.add('hidden');
      menu.style.transition = '';
      menu.removeEventListener('transitionend', handler);
    });
  }
}

function openWindow(title) {
  const existingWindow = document.querySelector(`.window[data-title="${title}"]`);
  const existingTaskbarIcon = document.querySelector(`.taskbar-icon[data-title="${title}"]`);

  if (existingWindow) {
    if (existingWindow.style.display === 'none') {
      existingWindow.style.display = 'block';
    }
    bringToFront(existingWindow);
    return;
  }

  const template = document.getElementById('window-template');
  const clone = template.content.cloneNode(true);
  const win = clone.querySelector('.window');
  const header = clone.querySelector('.window-title');
  const content = clone.querySelector('.window-content');
  
  header.textContent = title;
  win.dataset.title = title;

  if (title === "Music") {
    // Set window size to match USB Loader GX aspect ratio
    if (isMobile) {
      win.style.width = '95vw';
      win.style.height = 'calc(95vw * 0.75)'; // 4:3 aspect ratio
      win.style.maxWidth = '900px';
      win.style.maxHeight = '675px';
    } else {
      win.style.width = '900px';
      win.style.height = '675px'; // 4:3 aspect ratio
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }

    // Remove window chrome for a cleaner look
    win.style.border = 'none';
    win.style.borderRadius = '0';
    win.style.boxShadow = 'none';
    win.style.overflow = 'hidden';
    content.style.overflow = 'hidden';
    content.style.padding = '0';
    content.style.background = '#000';

    content.innerHTML = `
      <style>
        @import url('https://fonts.cdnfonts.com/css/nokiafc22');
        
        .usb-loader {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: linear-gradient(to bottom, #1b1b1b, #000000);
          color: #fff;
          font-family: 'Arial', sans-serif;
          position: relative;
          overflow: hidden;
        }
        
        .carousel-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 20px 0 40px 0;
          background: linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(0,0,0,0.0));
          perspective: 1200px;
        }
        
        .carousel-track {
          display: flex;
          transition: transform 0.5s ease;
          height: 100%;
          align-items: center;
          transform-style: preserve-3d;
        }
        
        .carousel-item {
          min-width: 200px;
          height: 280px;
          margin: 0 8px;
          transition: all 0.28s ease;
          cursor: pointer;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          opacity: 0.5;
          transform: translateZ(-200px) rotateY(-25deg) scale(0.82);
          border-radius: 6px;
          overflow: hidden;
          background: #111;
          border: 2px solid #222;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.65);
        }
        
        .carousel-item.active {
          opacity: 1;
          transform: translateZ(0) rotateY(0deg) scale(1);
          z-index: 2;
          border-color: rgba(255,255,255,0.22);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.75);
        }
        
        .carousel-item img {
          width: 100%;
          aspect-ratio: 1 / 1; /* ensure square covers */
          height: auto;
          object-fit: cover;
          border-bottom: 2px solid #333;
          box-shadow: inset 0 -10px 20px rgba(0,0,0,0.35);
          opacity: 0; /* prevent flash before layout */
          transition: opacity 200ms ease;
          display: block;
        }
        
        .carousel-item .title {
          padding: 10px 5px;
          text-align: center;
          font-size: 14px;
          font-family: 'NokiaFC22', Arial, sans-serif;
          font-weight: normal;
          color: #fff;
          text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
          width: 100%;
          box-sizing: border-box;
          background: #222;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .carousel-item .subtitle {
          margin-top: 2px;
          text-align: center;
          font-size: 11px;
          font-family: Arial, sans-serif;
          color: #c0c0c0; /* slightly grey */
          width: 100%;
          padding: 2px 0 0;
          box-sizing: border-box;
          background: transparent; /* no extra backdrop */
        }

        /* Reflections */
        .reflection {
          content: '';
          position: absolute;
          top: 210px;
          width: 100%;
          height: 60px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0));
          filter: blur(2px);
          opacity: 0.18;
        }
        
        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 100px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.2s;
          opacity: 0.7;
          padding: 0;
          margin: 0;
        }
        
        .carousel-nav:hover {
          background: rgba(255, 255, 255, 0.1);
          opacity: 1;
        }
        
        .carousel-nav.prev {
          left: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%) !important;
        }
        
        .carousel-nav.next {
          right: 0;
          background: linear-gradient(270deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%) !important;
        }
        
        .carousel-dots {
          position: absolute;
          bottom: 10px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          gap: 6px;
          z-index: 10;
          padding: 5px 0;
          background: rgba(0, 0, 0, 0.5);
        }
        
        .carousel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s;
        }
        
        .carousel-dot.active {
          background: #4a90e2;
          transform: scale(1.3);
        }
        
        .music-details {
          padding: 10px 20px;
          background: linear-gradient(to bottom, #0a0a0a, #000);
          border-top: 1px solid #333;
          text-align: left;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .music-details h2 {
          margin: 0;
          color: #4a90e2;
          font-size: 18px;
          font-family: 'NokiaFC22', Arial, sans-serif;
          font-weight: normal;
          letter-spacing: 0.5px;
        }
        
        .music-details p {
          margin: 2px 0 0 0;
          color: #888;
          font-size: 13px;
          font-family: Arial, sans-serif;
        }
        
        .play-button {
          position: absolute;
          bottom: 10px;
          right: 20px;
          padding: 8px 20px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 14px;
          font-family: 'NokiaFC22', Arial, sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .play-button:hover {
          background: #5a9ff2;
        }

        /* In-window 3D player (not fixed; sits inside window) */
        .window-player {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 10px;
          height: 180px;
          background: rgba(255,255,255,0.88);
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          color: #111;
          display: none;
        }
        .window-player.active { display: flex; }
        .window-player .music-player-container { width: 100%; height: 100%; padding: 12px; display: flex; gap: 14px; align-items: center; box-sizing: border-box; }
        .window-player .album-art-3d { width: 120px; height: 120px; position: relative; transform-style: preserve-3d; transform: rotateY(14deg) rotateX(8deg); transition: transform 420ms ease; }
        .window-player:hover .album-art-3d { transform: rotateY(24deg) rotateX(10deg); }
        .window-player .album-art-front, .window-player .album-art-back, .window-player .album-art-side { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 6px; box-shadow: 0 5px 14px rgba(0,0,0,0.25); }
        .window-player .album-art-front { transform: translateZ(12px); background:#eaeaea; overflow: hidden; }
        .window-player .album-art-front img { width:100%; height:100%; object-fit:cover; display:block; }
        .window-player .album-art-back { transform: translateZ(-12px) rotateY(180deg); background:#dcdcdc; }
        .window-player .album-art-side { width: 24px; background:#cfcfcf; transform: rotateY(90deg) translateZ(74px); left:50%; margin-left:-12px; border-radius:4px; }
        .window-player .player-controls { flex:1; display:flex; flex-direction:column; gap:8px; min-width:0; }
        .window-player .track-info h3 { margin:0; font-size:16px; color:#222; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .window-player .track-info p { margin:2px 0 0; font-size:12px; color:#666; }
        .window-player .progress-bar { width:100%; height:6px; background:#e6e6e6; border-radius:4px; cursor:pointer; overflow:hidden; }
        .window-player .progress { width:0%; height:100%; background:#4a90e2; transition: width 100ms linear; }
        .window-player .time-info { display:flex; justify-content:space-between; font-size:11px; color:#7b7b7b; margin-top:4px; }
        .window-player .control-buttons { display:flex; justify-content:center; gap:14px; }
        .window-player .control-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#222; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition: transform 140ms ease, background 140ms ease; }
        .window-player .control-btn:hover { background: rgba(0,0,0,0.06); transform: scale(1.06); }
        .window-player .play-btn { background:#4a90e2; color:#fff; width:46px; height:46px; font-size:22px; }
        .window-player .play-btn:hover { background:#3a7bc8; }
        .window-player .volume-control { display:flex; align-items:center; gap:10px; }
        .window-player .volume-icon { font-size:14px; color:#666; }
        .window-player #window-volume { flex:1; height:4px; -webkit-appearance:none; appearance:none; background:#e0e0e0; border-radius:2px; outline:none; }
        .window-player #window-volume::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#4a90e2; border-radius:50%; cursor:pointer; }
      </style>

      <div class="usb-loader">
        <div class="carousel-container">
          <button class="carousel-nav prev">‹</button>
          <div class="carousel-track" id="carousel-track">
            <!-- Items will be dynamically added here -->
          </div>
          <button class="carousel-nav next">›</button>
          <div class="carousel-dots" id="carousel-dots">
            <!-- Dots will be dynamically added here -->
          </div>
        </div>
        
        <div class="music-details">
          <h2 id="current-title">Select a release</h2>
          <p id="current-description">Browse through the collection using the navigation buttons</p>
          <button class="play-button" id="play-button">PLAY</button>
        </div>

        <!-- In-window player dock -->
        <div class="window-player" id="window-player">
          <div class="music-player-container">
            <div class="album-art-3d">
              <div class="album-art-front">
                <img src="" alt="Album Art" id="window-player-art">
              </div>
              <div class="album-art-back"></div>
              <div class="album-art-side"></div>
            </div>
            <div class="player-controls">
              <div class="track-info">
                <h3 id="window-now">Select a track</h3>
                <p id="window-artist">Artist</p>
              </div>
              <div class="progress-container">
                <div class="progress-bar" id="window-progress">
                  <div class="progress" id="window-progress-fill"></div>
                </div>
                <div class="time-info">
                  <span class="current-time" id="window-cur">0:00</span>
                  <span class="duration" id="window-dur">0:00</span>
                </div>
              </div>
              <div class="control-buttons">
                <button class="control-btn" id="window-prev">⏮</button>
                <button class="control-btn play-btn" id="window-play">▶</button>
                <button class="control-btn" id="window-next">⏭</button>
              </div>
              <div class="volume-control">
                <span class="volume-icon">🔊</span>
                <input type="range" id="window-volume" min="0" max="1" step="0.1" value="0.7">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Use the window's scrollbar and remove default padding
    win.classList.add('no-padding');

    // Handlers similar to Store, but scoped to this window's content
    function showMainMusic() {
      const main = content.querySelector('#music-main-sections');
      const section = content.querySelector('#music-section-content');
      if (main && section) { main.style.display = 'grid'; section.style.display = 'none'; }
    }

    function openMusicSection(key) {
      const main = content.querySelector('#music-main-sections');
      const section = content.querySelector('#music-section-content');
      const titleEl = content.querySelector('#music-section-title');
      const bodyEl = content.querySelector('#music-section-body');
      if (!main || !section || !titleEl || !bodyEl) return;
      main.style.display = 'none';
      section.style.display = 'block';

      // Populate per release
      if (key === 'demodisc_01') {
        titleEl.textContent = 'demodisc_01';
        bodyEl.innerHTML = `
          <div class="release-grid">
            <div class="release-item">
              <div class="release-cover"><img src="demodisccover.webp" alt="demodisc_01 cover"/></div>
              <div>demodisc_01</div>
              <div class="release-actions">
                <a href="#" onclick="openAlbumModal('demodisccover-hq.png', 'crackers.mp3'); return false;">View</a>
              </div>
            </div>
          </div>`;
      } else if (key === 'apple') {
        titleEl.textContent = 'apple';
        bodyEl.innerHTML = `
          <div class="release-grid">
            <div class="release-item">
              <div class="release-cover"><img src="applecover.webp" alt="apple cover"/></div>
              <div>apple</div>
            </div>
          </div>`;
      } else if (key === 'GOODTRIP') {
        titleEl.textContent = 'GOODTRIP';
        bodyEl.innerHTML = `
          <div class="release-grid">
            <div class="release-item">
              <div class="release-cover"><img src="goodtrip.webp" alt="GOODTRIP cover"/></div>
              <div>GOODTRIP</div>
              <div class="release-actions">
                <a href="#" onclick="openWindow('GOODTRIP'); return false;">Open GOODTRIP Window</a>
              </div>
            </div>
          </div>`;
      } else if (key === 'iso') {
        titleEl.textContent = 'iso';
        bodyEl.innerHTML = `
          <div class="release-grid">
            <div class="release-item">
              <div class="release-cover"><img src="isocover.webp" alt="iso cover"/></div>
              <div>iso</div>
            </div>
          </div>`;
      }
    }

    // Initialize the carousel
    const carouselTrack = content.querySelector('#carousel-track');
    const dotsContainer = content.querySelector('#carousel-dots');
    const prevButton = content.querySelector('.prev');
    const nextButton = content.querySelector('.next');
    const playButton = content.querySelector('#play-button');
    const currentTitle = content.querySelector('#current-title');
    const currentDesc = content.querySelector('#current-description');

    // --- UI sounds (Safari-safe: only after first user interaction) ---
    let uiSoundEnabled = false;
    const hoverSfx = new Audio('hoversound.wav');
    const selectSfx = new Audio('selectsound.wav');
    hoverSfx.preload = 'auto';
    selectSfx.preload = 'auto';
    function enableUiSoundsOnce() {
      uiSoundEnabled = true;
      window.removeEventListener('pointerdown', enableUiSoundsOnce);
      window.removeEventListener('keydown', enableUiSoundsOnce);
    }
    window.addEventListener('pointerdown', enableUiSoundsOnce, { once: true });
    window.addEventListener('keydown', enableUiSoundsOnce, { once: true });
    function tryPlayUI(audioEl) {
      if (!uiSoundEnabled || !audioEl) return;
      try { audioEl.currentTime = 0; audioEl.play().catch(()=>{}); } catch {}
    }

    const releases = [
      {
        id: 'demodisc_01',
        title: 'demodisc_01',
        image: 'demodisccover.webp',
        description: 'A collection of experimental tracks',
        type: 'Album',
        action: () => openWindow('demodisc_01')
      },
      {
        id: 'apple',
        title: 'apple',
        image: 'applecover.webp',
        description: 'Fresh sounds from the orchard',
        type: 'Single',
        action: () => openMusicSection('apple')
      },
      {
        id: 'GOODTRIP',
        title: 'GOODTRIP',
        image: 'goodtrip.webp',
        description: 'A journey through sound',
        type: 'Album',
        action: () => openWindow('GOODTRIP')
      },
      {
        id: 'iso',
        title: 'iso',
        image: 'isocover.webp',
        description: 'Isolated sounds and beats',
        type: 'EP',
        action: () => openMusicSection('iso')
      },
      
    ];

    let currentIndex = 0;

    // Create carousel items
    function createCarousel() {
      carouselTrack.innerHTML = '';
      dotsContainer.innerHTML = '';
      
      releases.forEach((release, index) => {
        // Create carousel item
        const item = document.createElement('div');
        item.className = 'carousel-item' + (index === 0 ? ' active' : '');
        item.innerHTML = `
          <img src="${release.image}" alt="${release.title}" />
          <div class="reflection"></div>
          <div class="title">${release.title}</div>
          <div class="subtitle">${release.type || ''}</div>
        `;
        // Fade in image after it loads to avoid flash
        const imgEl = item.querySelector('img');
        if (imgEl) {
          if (imgEl.complete) {
            requestAnimationFrame(()=>{ imgEl.style.opacity = '1'; });
          } else {
            imgEl.addEventListener('load', () => { imgEl.style.opacity = '1'; }, { once: true });
          }
        }
        // UI sounds
        item.addEventListener('mouseenter', () => tryPlayUI(hoverSfx));
        // Single click opens the album window
        item.addEventListener('click', () => {
          tryPlayUI(selectSfx);
          openWindow(release.title);
        });
        carouselTrack.appendChild(item);
        
        // Create dot
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => selectItem(index));
        dotsContainer.appendChild(dot);
      });
      
      updateDetails();
      // Ensure initial layout is correct
      updateCarousel();
      // Recenter once images have their intrinsic sizes
      const imgs = carouselTrack.querySelectorAll('img');
      imgs.forEach(img => {
        if (!img.complete) {
          img.addEventListener('load', () => updateCarousel(), { once: true });
        }
      });
      // Also recenter shortly after first paint to avoid initial jitter
      setTimeout(updateCarousel, 50);
      setTimeout(updateCarousel, 150);
    }
    
    function selectItem(index) {
      tryPlayUI(selectSfx);
      currentIndex = (index + releases.length) % releases.length;
      updateCarousel();
      updateDetails();
    }
    
    function updateCarousel() {
      const items = carouselTrack.querySelectorAll('.carousel-item');
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      if (!items.length) return;

      const first = items[0];
      const itemWidth = first.offsetWidth || 200;
      const cs = window.getComputedStyle(first);
      const margin = (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
      const gap = itemWidth + margin; // actual advance per item in the flex row

      // Visual state: active vs inactive
      items.forEach((item, index) => {
        // Remove any per-item transforms so flex layout remains predictable
        item.style.transform = '';
        item.style.opacity = index === currentIndex ? '1' : '0.6';
        item.style.zIndex = String(index === currentIndex ? 10 : 1);
        item.classList.toggle('active', index === currentIndex);
      });

      // Update dots
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });

      // Translate the whole track so the active item is centered
      const viewport = carouselTrack.parentElement;
      const containerWidth = viewport ? viewport.offsetWidth : (itemWidth + margin);
      const active = items[currentIndex];
      const targetCenter = active ? (active.offsetLeft + (active.offsetWidth || itemWidth) / 2) : 0;
      const trackX = (containerWidth / 2) - targetCenter;
      carouselTrack.style.transform = `translateX(${trackX}px)`;
    }
    
    function updateDetails() {
      const release = releases[currentIndex];
      currentTitle.textContent = release.title;
      currentDesc.textContent = release.type || '';
    }
    
    // Event listeners
    prevButton.addEventListener('click', () => {
      tryPlayUI(hoverSfx);
      currentIndex = (currentIndex - 1 + releases.length) % releases.length;
      updateCarousel();
      updateDetails();
    });
    
    nextButton.addEventListener('click', () => {
      tryPlayUI(hoverSfx);
      currentIndex = (currentIndex + 1) % releases.length;
      updateCarousel();
      updateDetails();
    });
    
    playButton.addEventListener('click', () => {
      tryPlayUI(selectSfx);
      openWindow(releases[currentIndex].title);
    });
    
    // Keyboard navigation
    content.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + releases.length) % releases.length;
        updateCarousel();
        updateDetails();
      } else if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % releases.length;
        updateCarousel();
        updateDetails();
      } else if (e.key === 'Enter') {
        openWindow(releases[currentIndex].title);
      }
    });
    
    // Window-scoped 3D player controller
    let winAudio = null;
    const winState = { playlist: [], index: 0, meta: { artist: '', cover: '' } };
    const winPlayerRoot = content.querySelector('#window-player');
    const wpArt = content.querySelector('#window-player-art');
    const wpNow = content.querySelector('#window-now');
    const wpArtist = content.querySelector('#window-artist');
    const wpProgressBar = content.querySelector('#window-progress');
    const wpProgress = content.querySelector('#window-progress-fill');
    const wpCur = content.querySelector('#window-cur');
    const wpDur = content.querySelector('#window-dur');
    const wpPrev = content.querySelector('#window-prev');
    const wpPlay = content.querySelector('#window-play');
    const wpNext = content.querySelector('#window-next');
    const wpVol = content.querySelector('#window-volume');

    function fmtTime(s){ s=Math.max(0,Math.floor(s||0)); const m=Math.floor(s/60), ss=s%60; return `${m}:${ss<10?'0':''}${ss}`; }
    function ensureWinAudio(){ if (!winAudio) { winAudio = new Audio(); winAudio.preload = 'metadata'; bindWinAudio(); } }
    function bindWinAudio(){
      if (!winAudio) return;
      winAudio.addEventListener('loadedmetadata', ()=>{ wpDur.textContent = fmtTime(winAudio.duration||0); });
      winAudio.addEventListener('timeupdate', ()=>{ wpCur.textContent = fmtTime(winAudio.currentTime||0); const d=Math.max(0.001, winAudio.duration||0); const p=Math.min(1,(winAudio.currentTime||0)/d); wpProgress.style.width=(p*100).toFixed(2)+'%'; });
      winAudio.addEventListener('ended', ()=>{ winLoad(winState.index+1); winPlay(); });
      winAudio.addEventListener('play', reflectBtn);
      winAudio.addEventListener('pause', reflectBtn);
    }
    function reflectBtn(){ if (!winAudio) return; wpPlay.textContent = winAudio.paused ? '▶' : '⏸'; }
    function winFlip(){ const art3d = content.querySelector('#window-player .album-art-3d'); if (!art3d) return; art3d.classList.add('flipping'); setTimeout(()=>art3d.classList.remove('flipping'), 900); }
    function winUpdateMeta(){ const t=winState.playlist[winState.index]; if (!t) return; wpNow.textContent=t.title||'—'; wpArtist.textContent=t.artist||winState.meta.artist||''; wpArt.src=t.cover||winState.meta.cover||''; }
    function winLoad(i){ if (!winState.playlist.length) return; ensureWinAudio(); winState.index=(i+winState.playlist.length)%winState.playlist.length; const t=winState.playlist[winState.index]; if (!t) return; winAudio.src=t.src; try{ winAudio.currentTime=0; }catch{} winAudio.load(); winUpdateMeta(); winFlip(); }
    function winPlay(){ ensureWinAudio(); if (!winAudio.src && winState.playlist.length) winLoad(winState.index); try{ winAudio.play().then(reflectBtn).catch(()=>{}); }catch{} reflectBtn(); }
    function winPause(){ try{ winAudio.pause(); }catch{} reflectBtn(); }
    function winNext(){ winLoad(winState.index+1); winPlay(); }
    function winPrev(){ winLoad(winState.index-1); winPlay(); }
    function setWindowPlaylist(playlist, meta={}){
      winState.playlist=(playlist||[]).filter(t=>t&&t.src);
      winState.index=0;
      winState.meta={ artist: meta.artist||'', cover: meta.cover||'' };
      if (wpVol) { try { ensureWinAudio(); winAudio.volume = Number(wpVol.value||0.7); } catch {} }
      const t0=winState.playlist[0]; if (t0){ wpArt.src=t0.cover||winState.meta.cover||''; wpNow.textContent=t0.title||'—'; wpArtist.textContent=t0.artist||winState.meta.artist||''; }
    }
    function showWindowPlayer(){ if (winPlayerRoot) { winPlayerRoot.classList.add('active'); } }
    function openWindowPlayerForRelease(release, fromImgEl){
      let playlist=[]; let meta={};
      try { if (release && release.id && typeof albumConfigs !== 'undefined' && albumConfigs[release.id]) { const cfg = albumConfigs[release.id]; meta = { artist: cfg.title || release.title || '', cover: cfg.albumCover || release.image || '' }; playlist = (cfg.playlist||[]).map((p,i)=>({ title: p.title || `Track ${i+1}`, artist: cfg.title || '', src: p.src, cover: cfg.albumCover })); } } catch {}
      if (!playlist.length && release && release.id === 'demodisc_01') {
        meta = { artist: 'demodisc_01', cover: 'demodisccover-hq.png' };
        playlist = [
          { title: 'crackers', artist: 'lewd', src: 'crackers.mp3', cover: meta.cover },
          { title: 'puzzle', artist: 'lewd', src: 'puzzle.mp3', cover: meta.cover },
          { title: 'meadowtronic', artist: 'lewd', src: 'meadowtronic.mp3', cover: meta.cover },
          { title: 'slideshow', artist: 'lewd', src: 'slideshow.mp3', cover: meta.cover },
          { title: 'goldentime', artist: 'lewd', src: 'goldentime.mp3', cover: meta.cover },
        ].filter(t=>!!t.src);
      }
      if (!playlist.length && release) { meta = { artist: release.title || '', cover: release.image || '' }; }
      setWindowPlaylist(playlist, meta); showWindowPlayer(); winPlay();
    }

    // Bind player controls
    if (wpPlay) wpPlay.addEventListener('click', ()=>{ if (!winAudio || winAudio.paused) winPlay(); else winPause(); });
    if (wpNext) wpNext.addEventListener('click', winNext);
    if (wpPrev) wpPrev.addEventListener('click', winPrev);
    if (wpProgressBar) wpProgressBar.addEventListener('click', (e)=>{ const r=wpProgressBar.getBoundingClientRect(); const p=Math.min(1, Math.max(0,(e.clientX-r.left)/r.width)); const d=Math.max(0, (winAudio&&winAudio.duration)||0); if (winAudio) winAudio.currentTime=p*d; });
    if (wpVol) wpVol.addEventListener('input', ()=>{ try{ ensureWinAudio(); winAudio.volume=Number(wpVol.value||0.7);}catch{} });

    // Initialize the carousel
    createCarousel();
    
    // Expose handlers for inline onclick inside this window scope
    window.openMusicSection = openMusicSection;
    window.showMainMusic = showMainMusic;

  } else if (title === "Whodunit?") {
    if (!isMobile) {
      win.style.width = '760px';
      win.style.height = '520px';
    }
    content.innerHTML = `
      <style>
        .whodunit-stage {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000; /* fill with black */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          perspective: 1200px; /* for 3D door swing */
          /* subtle CRT scanline feel */
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* White void behind the door */
        .whodunit-void {
          position: absolute;
          width: min(50%, 420px);
          height: min(60%, 360px);
          background: #fff;
          box-shadow:
            0 0 28px 8px rgba(255,255,255,0.5),
            0 0 72px 16px rgba(255,255,255,0.25),
            inset 0 0 60px rgba(255,255,255,0.9);
          transition: box-shadow 300ms ease;
        }
        /* Stronger glow when door opens */
        .whodunit-stage.open .whodunit-void {
          box-shadow:
            0 0 70px 20px rgba(255,255,255,0.95),
            0 0 200px 40px rgba(255,255,255,0.55),
            inset 0 0 120px rgba(255,255,255,1);
        }

        /* Door assembly */
        .whodunit-door {
          position: relative;
          width: min(50%, 420px);
          height: min(60%, 360px);
          display: flex;
          transform-style: preserve-3d;
          cursor: pointer; /* door only is clickable */
          z-index: 4; /* below hint/overlay */
        }

        /* Hover hint */
        .whodunit-hint {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-weight: 800;
          font-size: clamp(10px, 3.6vw, 28px);
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 0 10px rgba(63, 63, 63, 0.32), 0 4px 0 rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 160ms ease;
          pointer-events: none; /* allow clicks to pass */
          /* Sharper pixel-like look */
          -webkit-font-smoothing: none;
          -moz-osx-font-smoothing: auto;
          font-smooth: never;
          text-rendering: optimizeSpeed;
          image-rendering: pixelated;
          z-index: 6; /* above overlay and door */
        }
        .whodunit-door:hover + .whodunit-hint,
        .whodunit-door:hover .whodunit-hint,
        .whodunit-door:hover ~ .whodunit-hint { opacity: 1; }
        .whodunit-stage.open .whodunit-hint { opacity: 0; }

        .door-half {
          flex: 1 1 50%;
          /* retro pixelated plank look */
          /* remove visible stripes; keep subtle pixel texture */
          background:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect width='1' height='1' fill='rgba(255,255,255,0.04)'/><rect x='1' y='1' width='1' height='1' fill='rgba(0,0,0,0.06)'/></svg>") repeat,
            linear-gradient(#3a2516, #3a2516);
          background-size: 2px 2px, auto;
          border: 2px solid #5a4433;
          /* stacked hard-edged shadows for a pixel-y outline */
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.05) inset,
            0 0 0 4px rgba(0,0,0,0.2) inset,
            0 8px 0 rgba(0,0,0,0.4);
          transform-origin: center left;
          transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          image-rendering: pixelated;
          border-radius: 0; /* no rounding for retro look */
        }
        .door-half.right { transform-origin: center right; }

        /* Simple paneling effect */
        .door-half::before,
        .door-half::after {
          content: "";
          position: absolute;
          left: 10%; right: 10%;
          border: 1px solid rgba(0,0,0,0.35);
          background: rgba(255,255,255,0.04);
        }
        .door-half::before { top: 14%; height: 28%; }
        .door-half::after  { bottom: 14%; height: 28%; }

        /* Handles */
        .handle {
          position: absolute;
          top: 50%;
          width: 12px; height: 12px;
          background: radial-gradient(circle at 30% 30%, #f8e7a8, #c9a64f 60%, #8a6b2a);
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(0,0,0,0.6);
          transform: translateY(-50%);
          image-rendering: pixelated;
        }
        .left .handle { right: 8%; }
        .right .handle { left: 8%; }

        /* Open state */
        .whodunit-stage.open .door-half.left  { transform: rotateY(-100deg); }
        .whodunit-stage.open .door-half.right { transform: rotateY(100deg); }

        /* Retro overlay above content for CRT/pixel vibe */
        .retro-overlay {
          position: absolute;
          inset: 0;
          z-index: 5; /* above door, below hint */
          pointer-events: none;
          /* multiple layered effects: scanlines + vignette + dither */
          background-image:
            /* scanlines */
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.06) 0px,
              rgba(255,255,255,0.06) 1px,
              rgba(0,0,0,0.0) 1px,
              rgba(0,0,0,0.0) 3px
            ),
            /* subtle vignette */
            radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%),
            /* tiny checker dither */
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect width='1' height='1' fill='rgba(255,255,255,0.05)'/><rect x='1' y='1' width='1' height='1' fill='rgba(255,255,255,0.05)'/></svg>");
          background-size: auto, auto, 2px 2px;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }
      </style>

      <div id="whodunit-stage" class="whodunit-stage" aria-label="Open the door">
        <div class="whodunit-void" aria-hidden="true"></div>
        <div class="retro-overlay" aria-hidden="true"></div>
        <div class="whodunit-door">
          <div class="door-half left"><span class="handle"></span></div>
          <div class="door-half right"><span class="handle"></span></div>
          <div class="whodunit-hint">Open?</div>
        </div>
      </div>
    `;

    // Remove padding/scroll to ensure full-bleed
    content.style.padding = '0';
    content.style.overflow = 'hidden';

    // Feature flag: lock the Whodunit door for now (keep open logic intact for future)
    const WHODUNIT_LOCKED = true;

    // Click to open, then redirect after animation completes
    const preSaveUrl = 'https://share.amuse.io/VbMvlRPQelae'; 
    const stageEl = content.querySelector('#whodunit-stage');
    const doorEl = content.querySelector('.whodunit-door');
    const rightHalf = content.querySelector('.door-half.right');
    const hintEl = content.querySelector('.whodunit-hint');
    let opened = false;
    function triggerOpenAndRedirect() {
      if (opened) return;
      opened = true;
      // Play door open sound (inline, simple)
      try { const s = new Audio('dooropen.mp3'); s.play().catch(()=>{}); } catch {}
      stageEl.classList.add('open');
      // After the right panel finishes its (shorter) transition, open link in new tab
      const handler = (e) => {
        if (e.propertyName === 'transform') {
          rightHalf.removeEventListener('transitionend', handler);
          // open a bit sooner and in a new tab
          window.open(preSaveUrl, '_blank', 'noopener');
        }
      };
      rightHalf.addEventListener('transitionend', handler);
    }
    // Apply lock behavior now; preserve open logic for future
    if (WHODUNIT_LOCKED) {
      if (hintEl) hintEl.textContent = 'Locked';
      if (doorEl) { doorEl.style.cursor = 'not-allowed'; doorEl.setAttribute('aria-disabled', 'true'); }
      if (stageEl) stageEl.setAttribute('aria-label', 'Locked door');
      // Swallow click/touch to prevent opening
      doorEl?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); }, { once: false });
      doorEl?.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    } else {
      // Only clicks on the door open it
      doorEl.addEventListener('click', triggerOpenAndRedirect, { once: true });
    }
  } else if (title === "Info") {
    if (!isMobile) {
      win.style.width = '520px';
      win.style.height = '420px';
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }

    content.innerHTML = `
      <style>
        .info-root { display:flex; flex-direction:column; height:100%; padding:8px; box-sizing:border-box; background:#000; color:#00ff88; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", Consolas, monospace; }
        .info-terminal-line { margin:0 0 4px; }
        .prompt { color:#0f8; opacity:0.9; margin-right:6px; }
        #info-specs-text { white-space: pre-wrap; word-break: break-word; font-size:12px; color:#00ff88; }
        .cursor { display:inline-block; margin-left:4px; color:#00ff88; animation: blink 1s steps(1) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .info-divider { color:#00ff88; opacity:0.9; margin:8px 0 8px; }
        .info-body { flex:1 1 auto; display:flex; align-items:flex-start; }
        .info-welcome { font-size:14px; line-height:1.4; color:#00ff88; margin:2px; }
        .info-links { flex:0 0 auto; margin:0; margin-top:auto; padding-top:8px; color:#00ff88; }
        .info-links a { color:#00ff88; text-decoration: underline; margin-right:10px; }
      </style>
      <div class="info-root">
        <div class="info-terminal-line"><span class="prompt">LDOS></span><span id="info-specs-text"></span><span class="cursor">█</span></div>
        <div class="info-divider">-------------------------------------------------------------</div>
        <div class="info-body">
          <p class="info-welcome">Welcome to my website! Here you can find all things related to my artist alias "Lew_dunit".</p>
        </div>
        <div class="info-links">
          <a href="https://bandcamp.com/" target="_blank" rel="noopener">Bandcamp</a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener">YouTube</a>
          <a href="https://soundcloud.com/" target="_blank" rel="noopener">SoundCloud</a>
          <a href="https://open.spotify.com/" target="_blank" rel="noopener">Spotify</a>
          <a href="https://music.apple.com/" target="_blank" rel="noopener">Apple Music</a>
        </div>
      </div>
    `;

    // Remove default inner padding so black background fills window
    win.classList.add('no-padding');

    // Populate simple single-line specs text at the top (Info window only)
    (function(root) {
      const el = root.querySelector('#info-specs-text');
      if (!el) return;
      function getGPU() {
        try {
          const c = document.createElement('canvas');
          const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
          if (!gl) return null;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          return ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)) : null;
        } catch { return null; }
      }
      const ua = navigator.userAgent;
      const threads = typeof navigator.hardwareConcurrency === 'number' ? `${navigator.hardwareConcurrency} threads` : 'threads: ?';
      const mem = navigator.deviceMemory ? `${navigator.deviceMemory} GB RAM` : 'RAM: ?';
      const res = `${screen.width}x${screen.height} @ ${Math.round(devicePixelRatio * 100)/100}x`;
      const tz = (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Timezone: ?';
      const gpu = getGPU();
      el.textContent = `UA: ${ua} • ${threads} • ${mem} • Screen ${res} • ${tz}${gpu ? ' • GPU: ' + gpu : ''}`;
    })(content);

  } else if (title === "Recycle Bin") {
    // Desktop defaults; mobile sizing handled by positionAndClampOnSpawn()
    if (!isMobile) {
      win.style.width = '900px';
      win.style.height = '600px';
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }

    content.innerHTML = `
      <style>
        .files-root { display: grid; grid-template-columns: 380px 1fr; height: 100%; font-family: inherit; }
        .files-left { border-right: 1px solid rgba(0,0,0,0.15); background: linear-gradient(#f8f8f8, #e9e9e9); padding: 0; overflow: auto; }
        .files-left-header {
          position: sticky; top: 0; z-index: 2;
          display: flex; align-items: center; justify-content: space-between;
          height: 28px;
          background: linear-gradient(#fdfdfd, #ebebeb);
          border-bottom: 1px solid rgba(0,0,0,0.15);
          color: #333; font-size: 12px; font-weight: 600;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
          padding: 0 8px;
        }
        .files-left-header .col-name { padding-left: 15px; /* shift name left */ flex: 1; }
        .files-left-header .col-size { width: 90px; text-align: right; padding-right: 11px; }
        .files-right { display: grid; grid-template-rows: 1fr auto; }

        /* Explorer-like tree (scoped to left panel to avoid global clashes) */
        .files-left .tree { list-style: none; margin: 0; padding: 4px 0 12px 0; }
        .files-left .tree-item { display: block; }
        .files-left .tree-row { display: flex; align-items: center; gap: 8px; padding: 6px 6px; border-radius: 4px; cursor: default; user-select: none; }
        /* tighter spacing for file rows only */
        .files-left .tree-row.is-file { padding: 1px 4px; gap: 4px; }
        .files-left .tree-row:hover { background: rgba(51,153,255,0.12); }
        .files-left .tree-row.selected { background: rgba(51,153,255,0.18); outline: 1px solid rgba(51,153,255,0.6); }
        .files-left .twisty { width: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #333; }
        .files-left .icon { width: 18px; height: 18px; object-fit: contain; }
        .files-left .label { font-size: 13px; color: #222; flex: 1; }
        .files-left .size { width: 90px; font-size: 12px; color: #666; text-align: right; padding-right: 8px; }
        .files-left .children { margin: 0; padding-left: 12px; list-style: none; display: none; }
        .files-left .expanded > .children { display: block; }

        .preview { display: grid; grid-template-rows: 1fr auto; min-height: 0; }
        .artwork-wrap { display: flex; align-items: center; justify-content: center; padding: 6px 12px; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .artwork { max-width: 80%; max-height: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.25); border-radius: 6px; }
        .controls { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 8px; align-items: center; }
        .controls .title { font-size: 13px; color: #333; }
        .controls audio { width: 100%; max-width: 640px; }
        /* Download button styling aligned with Purchase button */
        .download-btn {
          display: inline-block;
          padding: 10px 14px;
          border-radius: 6px;
          border: 1px solid #0b5ed7;
          background: linear-gradient(#4da3ff,#1d76ff);
          color: #fff !important;
          text-decoration: none;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
        }
        .download-btn:hover {
          background: linear-gradient(#5bb0ff,#2b82ff);
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .download-btn[disabled] {
          opacity: 0.5;
          pointer-events: none;
          cursor: not-allowed;
          color: #eee !important;
          transform: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        /* Mobile vertical stack: left panel above right preview */
        @media (max-width: 760px) {
          .files-root {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .files-left {
            max-height: 45%;
            flex: 0 0 auto;
            border-right: none;
            border-bottom: 1px solid rgba(0,0,0,0.15);
            overflow: auto;
          }
          .files-right {
            flex: 1 1 auto;
            display: grid;
            grid-template-rows: 1fr;
            min-height: 0; /* enable child overflow */
          }
          .preview { min-height: 0; overflow: auto; }
          .artwork { max-width: 90%; max-height: 60vh; }
        }
      </style>

      <div class="files-root">
        <aside class="files-left">
          <div class="files-left-header">
            <span class="col-name">Name</span>
            <span class="col-size">Size</span>
          </div>
          <ul class="tree" id="fs-tree"></ul>
        </aside>
        <section class="files-right">
          <div class="preview">
            <div class="artwork-wrap">
              <img id="file-artwork" class="artwork" src="noselect.jpg" alt="Artwork" />
            </div>
            <div class="controls">
              <div class="title" id="file-title">Select a track</div>
              <audio id="rb-audio" controls preload="metadata"></audio>
              <a id="rb-download" class="download-btn" href="#" download style="justify-self:start; font-size:12px; color:#0366d6; text-decoration:none;">Download</a>
            </div>
          </div>
          <!-- Native HTML5 audio controls for quick working player -->
        </section>
      </div>
    `;
    // Fill the window: remove padding on this window's content only
    content.style.padding = '0';

    // Hierarchical file system (two folders as requested)
    // Each audio file can optionally specify explicit mp3 and/or wav URLs.
    // Playback prefers MP3; downloads prefer WAV (fall back to MP3 if WAV missing).
    const fsData = [
      {
        name: '23-24', type: 'folder', children: [
          { name: 'newblades.wav', type: 'audio', wav: 'https://files.catbox.moe/9lgr6h.wav', mp3: 'recyclebinmusic/newblades.mp3', art: 'nocover.jpg', date: '2024-12-02' },
          { name: 'INT.wav',        type: 'audio', wav: 'https://files.catbox.moe/30392j.wav',                                         mp3: 'recyclebinmusic/INT.mp3',        art: 'nocover.jpg', date: '2024-11-18' },
          { name: 'pachinko.wav',   type: 'audio', wav: 'https://files.catbox.moe/5puxbs.wav', mp3: 'recyclebinmusic/pachinko.mp3',                                  art: 'nocover.jpg', date: '2024-10-29' },
          { name: 'birdwatcher.wav',type: 'audio', wav: 'https://files.catbox.moe/a98yzu.wav', mp3: 'recyclebinmusic/birdwatcher.mp3',    art: 'nocover.jpg', date: '2024-09-14' },
          { name: 'BF.wav',         type: 'audio', wav: 'https://files.catbox.moe/vxkqec.wav', mp3: 'recyclebinmusic/BF.mp3',             art: 'nocover.jpg', date: '2024-08-22' }
        ]
      },
      { name: "remixes/flips/edits", type: 'folder', children: [] }
    ];

    const tree = content.querySelector('#fs-tree');
    const titleEl = content.querySelector('#file-title');
    const artEl = content.querySelector('#file-artwork');
    const rbAudio = content.querySelector('#rb-audio');
    const downloadBtn = content.querySelector('#rb-download');
    let selectedRow = null;

    // Initialize download button as disabled until a file is selected
    if (downloadBtn) {
      downloadBtn.setAttribute('disabled', 'true');
      downloadBtn.href = '#';
      downloadBtn.textContent = 'Download';
    }

    // Optional default volume
    rbAudio.volume = 0.85;

    // --- Size helpers ---
    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes <= 0) return '';
      const units = ['B','KB','MB','GB','TB'];
      let i = 0; let val = bytes;
      while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
      return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
    }

    async function fetchContentLength(url) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const len = res.headers.get('content-length');
        if (len) return parseInt(len, 10);
      } catch {}
      // Fallback: GET with Range to try to read Content-Range total size
      try {
        const res2 = await fetch(url, { headers: { 'Range': 'bytes=0-0' } });
        const cr = res2.headers.get('content-range');
        // format: bytes 0-0/12345
        const total = cr && cr.split('/')[1];
        if (total && !isNaN(total)) return parseInt(total, 10);
      } catch {}
      return null;
    }

    async function resolveSizeUrl(node) {
      const explicitWav = node.wav || '';
      const explicitMp3 = node.mp3 || '';
      const guessedMp3 = explicitMp3 || guessMp3FromWav(explicitWav);
      // Prefer WAV for size if available, else MP3
      const candidate = explicitWav || guessedMp3 || explicitMp3;
      if (!candidate) return null;
      try { return new URL(candidate, window.location.href).toString(); } catch { return candidate; }
    }

    async function updateRowSize(node, sizeEl) {
      // Use existing size as placeholder if provided
      if (sizeEl.textContent.trim() === '') sizeEl.textContent = '…';
      const url = await resolveSizeUrl(node);
      if (!url) return;
      const bytes = await fetchContentLength(url);
      if (bytes && Number.isFinite(bytes)) sizeEl.textContent = formatBytes(bytes);
    }

    function renderTree(data, parentUl, path = '') {
      data.forEach(node => {
        const li = document.createElement('li');
        li.className = 'tree-item';

        const row = document.createElement('div');
        row.className = 'tree-row';

        const twisty = document.createElement('span');
        twisty.className = 'twisty';
        twisty.textContent = node.type === 'folder' ? '▶' : '';

        const icon = document.createElement('img');
        icon.className = 'icon';
        icon.src = node.type === 'folder' ? 'folder.png' : 'WAV.webp';
        // fallback if target icon missing
        icon.onerror = () => {
          if (node.type !== 'folder') icon.src = 'disc1.png';
          else icon.src = 'recyclebin.png';
        };

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = node.name;

        row.appendChild(twisty);
        row.appendChild(icon);
        row.appendChild(label);
        li.appendChild(row);

        if (node.type === 'folder') {
          const childrenUl = document.createElement('ul');
          childrenUl.className = 'children';
          li.appendChild(childrenUl);

          row.addEventListener('click', () => {
            const expanded = li.classList.toggle('expanded');
            twisty.textContent = expanded ? '▼' : '▶';
          });

          // Render folder children
          renderTree(node.children || [], childrenUl, `${path}${node.name}/`);
        } else if (node.type === 'audio') {
          row.classList.add('is-file');
          row.style.cursor = 'pointer';
          // right-aligned size and date labels
          const sizeSpan = document.createElement('span');
          sizeSpan.className = 'size';
          sizeSpan.textContent = node.size || '';
          row.appendChild(sizeSpan);
          // async fetch and update
          updateRowSize(node, sizeSpan);
          row.addEventListener('click', () => selectAudio(node, row, `${path}${node.name}`));
        }

        parentUl.appendChild(li);
      });
    }

    function clearSelected() {
      if (selectedRow) selectedRow.classList.remove('selected');
      selectedRow = null;
    }

    function selectAudio(fileNode, rowEl, displayPath) {
      clearSelected();
      selectedRow = rowEl || null;
      if (selectedRow) selectedRow.classList.add('selected');

      titleEl.textContent = displayPath || fileNode.name;
      // update right image per file; fallback to placeholder if no art
      artEl.src = fileNode.art || 'rightpanelnothing.png';
      // if placeholder missing, fallback to a known existing image
      artEl.onerror = () => { artEl.onerror = null; artEl.src = 'demodisccover-hq.png'; };

      // Prefer MP3 for playback when available; WAV for download (fallback to MP3 if WAV missing)
      const explicitMp3 = fileNode.mp3 || '';
      const explicitWav = fileNode.wav || '';
      // If only WAV provided, try to guess MP3 from it for playback convenience
      const guessedMp3 = explicitMp3 || guessMp3FromWav(explicitWav);
      const mp3Url = guessedMp3 || '';
      const wavUrl = explicitWav || '';

      setAudioSources(rbAudio, [
        { src: mp3Url, type: mp3Url ? 'audio/mpeg' : '' },
        { src: wavUrl, type: wavUrl ? 'audio/wav' : '' }
      ]);

      // Set download target: WAV if available, else MP3
      if (downloadBtn) {
        const dlUrl = wavUrl || mp3Url || '#';
        downloadBtn.href = dlUrl;
        // Always show 'Download' per request
        downloadBtn.textContent = 'Download';
        // Enable/disable based on availability
        if (dlUrl === '#') {
          downloadBtn.setAttribute('disabled', 'true');
        } else {
          downloadBtn.removeAttribute('disabled');
        }
        try {
          const a = new URL(dlUrl, window.location.href);
          const base = (a.pathname.split('/').pop() || 'track');
          downloadBtn.setAttribute('download', base);
        } catch { /* noop */ }
      }

      rbAudio.currentTime = 0;
      rbAudio.load();
      rbAudio.play().catch((err) => {
        console.warn('Audio play failed:', err);
      });
    }

    // If user clicks play before selecting, auto-play first audio from root folders
    rbAudio.addEventListener('play', () => {
      if (!selectedRow) {
        const first = findFirstAudio(fsData);
        if (first) selectAudio(first.node, null, first.node.name);
      }
    });

    // Surface loading errors for remote links (e.g., CORS, 403, range unsupported)
    rbAudio.addEventListener('error', () => {
      const mediaError = rbAudio.error;
      let msg = 'Failed to load audio';
      if (mediaError) {
        // Map MediaError codes to brief messages
        const map = {
          1: 'Aborted',
          2: 'Network error',
          3: 'Decoding error',
          4: 'Source not supported'
        };
        msg += ` (${map[mediaError.code] || 'Unknown error'})`;
      }
      titleEl.textContent = msg;
      console.error(msg, { src: rbAudio.currentSrc, error: mediaError });
    });

    // Helpers
    function guessMp3FromWav(url) {
      if (!url) return '';
      // replace .wav (optionally with query) with .mp3, keep query if present
      const m = url.match(/^(.*)\.wav(\?.*)?$/i);
      if (m) return `${m[1]}.mp3${m[2] || ''}`;
      return url; // if not wav, just return as-is
    }

    function setAudioSources(audioEl, sources) {
      // Clear existing <source> nodes
      while (audioEl.firstChild) audioEl.removeChild(audioEl.firstChild);
      // Append new sources in priority order
      (sources || []).forEach(s => {
        if (!s || !s.src) return;
        const srcEl = document.createElement('source');
        srcEl.src = s.src;
        if (s.type) srcEl.type = s.type;
        audioEl.appendChild(srcEl);
      });
    }

    function findFirstAudio(data) {
      for (const n of data) {
        if (n.type === 'audio') return { node: n };
        if (n.type === 'folder') {
          const found = findFirstAudio(n.children || []);
          if (found) return found;
        }
      }
      return null;
    }

    // Render the tree
    renderTree(fsData, tree);
  } else if (title === "Store") {
    // Desktop default; mobile sizing handled by positionAndClampOnSpawn()
    if (!isMobile) {
      win.style.width = '900px';
      win.style.height = '600px';
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }
    content.innerHTML = `
      <style>
        .store-container {
          padding: 0; /* remove window/content gap */
          position: relative;
          font-family: inherit;
          height: 100%;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: 1fr 40px; /* products area + fixed bottom bar */
          gap: 0;
          overflow: hidden; /* prevent outer scrollbar */
        }

        /* Loading overlay shown while Store content initializes */
        .store-loading {
          position: absolute;
          inset: 0; /* cover everything including bottom bar */
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff; /* solid white bg while loading */
          z-index: 10;
          pointer-events: none;
        }
        .store-loading img {
          width: 96px;
          height: auto; /* maintain aspect ratio */
          image-rendering: auto;
          animation: store-spin 0.6s linear infinite;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.25));
        }
        @keyframes store-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Products grid */
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          overflow: auto; /* scroll only the products area */
          padding: 20px 20px 0 20px; /* inner padding for content spacing */
          align-items: start; /* prevent items stretching vertically */
        }
        @media (min-width: 900px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
        }

        /* Mobile: stack vertically to avoid overlaps */
        @media (max-width: 760px) {
          .store-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .product-grid {
            grid-template-columns: 1fr; /* single column */
            padding: 12px 12px 0 12px;
            flex: 1 1 auto; /* take available height */
          }
          .store-bottom-bar {
            position: relative;
            flex: 0 0 40px; /* keep height */
            justify-content: flex-start; /* keep controls visible on left */
            padding: 0 8px; /* slight tighter padding */
            gap: 8px;
          }
          .store-audio-wrap { order: -1; } /* move mute button to far left */
        }

        .product-item {
          background: rgba(255,255,255,0.85);
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06); /* subtler so image shadow reads clearly */
          color: #222;
          will-change: transform, opacity;
          transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 240ms ease-out;
          position: relative;
          height: 210px; /* slightly taller card */
        }
        /* The <img class="product-image"> itself, no wrapper */
        .product-image { display: block; background: transparent; }
        /* CD (p2) card hover spin on wrapper to preserve image 3D transform */
        .product-item[data-id="p2"] .product-image-wrap {
          transform: none;
          transform-origin: 50% 50%;
          transition: transform 1s ease;
        }
        .product-item[data-id="p2"]:hover .product-image-wrap {
          transform: rotate(1turn);
        }
        /* Vinyl (p1) card hover spin on wrapper to preserve image 3D transform */
        .product-item[data-id="p1"] .product-image-wrap {
          transform: none;
          transform-origin: 50% 50%;
          transition: transform 2s ease;
        }
        .product-item[data-id="p1"]:hover .product-image-wrap {
          transform: rotate(1turn);
        }
        .product-title { font-weight: 600; margin: 6px 0 2px; }
        .product-type { font-size: 12px; color: #666; }

        @media (prefers-reduced-motion: reduce) {
          .product-item { transition: none !important; }
        }

        /* Bottom taskbar-style filter bar */
        .store-bottom-bar {
          position: relative; /* ensure ::before anchors to bar and z-index applies */
          height: 40px; /* slimmer bar */
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: linear-gradient(
            to top,
            rgba(40, 40, 40, 0.7) 0%,
            rgba(70, 70, 70, 0.6) 30%,
            rgba(120, 120, 120, 0.45) 70%,
            rgba(180, 180, 180, 0.3) 100%
          );
          box-shadow:
            inset 0 1px 2px rgba(255,255,255,0.15),
            inset 0 -1px 4px rgba(0,0,0,0.4),
            0 -2px 6px rgba(0,0,0,0.4);
          border-top: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 5;
        }
        .store-bottom-bar::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0));
          pointer-events: none;
        }
        .store-filters { display: flex; align-items: center; gap: 0; flex-wrap: nowrap; height: 100%; }
        .store-filter-btn {
          position: relative;
          padding: 0 18px; /* slightly more spacing */
          font-size: 14px; /* tiny bit bigger */
          border-radius: 0; /* squared corners for Win7-like tabs */
          transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
          color: rgba(255,255,255,0.92);
          border: none;
          background: transparent; /* text-like tabs */
          cursor: pointer;
          text-shadow: 0 1px 2px rgba(0,0,0,0.6);
          letter-spacing: 0.2px; /* subtle optical centering */
          line-height: 1;
          border-radius: 0;
          transition: background 0.15s ease, color 0.15s ease;
          display: flex;
          align-items: center; /* vertically center text */
          height: 100%;
          background-origin: content-box; /* underline respects padding insets */
        }
        .store-filter-btn:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.12);
          /* subtle outline + top highlight to emphasize hover */
          box-shadow: 0 0 0 1px rgba(255,255,255,0.12) inset, inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .store-filter-btn.active {
          color: #ffffff;
          /* Stronger reversed gradient (darker top, lighter bottom) for a selected/pressed look */
          background: linear-gradient(#1f6feb, #63a2ff);
          /* stronger inner shadows for pressed glass effect */
          box-shadow:
            0 1px 2px rgba(0,0,0,0.3),            /* outer */
            inset 0 1px 0 rgba(0,0,0,0.35),        /* top inner shade */
            inset 0 -1px 0 rgba(255,255,255,0.4),  /* bottom inner gloss */
            0 0 0 1px rgba(0,0,0,0.35);            /* stroke */
        }
        .store-filter-btn.active:hover {
          background: linear-gradient(#1b5fc8, #74b3ff);
          box-shadow:
            0 1px 3px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(0,0,0,0.4),
            inset 0 -1px 0 rgba(255,255,255,0.45),
            0 0 0 1px rgba(0,0,0,0.4);
        }
        /* vertical dividers framing each tab label */
        /* left divider for all but the first tab */
        .store-filters .store-filter-btn:not(:first-child)::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 24px;
          background: rgba(255,255,255,0.35);
          box-shadow: 1px 0 0 rgba(0,0,0,0.35);
        }
        /* right divider for all but the last tab */
        .store-filters .store-filter-btn:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 24px; /* a bit taller to match larger text */
          background: rgba(255,255,255,0.35);
          box-shadow: 1px 0 0 rgba(0,0,0,0.35);
        }
        /* underline removed per request */

        /* Audio controls area inside bar */
        .store-audio-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-direction: row;
        }
        .store-audio-btn {
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
          opacity: 0.55; /* a bit more transparent when idle */
          transition: opacity 0.15s ease;
        }
        .store-audio-btn:hover { opacity: 1; }
        .store-audio-btn img { width: 100%; height: 100%; display: block; }
        /* Volume slider styles (desktop) */
        .store-volume {
          width: 110px;
          height: 4px;
          appearance: none;
          background: #bbb;
          border-radius: 2px;
          outline: none;
        }
        .store-volume::-webkit-slider-runnable-track { height: 4px; background: #bbb; border-radius: 2px; }
        .store-volume::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 12px; height: 12px; border-radius: 50%;
          background: #666;
          margin-top: -4px;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          opacity: 0.65; /* semi-transparent orb */
          transition: opacity 0.15s ease;
        }
        .store-volume:hover::-webkit-slider-thumb { opacity: 1; }
        .store-volume::-moz-range-track { height: 4px; background: #bbb; border-radius: 2px; }
        .store-volume::-moz-range-thumb {
          width: 12px; height: 12px; border: none; border-radius: 50%;
          background: #666;
          box-shadow: 0 0 4px rgba(0,0,0,0.5);
          opacity: 0.65;
          transition: opacity 0.15s ease;
        }
        .store-volume:hover::-moz-range-thumb { opacity: 1; }
      </style>

      <div class="store-container">
        <div id="store-loading" class="store-loading">
          <img src="wiiload.webp" alt="Loading" />
        </div>
        <div class="product-grid" id="store-products"></div>

        <div class="store-bottom-bar">
          <div class="store-filters">
            <button class="store-filter-btn active" data-filter="all">All</button>
            <button class="store-filter-btn" data-filter="vinyl">Vinyl</button>
            <button class="store-filter-btn" data-filter="cd">CD</button>
            <button class="store-filter-btn" data-filter="clothing">Clothing</button>
          </div>
          <div class="store-audio-wrap"></div>
        </div>
      </div>
    `;

    // Use the window's scrollbar and remove default padding
    win.classList.add('no-padding');

    // Build products and filtering
    (function setupStoreProducts() {
      const products = [
        { id: 'p1', title: 'Whodunit?', type: 'vinyl', subtitle: 'Standard Black Vinyl', img: 'whodunitvinyldisc.webp', images: ['whodunitvinyl1.webp'], price: 27.90 },
        { id: 'p2', title: 'Whodunit?', type: 'cd', subtitle: 'CD', img: 'whodunitcd1.png', images: ['whodunitcd2.webp','whodunitcd1.png'], price: 11.40 }
      ];
      const grid = content.querySelector('#store-products');
      const buttons = Array.from(content.querySelectorAll('.store-filter-btn'));
      const loadingEl = content.querySelector('#store-loading');
      let firstLoad = true; // always show spinner on open
      const spinnerStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const MIN_SPIN_MS = 250; // faster: brief but noticeable

      // --- UI sounds (scoped to Store item cards only) ---
      // Use Howler (Web Audio) for low-latency overlapping playback; fallback to a small HTMLAudio pool
      let playStoreHover = () => {};
      let playStoreSelect = () => {};
      let storeUiSoundEnabled = false;
      function enableStoreUiSoundsOnce() {
        storeUiSoundEnabled = true;
        window.removeEventListener('pointerdown', enableStoreUiSoundsOnce);
        window.removeEventListener('keydown', enableStoreUiSoundsOnce);
      }
      // Gate to satisfy autoplay policies (especially iOS Safari)
      window.addEventListener('pointerdown', enableStoreUiSoundsOnce, { once: true });
      window.addEventListener('keydown', enableStoreUiSoundsOnce, { once: true });

      try {
        if (window.Howl) {
          const hoverHowl = new Howl({ src: ['hoversound.wav'], volume: 1, html5: false, pool: 6 });
          const selectHowl = new Howl({ src: ['selectsound.wav'], volume: 1, html5: false, pool: 6 });
          // Eagerly decode buffers to minimize first-play latency
          try { hoverHowl.load(); } catch {}
          try { selectHowl.load(); } catch {}
          playStoreHover = () => { if (!storeUiSoundEnabled) return; try { hoverHowl.play(); } catch {} };
          playStoreSelect = () => { if (!storeUiSoundEnabled) return; try { selectHowl.play(); } catch {} };
        } else {
          // Fallback: small round-robin pools to avoid cutting off overlapping plays
          const hoverPool = Array.from({ length: 4 }, () => { const a = new Audio('hoversound.wav'); try { a.preload = 'auto'; a.load(); } catch {}; return a; });
          const selectPool = Array.from({ length: 4 }, () => { const a = new Audio('selectsound.wav'); try { a.preload = 'auto'; a.load(); } catch {}; return a; });
          let hi = 0, si = 0;
          playStoreHover = () => {
            if (!storeUiSoundEnabled) return;
            const a = hoverPool[hi = (hi + 1) % hoverPool.length];
            try { a.currentTime = 0; a.play().catch(()=>{}); } catch {}
          };
          playStoreSelect = () => {
            if (!storeUiSoundEnabled) return;
            const a = selectPool[si = (si + 1) % selectPool.length];
            try { a.currentTime = 0; a.play().catch(()=>{}); } catch {}
          };
        }
      } catch {}

      // Expose a readiness promise so music can wait until loaded
      let storeReadyResolve;
      const storeReadyPromise = new Promise(r => { storeReadyResolve = r; });
      content.__storeReadyPromise = storeReadyPromise;

      // Preload all product detail imagery up-front so opening a product doesn't show loading
      function preloadImages(urls, timeoutMs = 2000) {
        const list = Array.from(new Set(urls)).filter(Boolean);
        if (!list.length) return Promise.resolve();
        const timer = new Promise(res => setTimeout(res, timeoutMs));
        const waits = list.map(src => new Promise(res => {
          try {
            const img = new Image();
            const done = () => { img.onload = null; img.onerror = null; res(); };
            img.onload = done; img.onerror = done; img.src = src;
            if (img.complete) done();
          } catch { res(); }
        }));
        return Promise.race([Promise.all(waits), timer]);
      }

      // Build a list of known current and detail gallery images to cache
      const detailPreloadUrls = new Set();
      products.forEach(p => {
        if (p.img) detailPreloadUrls.add(p.img);
        (Array.isArray(p.images) ? p.images : []).forEach(u => detailPreloadUrls.add(u));
      });
      // Known gallery for Whodunit detail
      ['whodunitproducts/whodunitvinyl1.jpg',
       'whodunitproducts/whodunitvinyl2.jpg',
       'whodunitproducts/whodunitvinyl3.jpg',
       'whodunitproducts/whodunitvinyl4.jpg',
       'whodunitproducts/whodunit.gif']
        .forEach(u => detailPreloadUrls.add(u));

      const detailPreloadPromise = preloadImages(Array.from(detailPreloadUrls), 2000)
        .then(() => { content.__detailImagesPreloaded = true; })
        .catch(() => {});
      content.__detailPreloadPromise = detailPreloadPromise;

      // Wait until current images in grid finish loading (or timeout) before hiding loader
      function whenImagesSettled(timeoutMs = 900) {
        const imgs = Array.from(grid.querySelectorAll('img'));
        if (!imgs.length) {
          return Promise.resolve();
        }
        const timer = new Promise(resolve => setTimeout(resolve, timeoutMs));
        const waits = imgs.map(img => new Promise(res => {
          if (img.complete) return res();
          const done = () => { img.removeEventListener('load', done); img.removeEventListener('error', done); res(); };
          img.addEventListener('load', done);
          img.addEventListener('error', done);
        }));
        return Promise.race([Promise.all(waits), timer]);
      }

      // Helper: open product detail overlay with animated image transition
      function openProductDetail(product, sourceCard) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Support multiple images (carousel). Fallback to single image
        const images = Array.isArray(product.images) && product.images.length ? product.images : [product.img].filter(Boolean);
        let currentIndex = 0;
        // Create overlay container
        let overlay = content.querySelector('.store-detail-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'store-detail-overlay';
          Object.assign(overlay.style, {
            position: 'absolute',
            left: '0', right: '0', top: '0', bottom: '40px', /* keep bottom bar visible */
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(3px)',
            webkitBackdropFilter: 'blur(3px)',
            zIndex: '20',
            overflow: 'auto',
            opacity: '0',
            transition: 'opacity 220ms ease'
          });
          content.querySelector('.store-container')?.appendChild(overlay);
        }

        // Build detail inner layout (no carousel for now)
        const heroImgSrc = images[0];
        overlay.innerHTML = `
          <style>
            /* Scoped to the store detail overlay */
            .store-detail-overlay .detail-hero {
              background: rgba(255,255,255,0.66);
              border: 1px solid rgba(255,255,255,0.7);
              box-shadow: 0 8px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              height: 300px; /* match previous visual height */
            }
            .store-detail-overlay .detail-hero-img {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: contain; /* default for first image */
              opacity: 1;
              transition: opacity 200ms ease;
            }
            .store-detail-overlay .detail-gallery {
              margin-top: 10px;
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
              gap: 8px;
            }
            .store-detail-overlay .detail-thumb {
              background:#fff;
              border:1px solid #ddd;
              border-radius:6px;
              height:72px;
              display:flex;align-items:center;justify-content:center;
              overflow:hidden;
              cursor:pointer;
              transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease;
            }
            .store-detail-overlay .detail-thumb:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.12); transform: translateY(-1px); }
            .store-detail-overlay .detail-thumb.selected { border-color:#4da3ff; box-shadow: 0 0 0 2px rgba(77,163,255,0.25) inset; }
            .store-detail-overlay .detail-thumb img { max-width:100%; max-height:100%; object-fit:contain; display:block; }
            /* Back button hover: lighten arrow */
            .store-detail-overlay .detail-back:hover img { filter: brightness(1.25); }
            /* Purchase button hover */
            .store-detail-overlay .detail-buy:hover {
              background: linear-gradient(#5bb0ff,#2b82ff) !important;
              transform: translateY(-1px);
              box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            }
          </style>
          <button class="detail-back" style="position:absolute;top:8px;left:8px;padding:2px;border:none;background:transparent;cursor:pointer;z-index:21;display:flex;align-items:center;justify-content:center;border-radius:8px;">
            <img src="backarrow.webp" alt="Back" style="width:40px;height:auto;display:block;transition:filter .15s ease;" />
          </button>
          <div class="detail-wrap" style="max-width: 900px; margin: 0 auto; padding: 56px 16px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; position: relative;">
            <div>
              <div class="detail-hero" style="position: relative; min-height: 300px; border: 1px solid #ddd; border-radius: 8px; background:#fff; display:flex; align-items:center; justify-content:center; padding: 4%; overflow:hidden;">
                ${heroImgSrc ? `<img class="detail-hero-img imgA" src="${heroImgSrc}" alt="${product.title}" />` : ''}
                <img class="detail-hero-img imgB" alt="${product.title}" aria-hidden="true" style="opacity:0;" />
              </div>
              <div class="detail-gallery" id="detail-gallery"></div>
            </div>
            <div class="detail-right" style="display:flex; flex-direction:column; gap:12px;">
              <div class="detail-info" style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:16px;"> 
                <h2 style="margin:0 0 2px 0; font-size:28px;">${product.title}</h2>
                <div style="margin:0 0 12px 0; font-size:15px; color:#666; text-transform: none;">${product.subtitle ?? (product.type || '')}</div>
                <div style="font-weight:800; font-size:20px; color:#111; margin-bottom: 14px;">£${(product.price ?? 0).toFixed(2)}</div>
                <a class="detail-buy" href="https://elasticstage.com/lew-dunit/releases/whodunit-album" target="_blank" rel="noopener" style="display:inline-block;padding:10px 14px;border-radius:6px;border:1px solid #0b5ed7;background:linear-gradient(#4da3ff,#1d76ff);color:#fff;text-decoration:none;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.15);">Purchase</a>
              </div>
              <div class="detail-desc" style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:14px; color:#333; line-height:1.5; font-size:14px;">
                <div style="font-weight:700; margin-bottom:6px;">Description</div>
                <div>'Whodunit?' on black vinyl. Includes 3 bonus tracks.</div>
              </div>
            </div>
          </div>
        `;

        // Detail-level loader overlay: only add if preloading hasn't completed
        let detailLoader = null;
        if (!content.__detailImagesPreloaded) {
          detailLoader = document.createElement('div');
          Object.assign(detailLoader.style, {
            position: 'absolute', left: '0', right: '0', top: '0', bottom: '0',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: '25', pointerEvents: 'none'
          });
          const detailSpinner = document.createElement('img');
          detailSpinner.src = 'wiiload.webp';
          detailSpinner.alt = 'Loading';
          detailSpinner.style.width = '96px';
          detailSpinner.style.height = 'auto';
          detailSpinner.style.animation = 'store-spin 0.6s linear infinite';
          detailLoader.appendChild(detailSpinner);
          overlay.appendChild(detailLoader);
        }

        function whenDetailImagesSettled(timeoutMs = 1200) {
          const imgs = Array.from(overlay.querySelectorAll('img'));
          if (!imgs.length) return Promise.resolve();
          const timer = new Promise(r => setTimeout(r, timeoutMs));
          const waits = imgs.map(img => new Promise(res => {
            if (img.complete) return res();
            const done = () => { img.removeEventListener('load', done); img.removeEventListener('error', done); res(); };
            img.addEventListener('load', done);
            img.addEventListener('error', done);
          }));
          return Promise.race([Promise.all(waits), timer]);
        }

        const heroImgA = overlay.querySelector('.detail-hero-img.imgA');
        const heroImgB = overlay.querySelector('.detail-hero-img.imgB');
        const backBtn = overlay.querySelector('.detail-back');
        const galleryEl = overlay.querySelector('#detail-gallery');

        // No carousel: nothing extra to initialize

        // Build gallery thumbnails using known product images (below the hero)
        if (galleryEl) {
          // For Vinyl (p1), include the full, curated gallery.
          // For CD (p2), use all images provided on the product so the second image (whodunitcd1.png) appears.
          const galleryImages = (product && product.id === 'p1')
            ? [
                heroImgSrc,
                'whodunitproducts/whodunitvinyl1.jpg',
                'whodunitproducts/whodunitvinyl2.jpg',
                'whodunitproducts/whodunitvinyl3.jpg',
                'whodunitproducts/whodunitvinyl4.jpg',
                'whodunitproducts/whodunit.gif'
              ].filter(Boolean)
            : (product && product.id === 'p2')
              ? images.filter(Boolean)
              : [heroImgSrc].filter(Boolean);

          // Helper to apply sizing to a specific element:
          // Default: index 0 = contain; others = cover; GIFs fill height (height:100%, width:auto).
          // For CD (p2): force contain for all indices so every image fits inside the hero box.
          function applyHeroFitTo(el, index, src) {
            if (!el) return;
            const isGif = (src || '').toLowerCase().endsWith('.gif');
            if (isGif) {
              // Center the GIF and fill height
              el.style.objectFit = 'contain';
              el.style.width = 'auto';
              el.style.height = '100%';
              el.style.left = '50%';
              el.style.top = '50%';
              el.style.right = '';
              el.style.bottom = '';
              el.style.transform = 'translate(-50%, -50%)';
            } else if (index === 0) {
              // Reset to fill box and remove centering transform
              el.style.objectFit = 'contain';
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.left = '0';
              el.style.top = '0';
              el.style.right = '0';
              el.style.bottom = '0';
              el.style.transform = 'none';
            } else {
              // Reset to fill box and remove centering transform
              const wantContain = (product && product.id === 'p2');
              el.style.objectFit = wantContain ? 'contain' : 'cover';
              el.style.width = '100%';
              el.style.height = '100%';
              el.style.left = '0';
              el.style.top = '0';
              el.style.right = '0';
              el.style.bottom = '0';
              el.style.transform = 'none';
            }
          }

          // Crossfade between A and B layers. Handles rapid clicks via token.
          let fadeToken = 0;
          let useAasFront = true;
          function swapHero(nextSrc, idx) {
            if (!heroImgA || !heroImgB || !nextSrc) return;
            const token = ++fadeToken;
            const front = useAasFront ? heroImgA : heroImgB;
            const back = useAasFront ? heroImgB : heroImgA;
            // Prepare back layer
            applyHeroFitTo(back, isNaN(idx) ? 0 : idx, nextSrc);
            back.src = nextSrc;
            back.style.opacity = '0';
            // Force reflow before starting transition
            // eslint-disable-next-line no-unused-expressions
            back.offsetHeight;
            // Start simultaneous fade
            front.style.opacity = '0';
            back.style.opacity = '1';
            const onEnd = (e) => {
              if (e.propertyName !== 'opacity' || token !== fadeToken) return;
              front.removeEventListener('transitionend', onEnd);
              useAasFront = !useAasFront; // swap roles
            };
            front.addEventListener('transitionend', onEnd);
          }

          galleryEl.innerHTML = galleryImages.map((src, i) => `
            <div class="detail-thumb${i===0 ? ' selected' : ''}" data-src="${src}" data-index="${i}">
              <img src="${src}" alt="${product.title} preview ${i+1}">
            </div>
          `).join('');

          const thumbs = Array.from(galleryEl.querySelectorAll('.detail-thumb'));
          // Ensure initial fit corresponds to first image (contained)
          if (heroImgA) {
            applyHeroFitTo(heroImgA, 0, heroImgA.src || '');
            heroImgA.style.opacity = '1';
          }
          if (heroImgB) {
            applyHeroFitTo(heroImgB, 1, heroImgB.src || '');
            heroImgB.style.opacity = '0';
          }
          thumbs.forEach(t => {
            t.addEventListener('click', () => {
              const nextSrc = t.getAttribute('data-src');
              const idxStr = t.getAttribute('data-index');
              const idx = idxStr ? parseInt(idxStr, 10) : 0;
              if (nextSrc) {
                swapHero(nextSrc, idx);
              }
              thumbs.forEach(x => x.classList.remove('selected'));
              t.classList.add('selected');
            });
          });
        }

        // Hide detail loader (if present) after images are ready (or timeout) with brief minimum spinner time
        if (detailLoader) {
          const detailSpinStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          const MIN_DETAIL_SPIN_MS = 250;
          whenDetailImagesSettled(1200).then(() => {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const elapsed = now - detailSpinStart;
            const wait = Math.max(0, MIN_DETAIL_SPIN_MS - elapsed);
            setTimeout(() => { if (detailLoader) detailLoader.style.display = 'none'; }, wait);
          });
        }

        function showOverlayNoAnim() {
          overlay.style.opacity = '1';
        }

        // Animate image from source card image to hero image position
        const srcImg = sourceCard?.querySelector('.product-image');
        if (!srcImg || reduceMotion) {
          showOverlayNoAnim();
        } else {
          // Ask the card to suspend 3D tilt and settle to flat briefly
          if (sourceCard) sourceCard.dataset.suspendTilt = '1';

          // First attach overlay hidden to measure target rect
          overlay.style.opacity = '0';
          // Force layout
          overlay.getBoundingClientRect();

          // Simple fade-in (no zoom) for zero aspect morph
          setTimeout(() => {
            overlay.style.opacity = '1';
          }, 80);
        }

        // Back handler
        backBtn?.addEventListener('click', () => {
          // Resume 3D tilt on the source card when exiting detail view
          if (sourceCard && sourceCard.dataset) {
            delete sourceCard.dataset.suspendTilt;
          }
          overlay.style.opacity = '0';
          // Destroy carousel if present
          try { overlay.__glide && overlay.__glide.destroy(); } catch {}
          setTimeout(() => overlay.remove(), 220);
        }, { once: true });
      }

      function render(filter) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // First: capture positions of existing items by id
        const prev = new Map();
        const prevItems = Array.from(grid.children);
        prevItems.forEach(el => {
          const id = el.getAttribute('data-id');
          if (!id) return;
          const rect = el.getBoundingClientRect();
          prev.set(id, rect);
        });

        const f = (filter && filter !== 'all') ? filter : null;
        const list = f ? products.filter(p => p.type === f) : products;

        // Last: replace content with new list (include data-id for matching)
        // Note: image rendered directly (no inner box) for cleaner 3D effect
        // Title and price pinned to bottom of the card in a fixed bar
        grid.innerHTML = list.map(p => `
          <div class="product-item" data-id="${p.id}" data-type="${p.type}">
            <div class="product-image-wrap" style="position:absolute;left:12px;right:12px;top:8px;bottom:98px;display:flex;align-items:center;justify-content:center;">
              ${p.img ? `<img class=\"product-image\" src=\"${p.img}\" alt=\"${p.title}\">` : ''}
            </div>
            <div class="product-divider" style="position:absolute;left:12px;right:12px;bottom:90px;height:1px;background:rgba(0,0,0,0.12);"></div>
            <div class="product-info" style="position:absolute;left:12px;right:12px;bottom:44px;display:flex;flex-direction:column;align-items:flex-start;gap:1px;pointer-events:none;z-index:3;">
              <div class="product-title" style="margin:0;font-size:20px;line-height:1.14;font-weight:800;letter-spacing:0.2px;text-align:left;">${p.title}</div>
              <div class="product-subtitle" style="margin:0;font-size:13px;line-height:1.1;color:#777;text-transform:capitalize;">${p.subtitle ?? (p.type || '')}</div>
            </div>
            <div class="product-price" style="position:absolute;left:12px;right:12px;bottom:10px;font-size:14px;color:#222;font-weight:700;text-align:left;pointer-events:none;z-index:3;">£${(p.price ?? 0).toFixed(2)}</div>
          </div>`).join('');

        // After the first render, hide the loading overlay once images have settled
        if (firstLoad) {
          // Include detail image preloading in initial wait (both with short caps)
          Promise.allSettled([ whenImagesSettled(900), detailPreloadPromise ]).then(() => {
            const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const elapsed = now - spinnerStart;
            const wait = Math.max(0, MIN_SPIN_MS - elapsed);
            setTimeout(() => {
              if (loadingEl) loadingEl.style.display = 'none';
              firstLoad = false;
              try { storeReadyResolve && storeReadyResolve(); } catch {}
            }, wait);
          });
        }

        // Click to open detail for Whodunit? Vinyl (p1)
        const whodunitVinylCard = grid.querySelector('.product-item[data-id="p1"]');
        if (whodunitVinylCard) {
          whodunitVinylCard.style.cursor = 'pointer';
          whodunitVinylCard.addEventListener('click', () => {
            const product = products.find(pp => pp.id === 'p1');
            if (product) openProductDetail(product, whodunitVinylCard);
          });
        }

        // Click to open detail for Whodunit? CD (p2)
        const whodunitCdCard = grid.querySelector('.product-item[data-id="p2"]');
        if (whodunitCdCard) {
          whodunitCdCard.style.cursor = 'pointer';
          whodunitCdCard.addEventListener('click', () => {
            const product = products.find(pp => pp.id === 'p2');
            if (product) openProductDetail(product, whodunitCdCard);
          });
        }

        // Attach hover and select sounds to ALL product item cards (shop only)
        const productCards = Array.from(grid.querySelectorAll('.product-item'));
        productCards.forEach(card => {
          card.addEventListener('mouseenter', () => playStoreHover());
          card.addEventListener('click', () => playStoreSelect());
        });

        // Add interactive 3D tilt on hover (skip if reduced motion)
        if (!reduceMotion) {
          const items3d = Array.from(grid.querySelectorAll('.product-item'));
          items3d.forEach(card => {
            // prep styles
            card.style.perspective = '600px';
            card.style.transformStyle = 'preserve-3d';
            card.style.position = 'relative';
            card.style.overflow = 'visible'; // allow image pop-out beyond card
            // Keep cards slimmer and reserve space for the fixed info bar
            card.style.minHeight = '';
            card.style.paddingBottom = '60px';
            const imgEl = card.querySelector('.product-image');
            if (imgEl) {
              imgEl.style.transform = 'translateZ(0px)';
              imgEl.style.transformStyle = 'preserve-3d';
              imgEl.style.willChange = 'transform, filter';
              imgEl.style.transformOrigin = 'center center';
              imgEl.style.display = 'block';
              imgEl.style.pointerEvents = 'none';
              // Centered in wrapper; allow it to be larger but contained
              imgEl.style.maxHeight = '100%';
              imgEl.style.maxWidth = '100%';
              imgEl.style.width = 'auto';
              imgEl.style.height = 'auto';
              imgEl.style.objectFit = 'contain';
              imgEl.style.margin = '0';
              imgEl.style.zIndex = '1';
              // Ensure a base shadow is visible even before any hover/animation occurs
              imgEl.style.filter = 'drop-shadow(0px 0px 18px rgba(0,0,0,0.25))';
            }

            // Create a specular highlight overlay for more realistic 3D lighting
            const glow = document.createElement('div');
            Object.assign(glow.style, {
              position: 'absolute',
              left: '0', top: '0', right: '0', bottom: '0',
              pointerEvents: 'none',
              borderRadius: '6px',
              opacity: '0',
              transition: 'opacity 120ms ease-out',
              willChange: 'opacity, background',
              mixBlendMode: 'screen',
              zIndex: '2'
            });
            card.appendChild(glow);

            // Add a separate ground shadow element (anchors object to surface)
            const ground = document.createElement('div');
            Object.assign(ground.style, {
              position: 'absolute',
              left: '50%',
              bottom: '94px', // sits just under image area (image bottom is ~98px)
              width: '62%',
              height: '18px',
              transform: 'translateX(-50%) scale(1,1)',
              transformOrigin: 'center',
              borderRadius: '50% / 60%',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.36) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.0) 72%)',
              filter: 'blur(10px)',
              opacity: '0',
              pointerEvents: 'none',
              zIndex: '0'
            });
            card.appendChild(ground);

            // No extra base shadow beneath image: rely on image alpha + dynamic drop-shadow

            let raf = null;
            let targetRX = 0, targetRY = 0;
            let currentRX = 0, currentRY = 0;
            let hovered = false;
            let currentPop = 0, targetPop = 0;
            let currentScale = 1, targetScale = 1;
            let lastNX = 0, lastNY = 0; // store cursor normalized for parallax layers

            const isSuspended = () => card && card.dataset && card.dataset.suspendTilt === '1';

            function apply() {
              raf = null;
              // If suspended, settle to flat quickly and keep glow hidden
              if (isSuspended()) {
                hovered = false;
                targetRX = 0; targetRY = 0;
                targetPop = 0; targetScale = 1;
                glow.style.opacity = '0';
              }
              // simple spring towards target (even subtler follow)
              const lerp = isSuspended() ? 0.2 : 0.12;
              currentRX += (targetRX - currentRX) * lerp;
              currentRY += (targetRY - currentRY) * lerp;
              // Only tilt the image, not the whole card
              if (imgEl) {
                // Smoothly interpolate pop and scale for a more natural transition
                targetPop = hovered ? 45 : 0; // stronger pop-out
                targetScale = hovered ? 1.06 : 1.0; // stronger scale
                currentPop += (targetPop - currentPop) * lerp;
                currentScale += (targetScale - currentScale) * lerp;
                // Image at base Z
                imgEl.style.transform = `translateZ(${currentPop.toFixed(2)}px) rotateX(${currentRX.toFixed(3)}deg) rotateY(${currentRY.toFixed(3)}deg) scale(${currentScale.toFixed(3)})`;
                // Dynamic shadow based on tilt direction using drop-shadow
                if (!isSuspended()) {
                  const k = 0.5; // offset factor
                  const dx = (-currentRY) * k; // right tilt -> shadow to left
                  const dy = (currentRX) * k;  // tilt up -> shadow down
                  const blur = 18 + Math.min(Math.abs(currentRX) + Math.abs(currentRY), 40) * 0.60;
                  const alpha = 0.22 + Math.min((Math.abs(currentRX) + Math.abs(currentRY)) / 60, 0.34);
                  imgEl.style.filter = `drop-shadow(${dx.toFixed(1)}px ${dy.toFixed(1)}px ${blur.toFixed(0)}px rgba(0,0,0,${alpha.toFixed(2)}))`;
                }
              }
              // Layered parallax: gloss sits slightly above the image and shifts subtly with cursor
              if (glow) {
                const glossZ = currentPop + 12; // above image
                const parX = lastNX * 4; // subtle XY parallax
                const parY = lastNY * 2;
                glow.style.transform = `translateZ(${glossZ.toFixed(2)}px) translate(${parX.toFixed(1)}px, ${parY.toFixed(1)}px) rotateX(${currentRX.toFixed(3)}deg) rotateY(${currentRY.toFixed(3)}deg)`;
              }
              // Ground shadow: scale, skew, blur, and fade with tilt/pop
              if (ground) {
                const tiltMag = Math.min(Math.abs(currentRX) + Math.abs(currentRY), 40);
                const sx = 1 + (currentPop / 55); // wider as it pops out
                const sy = 1 - Math.min(0.35, tiltMag / 180); // flatter with tilt
                const skew = (currentRY * 0.5);
                const blurPx = 10 + tiltMag * 0.28; // slightly tighter to read darker
                const op = Math.min(0.46, 0.22 + (currentPop / 140) + (tiltMag / 200));
                ground.style.opacity = hovered ? op.toFixed(2) : '0';
                ground.style.filter = `blur(${blurPx.toFixed(0)}px)`;
                ground.style.transform = `translateX(-50%) scale(${sx.toFixed(2)}, ${sy.toFixed(2)}) skewX(${skew.toFixed(2)}deg)`;
              }
              if (Math.abs(targetRX - currentRX) > 0.05 || Math.abs(targetRY - currentRY) > 0.05) {
                raf = requestAnimationFrame(apply);
              }
            }

            function onMove(e) {
              if (isSuspended()) return;
              const rect = card.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;   // 0..1
              const y = (e.clientY - rect.top) / rect.height;   // 0..1
              const nx = (x - 0.5) * 2; // -1..1
              const ny = (y - 0.5) * 2; // -1..1
              const max = 18; // stronger tilt in degrees
              targetRY = nx * max;       // rotateY left/right
              targetRX = -ny * max;      // rotateX up/down (invert for natural tilt)
              lastNX = nx; lastNY = ny;  // cache for parallax layers
              // Move specular highlight toward cursor
              const gx = Math.round(x * 100);
              const gy = Math.round(y * 100);
              // Weaken the highlight a bit
              glow.style.background = `radial-gradient( circle at ${gx}% ${gy}%, rgba(255,255,255,0.16), rgba(255,255,255,0.05) 14%, rgba(255,255,255,0.0) 34% )`;
              if (!raf) raf = requestAnimationFrame(apply);
            }

            function onEnter() {
              if (isSuspended()) return;
              hovered = true;
              card.style.zIndex = '2';
              glow.style.opacity = '1';
              ground.style.opacity = '0.24';
              if (!raf) raf = requestAnimationFrame(apply);
            }
            function onLeave() {
              hovered = false;
              targetRX = 0; targetRY = 0;
              card.style.zIndex = '';
              glow.style.opacity = '0';
              ground.style.opacity = '0';
              if (!raf) raf = requestAnimationFrame(apply);
            }

            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseenter', onEnter);
            card.addEventListener('mouseleave', onLeave);
          });
        }

        if (reduceMotion) return; // Skip animation

        // Invert & Play
        const items = Array.from(grid.children);
        // Prepare initial states (slide-only, no fade)
        items.forEach((el, idx) => {
          const id = el.getAttribute('data-id');
          const rect = el.getBoundingClientRect();
          const before = id ? prev.get(id) : null;
          el.style.transition = 'none';
          if (before) {
            const dx = before.left - rect.left;
            const dy = before.top - rect.top;
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.__delay = 0; // no stagger for moved items
          } else {
            // New item: slight slide-in only, no scale
            el.style.transform = 'translate(0, 12px)';
            el.__delay = Math.min(idx * 24, 180); // stagger up to ~180ms
          }
        });

        // Next frame, animate to identity
        requestAnimationFrame(() => {
          items.forEach(el => {
            const delay = el.__delay || 0;
            // Slide-only transition (no opacity fade)
            el.style.transition = `transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`;
            el.style.transform = 'translate(0px, 0px)';
          });
          // Cleanup helper
          setTimeout(() => {
            items.forEach(el => {
              el.style.transition = '';
              el.style.transform = '';
              delete el.__delay;
            });
          }, 600);
        });
      }

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          // Close any open detail overlay with a fade when switching tabs
          const openOverlay = content.querySelector('.store-detail-overlay');
          if (openOverlay) {
            openOverlay.style.opacity = '0';
            setTimeout(() => openOverlay.remove(), 220);
          }
          render(btn.dataset.filter || 'all');
        });
      });

      render('all');
    })();

    // removed: global mute-only control (desktop uses volume slider; mobile uses mute-only below)

    // Shopping music: random track rotation with mute
    (function setupStoreMusic() {
      const tracks = [
        'goldentime.mp3',
        'meadowtronic.mp3',
        'checkmiiout.mp3',
        //'puzzle.mp3',
        'slideshow.mp3',
        'que.mp3',
        'losangeles.mp3'
      ];
      const audio = new Audio();
      audio.volume = 0.3;
      audio.preload = 'auto';

      // maintain current index in this session
      let currentIdx = null;
      const WINDOW = Math.max(1, Math.min(4, tracks.length - 1));

      function pickNextIndex(prevIdx) {
        // Build candidate list excluding recent history (up to WINDOW)
        const recentSet = new Set(storeMusicState.recent.slice(-WINDOW));
        const candidates = [];
        for (let i = 0; i < tracks.length; i++) {
          if (!recentSet.has(i)) candidates.push(i);
        }
        // If no candidates (e.g., very short list), allow all except prevIdx when possible
        let pool = candidates.length ? candidates : [...Array(tracks.length).keys()];
        if (pool.length > 1 && typeof prevIdx === 'number') {
          pool = pool.filter(i => i !== prevIdx);
        }
        const i = pool[Math.floor(Math.random() * pool.length)];
        return i;
      }

      function notePlayed(idx) {
        storeMusicState.lastIndex = idx;
        storeMusicState.recent.push(idx);
        while (storeMusicState.recent.length > WINDOW) storeMusicState.recent.shift();
      }

      function playIndex(idx) {
        currentIdx = idx;
        notePlayed(idx);
        audio.src = tracks[idx];
        audio.currentTime = 0;
        audio.play().catch(() => {/* autoplay may be blocked until user interacts */});
      }

      function playNext() {
        const nextIdx = pickNextIndex(currentIdx);
        playIndex(nextIdx);
      }

      // Start playback after the Store has finished loading (spinner hidden),
      // then wait a tiny delay to avoid jank. Fallback to immediate timer if no promise.
      const startMusic = () => {
        const startIdx = pickNextIndex(storeMusicState.lastIndex);
        playIndex(startIdx);
      };
      const ready = content.__storeReadyPromise;
      if (ready && typeof ready.then === 'function') {
        ready.then(() => setTimeout(startMusic, 50));
      } else {
        setTimeout(startMusic, 50);
      }
      audio.addEventListener('ended', playNext);

      // Bind audio controls into bottom bar
      const controlsWrap = content.querySelector('.store-audio-wrap');
      if (!controlsWrap) return;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'store-audio-btn';
      toggleBtn.title = 'Toggle store music';
      const img = document.createElement('img');
      // Icons: when muted -> muteon.png, when unmuted -> muteoff.png
      const ICON_MUTED = 'muteon.png';
      const ICON_UNMUTED = 'muteoff.png';
      function updateIcon() {
        img.src = audio.muted ? ICON_MUTED : ICON_UNMUTED;
        img.alt = audio.muted ? 'Music Off' : 'Music On';
      }
      updateIcon();
      toggleBtn.appendChild(img);

      // Desktop: add volume slider first (so mute is to the right)
      if (!isMobile) {
        const vol = document.createElement('input');
        vol.type = 'range';
        vol.className = 'store-volume';
        vol.min = '0';
        vol.max = '1';
        vol.step = '0.05';
        vol.value = String(audio.volume);
        vol.addEventListener('input', () => {
          const v = parseFloat(vol.value);
          audio.volume = isNaN(v) ? 0.5 : Math.max(0, Math.min(1, v));
          if (audio.volume === 0) {
            audio.muted = true;
          } else if (audio.muted) {
            audio.muted = false;
          }
          updateIcon();
        });
        controlsWrap.appendChild(vol);
      }

      // Append mute button last (right of slider on desktop, only control on mobile)
      controlsWrap.appendChild(toggleBtn);

      // Toggle mute on click
      toggleBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateIcon();
      });

      // Fade out helper used on close/removal
      function fadeOutAndCleanup(duration = 800) {
        const startVol = audio.muted ? 0 : audio.volume;
        // If already silent, just stop immediately
        if (startVol <= 0) {
          audio.pause();
          audio.src = '';
          if (controlsWrap && controlsWrap.parentNode) controlsWrap.remove();
          return;
        }
        const steps = 20;
        const stepDur = Math.max(16, duration / steps);
        let step = 0;
        const wasMuted = audio.muted;
        audio.muted = false; // ensure fade is audible
        function tick() {
          step += 1;
          const v = Math.max(0, startVol * (1 - step / steps));
          audio.volume = v;
          // reflect on slider if present
          const volEl = controlsWrap && controlsWrap.querySelector('.store-volume');
          if (volEl) volEl.value = String(v);
          if (step < steps) {
            setTimeout(tick, stepDur);
          } else {
            audio.pause();
            audio.src = '';
            // restore prior mute state and volume for next open session
            audio.volume = startVol;
            audio.muted = wasMuted;
            if (controlsWrap && controlsWrap.parentNode) controlsWrap.remove();
          }
        }
        tick();
      }

      // Pause music when this Store window is closed
      const closeBtn = win.querySelector('.window-header button');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          fadeOutAndCleanup(800);
        }, { once: true });
      }

      // Also observe removal of the window node as a fallback
      const obs = new MutationObserver(() => {
        if (!document.body.contains(win)) {
          fadeOutAndCleanup(600);
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    })();

  
  } else if (title === "GOODTRIP") {
    // Desktop default; mobile sizing handled by positionAndClampOnSpawn()
    if (!isMobile) {
      win.style.width = '900px';
      win.style.height = '600px';
    }
    content.innerHTML = `
      <style>
        .goodtrip-layout {
          display: flex;
          height: 100%;
          overflow: hidden;
          background: url('graffitibg.gif') no-repeat center center;
          background-size: cover;
        }
    
        /* Mobile: stack columns to avoid overlap */
        @media (max-width: 760px) {
          .goodtrip-layout { flex-direction: column; }
          .goodtrip-left { width: 100%; min-width: 0; max-width: none; height: auto; }
          .goodtrip-right { width: 100%; padding-top: 0; }
          .goodtrip-separator { display: none !important; }
          .left-inner { height: auto; }
        }

        .goodtrip-left {
          width: 320px;
          min-width: 250px;
          max-width: 70%;
          height: 100%;
          background: url('brickwall.jpeg') no-repeat center center;
          background-size: cover;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          user-select: none;
          flex-shrink: 0;
        }
    
        .left-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }
    

    
        .goodtrip-right {
          padding: 0; /* horizontal padding off */
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;
          text-shadow: 0 0 4px #000;
          scrollbar-gutter: stable;
        }

        
        .track-description#goodtrip-info-display {
          background: white;
          color: #000;
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          font-family: "Segoe UI", sans-serif;
          font-size: 14px;
          padding: 12px 16px;
          margin-top: 20px;
          max-width: 300px;
          text-align: left;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }        

        /* Box for platform icons styled like the track info box */
        .platform-box {
          background: white;
          color: #000;
          border: 1px solid rgba(0, 0, 0, 0.2);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          font-family: "Segoe UI", sans-serif;
          font-size: 14px;
          padding: 12px 16px;
          margin-top: 40px; /* push it lower */
          max-width: 300px;
          width: 100%;
          text-align: center;
          border-radius: 4px;
        }

        .platform-box .platform-icons {
          margin-top: 4px;
        }

        /* Platform icons layout (panel look is provided by .platform-box) */
        .platform-icons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          max-width: 100%;
          margin-left: auto;
          margin-right: auto;
        }
        .platform-icons .platform-icon {
          width: 28px;
          height: 28px;
          object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
        }
        .platform-icons a { display: inline-flex; }
    
        .lcd-display,
        .lcd-track-info {
          width: 100%;
          height: 36px;
          background: #111;
          color: #0f0;
          font-family: 'Courier New', monospace;
          font-size: 1.2em;
          padding: 6px 12px;
          border: 2px inset #0f0;
          overflow: hidden;
          position: relative;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-shadow: 0 0 6px #0f0;
          flex-shrink: 0;
        }
    
        #scrolling-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          pointer-events: none;
          will-change: transform;
        }
    
        .scrolling-wrapper {
          display: flex;
          animation: scroll-left 10s linear infinite;
          will-change: transform;
        }
    
        .scrolling-wrapper span {
          display: inline-block;
          padding-right: 120px;
          white-space: nowrap;
        }
    
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
    
        .cassette-wrapper {
          width: 100%;
          display: flex;
          justify-content: center;
          position: relative;
        }
    
        .cassette-image {
          width: 100%;
          max-width: 320px;
          min-width: 280px;
          height: auto;
          display: block;
          filter: drop-shadow(0 7px 10px rgba(0, 0, 0, 0.7));
        }
    
        .album-cover {
          margin-top: 0;
          width: 100%;
          max-width: 300px;
          margin-bottom: 20px;
          box-shadow: 0 0 15px rgba(0,0,0,0.8);
          border-radius: 0;
          display: block;
          image-rendering: auto !important;
          cursor: zoom-in;
          transition: box-shadow 0.2s ease;
        }
    
        .album-cover:hover {
          box-shadow: 0 0 25px rgba(0, 0, 0, 1.2);
        }
    
        .lcd-volume {
          width: 95px;
          height: 38px;
          background: #111;
          border: 2px inset #0f0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 6px;
          margin-top: 15px;
          padding: 4px 0;
          text-shadow: 0 0 6px #0f0;
          flex-shrink: 0;
        }
    
        .lcd-volume .bar {
          width: 6px;
          background: #030;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
        }
    
        .lcd-volume .bar[data-level="1"] { height: 12px; }
        .lcd-volume .bar[data-level="2"] { height: 18px; }
        .lcd-volume .bar[data-level="3"] { height: 24px; }
        .lcd-volume .bar[data-level="4"] { height: 30px; }
        .lcd-volume .bar[data-level="5"] { height: 36px; }
    
        .lcd-volume .bar.active {
          background: #0f0;
          box-shadow: 0 0 6px #0f0;
        }
        
        /* Windows 7–style scrollbar for goodtrip-right */
        .goodtrip-right::-webkit-scrollbar {
          width: 16px;
          height: 16px;
        }
        
        .goodtrip-right::-webkit-scrollbar-track {
          background: #e1e1e1;
          border: 1px solid #cfcfcf;
        }
        
        .goodtrip-right::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a6a6a6, #7a7a7a);
          border: 1px solid #6e6e6e;
          border-radius: 8px;
        }
        
        .goodtrip-right::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #8e8e8e, #5f5f5f);
          border: 1px solid #5a5a5a;
        }
        
        /* For Firefox */
        .goodtrip-right {
          scrollbar-width: thin;
          scrollbar-color: #7a7a7a #e1e1e1;
        }
        
        .goodtrip-logo-wrapper {
          position: sticky;
          top: 0;
          width: 100%;
          height: 50px; /* height of the shadow area */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
        }
        
        .goodtrip-logo {
          padding-top: 72px;
          max-height: 155px;
          width: auto;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 11;
        }
        
        .goodtrip-logo-shadow {
          left: 0px;
          position: absolute;
          top: 0;
          left: 0;
          height: 180px;
          width: 120%;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 1.1), transparent);
          z-index: 10;
        }

        
        .goodtrip-content-inner {
          padding: 20px 20px 20px 20px; /* room for logo + shadow */
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        #goodtrip-info-display.default-info {
          color: #666;
          font-weight: normal;
          font-style: italic;
        }    
        
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .goodtrip-layout {
            flex-direction: column;
            height: 100vh;
            min-height: 100%;
            display: flex;
            flex-wrap: nowrap;
          }

          .goodtrip-left {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            height: fit-content;
            min-height: 200px;
            flex-shrink: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding-bottom: 20px;
          }

          .goodtrip-right {
            width: 100%;
            height: fit-content;
            min-height: 200px;
            flex-grow: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding-top: 20px;
          }

          .left-inner {
            padding: 10px;
            overflow-y: auto;
            height: 100%;
          }
        }

      </style>
    
      <div class="goodtrip-layout">
        <div class="goodtrip-left">
          <div class="left-inner">
            <div class="lcd-display">
              <span id="goodtrip-track-title">Use cassette controls to play</span>
              <div id="scrolling-container">
                <div class="scrolling-wrapper">
                  <span id="scroll-text1"></span>
                  <span id="scroll-text2"></span>
                </div>
              </div>
            </div>
    
            <div class="cassette-wrapper">
              <div class="cassette-inner">
                <img
                  id="goodtrip-cassette-img"
                  src="tape.png"
                  alt="Cassette Player"
                  class="cassette-image"
                />
    
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  class="cassette-overlay">
                  <rect id="goodtrip-rewind" x="38" y="75" width="12" height="12" fill="rgba(0,0,255,0.0)" pointer-events="auto" />
                  <rect id="goodtrip-play" x="26" y="75" width="12" height="12" fill="rgba(0,255,0,0.0)" pointer-events="auto" />
                  <rect id="goodtrip-pause" x="74" y="75" width="12" height="12" fill="rgba(255,255,0,0.0)" pointer-events="auto" />
                  <rect id="goodtrip-forward" x="50" y="75" width="12" height="12" fill="rgba(255,0,0,0.0)" pointer-events="auto" />
                </svg>
              </div>
            </div>
    
            <div class="lcd-volume" id="volume-control">
              <span class="bar" data-level="1"></span>
              <span class="bar" data-level="2"></span>
              <span class="bar" data-level="3"></span>
              <span class="bar" data-level="4"></span>
              <span class="bar" data-level="5"></span>
            </div>
          </div>
        </div>
    

    
        <div class="goodtrip-right">
          <div class="goodtrip-logo-wrapper">
            <img src="goodtrip-logo.png" alt="GOODTRIP Logo" class="goodtrip-logo" />
            <div class="goodtrip-logo-shadow"></div>
          </div>
        
          <div class="goodtrip-content-inner">
            <img
              src="goodtrip.webp"
              alt="GOODTRIP Album Cover"
              class="album-cover"
              onclick="openAlbumModal()"
            />
        
            <div class="track-description" id="goodtrip-info-display" style="display:none">
              <strong>GOODTRIP</strong>
            </div>

            <div class="platform-box">
              <div class="platform-icons">
                <a href="https://open.spotify.com/album/2AOE6VeeBrTjAco9KYWeDC?si=2fe7b5b2a6c64891" target="_blank">
                  <img src="spotify-icon.webp" alt="Spotify" class="platform-icon" />
                </a>
                <a href="https://music.apple.com/gb/album/goodtrip/1785658586" target="_blank">
                  <img src="applemusic-logo.png" alt="Apple Music" class="platform-icon" />
                </a>
                <a href="https://bandcamp.com" target="_blank">
                  <img src="bandcamp-icon.png" alt="Bandcamp" class="platform-icon" />
                </a>
              </div>
            </div>

          </div>
        
          <audio id="goodtrip-audio" src=""></audio>
        </div>

      </div>
    `;
    
    win.classList.add('no-padding');
    
    ['goodtrip-rewind', 'goodtrip-play', 'goodtrip-pause', 'goodtrip-forward'].forEach(id => {
      const btn = content.querySelector(`#${id}`);
      if (btn) btn.style.cursor = 'pointer';
    });
    
    const cassetteImg = content.querySelector('#goodtrip-cassette-img');
    
    const cassetteImages = {
      default: "tape.png",
      playing: "tapeplay.png",
      paused: "tapepause.png"
    };
    
    const playlist = [
      { title: "Track 1/17 - directions", src: "https://files.catbox.moe/yyizqi.mp3" },
      { title: "Track 2/17 - apple", src: "https://files.catbox.moe/2xvo23.mp3" },
      { title: "Track 3/17 - heart", src: "https://files.catbox.moe/mgyaax.mp3" },
      { title: "Track 4/17 - dreams", src: "https://files.catbox.moe/kbyzez.mp3" },
      { title: "Track 5/17 - lose me", src: "https://files.catbox.moe/6lv20o.mp3" },
      { title: "Track 6/17 - give it", src: "https://files.catbox.moe/etr2l4.mp3" },
      { title: "Track 7/17 - let u down", src: "https://files.catbox.moe/zjytw9.mp3" },
      { title: "Track 8/17 - bongs", src: "https://files.catbox.moe/102c79.mp3" },
      { title: "Track 9/17 - 2me", src: "https://files.catbox.moe/x3czyn.mp3" },
      { title: "Track 10/17 - gut drum", src: "https://files.catbox.moe/qnuabw.mp3" },
      { title: "Track 11/17 - keeplovin", src: "https://files.catbox.moe/x5kti8.mp3" },
      { title: "Track 12/17 - goldenlove", src: "https://files.catbox.moe/cqjl0g.mp3" },
      { title: "Track 13/17 - here now", src: "https://files.catbox.moe/b6wpy5.mp3" },
      { title: "Track 14/17 - mood09", src: "https://files.catbox.moe/r4iyxy.mp3" },
      { title: "Track 15/17 - my soul", src: "https://files.catbox.moe/6w7dbp.mp3" },
      { title: "Track 16/17 - grapes", src: "https://files.catbox.moe/t17auq.mp3" },
      { title: "Track 17/17 - destinations", src: "https://files.catbox.moe/5bilr0.mp3" }
    ];
    
    const trackInfoMap = {
      "Track 1/17 - directions": "<strong>directions</strong> - One of my personal favourites off the tape. <i>Samples 'Where Can I Go?' by Marlena Shaw.</i>",
      "Track 2/17 - apple": "Description",
      "Track 3/17 - heart": "Description",
      "Track 4/17 - dreams": "Description"
    };
    
    const infoDisplay = content.querySelector('#goodtrip-info-display');
    infoDisplay.textContent = "Track info";
    infoDisplay.classList.add("default-info");
    
    let currentTrack = 0;
    let playlistEnded = false;
    const audio = content.querySelector('#goodtrip-audio');
    const titleDisplay = content.querySelector('#goodtrip-track-title');
    const scrollContainer = content.querySelector('#scrolling-container');
    const scrollText1 = content.querySelector('#scroll-text1');
    const scrollText2 = content.querySelector('#scroll-text2');
    
    let scrollPos = 0;
    let textWidth = 0;
    let animationFrameId = null;
    
    function stopScrolling() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    
    function startScrolling(text) {
      stopScrolling();
    
      scrollText1.textContent = text;
      scrollText2.textContent = text;
    
      const wrapperDiv = scrollContainer.querySelector('.scrolling-wrapper');
    
      setTimeout(() => {
        const span1Width = scrollText1.offsetWidth;
        const spacing = 80;
        textWidth = span1Width + spacing;
        scrollPos = 0;
    
        function step() {
          scrollPos += 1.2;
          if (scrollPos >= textWidth) {
            scrollPos = 0;
          }
    
          wrapperDiv.style.transform = `translateX(${-scrollPos}px)`;
    
          // CRT flicker effect (optional)
          const flicker = 0.92 + Math.random() * 0.08;
          // scrollContainer.style.opacity = flicker.toFixed(2);
    
          animationFrameId = requestAnimationFrame(step);
        }
    
        animationFrameId = requestAnimationFrame(step);
      }, 0);
    }

    
    function updateDisplay(text, scroll = false) {
      if (scroll) {
        titleDisplay.style.display = 'none';
        scrollContainer.style.display = 'flex';
        startScrolling(text);
      } else {
        stopScrolling();
        scrollContainer.style.opacity = '1';
        scrollContainer.style.display = 'none';
        titleDisplay.style.display = 'inline-block';
        titleDisplay.textContent = text;
      }
    }

    function updateTrack(index) {
      currentTrack = index;
      const track = playlist[currentTrack];
      audio.src = track.src;
      audio.play();
    
      updateDisplay(`Now Playing: ${track.title}`, true); // Left side scroll
      const info = trackInfoMap[track.title] || 'Now playing...';
      typeText(infoDisplay, info);
    
      cassetteImg.src = cassetteImages.playing;
      playlistEnded = false;
      infoDisplay.classList.remove("default-info");
    }

    // Button controls
    content.querySelector('#goodtrip-play').addEventListener('click', () => {
      const playSound = document.getElementById('goodtrip-play-sound');
      if (playSound) {
        playSound.currentTime = 0;
        playSound.play();
      }
    
      setTimeout(() => {
        infoDisplay.classList.remove("default-info");
    
        if (playlistEnded) {
          currentTrack = 0;
          updateTrack(currentTrack);
        } else if (!audio.src || audio.src === window.location.href) {
          updateTrack(currentTrack);
        } else if (audio.paused) {
          audio.play();
          updateDisplay(`Now Playing: ${playlist[currentTrack].title}`, true);
          const info = trackInfoMap[playlist[currentTrack].title] || 'Now playing...';
          typeText(infoDisplay, info); // always animate when unpausing
          cassetteImg.src = cassetteImages.playing;
        }
      }, 120);
    });


    
    content.querySelector('#goodtrip-pause').addEventListener('click', () => {
      const pauseSound = document.getElementById('goodtrip-pause-sound');
      if (pauseSound) {
        pauseSound.currentTime = 0;
        pauseSound.play();
      }
    
      setTimeout(() => {
        audio.pause();
        updateDisplay('Paused', false);
        if (currentTypeInterval) clearTimeout(currentTypeInterval);
        infoDisplay.innerHTML = "Track info";
        infoDisplay.classList.add("default-info");
        cassetteImg.src = cassetteImages.paused;
      }, 100);
    });



    
    content.querySelector('#goodtrip-rewind').addEventListener('click', () => {
      if (playlistEnded) playlistEnded = false;
      currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
      updateTrack(currentTrack);
    });
    
    content.querySelector('#goodtrip-forward').addEventListener('click', () => {
      if (playlistEnded) playlistEnded = false;
      currentTrack = (currentTrack + 1) % playlist.length;
      updateTrack(currentTrack);
    });
    
    audio.addEventListener('ended', () => {
      if (currentTrack < playlist.length - 1) {
        currentTrack++;
        updateTrack(currentTrack);
      } else {
        playlistEnded = true;
        updateDisplay('Playback finished', false); // Left LCD
        infoDisplay.innerHTML = '<strong>GOODTRIP</strong>'; // Right LCD
        cassetteImg.src = cassetteImages.default;
      }
    });

    function setupCassetteClickSounds() {
      const sounds = {
        play: document.getElementById('goodtrip-play-sound'),
        pause: document.getElementById('goodtrip-pause-sound'),
        click: document.getElementById('goodtrip-click')
      };
    
      const btnMap = {
        'goodtrip-play': sounds.play,
        'goodtrip-pause': sounds.pause,
        'goodtrip-forward': sounds.click,
        'goodtrip-rewind': sounds.click
      };
    
      Object.entries(btnMap).forEach(([id, sound]) => {
        const btn = content.querySelector(`#${id}`);
        if (btn && sound) {
          btn.addEventListener('click', () => {
            sound.currentTime = 0;
            sound.play().catch(err => console.warn("Sound play failed:", err));
          });
        }
      });
    }
    
    function setupVolumeControl() {
      const bars = Array.from(content.querySelectorAll('#volume-control .bar'));
    
      function updateBars(level) {
        bars.forEach(bar => {
          const barLevel = parseInt(bar.dataset.level, 10);
          bar.classList.toggle('active', barLevel <= level);
        });
      }
    
      bars.forEach((bar, idx) => {
        bar.addEventListener('click', () => {
          const level = idx + 1;
          const volume = level / bars.length;
          audio.volume = volume;
          updateBars(level);
        });
      });
    
      // Initial state: 80% volume
      audio.volume = 0.8;
      updateBars(4);
    }
    
    setupCassetteClickSounds();
    setupVolumeControl();
    
    // Move info display to the left on mobile, and remove volume control
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const volumeControl = content.querySelector('#volume-control');
      if (volumeControl) volumeControl.remove();
    
      const infoDisplay = content.querySelector('#goodtrip-info-display');
      const leftInner = content.querySelector('.left-inner');
      if (infoDisplay && leftInner) {
        leftInner.appendChild(infoDisplay);
        infoDisplay.style.marginTop = '20px';
        infoDisplay.style.maxWidth = '100%';
      }
    }



  } else if (title === "Whodunit?") {
    if (!isMobile) {
      win.style.width = '760px';
      win.style.height = '520px';
    }
    content.innerHTML = `
      <style>
        .whodunit-stage {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000; /* fill with black */
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          perspective: 1200px; /* for 3D door swing */
          /* subtle CRT scanline feel */
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.02) 0px,
            rgba(255,255,255,0.02) 1px,
            transparent 1px,
            transparent 3px
          );
        }

        /* White void behind the door */
        .whodunit-void {
          position: absolute;
          width: min(50%, 420px);
          height: min(60%, 360px);
          background: #fff;
          box-shadow:
            0 0 28px 8px rgba(255,255,255,0.5),
            0 0 72px 16px rgba(255,255,255,0.25),
            inset 0 0 60px rgba(255,255,255,0.9);
          transition: box-shadow 300ms ease;
        }
        /* Stronger glow when door opens */
        .whodunit-stage.open .whodunit-void {
          box-shadow:
            0 0 70px 20px rgba(255,255,255,0.95),
            0 0 200px 40px rgba(255,255,255,0.55),
            inset 0 0 120px rgba(255,255,255,1);
        }

        /* Door assembly */
        .whodunit-door {
          position: relative;
          width: min(50%, 420px);
          height: min(60%, 360px);
          display: flex;
          transform-style: preserve-3d;
          cursor: pointer; /* door only is clickable */
          z-index: 4; /* below hint/overlay */
        }

        /* Hover hint */
        .whodunit-hint {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-weight: 800;
          font-size: clamp(10px, 3.6vw, 28px);
          letter-spacing: 0.5px;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 0 10px rgba(63, 63, 63, 0.32), 0 4px 0 rgba(0,0,0,0.8);
          opacity: 0;
          transition: opacity 160ms ease;
          pointer-events: none; /* allow clicks to pass */
          /* Sharper pixel-like look */
          -webkit-font-smoothing: none;
          -moz-osx-font-smoothing: auto;
          font-smooth: never;
          text-rendering: optimizeSpeed;
          image-rendering: pixelated;
          z-index: 6; /* above overlay and door */
        }
        .whodunit-door:hover + .whodunit-hint,
        .whodunit-door:hover .whodunit-hint,
        .whodunit-door:hover ~ .whodunit-hint { opacity: 1; }
        .whodunit-stage.open .whodunit-hint { opacity: 0; }

        .door-half {
          flex: 1 1 50%;
          /* retro pixelated plank look */
          /* remove visible stripes; keep subtle pixel texture */
          background:
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect width='1' height='1' fill='rgba(255,255,255,0.04)'/><rect x='1' y='1' width='1' height='1' fill='rgba(0,0,0,0.06)'/></svg>") repeat,
            linear-gradient(#3a2516, #3a2516);
          background-size: 2px 2px, auto;
          border: 2px solid #5a4433;
          /* stacked hard-edged shadows for a pixel-y outline */
          box-shadow:
            0 0 0 2px rgba(255,255,255,0.05) inset,
            0 0 0 4px rgba(0,0,0,0.2) inset,
            0 8px 0 rgba(0,0,0,0.4);
          transform-origin: center left;
          transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          image-rendering: pixelated;
          border-radius: 0; /* no rounding for retro look */
        }
        .door-half.right { transform-origin: center right; }

        /* Simple paneling effect */
        .door-half::before,
        .door-half::after {
          content: "";
          position: absolute;
          left: 10%; right: 10%;
          border: 1px solid rgba(0,0,0,0.35);
          background: rgba(255,255,255,0.04);
        }
        .door-half::before { top: 14%; height: 28%; }
        .door-half::after  { bottom: 14%; height: 28%; }

        /* Handles */
        .handle {
          position: absolute;
          top: 50%;
          width: 12px; height: 12px;
          background: radial-gradient(circle at 30% 30%, #f8e7a8, #c9a64f 60%, #8a6b2a);
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(0,0,0,0.6);
          transform: translateY(-50%);
          image-rendering: pixelated;
        }
        .left .handle { right: 8%; }
        .right .handle { left: 8%; }

        /* Open state */
        .whodunit-stage.open .door-half.left  { transform: rotateY(-100deg); }
        .whodunit-stage.open .door-half.right { transform: rotateY(100deg); }

        /* Retro overlay above content for CRT/pixel vibe */
        .retro-overlay {
          position: absolute;
          inset: 0;
          z-index: 5; /* above door, below hint */
          pointer-events: none;
          /* multiple layered effects: scanlines + vignette + dither */
          background-image:
            /* scanlines */
            repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.06) 0px,
              rgba(255,255,255,0.06) 1px,
              rgba(0,0,0,0.0) 1px,
              rgba(0,0,0,0.0) 3px
            ),
            /* subtle vignette */
            radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%),
            /* tiny checker dither */
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect width='1' height='1' fill='rgba(255,255,255,0.05)'/><rect x='1' y='1' width='1' height='1' fill='rgba(255,255,255,0.05)'/></svg>");
          background-size: auto, auto, 2px 2px;
          mix-blend-mode: overlay;
          opacity: 0.35;
        }
      </style>

      <div id="whodunit-stage" class="whodunit-stage" aria-label="Open the door">
        <div class="whodunit-void" aria-hidden="true"></div>
        <div class="retro-overlay" aria-hidden="true"></div>
        <div class="whodunit-door">
          <div class="door-half left"><span class="handle"></span></div>
          <div class="door-half right"><span class="handle"></span></div>
          <div class="whodunit-hint">Open?</div>
        </div>
      </div>
    `;

    // Remove padding/scroll to ensure full-bleed
    content.style.padding = '0';
    content.style.overflow = 'hidden';

    // Feature flag: lock the Whodunit door for now (keep open logic intact for future)
    const WHODUNIT_LOCKED = true;

    // Click to open, then redirect after animation completes
    const preSaveUrl = 'https://share.amuse.io/VbMvlRPQelae'; 
    const stageEl = content.querySelector('#whodunit-stage');
    const doorEl = content.querySelector('.whodunit-door');
    const rightHalf = content.querySelector('.door-half.right');
    const hintEl = content.querySelector('.whodunit-hint');
    let opened = false;
    function triggerOpenAndRedirect() {
      if (opened) return;
      opened = true;
      // Attempt to open a blank tab/window synchronously during user gesture
      let popup = null;
      try { popup = window.open('', '_blank'); } catch {}
      // Play door open sound (inline, simple)
      try { const s = new Audio('dooropen.mp3'); s.play().catch(()=>{}); } catch {}
      stageEl.classList.add('open');
      // After the right panel finishes its (shorter) transition, navigate
      const handler = (e) => {
        if (e.propertyName !== 'transform') return;
        rightHalf.removeEventListener('transitionend', handler);
        // If popup opened, navigate it; otherwise fallback to same-tab navigation
        if (popup && !popup.closed) {
          try { popup.location.href = preSaveUrl; return; } catch {}
        }
        window.location.href = preSaveUrl;
      };
      rightHalf.addEventListener('transitionend', handler);
    }
    // Apply lock behavior now; preserve open logic for future
    if (WHODUNIT_LOCKED) {
      if (hintEl) hintEl.textContent = 'Locked';
      if (doorEl) { doorEl.style.cursor = 'not-allowed'; doorEl.setAttribute('aria-disabled', 'true'); }
      if (stageEl) stageEl.setAttribute('aria-label', 'Locked door');
      // Swallow click/touch to prevent opening
      doorEl?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); });
      doorEl?.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); }, { passive: false });
    } else {
      // Click and touch to open (ensure mobile reliability)
      doorEl.addEventListener('click', triggerOpenAndRedirect, { once: true });
      doorEl.addEventListener('touchend', (e) => { e.preventDefault(); triggerOpenAndRedirect(); }, { once: true });
    }
  } else {
    content.innerHTML = `<p>This is the ${title} window.</p>`;
  }

  // Set default window size only if not already set by a window-specific block above
  // This avoids overriding sizes for windows like Music and Recycle Bin.
  if (!win.style.width || !win.style.height) {
    if (title === "Store") {
      // Desktop defaults only; mobile sizing handled by positionAndClampOnSpawn()
      if (!isMobile) {
        win.style.width = '700px';
        win.style.height = '500px';
      }
    } else if (title === "GOODTRIP") {
      // Desktop defaults only; mobile sizing handled by positionAndClampOnSpawn()
      if (!isMobile) {
        win.style.width = '960px';
        win.style.height = '640px';
      }
    } else if (title === "Whodunit?") {
      if (!isMobile) {
        win.style.width = '760px';
        win.style.height = '520px';
      }
    } else {
      win.style.width = isMobile ? '80vw' : '300px';
      win.style.height = isMobile ? '50vh' : '200px';
    }
  }

  const windowWidth = parseInt(win.style.width);
  const windowHeight = parseInt(win.style.height);
  const offsetRange = 30;

  function isMobilePortrait() {
    return /Mobi|Android/i.test(navigator.userAgent) && window.innerHeight > window.innerWidth;
  }
  
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 12; // prevent hugging edges
  
  let left = Math.max(padding, (vw - windowWidth) / 2 + (Math.random() - 0.5) * 20);
  let top = Math.max(padding, (vh - windowHeight) / 2 + (Math.random() - 0.5) * 20);
  
  // Clamp position within screen
  left = Math.min(left, vw - windowWidth - padding);
  top = Math.min(top, vh - windowHeight - padding);
  
  win.style.position = 'fixed';
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
  win.style.transform = ''; // clear translate transforms


  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const padding = 10; // margin from screen edge
  
    if (rect.right > window.innerWidth) {
      win.style.left = `${window.innerWidth - rect.width - padding}px`;
      win.style.transform = '';
    }
    if (rect.bottom > window.innerHeight) {
      win.style.top = `${window.innerHeight - rect.height - padding}px`;
      win.style.transform = '';
    }
    if (rect.left < 0) {
      win.style.left = `${padding}px`;
      win.style.transform = '';
    }
    if (rect.top < 0) {
      win.style.top = `${padding}px`;
      win.style.transform = '';
    }
  });


  // Mobile-specific layout fix for GOODTRIP window
  if (isMobile && title === "GOODTRIP") {
    const style = document.createElement('style');
    style.textContent = `
      .window-content {
        overflow-y: auto !important;
        height: 100% !important;
        padding: 0 !important; /* remove default content padding that creates a top gap */
        border-top: 0 !important; /* remove any top border between header and content */
        background: transparent !important; /* avoid light band from base background */
      }
  
      .goodtrip-layout {
        flex-direction: column !important;
        height: auto !important;
        max-height: none !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
      }
  
      .goodtrip-left,
      .goodtrip-right {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow-y: auto !important;
      }
  
      /* Hide any separator-like elements that could cause a light band */
      .goodtrip-layout hr,
      .goodtrip-layout .separator,
      .goodtrip-layout .goodtrip-separator { display: none !important; }

      /* Ensure first child in right pane doesn't push a gap */
      .goodtrip-right > *:first-child { margin-top: 0 !important; }
      .goodtrip-right .lcd-display, .goodtrip-right .lcd-track-info { margin-top: 0 !important; }
      .goodtrip-right { border-top: 0 !important; }

      /* Remove header dividing line/shadow for GOODTRIP on mobile */
      .window[data-title="GOODTRIP"] .window-header {
        border-bottom: 0 !important;
        box-shadow: none !important;
      }

      
  
      .left-inner {
        flex-direction: column !important;
      }
    `;
    document.head.appendChild(style);
  }



  win.style.zIndex = ++zIndex;

  const closeBtn = clone.querySelector('.window-header button');
  closeBtn.addEventListener('pointerup', (e) => {
    e.stopPropagation(); // Stop bubbling so drag doesn't start or focus happens
  
    playSound('sound-close');
  
    // Begin fading out any audio elements in this window
    const fadePromise = fadeOutAudiosIn(win, 800);

    win.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
  
    win.addEventListener('transitionend', () => {
      Promise.resolve(fadePromise).finally(() => {
        win.remove();
        removeTaskbarIcon(title);
      });
    }, { once: true });
  });

  makeDraggable(win);
  document.body.appendChild(win);
  // Clamp and center within desktop on spawn (especially for mobile)
  positionAndClampOnSpawn(win);

  animateWindowSpawn(win);
  setTimeout(() => { bringToFront(win); }, 0);
  addTaskbarIcon(title);
  // Play store open sound after DOM insertion (simple inline)
  if (title === 'Store') { try { const s = new Audio('storeopen.mp3'); s.play().catch(()=>{}); } catch {} }

  // Logo fade on scroll for any album with logo and shadow
  const rightPanel = content.querySelector('.goodtrip-right');
  const logo = content.querySelector('.goodtrip-logo');
  const backdrop = content.querySelector('.goodtrip-logo-shadow');
  if (rightPanel && logo && backdrop) {
    rightPanel.addEventListener('scroll', () => {
      const fadeEnd = 70;
      const scrollY = rightPanel.scrollTop;
      const opacity = Math.max(0, 1 - scrollY / fadeEnd);
      logo.style.opacity = opacity;
      backdrop.style.opacity = opacity;
    });
  }



  // Mobile-specific layout fix for all album windows
  if (isMobile) {
    const style = document.createElement('style');
    style.textContent = `
      .window[data-title="${title}"] .window-content {
        overflow-y: auto !important;
        height: 100% !important;
      }

      .window[data-title="${title}"] .goodtrip-layout {
        flex-direction: column !important;
        height: auto !important;
        max-height: none !important;
      }

      .window[data-title="${title}"] .goodtrip-left,
      .window[data-title="${title}"] .goodtrip-right {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow-y: auto !important;
      }



      .window[data-title="${title}"] .left-inner {
        flex-direction: column !important;
      }
    `;
    document.head.appendChild(style);
  }
}

function bringToFront(el) {
  el.style.zIndex = ++zIndex;

  // Remove "focused" class from all windows
  document.querySelectorAll('.window').forEach(win => {
    win.classList.remove('focused');
  });

  // Add "focused" to the current window
  el.classList.add('focused');
}

function makeDraggable(el) {
  const header = el.querySelector('.window-header');
  let offsetX = 0, offsetY = 0;
  let isDragging = false;

  header.style.touchAction = 'none';

  header.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;

    // Ignore if the pointerdown is on the close button or inside it
    if (e.target.closest('button')) {
      // Don't start dragging or bring to front
      return;
    }

    isDragging = true;
    offsetX = e.clientX - el.offsetLeft;
    offsetY = e.clientY - el.offsetTop;
    bringToFront(el);
    e.preventDefault();
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
  
    const desktop = document.getElementById('desktop');
    const bounds = desktop.getBoundingClientRect();
  
    const winWidth = el.offsetWidth;
    const winHeight = el.offsetHeight;
  
    let newLeft = e.clientX - offsetX;
    let newTop = e.clientY - offsetY;
  
    // Clamp window within desktop bounds
    newLeft = Math.max(0, Math.min(bounds.width - winWidth, newLeft));
    newTop = Math.max(0, Math.min(bounds.height - winHeight, newTop));
  
    el.style.left = `${newLeft}px`;
    el.style.top = `${newTop}px`;
  });


  window.addEventListener('pointerup', () => { isDragging = false; });
  window.addEventListener('pointercancel', () => { isDragging = false; });
}

// Ensure a newly spawned window is within the visible desktop and reasonably centered
function positionAndClampOnSpawn(el) {
  try {
    const desktop = document.getElementById('desktop');
    const bounds = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };

    // Apply a smaller default size on mobile before centering/clamping
    if (isMobile) {
      el.style.maxWidth = '92vw';
      el.style.maxHeight = '84vh';
      el.style.width = '78vw';
      el.style.height = '62vh';
    }

    // Initial center
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = Math.max(0, (bounds.width - w) / 2);
    let top = Math.max(0, (bounds.height - h) / 2);

    // Clamp inside bounds
    left = Math.min(left, Math.max(0, bounds.width - w));
    top = Math.min(top, Math.max(0, bounds.height - h));

    el.style.position = 'absolute';
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    // For mobile, add a small padding to avoid touching edges
    if (isMobile) {
      const pad = 6;
      const maxLeft = Math.max(0, bounds.width - el.offsetWidth - pad);
      const maxTop = Math.max(0, bounds.height - el.offsetHeight - pad);
      const newLeft = Math.min(Math.max(pad, parseFloat(el.style.left) || 0), maxLeft);
      const newTop = Math.min(Math.max(pad, parseFloat(el.style.top) || 0), maxTop);
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
    }
  } catch (_) {}
}

function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

document.querySelectorAll('.icon').forEach(icon => {
  const label = icon.querySelector('span').textContent;

  if (isMobile) {
    icon.addEventListener('click', () => openWindow(label));
  } else {
    let clickTimeout;

    icon.addEventListener('click', function (e) {
      if (!e.shiftKey && !e.ctrlKey) {
        document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
      }
      this.classList.add('selected');
      e.stopPropagation();

      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        clickTimeout = null;
      }, 250);
    });

    icon.addEventListener('dblclick', () => {
      const selected = document.querySelectorAll('.icon.selected');
      selected.forEach(el => {
        const lbl = el.querySelector('span').textContent;
        openWindow(lbl);
      });
    });
  }
});

document.getElementById('desktop').addEventListener('click', (e) => {
  if (e.target.id === 'desktop') {
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
  }
});

document.addEventListener('click', (e) => {
  const startMenu = document.getElementById('start-menu');
  const startButton = document.getElementById('start-button');
  if (!startMenu.contains(e.target) && !startButton.contains(e.target)) {
    startMenu.classList.add('hidden');
  }
});

if (!isMobile) {
  const selectionBox = document.getElementById('selection-box');
  let startX, startY;

  document.getElementById('desktop').addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';

    function onMouseMove(eMove) {
      const x = Math.min(eMove.clientX, startX);
      const y = Math.min(eMove.clientY, startY);
      const w = Math.abs(eMove.clientX - startX);
      const h = Math.abs(eMove.clientY - startY);

      selectionBox.style.left = `${x}px`;
      selectionBox.style.top = `${y}px`;
      selectionBox.style.width = `${w}px`;
      selectionBox.style.height = `${h}px`;

      document.querySelectorAll('.icon').forEach(icon => {
        const rect = icon.getBoundingClientRect();
        const inBox =
          rect.right > x &&
          rect.left < x + w &&
          rect.bottom > y &&
          rect.top < y + h;
        icon.classList.toggle('selected', inBox);
      });
    }

    function onMouseUp() {
      selectionBox.style.display = 'none';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function addTaskbarIcon(title) {
  const taskbar = document.getElementById('taskbar-apps');
  const icon = document.createElement('div');
  icon.className = 'taskbar-icon';
  icon.dataset.title = title;
  icon.title = title;

  let imgSrc = '';
  switch (title) {
    case 'GOODTRIP':
      imgSrc = 'goodtrip.png';
      break;
    case 'apple':
      imgSrc = 'applecover.webp';
      break;
    case 'iso':
      imgSrc = 'isocover.webp';
      break;
    case 'Store':
      imgSrc = 'storeicon.png';
      break;
    case 'Music':
      imgSrc = 'cdicon.gif';
      break;
    case 'Recycle Bin':
      imgSrc = 'recyclebin.png';
      break;
    case 'Whodunit?':
      imgSrc = 'bug.png';
      break;
    case 'demodisc_01':
      imgSrc = 'demodisc01.png';
      break;
    case 'Info':
      imgSrc = 'info.ico';
      break;
  }

  icon.innerHTML = `<img src="${imgSrc}" />`;

  // Set initial state for animation (hidden + small)
  icon.style.opacity = '0';
  icon.style.transform = 'scale(0.95)';
  icon.style.transition = 'none';

  taskbar.appendChild(icon);

  // Force reflow to ensure animation triggers
  void icon.offsetWidth;

  // Animate to visible state
  requestAnimationFrame(() => {
    icon.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    icon.style.opacity = '1';
    icon.style.transform = 'scale(1)';
  });

  icon.addEventListener('click', () => {
    const win = document.querySelector(`.window[data-title="${title}"]`);
    if (!win) return;
  
    if (win.style.display === 'none') {
      win.style.display = 'block';  // Show if hidden
    }
    bringToFront(win);  // Always focus and bring to front
  });
}


function removeTaskbarIcon(title) {
  const icon = document.querySelector(`.taskbar-icon[data-title="${title}"]`);
  if (!icon) return;

  // Start fade-out animation
  icon.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
  icon.style.opacity = '0';
  icon.style.transform = 'scale(0.95)';

  // Remove icon from DOM after animation
  icon.addEventListener('transitionend', () => {
    icon.remove();
  }, { once: true });
}

function animateWindowSpawn(win) {
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
    win.style.transition = 'none';

    // Force reflow
    void win.offsetWidth;

    // Trigger animation
    requestAnimationFrame(() => {
        win.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        win.style.opacity = '1';
        win.style.transform = 'scale(1)';
    });

    // Clean up after animation
    win.addEventListener('transitionend', () => {
        win.style.transition = '';
    }, { once: true });
}

document.addEventListener('click', (event) => {
  const isInWindow = event.target.closest('.window');
  const isInTaskbar = event.target.closest('#taskbar');

  if (!isInWindow && !isInTaskbar) {
    document.querySelectorAll('.window').forEach(win => {
      win.classList.remove('focused');
    });
  }
});


function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Some browsers block autoplay; optionally log or silently fail
    });
  }
}

// Start with loading state
document.body.classList.add('loading');

function dismissLoginOverlay() {
  const overlay = document.getElementById('login-screen');
  const audio = new Audio('https://files.catbox.moe/7tkpiy.mp3');
  audio.play();

  overlay.style.transition = 'opacity 0.5s ease';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';

  setTimeout(() => {
    overlay.remove(); // Fully remove it from the DOM
  }, 500);
}

window.addEventListener('load', () => {
  // Remove loading message
  const loadingMsg = document.getElementById('loading-message');
  if (loadingMsg) {
    loadingMsg.style.opacity = '0';
    setTimeout(() => {
      loadingMsg.remove();
    }, 500);
  }

  // Reveal login elements by switching class from loading → loaded
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
});

function openAlbumModal(coverSrc, downloadSrc) {
  const modal = document.getElementById('album-modal');
  if (!modal) return;

  // Play swoosh-in sound (use Howler if available for low-latency)
  try {
    if (window.Howl) {
      window.__swooshIn = window.__swooshIn || new Howl({ src: ['swooshin.wav'], volume: 1, html5: false, pool: 2 });
      window.__swooshIn.load();
      window.__swooshIn.play();
    } else {
      const a = new Audio('swooshin.wav');
      try { a.preload = 'auto'; } catch {}
      a.play().catch(()=>{});
    }
  } catch {}

  // Remove hidden class to show modal
  modal.classList.remove('hidden');
  
  // Add transition for smooth appearance
  modal.style.opacity = '0';
  modal.style.transition = 'opacity 0.2s ease';
  
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
  });

  // Set album cover image and download button
  const imgWrapper = modal.querySelector('.modal-image-wrapper img');
  const downloadBtn = modal.querySelector('.download-btn');
  
  if (imgWrapper && downloadBtn) {
    // Determine sources
    const defaultCover = 'goodtripcover-hq.jpg';
    const imgSrc = coverSrc || defaultCover;
    const dlSrc = downloadSrc || imgSrc;
    imgWrapper.src = imgSrc;
    downloadBtn.href = dlSrc;
    try {
      const a = new URL(dlSrc, window.location.href);
      const base = (a.pathname.split('/').pop() || 'download');
      downloadBtn.download = base;
    } catch {
      downloadBtn.download = 'download';
    }
    
    // Add click handler to ensure proper download
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const link = document.createElement('a');
      link.href = dlSrc;
      try {
        const a = new URL(dlSrc, window.location.href);
        link.download = (a.pathname.split('/').pop() || 'download');
      } catch {
        link.download = 'download';
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Apply primary button styling and hover effect to modal download button
    Object.assign(downloadBtn.style, {
      display: 'inline-block',
      padding: '10px 14px',
      borderRadius: '6px',
      border: '1px solid #0b5ed7',
      background: 'linear-gradient(#4da3ff,#1d76ff)',
      color: '#fff',
      textDecoration: 'none',
      fontWeight: '700',
      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      transition: 'transform .15s ease, box-shadow .15s ease, background .15s ease'
    });
    const hoverIn = () => {
      downloadBtn.style.background = 'linear-gradient(#5bb0ff,#2b82ff)';
      downloadBtn.style.transform = 'translateY(-1px)';
      downloadBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    };
    const hoverOut = () => {
      downloadBtn.style.background = 'linear-gradient(#4da3ff,#1d76ff)';
      downloadBtn.style.transform = 'none';
      downloadBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    };
    downloadBtn.addEventListener('mouseenter', hoverIn);
    downloadBtn.addEventListener('mouseleave', hoverOut);
  }
}

function closeAlbumModal() {
  const modal = document.getElementById('album-modal');
  if (modal) {
    // Play swoosh-out sound
    try {
      if (window.Howl) {
        window.__swooshOut = window.__swooshOut || new Howl({ src: ['swooshout.wav'], volume: 1, html5: false, pool: 2 });
        window.__swooshOut.load();
        window.__swooshOut.play();
      } else {
        const a = new Audio('swooshout.wav');
        try { a.preload = 'auto'; } catch {}
        a.play().catch(()=>{});
      }
    } catch {}
    modal.classList.add('hidden');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAlbumModal();
  }
});

let currentTypeInterval = null;

function typeText(el, html, speed = 18) {
  // Cancel any ongoing typing
  if (currentTypeInterval) clearTimeout(currentTypeInterval);

  el.innerHTML = ''; // Clear content
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const nodes = Array.from(temp.childNodes);

  function typeNode(parent, nodeList, nodeIndex = 0) {
    if (nodeIndex >= nodeList.length) return;

    const node = nodeList[nodeIndex];
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      let charIndex = 0;

      function typeChar() {
        if (charIndex < text.length) {
          parent.append(text[charIndex++]);
          currentTypeInterval = setTimeout(typeChar, speed);
        } else {
          typeNode(parent, nodeList, nodeIndex + 1);
        }
      }

      typeChar();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      parent.appendChild(clone);
      typeNode(clone, Array.from(node.childNodes), 0);
      currentTypeInterval = setTimeout(() => typeNode(parent, nodeList, nodeIndex + 1), 0);
    } else {
      typeNode(parent, nodeList, nodeIndex + 1);
    }
  }

  typeNode(el, nodes);
}

// --- Modular Album Configs ---
const albumConfigs = {
  GOODTRIP: {
    title: "GOODTRIP",
    playlist: [
      { title: "Track 1/17 - directions", src: "https://files.catbox.moe/yyizqi.mp3" },
      { title: "Track 2/17 - apple", src: "https://files.catbox.moe/2xvo23.mp3" },
      { title: "Track 3/17 - heart", src: "https://files.catbox.moe/mgyaax.mp3" },
      { title: "Track 4/17 - dreams", src: "https://files.catbox.moe/kbyzez.mp3" },
      { title: "Track 5/17 - lose me", src: "https://files.catbox.moe/6lv20o.mp3" },
      { title: "Track 6/17 - give it", src: "https://files.catbox.moe/etr2l4.mp3" },
      { title: "Track 7/17 - let u down", src: "https://files.catbox.moe/zjytw9.mp3" },
      { title: "Track 8/17 - bongs", src: "https://files.catbox.moe/102c79.mp3" },
      { title: "Track 9/17 - 2me", src: "https://files.catbox.moe/x3czyn.mp3" },
      { title: "Track 10/17 - gut drum", src: "https://files.catbox.moe/qnuabw.mp3" },
      { title: "Track 11/17 - keeplovin", src: "https://files.catbox.moe/x5kti8.mp3" },
      { title: "Track 12/17 - goldenlove", src: "https://files.catbox.moe/cqjl0g.mp3" },
      { title: "Track 13/17 - here now", src: "https://files.catbox.moe/b6wpy5.mp3" },
      { title: "Track 14/17 - mood09", src: "https://files.catbox.moe/r4iyxy.mp3" },
      { title: "Track 15/17 - my soul", src: "https://files.catbox.moe/6w7dbp.mp3" },
      { title: "Track 16/17 - grapes", src: "https://files.catbox.moe/t17auq.mp3" },
      { title: "Track 17/17 - destinations", src: "https://files.catbox.moe/5bilr0.mp3" }
    ],
    cassetteImages: {
      default: "tape.png",
      playing: "tapeplay.png",
      paused: "tapepause.png"
    },
    albumCover: "goodtrip.webp",
    logo: "goodtrip-logo.png",
    logoShadow: true,
    trackInfoMap: {
      "Track 1/17 - directions": "<strong>directions</strong> - One of my personal favourites off the tape. <i>Samples 'Where Can I Go?' by Marlena Shaw.</i>",
      "Track 2/17 - apple": "Description",
      "Track 3/17 - heart": "Description",
      "Track 4/17 - dreams": "Description"
    },
    platformLinks: [
      { href: "https://open.spotify.com/album/2AOE6VeeBrTjAco9KYWeDC?si=2fe7b5b2a6c64891", icon: "spotify-icon.webp", alt: "Spotify" },
      { href: "https://music.apple.com/gb/album/goodtrip/1785658586", icon: "applemusic-logo.png", alt: "Apple Music" },
      { href: "https://bandcamp.com", icon: "bandcamp-icon.png", alt: "Bandcamp" }
    ],
    background: "graffitibg.gif",
    leftBackground: "brickwall.jpeg",
    modal: true
  },
  demodisc_01: {
    title: "demodisc_01",
    playlist: [
      { title: "crackers", src: "crackers.mp3" },
      { title: "puzzle", src: "puzzle.mp3" },
      { title: "meadowtronic", src: "meadowtronic.mp3" },
      { title: "slideshow", src: "slideshow.mp3" },
      { title: "goldentime", src: "goldentime.mp3" }
    ],
    cassetteImages: {
      default: "cdicon.gif",
      playing: "cdhand.gif",
      paused: "cdicon.gif"
    },
    albumCover: "demodisccover.webp",
    modalCover: "demodisccover-hq.png",
    logo: "demodisclogo.png",
    logoShadow: true,
    trackInfoMap: {},
    platformLinks: [],
    background: "#ffffff",
    leftBackground: "redbrick.jpg",
    modal: true
  },
  apple: {
    title: "apple",
    playlist: [
      { title: "BF", src: "recyclebinmusic/BF.mp3" },
      { title: "INT", src: "recyclebinmusic/INT.mp3" }
    ],
    cassetteImages: {
      default: "tape.png",
      playing: "tapeplay.png",
      paused: "tapepause.png"
    },
    albumCover: "applecover.webp",
    logo: null,
    logoShadow: false,
    trackInfoMap: {},
    platformLinks: [],
    background: "graffitibg3.png",
    leftBackground: "brickwall.jpeg",
    modal: true
  },
  iso: {
    title: "iso",
    playlist: [
      { title: "birdwatcher", src: "recyclebinmusic/birdwatcher.mp3" },
      { title: "newblades", src: "recyclebinmusic/newblades.mp3" }
    ],
    cassetteImages: {
      default: "tape.png",
      playing: "tapeplay.png",
      paused: "tapepause.png"
    },
    albumCover: "isocover.webp",
    logo: null,
    logoShadow: false,
    trackInfoMap: {},
    platformLinks: [],
    background: "graffitibg4.png",
    leftBackground: "brickwall.jpeg",
    modal: true
  }
};

// --- Modular Album Window Renderer ---
function renderAlbumWindow(config) {
  const existingWindow = document.querySelector(`.window[data-title="${config.title}"]`);
  if (existingWindow) {
    bringToFront(existingWindow);
    return;
  }

  const template = document.getElementById('window-template');
  const clone = template.content.cloneNode(true);
  const win = clone.querySelector('.window');
  const header = clone.querySelector('.window-title');
  const content = clone.querySelector('.window-content');

  header.textContent = config.title;
  win.dataset.title = config.title;

  // Build the HTML for the window content
  let platformIcons = '';
  if (config.platformLinks && config.platformLinks.length) {
    platformIcons = `<div class="platform-box"><div class="platform-icons">` +
      config.platformLinks.map(link => `<a href="${link.href}" target="_blank"><img src="${link.icon}" alt="${link.alt}" class="platform-icon" /></a>`).join('') +
      `</div></div>`;
  }

  let logoHtml = '';
  if (config.logo) {
    logoHtml = `<div class="goodtrip-logo-wrapper"><img src="${config.logo}" alt="${config.title} Logo" class="goodtrip-logo" />${config.logoShadow ? '<div class="goodtrip-logo-shadow"></div>' : ''}</div>`;
  }

  // In the left-inner, render the LCD display and cassette controls
  let leftInnerHtml = `
    <div class="lcd-display">
      <span id="goodtrip-track-title">Use cassette controls to play</span>
      <div id="scrolling-container">
        <div class="scrolling-wrapper">
          <span id="scroll-text1"></span>
          <span id="scroll-text2"></span>
        </div>
      </div>
    </div>
    <div class="cassette-wrapper">
      <div class="cassette-inner">
        <img id="goodtrip-cassette-img" src="${config.cassetteImages.default}" alt="Cassette Player" class="cassette-image" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="cassette-overlay">
          <rect id="goodtrip-rewind" x="38" y="75" width="12" height="12" fill="rgba(0,0,255,0.0)" pointer-events="auto" />
          <rect id="goodtrip-play" x="26" y="75" width="12" height="12" fill="rgba(0,255,0,0.0)" pointer-events="auto" />
          <rect id="goodtrip-pause" x="74" y="75" width="12" height="12" fill="rgba(255,255,0,0.0)" pointer-events="auto" />
          <rect id="goodtrip-forward" x="50" y="75" width="12" height="12" fill="rgba(255,0,0,0.0)" pointer-events="auto" />
        </svg>
      </div>
    </div>
    <div class="lcd-volume" id="volume-control">
      <span class="bar" data-level="1"></span>
      <span class="bar" data-level="2"></span>
      <span class="bar" data-level="3"></span>
      <span class="bar" data-level="4"></span>
      <span class="bar" data-level="5"></span>
    </div>
  `;

  content.innerHTML = `
    <style>
      .goodtrip-layout[data-title="${config.title}"] { 
        display: flex !important; 
        height: 100% !important; 
        overflow: hidden !important; 
        background: ${config.background.startsWith('#') ? config.background : `url('${config.background}') no-repeat center center`} !important; 
        background-size: cover !important; 
      }
      .goodtrip-left[data-title="${config.title}"] { 
        width: 330px !important; 
        min-width: 315px !important; 
        max-width: 360px !important; 
        height: 100% !important; 
        ${config.leftBackground.startsWith('#') ? `background: ${config.leftBackground} !important;` : `background: url('${config.leftBackground}') no-repeat center center !important; background-size: cover !important;`} 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        padding: 20px; 
        box-sizing: border-box; 
        user-select: none; 
        flex-shrink: 0; 
      }
      .left-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; }

      .goodtrip-right { padding: 0; position: relative; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; align-items: center; color: white; text-shadow: 0 0 2px rgba(0,0,0,0.6); scrollbar-gutter: stable; flex: 1 1 auto; }
      /* Vertical resizer between left and right panes */
      .goodtrip-resizer {
        flex: 0 0 6px;
        cursor: col-resize;
        background: linear-gradient(
          to right,
          rgba(255,255,255,0.35),
          rgba(255,255,255,0.0),
          rgba(255,255,255,0.35)
        );
        border-left: 1px solid rgba(0,0,0,0.12);
        border-right: 1px solid rgba(255,255,255,0.2);
        align-self: stretch;
        z-index: 5;
      }
      .track-description#goodtrip-info-display { background: white; color: #000; border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); font-family: "Segoe UI", sans-serif; font-size: 14px; padding: 12px 16px; margin-top: 20px; max-width: 300px; text-align: left; text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1); border-radius: 4px; }
      .lcd-display, .lcd-track-info { width: 100%; height: 36px; background: #111; color: #0f0; font-family: 'Courier New', monospace; font-size: 1.2em; padding: 6px 12px; border: 2px inset #0f0; overflow: hidden; position: relative; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; text-shadow: 0 0 6px #0f0; flex-shrink: 0; }
      #scrolling-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; pointer-events: none; will-change: transform; }
      .scrolling-wrapper { display: flex; animation: scroll-left 10s linear infinite; will-change: transform; }
      .scrolling-wrapper span { display: inline-block; padding-right: 120px; white-space: nowrap; }
      @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .cassette-wrapper { width: 100%; display: flex; justify-content: center; position: relative; }
      .cassette-image { width: 100%; max-width: 320px; min-width: 280px; height: auto; display: block; filter: drop-shadow(0 7px 10px rgba(0, 0, 0, 0.7)); }
      .album-cover { margin-top: 8px; width: 100%; max-width: 320px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(0,0,0,0.8); border-radius: 0; display: block; image-rendering: auto !important; cursor: zoom-in; transition: box-shadow 0.2s ease; }
      .album-cover:hover { box-shadow: 0 0 25px rgba(0, 0, 0, 1.2); }
      .lcd-volume { width: 95px; height: 38px; background: #111; border: 2px inset #0f0; display: flex; align-items: flex-end; justify-content: center; gap: 6px; margin-top: 15px; padding: 4px 0; text-shadow: 0 0 6px #0f0; flex-shrink: 0; }
      .lcd-volume .bar { width: 6px; background: #030; cursor: pointer; transition: background 0.2s, box-shadow 0.2s; }
      .lcd-volume .bar[data-level="1"] { height: 12px; }
      .lcd-volume .bar[data-level="2"] { height: 18px; }
      .lcd-volume .bar[data-level="3"] { height: 24px; }
      .lcd-volume .bar[data-level="4"] { height: 30px; }
      .lcd-volume .bar[data-level="5"] { height: 36px; }
      .lcd-volume .bar.active { background: #0f0; box-shadow: 0 0 6px #0f0; }
      .goodtrip-right::-webkit-scrollbar { width: 16px; height: 16px; }
      .goodtrip-right::-webkit-scrollbar-track { background: #e1e1e1; border: 1px solid #cfcfcf; }
      .goodtrip-right::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #a6a6a6, #7a7a7a); border: 1px solid #6e6e6e; border-radius: 8px; }
      .goodtrip-right::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #8e8e8e, #5f5f5f); border: 1px solid #5a5a5a; }
      .goodtrip-right { scrollbar-width: thin; scrollbar-color: #7a7a7a #e1e1e1; }
      .goodtrip-logo-wrapper { position: sticky; top: 0; width: 100%; height: 50px; display: flex; align-items: center; justify-content: center; z-index: 10; pointer-events: none; }
      .goodtrip-logo { padding-top: 72px; max-height: 155px; width: auto; transition: opacity 0.3s ease; pointer-events: none; z-index: 11; }
      .goodtrip-logo-shadow { left: 0px; position: absolute; top: 0; left: 0; height: 180px; width: 120%; background: linear-gradient(to bottom, rgba(0, 0, 0, 1.1), transparent); z-index: 10; }
      .goodtrip-content-inner { padding: 20px 20px 20px 20px; width: 100%; display: flex; flex-direction: column; align-items: center; }
      #goodtrip-info-display.default-info { color: #666; font-weight: normal; font-style: italic; }
      /* Box for platform icons styled like the track info box */
      .platform-box {
        background: rgba(255, 255, 255, 0.85);
        color: #000;
        border: 1px solid rgba(0, 0, 0, 0.15);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
        font-family: "Segoe UI", sans-serif;
        font-size: 14px;
        padding: 8px 14px;
        margin-top: 32px;
        max-width: 380px;
        border-radius: 6px;
        display: flex;
        align-items: center; /* vertical centering */
        justify-content: center; /* horizontal centering */
        min-height: 50px;
      }
      .platform-box .platform-icons { margin-top: 0; }
      /* Platform icons layout */
      .platform-icons {
        display: flex;
        align-items: center; /* vertical center icons within the row */
        justify-content: center;
        gap: 16px;
        flex-wrap: wrap;
        max-width: 360px;
        margin-left: auto;
        margin-right: auto;
      }
      .platform-icons .platform-icon {
        width: 40px;
        height: 40px;
        object-fit: contain;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25));
      }
      .platform-icons a { display: inline-flex; }

      /* Aero-styled dropdown tracklist */
      .album-tracklist {
        width: 100%;
        max-width: 380px;
        background: rgba(255,255,255,0.9);
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6);
        margin-top: 16px;
        color: #111;
        overflow: hidden;
      }
      .album-tracklist[open] { overflow: visible; }
      .album-tracklist .tl-summary {
        list-style: none;
        display: block;
        background: linear-gradient(#fefefe, #e9eef8);
        padding: 8px 12px;
        font-weight: 700;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        cursor: pointer;
        position: relative;
        user-select: none;
      }
      .album-tracklist .tl-summary::-webkit-details-marker { display: none; }
      .album-tracklist .tl-summary::after {
        content: '▾';
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%) rotate(-90deg);
        transition: transform 280ms ease-in-out;
        opacity: 0.7;
      }
      .album-tracklist[open] .tl-summary::after { transform: translateY(-50%) rotate(0deg); }
      .album-tracklist ul {
        list-style: none;
        padding: 0;
        margin: 0;
        max-height: 0; /* collapsed */
        opacity: 0;
        transform: translateY(-4px);
        transition: max-height 380ms ease-in-out, opacity 300ms ease-in-out, transform 320ms ease-in-out;
        will-change: max-height, opacity, transform;
        overflow: hidden;
      }
      .album-tracklist[open] ul {
        max-height: 800px; /* enough to reveal list smoothly */
        opacity: 1;
        transform: translateY(0);
      }
      .album-tracklist li {
        display: grid;
        grid-template-columns: 28px 1fr 56px;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-top: 1px solid rgba(0,0,0,0.06);
        transition: background 0.15s ease;
        cursor: pointer;
      }
      .album-tracklist li:hover { background: rgba(74,144,226,0.08); }
      .album-tracklist li.active { background: rgba(74,144,226,0.16); box-shadow: inset 0 0 0 1px rgba(74,144,226,0.35); }
      .album-tracklist .idx { color:#666; font-weight:700; text-align:right; }
      .album-tracklist .name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .album-tracklist .len { color:#666; text-align:right; font-variant-numeric: tabular-nums; }
    </style>
    <div class="goodtrip-layout" data-title="${config.title}">
      <div class="goodtrip-left" data-title="${config.title}">
        <div class="left-inner">
          ${leftInnerHtml}
        </div>
      </div>

      <div class="goodtrip-resizer" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Resize left panel"></div>

      <div class="goodtrip-right">
        ${logoHtml}
        <div class="goodtrip-content-inner">
          <img src="${config.modalCover ? config.modalCover : config.albumCover}" alt="${config.title} Album Cover" class="album-cover" onclick="${config.modal ? `openAlbumModal('${config.modalCover ? config.modalCover : config.albumCover}')` : ''}" />
          <div class="track-description" id="goodtrip-info-display" style="display:none"><strong>${config.title}</strong></div>
          <details class="album-tracklist">
            <summary class="tl-summary">Tracklist</summary>
            <ul id="album-tracklist"></ul>
          </details>
          ${platformIcons}
        </div>
        <audio id="goodtrip-audio" src=""></audio>
      </div>
    </div>
  `;

  win.classList.add('no-padding');

  // Enable dragging the vertical resizer to adjust left pane width within min/max
  (function setupGoodtripResizer() {
    const layout = content.querySelector('.goodtrip-layout');
    const left = content.querySelector('.goodtrip-left');
    const resizer = content.querySelector('.goodtrip-resizer');
    if (!layout || !left || !resizer) return;

    let startX = 0;
    let startWidth = 0;
    let dragging = false;

    function getBounds() {
      const cs = getComputedStyle(left);
      const minW = parseFloat(cs.minWidth) || 0;
      const layoutRect = layout.getBoundingClientRect();
      const maxProp = cs.maxWidth;
      let maxW;
      if (maxProp && maxProp.endsWith('%')) {
        maxW = (parseFloat(maxProp) / 100) * layoutRect.width;
      } else if (maxProp && maxProp !== 'none' && !isNaN(parseFloat(maxProp))) {
        maxW = parseFloat(maxProp);
      } else {
        // If computed max-width is 'none', cap to the container width
        maxW = layoutRect.width;
      }
      // Sanity clamp
      if (!isFinite(maxW) || maxW <= 0) maxW = layoutRect.width;
      return { minW, maxW };
    }

    // Clamp current width into bounds on init so it respects new limits immediately
    (function clampInitialWidth() {
      const { minW, maxW } = getBounds();
      const cur = left.getBoundingClientRect().width;
      let next = Math.max(minW, Math.min(maxW, cur));
      next = Math.round(next);
      // Use flex-basis for sizing within flex layout; clear width to avoid conflicts
      left.style.setProperty('width', 'auto', 'important');
      left.style.setProperty('flex', `0 0 ${next}px`, 'important');
    })();

    function onMouseMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const { minW, maxW } = getBounds();
      let newW = startWidth + dx;
      if (newW < minW) newW = minW;
      if (newW > maxW) newW = maxW;
      const px = Math.round(newW);
      left.style.setProperty('width', 'auto', 'important');
      left.style.setProperty('flex', `0 0 ${px}px`, 'important');
    }

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', endDrag);
    }

    resizer.addEventListener('mousedown', (e) => {
      if (window.matchMedia('(max-width: 768px)').matches) return;
      dragging = true;
      startX = e.clientX;
      startWidth = left.getBoundingClientRect().width;
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', endDrag);
      e.preventDefault();
    });

    resizer.addEventListener('keydown', (e) => {
      if (window.matchMedia('(max-width: 768px)').matches) return;
      const step = (e.shiftKey ? 20 : 10);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const { minW, maxW } = getBounds();
        const cur = left.getBoundingClientRect().width;
        let next = cur + (e.key === 'ArrowRight' ? step : -step);
        if (next < minW) next = minW;
        if (next > maxW) next = maxW;
        next = Math.round(next);
        left.style.setProperty('width', 'auto', 'important');
        left.style.setProperty('flex', `0 0 ${next}px`, 'important');
        e.preventDefault();
      }
    });

    window.addEventListener('resize', () => {
      const { minW, maxW } = getBounds();
      const cur = left.getBoundingClientRect().width;
      if (cur < minW) {
        const v = Math.round(minW);
        left.style.setProperty('width', 'auto', 'important');
        left.style.setProperty('flex', `0 0 ${v}px`, 'important');
      }
      if (cur > maxW) {
        const v = Math.round(maxW);
        left.style.setProperty('width', 'auto', 'important');
        left.style.setProperty('flex', `0 0 ${v}px`, 'important');
      }
    });
  })();

  ['goodtrip-rewind', 'goodtrip-play', 'goodtrip-pause', 'goodtrip-forward'].forEach(id => {
    const btn = content.querySelector(`#${id}`);
    if (btn) btn.style.cursor = 'pointer';
  });

  const cassetteImg = content.querySelector('#goodtrip-cassette-img');
  const playlist = config.playlist;
  const cassetteImages = config.cassetteImages;
  const trackInfoMap = config.trackInfoMap || {};
  const infoDisplay = content.querySelector('#goodtrip-info-display');
  infoDisplay.textContent = "Track info";
  infoDisplay.classList.add("default-info");

  let currentTrack = 0;
  let playlistEnded = false;
  const audio = content.querySelector('#goodtrip-audio');
  const titleDisplay = content.querySelector('#goodtrip-track-title');
  const scrollContainer = content.querySelector('#scrolling-container');
  const scrollText1 = content.querySelector('#scroll-text1');
  const scrollText2 = content.querySelector('#scroll-text2');

  let scrollPos = 0;
  let textWidth = 0;
  let animationFrameId = null;

  function stopScrolling() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function startScrolling(text) {
    // Switch to CSS animation for smoother, consistent performance across windows
    stopScrolling();
    scrollText1.textContent = text;
    scrollText2.textContent = text;
    const wrapperDiv = scrollContainer.querySelector('.scrolling-wrapper');
    // Compute animation duration based on content width
    setTimeout(() => {
      const span1Width = scrollText1.offsetWidth;
      const spacing = 80;
      textWidth = span1Width + spacing;
      // Pixels per second speed
      const pxPerSec = 60; // adjust to taste
      const durationSec = Math.max(4, textWidth / pxPerSec);
      // Apply animation with dynamic duration
      wrapperDiv.style.willChange = 'transform';
      wrapperDiv.style.animation = `scroll-left ${durationSec}s linear infinite`;
      // Ensure starting at zero transform
      wrapperDiv.style.transform = 'translateX(0)';
    }, 0);
  }

  function updateDisplay(text, scroll = false) {
    if (scroll) {
      titleDisplay.style.display = 'none';
      scrollContainer.style.display = 'flex';
      startScrolling(text);
    } else {
      stopScrolling();
      scrollContainer.style.opacity = '1';
      scrollContainer.style.display = 'none';
      titleDisplay.style.display = 'inline-block';
      titleDisplay.textContent = text;
    }
  }

  function updateTrack(index) {
    currentTrack = index;
    const track = playlist[currentTrack];
    audio.src = track.src;
    audio.play();
    updateDisplay(`Now Playing: ${track.title}`, true);
    const info = trackInfoMap[track.title] || 'Now playing...';
    typeText(infoDisplay, info);
    cassetteImg.src = cassetteImages.playing;
    playlistEnded = false;
    infoDisplay.classList.remove("default-info");
    refreshTracklistActive();
  }

  content.querySelector('#goodtrip-play').addEventListener('click', () => {
    setTimeout(() => {
      infoDisplay.classList.remove("default-info");
      if (playlistEnded) {
        currentTrack = 0;
        updateTrack(currentTrack);
      } else if (!audio.src || audio.src === window.location.href) {
        updateTrack(currentTrack);
      } else if (audio.paused) {
        audio.play();
        updateDisplay(`Now Playing: ${playlist[currentTrack].title}`, true);
        const info = trackInfoMap[playlist[currentTrack].title] || 'Now playing...';
        typeText(infoDisplay, info);
        cassetteImg.src = cassetteImages.playing;
      }
    }, 120);
  });

  content.querySelector('#goodtrip-pause').addEventListener('click', () => {
    setTimeout(() => {
      audio.pause();
      updateDisplay('Paused', false);
      if (currentTypeInterval) clearTimeout(currentTypeInterval);
      infoDisplay.innerHTML = "Track info";
      infoDisplay.classList.add("default-info");
      cassetteImg.src = cassetteImages.paused;
    }, 100);
  });

  content.querySelector('#goodtrip-rewind').addEventListener('click', () => {
    if (playlistEnded) playlistEnded = false;
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    updateTrack(currentTrack);
  });

  content.querySelector('#goodtrip-forward').addEventListener('click', () => {
    if (playlistEnded) playlistEnded = false;
    currentTrack = (currentTrack + 1) % playlist.length;
    updateTrack(currentTrack);
  });

  audio.addEventListener('ended', () => {
    if (currentTrack < playlist.length - 1) {
      currentTrack++;
      updateTrack(currentTrack);
    } else {
      playlistEnded = true;
      updateDisplay('Playback finished', false);
      infoDisplay.innerHTML = `<strong>${config.title}</strong>`;
      cassetteImg.src = cassetteImages.default;
    }
  });

  // Build tracklist UI
  const tl = content.querySelector('#album-tracklist');
  function fmtLen(sec) {
    if (!isFinite(sec) || sec <= 0) return '';
    sec = Math.floor(sec);
    const m = Math.floor(sec/60), s = sec%60;
    return `${m}:${s<10?'0':''}${s}`;
  }
  function bindDurations() {
    // Load each track metadata in background to populate lengths
    playlist.forEach((t, i) => {
      if (!t || !t.src) return;
      const a = new Audio();
      a.preload = 'metadata';
      a.src = t.src;
      a.addEventListener('loadedmetadata', () => {
        const li = tl.querySelector(`li[data-index="${i}"] .len`);
        if (li) li.textContent = fmtLen(a.duration || 0);
      });
    });
  }
  function getDisplayTitle(rawTitle) {
    if (config && config.title === 'GOODTRIP') {
      // Strip prefixes like "Track 1/17 - "
      return String(rawTitle || '').replace(/^Track\s*\d+\/\d+\s*-\s*/i, '').trim();
    }
    return rawTitle || '';
  }
  function renderTracklist() {
    if (!tl) return;
    tl.innerHTML = playlist.map((t, i) => `
      <li data-index="${i}">
        <div class="idx">${String(i+1).padStart(2,'0')}</div>
        <div class="name">${getDisplayTitle(t.title) || `Track ${i+1}`}</div>
        <div class="len"></div>
      </li>
    `).join('');
    Array.from(tl.querySelectorAll('li')).forEach(li => {
      li.addEventListener('click', () => {
        const i = parseInt(li.getAttribute('data-index'), 10) || 0;
        if (i === currentTrack && !audio.paused) {
          audio.pause();
        } else {
          updateTrack(i);
        }
      });
      li.addEventListener('dblclick', () => {
        const i = parseInt(li.getAttribute('data-index'), 10) || 0;
        updateTrack(i);
      });
    });
    refreshTracklistActive();
    bindDurations();
  }
  function refreshTracklistActive() {
    if (!tl) return;
    Array.from(tl.querySelectorAll('li')).forEach(li => {
      const i = parseInt(li.getAttribute('data-index'), 10) || 0;
      li.classList.toggle('active', i === currentTrack);
    });
  }
  audio.addEventListener('play', refreshTracklistActive);
  audio.addEventListener('pause', refreshTracklistActive);
  renderTracklist();

  function setupVolumeControl() {
    const bars = Array.from(content.querySelectorAll('#volume-control .bar'));
    function updateBars(level) {
      bars.forEach(bar => {
        const barLevel = parseInt(bar.dataset.level, 10);
        bar.classList.toggle('active', barLevel <= level);
      });
    }
    bars.forEach((bar, idx) => {
      bar.addEventListener('click', () => {
        const level = idx + 1;
        const volume = level / bars.length;
        audio.volume = volume;
        updateBars(level);
      });
    });
    audio.volume = 0.8;
    updateBars(4);
  }
  setupVolumeControl();

  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const volumeControl = content.querySelector('#volume-control');
    if (volumeControl) volumeControl.remove();
    const infoDisplay = content.querySelector('#goodtrip-info-display');
    const leftInner = content.querySelector('.left-inner');
    if (infoDisplay && leftInner) {
      leftInner.appendChild(infoDisplay);
      infoDisplay.style.marginTop = '20px';
      infoDisplay.style.maxWidth = '100%';
    }
  }

  win.style.width = isMobile ? '88vw' : '800px';
  win.style.height = isMobile ? '70vh' : '500px';
  const windowWidth = parseInt(win.style.width);
  const windowHeight = parseInt(win.style.height);
  const padding = 12;
  let left = Math.max(padding, (window.innerWidth - windowWidth) / 2 + (Math.random() - 0.5) * 20);
  let top = Math.max(padding, (window.innerHeight - windowHeight) / 2 + (Math.random() - 0.5) * 20);
  left = Math.min(left, window.innerWidth - windowWidth - padding);
  top = Math.min(top, window.innerHeight - windowHeight - padding);
  win.style.position = 'fixed';
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
  win.style.transform = '';
  requestAnimationFrame(() => {
    const rect = win.getBoundingClientRect();
    const padding = 10;
    if (rect.right > window.innerWidth) {
      win.style.left = `${window.innerWidth - rect.width - padding}px`;
      win.style.transform = '';
    }
    if (rect.bottom > window.innerHeight) {
      win.style.top = `${window.innerHeight - rect.height - padding}px`;
      win.style.transform = '';
    }
    if (rect.left < 0) {
      win.style.left = `${padding}px`;
      win.style.transform = '';
    }
    if (rect.top < 0) {
      win.style.top = `${padding}px`;
      win.style.transform = '';
    }
  });

  win.style.zIndex = ++zIndex;
  const closeBtn = clone.querySelector('.window-header button');
  closeBtn.addEventListener('pointerup', (e) => {
    e.stopPropagation();
    playSound('sound-close');
    win.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
    win.addEventListener('transitionend', () => {
      win.remove();
      removeTaskbarIcon(config.title);
    }, { once: true });
  });
  makeDraggable(win);
  document.body.appendChild(win);
  // Clamp and center within desktop on spawn (especially for mobile)
  positionAndClampOnSpawn(win);
  animateWindowSpawn(win);
  setTimeout(() => { bringToFront(win); }, 0);
  addTaskbarIcon(config.title);

  // Logo fade on scroll for any album with logo and shadow
  const rightPanel = content.querySelector('.goodtrip-right');
  const logo = content.querySelector('.goodtrip-logo');
  const backdrop = content.querySelector('.goodtrip-logo-shadow');
  if (rightPanel && logo && backdrop) {
    rightPanel.addEventListener('scroll', () => {
      const fadeEnd = 70;
      const scrollY = rightPanel.scrollTop;
      const opacity = Math.max(0, 1 - scrollY / fadeEnd);
      logo.style.opacity = opacity;
      backdrop.style.opacity = opacity;
    });
  }



  // Restore cassette button sounds for GOODTRIP only
  function setupCassetteClickSounds() {
    const sounds = {
      play: document.getElementById('goodtrip-play-sound'),
      pause: document.getElementById('goodtrip-pause-sound'),
      click: document.getElementById('goodtrip-click')
    };
    const btnMap = {
      'goodtrip-play': sounds.play,
      'goodtrip-pause': sounds.pause,
      'goodtrip-forward': sounds.click,
      'goodtrip-rewind': sounds.click
    };
    Object.entries(btnMap).forEach(([id, sound]) => {
      const btn = content.querySelector(`#${id}`);
      if (btn && sound) {
        btn.addEventListener('click', () => {
          sound.currentTime = 0;
          sound.play().catch(err => console.warn("Sound play failed:", err));
        });
      }
    });
  }
  if (config.title === 'GOODTRIP') {
    setupCassetteClickSounds();
  }
}

// Store section handler
function openStoreSection(section) {
  
  const mainSections = document.getElementById('store-main-sections');
  const sectionContent = document.getElementById('section-content');
  const sectionTitle = document.getElementById('section-title');
  const sectionBody = document.getElementById('section-body');
  
  // Hide main sections, show section content
  mainSections.style.display = 'none';
  sectionContent.style.display = 'block';
  
  const sectionData = {
    'vinyl': {
      title: 'Vinyl Records',
      content: `
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">GOODTRIP Vinyl</div>
            <h4>GOODTRIP</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">demodisc01 Vinyl</div>
            <h4>demodisc01</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
        </div>
      `
    },
    'cd': {
      title: 'CD',
      content: `
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">GOODTRIP CD</div>
            <h4>GOODTRIP</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">demodisc01 CD</div>
            <h4>demodisc01</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
        </div>
      `
    },
    'clothes': {
      title: 'Clothing',
      content: `
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">Logo T-Shirt</div>
            <h4>Lew_dunit Tee</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">GOODTRIP Hoodie</div>
            <h4>GOODTRIP Hoodie</h4>
            <div class="coming-soon">Coming Soon</div>
          </div>
        </div>
      `
    }
  };
  
  const data = sectionData[section];
  if (data) {
    sectionTitle.textContent = data.title;
    sectionBody.innerHTML = data.content;
  }
}

// Function to show main store
function showMainStore() {
  const mainSections = document.getElementById('store-main-sections');
  const sectionContent = document.getElementById('section-content');
  
  // Show main sections, hide section content
  mainSections.style.display = 'grid';
  sectionContent.style.display = 'none';
}

// Override dispatcher after all functions are defined
const _originalOpenWindow = openWindow;
openWindow = function(title) {
  if (albumConfigs[title]) {
    renderAlbumWindow(albumConfigs[title]);
    return;
  }
  _originalOpenWindow(title);
};