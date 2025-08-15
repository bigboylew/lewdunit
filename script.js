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
    content.innerHTML = `
      <iframe style="border: 0; width: 100%; height: 120px;" 
        src="https://bandcamp.com/EmbeddedPlayer/album=573564593/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/" 
        seamless>
        <a href="https://lewdunit.bandcamp.com/album/demodisc01">demodisc01 by Lew_dunit</a>
      </iframe>
    `;
  } else if (title === "Recycle Bin") {
    // Make this window larger to accommodate content
    win.style.width = '960px';
    win.style.height = '640px';
    win.style.maxWidth = 'none';
    win.style.maxHeight = 'none';

    content.innerHTML = `
      <style>
        .files-root { display: grid; grid-template-columns: 380px 1fr; height: 100%; font-family: inherit; }
        .files-left { border-right: 1px solid rgba(0,0,0,0.15); background: linear-gradient(#f8f8f8, #e9e9e9); padding: 6px 0; overflow: auto; }
        .files-right { display: grid; grid-template-rows: 1fr auto; background: #fff; }

        /* Explorer-like tree */
        .tree { list-style: none; margin: 0; padding: 4px 0 12px 0; }
        .tree-item { display: block; }
        .tree-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 4px; cursor: default; user-select: none; }
        .tree-row:hover { background: rgba(51,153,255,0.12); }
        .tree-row.selected { background: rgba(51,153,255,0.18); outline: 1px solid rgba(51,153,255,0.6); }
        .twisty { width: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; color: #333; }
        .icon { width: 18px; height: 18px; object-fit: contain; }
        .label { font-size: 13px; color: #222; }
        .children { margin: 0; padding-left: 18px; list-style: none; display: none; }
        .expanded > .children { display: block; }

        .preview { display: grid; grid-template-rows: 1fr auto; min-height: 0; }
        .artwork-wrap { display: flex; align-items: center; justify-content: center; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); }
        .artwork { max-width: 80%; max-height: 100%; box-shadow: 0 2px 12px rgba(0,0,0,0.25); border-radius: 6px; }
        .controls { padding: 10px 12px; display: grid; grid-template-columns: 1fr; gap: 8px; align-items: center; }
        .controls .title { font-size: 13px; color: #333; }
        .controls audio { width: 100%; max-width: 640px; }
      </style>

      <div class="files-root">
        <aside class="files-left">
          <ul class="tree" id="fs-tree"></ul>
        </aside>
        <section class="files-right">
          <div class="preview">
            <div class="artwork-wrap">
              <img id="file-artwork" class="artwork" src="demodisccover-hq.png" alt="Artwork" />
            </div>
            <div class="controls">
              <div class="title" id="file-title">Select a track</div>
              <audio id="rb-audio" controls preload="metadata"></audio>
            </div>
          </div>
          <!-- Native HTML5 audio controls for quick working player -->
        </section>
      </div>
    `;

    // Fill the window: remove padding on this window's content only
    content.style.padding = '0';

    // Hierarchical file system (folders with files)
    const fsData = [
      {
        name: 'Music', type: 'folder', children: [
          {
            name: 'Demo Disc', type: 'folder', children: [
              { name: 'Track 1.mp3', type: 'audio', src: 'https://files.catbox.moe/ut26i3.mp3', art: 'demodisccover-hq.png' },
              { name: 'Windows Error.mp3', type: 'audio', src: 'UI Sounds/Windows Error.mp3', art: 'demodisccover-hq.png' },
              { name: 'Tape Play.mp3', type: 'audio', src: 'tapeplay.mp3', art: 'demodisccover-hq.png' },
              { name: 'Tape Pause.mp3', type: 'audio', src: 'tapepause.mp3', art: 'demodisccover-hq.png' }
            ]
          },
          { name: 'Unsorted', type: 'folder', children: [] }
        ]
      },
      { name: 'Pictures', type: 'folder', children: [] },
      { name: 'Documents', type: 'folder', children: [] }
    ];

    const tree = content.querySelector('#fs-tree');
    const titleEl = content.querySelector('#file-title');
    const artEl = content.querySelector('#file-artwork');
    const rbAudio = content.querySelector('#rb-audio');
    let selectedRow = null;

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
        icon.src = node.type === 'folder' ? 'pngimg.com - recycle_bin_PNG42.png' : (node.art || 'demodisccover-hq.png');

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
      selectedRow = rowEl;
      selectedRow.classList.add('selected');

      titleEl.textContent = displayPath || fileNode.name;
      if (fileNode.art) artEl.src = fileNode.art;

      rbAudio.src = fileNode.src;
      rbAudio.currentTime = 0;
      rbAudio.play().catch(() => {});
    }

    // If user clicks play before selecting, auto-open root Music and play first audio
    rbAudio.addEventListener('play', () => {
      if (!selectedRow) {
        const first = findFirstAudio(fsData);
        if (first) selectAudio(first.node, null, `Music/${first.node.name}`);
      }
    });

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

        /* Window-level audio toggle (bottom-right of the Store window) */
        .store-audio-btn {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          padding: 0;
          margin: 0;
          cursor: pointer;
          z-index: 20;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        .store-audio-btn img { width: 100%; height: 100%; display: block; transition: filter 0.15s ease; }
        /* Blue tint on hover */
        .store-audio-btn:hover img {
          filter: hue-rotate(200deg) saturate(2) brightness(1.05);
        }
      </style>
      
      <div class="store-container">
        <div class="store-sections" id="store-main-sections">
          <div class="store-section" onclick="openStoreSection('vinyl')">
            <img src="disc1.png" alt="Vinyl" class="section-icon" />
            <div class="section-title">Vinyl</div>
          </div>
          
          <div class="store-section" onclick="openStoreSection('cd')">
            <img src="cdicon.gif" alt="CDs" class="section-icon" />
            <div class="section-title">CDs</div>
          </div>
          
          <div class="store-section" onclick="openStoreSection('clothes')">
            <img src="https://img.icons8.com/windows/64/t-shirt.png" alt="Clothing" class="section-icon" />
            <div class="section-title">Clothing</div>
          </div>
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
        'shopping_theme_1.mp3',
        'shopping_theme_2.mp3',
        'shopping_theme_3.mp3'
      ];
      const audio = new Audio();
      audio.volume = 0.5;
      audio.preload = 'auto';

      function pickRandom() {
        const i = Math.floor(Math.random() * tracks.length);
        return tracks[i];
      }

      function playRandom() {
        audio.src = pickRandom();
        audio.currentTime = 0;
        audio.play().catch(() => {/* autoplay may be blocked until user interacts */});
      }

      // Start playback after slight delay (gives time for user interaction state)
      setTimeout(playRandom, 50);
      audio.addEventListener('ended', playRandom);

      // Create window-level image toggle button (bottom-right of the Store window)
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
      win.appendChild(toggleBtn);

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
          if (toggleBtn && toggleBtn.parentNode) toggleBtn.remove();
        }, { once: true });
      }

      // Also observe removal of the window node as a fallback
      const obs = new MutationObserver(() => {
        if (!document.body.contains(win)) {
          audio.pause();
          audio.src = '';
          if (toggleBtn && toggleBtn.parentNode) toggleBtn.remove();
          obs.disconnect();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    })();
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
        
            <div class="track-description" id="goodtrip-info-display">
              <strong>GOODTRIP</strong>
            </div>
        
            <div class="platform-icons">
              <a href="https://open.spotify.com/album/2AOE6VeeBrTjAco9KYWeDC?si=2fe7b5b2a6c64891" target="_blank">
                <img src="spotify-icon.webp" alt="Spotify" class="platform-icon" />
              </a>
              <a href="https://music.apple.com/gb/album/goodtrip/1785658586" target="_blank">
                <img src="applemusic-icon.png" alt="Apple Music" class="platform-icon" />
              </a>
              <a href="https://bandcamp.com" target="_blank">
                <img src="bandcamp-icon.png" alt="Bandcamp" class="platform-icon" />
              </a>
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

  // Set window size based on title (do not override Recycle Bin's explicit size set earlier)
  if (title === "Recycle Bin") {
    // keep 1100x720 from the Recycle Bin block above
  } else if (title === "Store") {
    win.style.width = isMobile ? '85vw' : '700px';
    win.style.height = isMobile ? '80vh' : '500px';
  } else if (title === "GOODTRIP") {
    win.style.width = isMobile ? '88vw' : '800px';
    win.style.height = isMobile ? '70vh' : '500px';
  } else {
    win.style.width = isMobile ? '80vw' : '300px';
    win.style.height = isMobile ? '50vh' : '200px';
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

function openAlbumModal() {
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
    // Use the same image source for both display and download
    const imgSrc = 'goodtripcover-hq.jpg';
    imgWrapper.src = imgSrc;
    downloadBtn.href = imgSrc;
    downloadBtn.download = 'goodtripcover-hq.jpg';
    
    // Add click handler to ensure proper download
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const link = document.createElement('a');
      link.href = imgSrc;
      link.download = 'goodtripcover-hq.jpg';
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
      { href: "https://music.apple.com/gb/album/goodtrip/1785658586", icon: "applemusic-icon.png", alt: "Apple Music" },
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
    platformIcons = `<div class="platform-icons">` +
      config.platformLinks.map(link => `<a href="${link.href}" target="_blank"><img src="${link.icon}" alt="${link.alt}" class="platform-icon" /></a>`).join('') +
      `</div>`;
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
        width: 320px !important; 
        min-width: 250px !important; 
        max-width: 70% !important; 
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

      .goodtrip-right { padding: 0; position: relative; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; align-items: center; color: white; text-shadow: 0 0 4px #000; scrollbar-gutter: stable; }
      .track-description#goodtrip-info-display { background: white; color: #000; border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); font-family: "Segoe UI", sans-serif; font-size: 14px; padding: 12px 16px; margin-top: 20px; max-width: 300px; text-align: left; text-shadow: 0 1px 0 rgba(0, 0, 0, 0.1); border-radius: 4px; }
      .lcd-display, .lcd-track-info { width: 100%; height: 36px; background: #111; color: #0f0; font-family: 'Courier New', monospace; font-size: 1.2em; padding: 6px 12px; border: 2px inset #0f0; overflow: hidden; position: relative; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; text-shadow: 0 0 6px #0f0; flex-shrink: 0; }
      #scrolling-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; pointer-events: none; will-change: transform; }
      .scrolling-wrapper { display: flex; animation: scroll-left 10s linear infinite; will-change: transform; }
      .scrolling-wrapper span { display: inline-block; padding-right: 120px; white-space: nowrap; }
      @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      .cassette-wrapper { width: 100%; display: flex; justify-content: center; position: relative; }
      .cassette-image { width: 100%; max-width: 320px; min-width: 280px; height: auto; display: block; filter: drop-shadow(0 7px 10px rgba(0, 0, 0, 0.7)); }
      .album-cover { margin-top: 0; width: 100%; max-width: 300px; margin-bottom: 20px; box-shadow: 0 0 15px rgba(0,0,0,0.8); border-radius: 0; display: block; image-rendering: auto !important; cursor: zoom-in; transition: box-shadow 0.2s ease; }
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
    </style>
    <div class="goodtrip-layout" data-title="${config.title}">
      <div class="goodtrip-left" data-title="${config.title}">
        <div class="left-inner">
          ${leftInnerHtml}
        </div>
      </div>

      <div class="goodtrip-right">
        ${logoHtml}
        <div class="goodtrip-content-inner">
          <img src="${config.modalCover ? config.modalCover : config.albumCover}" alt="${config.title} Album Cover" class="album-cover" onclick="${config.modal ? 'openAlbumModal()' : ''}" />
          <div class="track-description" id="goodtrip-info-display"><strong>${config.title}</strong></div>
          ${platformIcons}
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
        <p>Discover our collection of limited edition vinyl releases and exclusive pressings.</p>
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">GOODTRIP Vinyl</div>
            <h4>GOODTRIP</h4>
            <p>Limited Edition Vinyl</p>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">demodisc01 Vinyl</div>
            <h4>demodisc01</h4>
            <p>Debut Album Pressing</p>
            <div class="coming-soon">Coming Soon</div>
          </div>
        </div>
      `
    },
    'cd': {
      title: 'CDs',
      content: `
        <p>Physical CD releases and special edition packages with exclusive artwork.</p>
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">GOODTRIP CD</div>
            <h4>GOODTRIP</h4>
            <p>Standard CD Edition</p>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">demodisc01 CD</div>
            <h4>demodisc01</h4>
            <p>Debut Album CD</p>
            <div class="coming-soon">Coming Soon</div>
          </div>
        </div>
      `
    },
    'clothes': {
      title: 'Clothing',
      content: `
        <p>Exclusive apparel and merchandise featuring unique Lew_dunit designs.</p>
        <div class="product-grid">
          <div class="product-item">
            <div class="product-image">Logo T-Shirt</div>
            <h4>Lew_dunit Tee</h4>
            <p>Classic Logo Design</p>
            <div class="coming-soon">Coming Soon</div>
          </div>
          <div class="product-item">
            <div class="product-image">GOODTRIP Hoodie</div>
            <h4>GOODTRIP Hoodie</h4>
            <p>Album Art Design</p>
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
