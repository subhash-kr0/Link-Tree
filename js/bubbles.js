// Function definition ko update kiya gaya hai taaki 'config' receive kar sake
export function initBubbles(config) {

  // -------- SETUP --------
  const viewer = document.querySelector('.viewer');
  if (!viewer) return; // Agar viewer na mile to aage na badhein

  // -------- FLOATING GIF BUBBLES (Respawn Logic Added) --------
  
  // --- Config (ab config.js ya database se aa raha hai) ---
  const { bubbleData } = config;

  // --- State ---
  let activeBubble = null;
  let isDraggingBubble = false;
  let isClick = true;
  let offsetX = 0, offsetY = 0;
  let bubbleMoveQueued = false;
  let lastMoveCoords = { x: 0, y: 0 };
  
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

  function createBubble(b) {
    const el = document.createElement('div'); 
    el.className = "bubble";
    
    el.dataset.link = b.link;
    el.dataset.src = b.src;

    const size = 6 + Math.random() * 5; 
    el.style.width = `${size}vmin`;
    el.style.height = el.style.width;

    el.style.left = `${Math.random() * 90}%`;
    el.style.top = `${Math.random() * 90}%`;
    
    el.style.animationDuration = `${15 + Math.random() * 10}s`;
    el.style.animationDelay = `-${Math.random() * 10}s`;

    const img = document.createElement('img');
    img.src = b.src;
    img.onerror = () => {
      // Agar image load na ho to placeholder dikhayein
      img.src = `assets/images/tree.png`;
      console.warn("Failed to load bubble image:", b.src);
    }
    el.appendChild(img);
    viewer.appendChild(el);

    el.addEventListener('mousedown', dragStart);
    el.addEventListener('touchstart', dragStart, { passive: false });
    return el;
  }

  function dragStart(e) {
    // Canvas drag ke saath conflict na ho, isliye bubble drag ko rokein
    e.stopPropagation(); 

    if (e.target.classList.contains('bubble') || e.target.parentElement.classList.contains('bubble')) {
      e.preventDefault(); 
      
      activeBubble = e.currentTarget;
      isDraggingBubble = true;
      isClick = true; // Har baar drag start par click reset karein

      activeBubble.style.animationPlayState = 'paused';
      activeBubble.style.zIndex = 1000;
      activeBubble.style.cursor = 'grabbing';
      
      const coords = getEventCoords(e);
      const bubbleRect = activeBubble.getBoundingClientRect();
      
      offsetX = coords.x - bubbleRect.left;
      offsetY = coords.y - bubbleRect.top; 

      window.addEventListener('mousemove', dragMove);
      window.addEventListener('mouseup', dragEnd);
      window.addEventListener('touchmove', dragMove, { passive: false });
      window.addEventListener('touchend', dragEnd);
    }
  }

  function updateBubblePosition() {
    if (!isDraggingBubble || !activeBubble) {
      bubbleMoveQueued = false;
      return;
    }
    
    const viewerRect = viewer.getBoundingClientRect();
    
    let newLeftPx = lastMoveCoords.x - offsetX - viewerRect.left;
    let newTopPx = lastMoveCoords.y - offsetY - viewerRect.top;

    // Viewport ke andar rakhein
    let newLeftPercent = (newLeftPx / viewerRect.width) * 100;
    let newTopPercent = (newTopPx / viewerRect.height) * 100;

    const bubbleWidthPercent = (activeBubble.offsetWidth / viewerRect.width) * 100;
    const bubbleHeightPercent = (activeBubble.offsetHeight / viewerRect.height) * 100;

    newLeftPercent = Math.max(0, Math.min(newLeftPercent, 100 - bubbleWidthPercent));
    newTopPercent = Math.max(0, Math.min(newTopPercent, 100 - bubbleHeightPercent));
    
    activeBubble.style.left = newLeftPercent + '%';
    activeBubble.style.top = newTopPercent + '%';

    bubbleMoveQueued = false;
  }

  function dragMove(e) {
    if (!isDraggingBubble || !activeBubble) return;

    e.preventDefault();
    isClick = false; // Agar move hua, to yeh click nahi hai
    
    const coords = getEventCoords(e);
    lastMoveCoords.x = coords.x;
    lastMoveCoords.y = coords.y;

    if (!bubbleMoveQueued) {
      bubbleMoveQueued = true;
      requestAnimationFrame(updateBubblePosition);
    }
  }

  function dragEnd(e) {
    if (!isDraggingBubble || !activeBubble) return;

    const bubble = activeBubble; 
    const link = bubble.dataset.link;
    const src = bubble.dataset.src;
    
    // bubbleData array se original object dhoondein
    const bubbleInfo = bubbleData.find(b => b.src === src && b.link === link);

    if (isClick) {
      bubble.classList.add('burst');
      
      bubble.addEventListener('animationend', () => {
        bubble.remove();
        // Agar bubble ka data config mein hai, tabhi naya bubble banayein
        if (bubbleInfo) {
          setTimeout(() => createBubble(bubbleInfo), 1000); // 1 sec baad naya bubble
        }
      }, { once: true });

      setTimeout(() => {
        if (link && link !== "undefined") {
          window.open(link, '_blank');
        }
      }, 200); // Thoda delay taaki burst animation dikhe

    } else {
      // Yeh ek drag tha, animation resume karein
      bubble.style.animationPlayState = 'running';
      bubble.style.zIndex = 'auto';
      bubble.style.cursor = 'pointer';
    }

    // --- Cleanup ---
    isDraggingBubble = false;
    activeBubble = null;
    
    window.removeEventListener('mousemove', dragMove);
    window.removeEventListener('mouseup', dragEnd);
    window.removeEventListener('touchmove', dragMove);
    window.removeEventListener('touchend', dragEnd);
  }


  // --- Init Bubbles ---
  // Pehle se maujood bubbles (agar koi ho) ko hata dein
  viewer.querySelectorAll('.bubble').forEach(b => b.remove());
  
  // Naye config ke saath bubbles banayein
  if (bubbleData) {
      bubbleData.forEach(createBubble);
  } else {
      console.warn("No bubble data found to initialize bubbles.");
  }
}