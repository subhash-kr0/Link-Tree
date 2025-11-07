// Function definition ko update kiya gaya hai taaki 'config' receive kar sake
export function initCanvasScroll(config) {
  
  // -------- SETUP --------
  const canvas = document.getElementById('c');
  if (!canvas) return; // Agar canvas na mile to aage na badhein
  const ctx = canvas.getContext('2d', { alpha: true });

  // -------- IMAGE FRAME SCROLL ANIMATION --------
  
  // --- Config (ab config.js se aa raha hai) ---
  const { folder, extension, totalFrames, playSpeed, dragSensitivity } = config;

  // --- State ---
  const frames = [];
  const imgs = [];
  let loaded = 0;
  let idx = 0;
  let direction = 1;
  let playing = true;
  let dragging = false;
  let startX = 0;
  let startIdx = 0;
  let dpr = window.devicePixelRatio || 1;
  let resizeTimer;
  let moveQueued = false;

  // --- Functions ---

  /**
   * OPTIMIZATION: Helper to get normalized coordinates from mouse/touch events
   */
  function getEventCoords(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    if (imgs.length === 0) return; // Images load hone tak wait karein
    
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    
    const img = imgs[Math.floor(idx)];
    if (!img || !img.width || !img.height) return;
    
    const arImg = img.width / img.height; 
    const arCanvas = w / h;
    let dw, dh, dx, dy;
    
    // if (arImg > arCanvas) {
    //   dw = w;
    //   dh = w / arImg;
    //   dx = 0;
    //   dy = (h - dh) / 2;
    // } else {
    //   dh = h;
    //   dw = h * arImg;
    //   dx = (w - dw) / 2;
    //   dy = 0;
    // }

        // Yeh naya 'cover' (fullscreen) logic hai:
    if (arImg > arCanvas) {
        // Image canvas se zyada wide hai
        // Isliye height ko match karo aur width ko crop karo
        dh = h;
        dw = h * arImg;
        dx = (w - dw) / 2; // Horizontally center karo
        dy = 0;
    } else {
        // Image canvas se zyada tall hai
        // Isliye width ko match karo aur height ko crop karo
        dw = w;
        dh = w / arImg;
        dx = 0;
        dy = (h - dh) / 2; // Vertically center karo
    }
    /* --- BADLAV KHATM HUA --- */
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function loop() {
    if (playing) {
      idx += direction * playSpeed;
      if (idx >= imgs.length - 1) { idx = imgs.length - 1; direction = -1; }
      else if (idx <= 0) { idx = 0; direction = 1; }
      draw();
    }
    requestAnimationFrame(loop);
  }

  function onDown(e) { 
    dragging = true; 
    playing = false; 
    const coords = getEventCoords(e);
    startX = coords.x;
    startIdx = idx; 
  }

  function onMove(e) {
    if (!dragging) return;
    
    const coords = getEventCoords(e);
    const x = coords.x;
    const dx = x - startX;
    idx = startIdx - dx * dragSensitivity;
    pingPongClamp();

    if (!moveQueued) {
      moveQueued = true;
      requestAnimationFrame(() => {
        draw();
        moveQueued = false;
      });
    }
  }

  function onUp() { 
    dragging = false; 
    playing = true; 
  }

  function onWheel(e) {
    e.preventDefault();
    playing = false;
    
    if (imgs.length === 0) return; // Agar images load na hui ho
    if (idx >= imgs.length - 1) direction = -1;
    else if (idx <= 0) direction = 1;
    
    idx += direction * (e.deltaY > 0 ? 1 : -1);
    pingPongClamp();
    draw();
    
    clearTimeout(canvas._wheelTimeout);
    canvas._wheelTimeout = setTimeout(() => playing = true, 200);
  }

  function pingPongClamp() {
    if (imgs.length === 0) return;
    if (idx >= imgs.length - 1) { idx = imgs.length - 1; direction = -1; }
    else if (idx <= 0) { idx = 0; direction = 1; }
  }
  
  // --- Init & Event Listeners (Canvas) ---
  for (let i = 1; i <= totalFrames; i++) {
    const num = String(i).padStart(3, '0');
    frames.push(`${folder}/${num}${extension}`);
  }

  frames.forEach(src => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      loaded++;
      if (loaded === frames.length) {
        resize(); // Initial resize once images are loaded
        requestAnimationFrame(loop);
      }
    };
    img.onerror = () => {
        console.error("Failed to load image:", src);
        loaded++; // Phir bhi loaded count badhayein taaki loop start ho sake
    };
    imgs.push(img);
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  });

  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
}