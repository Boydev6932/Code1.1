// js/contact-admin.js
// (ต้องวางไฟล์นี้ในโฟลเดอร์ js/ ของโปรเจกต์)
(function(){
  console.log('[KNW] contact-admin.js loaded');

  // ใส่ปี
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Paths & candidates: **วางไฟล์ลงใน assets/**
  const PATHS = ['assets/'];
  const FILE_CANDIDATES = {
    ig:   ['qr-instagram.png','qr-instagram.PNG','qr_instagram.png','qr-instagram.jpg'],
    fb:   ['qr-facebook.png','qr-facebook.PNG','qr_facebook.png','qr-facebook.jpg'],
    line: ['qr-line.png','qr-line.PNG','qr_line.png','qr-line.jpg']
  };

  const IMG = document.getElementById('contact-qr-img');
  const FBACK = document.getElementById('qr-fallback');
  const WRAP = document.getElementById('qr-wrap');
  const PLATFORM_LABEL = document.getElementById('qr-platform-label');

  // cancellation guard for async image checks
  let latestSetId = 0;

  function showFallback(){ if (IMG) IMG.style.display='none'; if (FBACK) { FBACK.classList.remove('hidden'); FBACK.setAttribute('aria-hidden','false'); } }
  function hideFallback(){ if (FBACK) { FBACK.classList.add('hidden'); FBACK.setAttribute('aria-hidden','true'); } if (IMG) IMG.style.display=''; }

  function testSrc(src){
    return new Promise(resolve=>{
      const t = new Image();
      t.onload = ()=>resolve({ok:true,src});
      t.onerror = ()=>resolve({ok:false,src});
      t.src = src;
    });
  }

  async function findWorkingSrc(platformKey){
    const names = FILE_CANDIDATES[platformKey] || FILE_CANDIDATES.ig;
    const tries = [];
    PATHS.forEach(p => names.forEach(n => tries.push(p + n)));

    for (const s of tries){
      try{
        const r = await testSrc(s);
        if (r.ok) return r.src;
      }catch(e){ /* ignore */ }
    }
    return null;
  }

  function updatePlatformButtons(activeKey){
    document.querySelectorAll('[data-show-qr]').forEach(btn=>{
      const on = btn.dataset.showQr === activeKey;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function labelFor(key){ return key==='ig' ? 'Instagram' : key==='fb' ? 'Facebook' : 'LINE'; }

  async function setPlatform(key){
    const myId = ++latestSetId;
    updatePlatformButtons(key);
    if (PLATFORM_LABEL) PLATFORM_LABEL.textContent = labelFor(key);
    if (WRAP) WRAP.className = 'qr-wrap ' + (key==='ig' ? 'ig' : key==='fb' ? 'fb' : 'line');

    hideFallback();

    // subtle loading state
    if (IMG){ IMG.style.opacity = '0.6'; IMG.style.filter = 'blur(1px) grayscale(.02)'; }

    const src = await findWorkingSrc(key);

    // abort if another call happened
    if (myId !== latestSetId) return;

    if (src){
      if (IMG){
        IMG.src = src;
        IMG.alt = 'QR Code ของผู้ดูแล (' + labelFor(key) + ')';
        IMG.style.display = '';
        IMG.style.opacity = '';
        IMG.style.filter = '';
      }
      if (FBACK) FBACK.classList.add('hidden');
    } else {
      if (IMG) IMG.style.opacity = '';
      if (FBACK) FBACK.classList.remove('hidden');
      if (IMG) IMG.style.display = 'none';
    }
  }

  // Wire events: ให้ปุ่ม 3 ปุ่มเลือกแพลตฟอร์มได้จริง
  document.querySelectorAll('[data-show-qr]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const key = btn.dataset.showQr;
      setPlatform(key);
    });
  });

  // initial render (เริ่มด้วย IG)
  setPlatform('ig');

  // expose for debugging / programmatic control
  window._knw_setQR = setPlatform;

})();
