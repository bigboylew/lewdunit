let zIndex = 10;
const isMobile = /Mobi|Android|iPhone|iPad|iPod|Touch/.test(navigator.userAgent);

const sounds = {
  'sound-close': new Audio('https://files.catbox.moe/nmgith.mp3'),
  'sound-logon': new Audio('https://files.catbox.moe/7tkpiy.mp3'),
  'sound-error': new Audio('https://files.catbox.moe/2elxeq.mp3'),
};

// Preload all sounds
for (const soundKey in sounds) {
  sounds[soundKey].load();
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

  // To allow rapid replay, clone and play new Audio instance
  const clone = sound.cloneNode();
  clone.play().catch(() => {
    // Ignoring play errors (e.g. due to user not interacting yet)
  });
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
    // Make this window larger to accommodate the grid (responsive on mobile)
    if (isMobile) {
      win.style.width = '95vw';
      win.style.height = '90vh';
      win.style.maxWidth = '';
      win.style.maxHeight = '';
    } else {
      win.style.width = '900px';
      win.style.height = '600px';
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }

    content.innerHTML = `
      <style>
        .music-container {
          padding: 20px;
          position: relative;
          font-family: inherit;
        }
        .music-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        .music-section {
          background: transparent;
          padding: 8px 0;
          text-align: center;
          transition: transform 0.2s ease;
          cursor: pointer;
          border: none;
        }
        .music-section:hover { transform: translateY(-2px); }
        .music-section:hover .music-icon { filter: drop-shadow(0 0 10px rgba(51,153,255,0.9)); }
        .music-section:hover .music-title { color: #3399ff; text-shadow: 0 0 6px rgba(51,153,255,0.6); }
        .music-icon {
          width: 120px; height: 120px; margin: 0 auto 16px auto; display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          object-fit: cover;
        }
        .music-title { font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #333; }
        .music-section-content {}
        .music-section-header { display: flex; align-items: center; gap: 15px; padding: 0 20px; margin-bottom: 20px; }
        .music-back-button {
          background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
          border: 1px solid #999; color: #333; padding: 8px 12px; border-radius: 4px;
          cursor: pointer; font-size: 12px; transition: background 0.2s ease;
        }
        .music-back-button:hover { background: linear-gradient(to bottom, #f0f0f0, #e0e0e0); }
        #music-section-title { margin: 0; color: #333; font-size: 24px; }
        #music-section-body { color: #333; line-height: 1.6; padding: 0 20px; }
        .release-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .release-item { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .release-cover { width: 100%; height: 150px; background: #f5f5f5; border-radius: 4px; margin-bottom: 10px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .release-cover img { max-width: 100%; max-height: 100%; display:block; }
        .release-actions { display:flex; gap:8px; justify-content:center; margin-top:8px; }
        .release-actions a { font-size:12px; color:#0366d6; text-decoration:none; }
      </style>

      <div class="music-container">
        <div class="music-sections" id="music-main-sections">
          <div class="music-section" onclick="openWindow('demodisc_01')">
            <img src="demodisccover.webp" alt="demodisc_01" class="music-icon" />
            <div class="music-title">demodisc_01</div>
          </div>
          <div class="music-section" onclick="openMusicSection('apple')">
            <img src="applecover.webp" alt="apple" class="music-icon" />
            <div class="music-title">apple</div>
          </div>
          <div class="music-section" onclick="openWindow('GOODTRIP')">
            <img src="goodtrip.webp" alt="GOODTRIP" class="music-icon" />
            <div class="music-title">GOODTRIP</div>
          </div>
          <div class="music-section" onclick="openMusicSection('iso')">
            <img src="isocover.webp" alt="iso" class="music-icon" />
            <div class="music-title">iso</div>
          </div>
        </div>

        <div class="music-section-content" id="music-section-content" style="display:none;">
          <div class="music-section-header">
            <button class="music-back-button" onclick="showMainMusic()">← Back to Music</button>
            <h2 id="music-section-title"></h2>
          </div>
          <div id="music-section-body"></div>
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

    // Expose handlers for inline onclick inside this window scope
    window.openMusicSection = openMusicSection;
    window.showMainMusic = showMainMusic;
  } else if (title === "Recycle Bin") {
    // Make this window larger to accommodate content (responsive on mobile)
    if (isMobile) {
      win.style.width = '95vw';
      win.style.height = '90vh';
      win.style.maxWidth = '';
      win.style.maxHeight = '';
    } else {
      win.style.width = '900px';
      win.style.height = '600px';
      win.style.maxWidth = 'none';
      win.style.maxHeight = 'none';
    }

    content.innerHTML = `
      <style>
        .files-root { display: grid; grid-template-columns: 380px 1fr; height: 100%; font-family: inherit; }
        .files-left { border-right: 1px solid rgba(0,0,0,0.15); background: linear-gradient(#f8f8f8, #e9e9e9); padding: 6px 0; overflow: auto; }
        .files-right { display: grid; grid-template-rows: 1fr auto; }

        /* Explorer-like tree (scoped to left panel to avoid global clashes) */
        .files-left .tree { list-style: none; margin: 0; padding: 4px 0 12px 0; }
        .files-left .tree-item { display: block; }
        .files-left .tree-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 4px; cursor: default; user-select: none; }
        /* tighter spacing for file rows only */
        .files-left .tree-row.is-file { padding: 1px 6px; gap: 4px; }
        .files-left .tree-row:hover { background: rgba(51,153,255,0.12); }
        .files-left .tree-row.selected { background: rgba(51,153,255,0.18); outline: 1px solid rgba(51,153,255,0.6); }
        .files-left .twisty { width: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #333; }
        .files-left .icon { width: 18px; height: 18px; object-fit: contain; }
        .files-left .label { font-size: 13px; color: #222; }
        .files-left .children { margin: 0; padding-left: 18px; list-style: none; display: none; }
        .files-left .expanded > .children { display: block; }

        .preview { display: grid; grid-template-rows: 1fr auto; min-height: 0; }
        .artwork-wrap { display: flex; align-items: center; justify-content: center; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .artwork { max-width: 80%; max-height: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.25); border-radius: 6px; }
        .controls { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 8px; align-items: center; }
        .controls .title { font-size: 13px; color: #333; }
        .controls audio { width: 100%; max-width: 640px; }
        /* disabled state for the download button */
        .download-btn { color: #003366 !important; font-weight: bold; }
        .download-btn[disabled] {
          opacity: 0.5;
          pointer-events: none;
          cursor: not-allowed;
          color: #888 !important;
        }
      </style>

      <div class="files-root">
        <aside class="files-left">
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
          { name: 'newblades.wav', type: 'audio', wav: 'https://files.catbox.moe/9lgr6h.wav', mp3: 'recyclebinmusic/newblades.mp3', art: 'nocover.jpg' },
          { name: 'INT.wav',        type: 'audio', wav: 'https://files.catbox.moe/30392j.wav',                                         mp3: 'recyclebinmusic/INT.mp3',        art: 'nocover.jpg' },
          { name: 'pachinko.wav',   type: 'audio', wav: 'https://files.catbox.moe/5puxbs.wav', mp3: 'recyclebinmusic/pachinko.mp3',                                  art: 'nocover.jpg' },
          { name: 'birdwatcher.wav',type: 'audio', wav: 'https://files.catbox.moe/a98yzu.wav', mp3: 'recyclebinmusic/birdwatcher.mp3',    art: 'nocover.jpg' },
          { name: 'BF.wav',         type: 'audio', wav: 'https://files.catbox.moe/vxkqec.wav', mp3: 'recyclebinmusic/BF.mp3',             art: 'nocover.jpg' }
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
    content.innerHTML = `
      <style>
        .store-container {
          padding: 20px;
          /* background removed to inherit window background */
          position: relative; /* allow positioning of mute button */
          font-family: inherit; /* match desktop UI font */
        }
        
        /* store header removed */
        
        .store-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .store-section {
          background: transparent;
          border-radius: 0;
          padding: 8px 0;
          box-shadow: none;
          transition: transform 0.2s ease;
          cursor: pointer;
          border: none;
          text-align: center;
        }
        
        .store-section:hover {
          transform: translateY(-2px);
        }

        /* Blue glow on hover for image and title */
        .store-section:hover .section-icon {
          filter: drop-shadow(0 0 10px rgba(51,153,255,0.9));
        }
        .store-section:hover .section-title {
          color: #3399ff;
          text-shadow: 0 0 6px rgba(51,153,255,0.6);
        }
        
        .section-icon {
          width: 120px;
          height: 120px;
          margin: 0 auto 16px auto;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }
        
        .section-title {
          font-family: inherit; /* match desktop UI font */
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 8px;
          color: #333;
        }
        
        .section-content {
        }
        
        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
          padding: 0 20px;
        }
        
        .back-button {
          background: linear-gradient(to bottom, #e8e8e8, #d0d0d0);
          border: 1px solid #999;
          color: #333;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s ease;
        }
        
        .back-button:hover {
          background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
        }
        
        #section-title {
          margin: 0;
          color: #333;
          font-size: 24px;
        }
        
        #section-body {
          color: #333;
          line-height: 1.6;
          padding: 0 20px;
        }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .product-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .product-image {
          width: 100%;
          height: 150px;
          background: #f5f5f5;
          border-radius: 4px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          font-size: 12px;
        }

        /* Window-level audio controls (bottom-right of the Store window) */
        .store-audio-wrap {
          position: absolute;
          right: 12px;
          bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-direction: row-reverse; /* show slider to the left of button */
          z-index: 20;
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
          opacity: 0.55;
          transition: opacity 0.15s ease;
        }
        .store-audio-btn:hover { opacity: 1; }
        .store-audio-btn img { width: 100%; height: 100%; display: block; transition: filter 0.15s ease; }
        .store-volume {
          width: 80px;
          height: 4px;
          appearance: none;
          background: #bbb; /* solid color */
          border-radius: 2px;
          outline: none;
          opacity: 0; /* hidden by default */
          transition: opacity 0.15s ease;
        }
        /* Show slider when hovering the control area (button or slider) */
        .store-audio-wrap:hover .store-volume { opacity: 1; }
        /* WebKit slider styling */
        .store-volume::-webkit-slider-runnable-track { height: 4px; background: #bbb; border-radius: 2px; }
        .store-volume::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #666; margin-top: -3px; box-shadow: 0 0 4px rgba(0,0,0,0.5); }
        /* Firefox */
        .store-volume::-moz-range-track { height: 4px; background: #bbb; border-radius: 2px; }
        .store-volume::-moz-range-thumb { width: 10px; height: 10px; border: none; border-radius: 50%; background: #666; box-shadow: 0 0 4px rgba(0,0,0,0.5); }
        /* Blue tint on hover */
        .store-audio-btn:hover img {
          filter: hue-rotate(200deg) saturate(2) brightness(1.05);
        }
      </style>
      
      <div class="store-container">
        <div class="store-sections" id="store-main-sections">
          <div class="store-section" onclick="openStoreSection('vinyl')">
            <img src="vinyl.gif" alt="Vinyl" class="section-icon" />
            <div class="section-title">Vinyl</div>
          </div>
          
          <div class="store-section" onclick="openStoreSection('cd')">
            <img src="cdicon.gif" alt="CDs" class="section-icon" />
            <div class="section-title">CDs</div>
          </div>
          
          <!-- Clothing section temporarily disabled
          <div class="store-section" onclick="openStoreSection('clothes')">
            <img src="https://img.icons8.com/windows/64/t-shirt.png" alt="Clothing" class="section-icon" />
            <div class="section-title">Clothing</div>
          </div>
          -->
        </div>
        
        <div class="section-content" id="section-content" style="display: none;">
          <div class="section-header">
            <button class="back-button" onclick="showMainStore()">← Back to Store</button>
            <h2 id="section-title"></h2>
          </div>
          <div id="section-body"></div>
        </div>
      </div>
    `;
    // Use the window's scrollbar and remove default padding
    win.classList.add('no-padding');

    // Shopping music: random track rotation with mute
    (function setupStoreMusic() {
      const tracks = [
        'goldentime.mp3',
        'meadowtronic.mp3',
        'checkmiiout.mp3',
        'puzzle.mp3',
        'slideshow.mp3'
      ];
      const audio = new Audio();
      audio.volume = 0.5;
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

      // Start playback after slight delay, avoid repeating last track from previous session
      setTimeout(() => {
        const startIdx = pickNextIndex(storeMusicState.lastIndex);
        playIndex(startIdx);
      }, 50);
      audio.addEventListener('ended', playNext);

      // Create window-level audio controls (mute toggle + volume)
      const controlsWrap = document.createElement('div');
      controlsWrap.className = 'store-audio-wrap';

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

      controlsWrap.appendChild(toggleBtn);
      controlsWrap.appendChild(vol);
      win.appendChild(controlsWrap);

      toggleBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateIcon();
      });

      // Pause music when this Store window is closed
      const closeBtn = win.querySelector('.window-header button');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          audio.pause();
          audio.src = '';
          if (controlsWrap && controlsWrap.parentNode) controlsWrap.remove();
        }, { once: true });
      }

      // Also observe removal of the window node as a fallback
      const obs = new MutationObserver(() => {
        if (!document.body.contains(win)) {
          audio.pause();
          audio.src = '';
          if (controlsWrap && controlsWrap.parentNode) controlsWrap.remove();
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    })();

  
  } else if (title === "demodisc_01") {
    // Demodisc window: simple cover + audio player
    if (isMobile) {
      win.style.width = '90vw';
      win.style.height = '80vh';
    } else {
      win.style.width = '900px';
      win.style.height = '600px';
    }

    content.innerHTML = `
      <style>
        .demodisc-wrap { height: 100%; display: flex; flex-direction: column; gap: 16px; padding: 16px; box-sizing: border-box; }
        .demodisc-head { display:flex; align-items:center; gap:14px; }
        .demodisc-head img { width:72px; height:72px; object-fit:cover; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.2); }
        .demodisc-title { font-size:20px; font-weight:700; }
        .demodisc-body { flex:1; display:flex; align-items:center; justify-content:center; }
        .demodisc-cover { max-width: 85%; max-height: 80%; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.25); }
        .demodisc-controls { display:flex; gap:12px; align-items:center; justify-content:center; }
      </style>
      <div class="demodisc-wrap">
        <div class="demodisc-head">
          <img src="demodisccover-hq.png" alt="demodisc_01"/>
          <div class="demodisc-title">demodisc_01</div>
        </div>
        <div class="demodisc-body">
          <img src="demodisccover-hq.png" class="demodisc-cover" alt="demodisc_01 cover"/>
        </div>
        <div class="demodisc-controls">
          <audio controls src="crackers.mp3" style="width: min(720px, 100%);"></audio>
        </div>
      </div>
    `;

  } else if (title === "GOODTRIP") {
    content.innerHTML = `
      <style>
        .goodtrip-layout {
          display: flex;
          height: 100%;
          overflow: hidden;
          background: url('graffitibg.gif') no-repeat center center;
          background-size: cover;
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



  } else {
    content.innerHTML = `<p>This is the ${title} window.</p>`;
  }

  // Set default window size only if not already set by a window-specific block above
  // This avoids overriding sizes for windows like Music and Recycle Bin.
  if (!win.style.width || !win.style.height) {
    if (title === "Store") {
      win.style.width = isMobile ? '85vw' : '700px';
      win.style.height = isMobile ? '80vh' : '500px';
    } else if (title === "GOODTRIP") {
      win.style.width = isMobile ? '92vw' : '960px';
      win.style.height = isMobile ? '80vh' : '640px';
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
      }
  
      .goodtrip-layout {
        flex-direction: column !important;
        height: auto !important;
        max-height: none !important;
      }
  
      .goodtrip-left,
      .goodtrip-right {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        overflow-y: auto !important;
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
  
    win.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
  
    win.addEventListener('transitionend', () => {
      win.remove();
      removeTaskbarIcon(title);
    }, { once: true });
  });

  makeDraggable(win);
  document.body.appendChild(win);

  animateWindowSpawn(win);
  setTimeout(() => { bringToFront(win); }, 0);
  addTaskbarIcon(title);

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
    case 'Store':
      imgSrc = 'storeicon.png';
      break;
    case 'Music':
      imgSrc = 'cdicon.gif';
      break;
    case 'Recycle Bin':
      imgSrc = 'recyclebin.png';
      break;
    case 'Socials':
      imgSrc = 'socials.png';
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
  }
}

function closeAlbumModal() {
  const modal = document.getElementById('album-modal');
  if (modal) {
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

      .goodtrip-right { padding: 0; position: relative; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; align-items: center; color: white; text-shadow: 0 0 4px #000; scrollbar-gutter: stable; flex: 1 1 auto; }
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
          <img src="${config.modalCover ? config.modalCover : config.albumCover}" alt="${config.title} Album Cover" class="album-cover" onclick="${config.modal ? 'openAlbumModal()' : ''}" />
          <div class="track-description" id="goodtrip-info-display" style="display:none"><strong>${config.title}</strong></div>
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
    updateDisplay(`Now Playing: ${track.title}`, true);
    const info = trackInfoMap[track.title] || 'Now playing...';
    typeText(infoDisplay, info);
    cassetteImg.src = cassetteImages.playing;
    playlistEnded = false;
    infoDisplay.classList.remove("default-info");
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
      title: 'CDs',
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
