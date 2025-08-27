// js/contact-admin.js
// วางไฟล์นี้ที่ project-root/js/contact-admin.js
(function(){
  'use strict';

  // ตั้งเป็น true เพื่อดู logs และ alert; เปลี่ยนเป็น false ตอนใช้งานจริง
  const DEBUG = true;

  if (DEBUG) console.log('[KNW] contact-admin.js (start)');

  // เรียก init เมื่อ DOM พร้อม (รองรับทั้ง defer และ non-defer)
  function onReady(fn){
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(init);

  function init(){
    if (DEBUG) console.log('[KNW] init() start');

    // ใส่ปี (ถ้ามี element)
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // หากต้องการ alert แสดงว่าสคริปต์ทำงาน ให้ใช้ DEBUG = true (ตอน debug เท่านั้น)
    if (DEBUG) {
      // ให้เป็น non-blocking (ใช้ confirm/alert ได้แต่มักรบกวน UX) — คอมเมนต์บรรทัดถัดไปออกหากไม่ต้องการ
      // alert('[KNW] contact-admin.js ทำงานแล้ว (DEBUG=true)');
    }

    // Paths: ลองหลาย ๆ path เพื่อความยืดหยุ่น (ขึ้นกับตำแหน่งไฟล์ HTML)
    const PATHS = [
      'assets/',
      './assets/',
      '../assets/'
    ];

    // ชื่อไฟล์ที่พยายามหา — เพิ่มนามสกุลที่พบบ่อย (png, jpg, jpeg, webp, svg)
    const FILE_CANDIDATES = {
      ig:   ['qr-instagram.png','qr-instagram.PNG','qr_instagram.png','qr-instagram.jpg','qr-instagram.jpeg','qr-instagram.webp','qr-instagram.svg'],
      fb:   ['qr-facebook.png','qr-facebook.PNG','qr_facebook.png','qr-facebook.jpg','qr-facebook.jpeg','qr-facebook.webp','qr-facebook.svg'],
      line: ['qr-line.png','qr-line.PNG','qr_line.png','qr-line.jpg','qr-line.jpeg','qr-line.webp','qr-line.svg']
    };

    // หา element สำคัญ
    const IMG = document.getElementById('contact-qr-img');
    const FBACK = document.getElementById('qr-fallback');
    const WRAP = document.getElementById('qr-wrap');
    const PLATFORM_LABEL = document.getElementById('qr-platform-label');
    const BUTTONS = Array.from(document.querySelectorAll('[data-show-qr]'));

    if (!IMG) {
      console.error('[KNW] contact-admin.js: ไม่พบ element #contact-qr-img — ถอดใจไม่ได้ ให้ตรวจสอบ HTML ว่ามี <img id="contact-qr-img"> อยู่ในหน้า contact-admin.html');
      return;
    }

    if (BUTTONS.length === 0) {
      console.warn('[KNW] contact-admin.js: ไม่พบปุ่มที่มี data-show-qr — ตรวจสอบว่า HTML มีปุ่ม 3 ปุ่ม (IG, FB, LINE) และใส่ attribute data-show-qr="ig|fb|line"');
      // แต่ยังคงทำงานต่อ (load default image)
    }

    if (DEBUG) {
      console.log('[KNW] Elements:', { IMG: !!IMG, FBACK: !!FBACK, WRAP: !!WRAP, PLATFORM_LABEL: !!PLATFORM_LABEL, buttonsCount: BUTTONS.length });
    }

    // guard for async image checks
    let latestSetId = 0;

    function showFallback(msg){
      if (IMG) IMG.style.display = 'none';
      if (FBACK) {
        FBACK.classList.remove('hidden');
        FBACK.setAttribute('aria-hidden','false');
        if (msg) {
          // update fallback message if provided
          try { FBACK.querySelector('div.muted').textContent = msg; } catch(e){ /* ignore */ }
        }
      }
    }
    function hideFallback(){
      if (FBACK) { FBACK.classList.add('hidden'); FBACK.setAttribute('aria-hidden','true'); }
      if (IMG) IMG.style.display = '';
    }

    // Promise loader for an image URL
    function testSrc(src){
      return new Promise(resolve=>{
        const t = new Image();
        t.onload = ()=>resolve({ok:true,src});
        t.onerror = ()=>resolve({ok:false,src});
        // ตั้ง src หลังจากตั้ง event handlers เพื่อจับ error ได้แน่นอน
        t.src = src;
      });
    }

    // สร้าง list ของ path ที่จะลอง (รวมทุก PATHS + candidate names)
    function buildTriesFor(platformKey){
      const names = FILE_CANDIDATES[platformKey] || FILE_CANDIDATES.ig;
      const tries = [];
      PATHS.forEach(p => names.forEach(n => tries.push(p + n)));
      return tries;
    }

    // ลองหาภาพที่ใช้งานได้จริง หากเจอ return URL
    async function findWorkingSrc(platformKey){
      const tries = buildTriesFor(platformKey);
      if (DEBUG) console.log('[KNW] findWorkingSrc tries count=', tries.length);

      for (const s of tries){
        try {
          if (DEBUG) console.debug('[KNW] testing', s);
          const r = await testSrc(s);
          if (r && r.ok) {
            if (DEBUG) console.log('[KNW] found image:', r.src);
            return r.src;
          }
        } catch(err) {
          if (DEBUG) console.warn('[KNW] error testing', s, err);
        }
      }
      if (DEBUG) console.warn('[KNW] no image found for', platformKey);
      return null;
    }

    // ปรับสถานะปุ่ม (active/aria-pressed)
    function updatePlatformButtons(activeKey){
      document.querySelectorAll('[data-show-qr]').forEach(btn=>{
        const on = btn.dataset.showQr === activeKey;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function labelFor(key){ return key==='ig' ? 'Instagram' : key==='fb' ? 'Facebook' : 'LINE'; }

    // ตั้ง platform: load รูปและจัด UI
    async function setPlatform(key){
      const myId = ++latestSetId;
      if (DEBUG) console.log('[KNW] setPlatform()', key, 'id=', myId);

      updatePlatformButtons(key);
      if (PLATFORM_LABEL) PLATFORM_LABEL.textContent = labelFor(key);
      if (WRAP) WRAP.className = 'qr-wrap ' + (key==='ig' ? 'ig' : key==='fb' ? 'fb' : 'line');

      hideFallback();

      // subtle loading state
      if (IMG){ IMG.style.opacity = '0.6'; IMG.style.filter = 'blur(1px) grayscale(.02)'; }

      let src = null;
      try {
        src = await findWorkingSrc(key);
      } catch(err){
        console.error('[KNW] setPlatform: findWorkingSrc threw', err);
      }

      // abort if another call happened
      if (myId !== latestSetId) {
        if (DEBUG) console.log('[KNW] setPlatform aborted (outdated id)', myId);
        return;
      }

      if (src){
        IMG.src = src;
        IMG.alt = 'QR Code ของผู้ดูแล (' + labelFor(key) + ')';
        IMG.style.display = '';
        IMG.style.opacity = '';
        IMG.style.filter = '';
        if (FBACK) FBACK.classList.add('hidden');
        if (DEBUG) console.log('[KNW] image applied for', key, src);
      } else {
        // ไม่พบไฟล์: แสดง fallback
        const msg = 'ไม่พบภาพ QR (' + labelFor(key) + ') — กรุณาตรวจสอบไฟล์ใน ' + PATHS.join(' หรือ ');
        if (DEBUG) console.warn('[KNW] no image for', key, msg);
        if (FBACK) {
          // ใส่ข้อความ fallback ให้ชัดเจน
          try {
            FBACK.querySelector('div.muted').innerHTML = msg + ' — (ตัวอย่างชื่อไฟล์: qr-' + key + '.png)';
          } catch(e){}
        }
        showFallback();
      }
    }

    // เชื่อมปุ่ม (ถ้ามี)
    BUTTONS.forEach(btn=>{
      // ป้องกันกรณีปุ่มเป็น <button> ที่ไม่มี type (ทำให้เป็น submit ใน form)
      if (btn.tagName.toLowerCase() === 'button' && !btn.hasAttribute('type')) {
        btn.setAttribute('type', 'button');
      }

      btn.addEventListener('click', (ev)=>{
        ev.preventDefault();
        const key = btn.dataset.showQr;
        if (!key) return console.warn('[KNW] button has no data-show-qr value', btn);
        setPlatform(key);
      });
    });

    // initial render: เริ่มด้วย IG หากต้องการเปลี่ยน ให้เรียก window._knw_setQR('fb') เป็นต้น
    setPlatform('ig');

    // expose for debugging / programmatic control
    window._knw_setQR = function(key){
      if (!key) return;
      setPlatform(key);
    };

    if (DEBUG) console.log('[KNW] init() done');
  } // end init()

})();
