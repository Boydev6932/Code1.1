/* ==========================================================================
   script.js — unified for index + contact-admin
   - safe (no innerHTML), guards for missing elements
   - fallback images as inline SVG if asset missing
   - supports both index (name search) & contact-admin (QR toggle)
   -------------------------------------------------------------------------- */

(function () {
  'use strict';

  /* ========== CONFIG ========== */
  const ASSETS_DIR     = './assets';      // โฟลเดอร์รูป (relative to HTML)
  const SLIDE_INTERVAL = 7000;            // ms: เวลาพักก่อนเปลี่ยนภาพ
  const TRANSITION_MS  = 2000;            // ms: เวลาการเลื่อน (ต้องตรงกับ CSS transition ใช้งานทั้งคู่)

  /* ========== UTILS ========== */

  // แปลงค่า backgroundImage "url('...')" ให้เป็น URL ธรรมดา หรือ null
  function extractUrl(bg) {
    if (!bg || bg === 'none') return null;
    // bg อาจเป็น: url("assets/bg1.jpg") หรือ url(assets/bg1.jpg)
    const m = /url\((['"]?)(.+?)\1\)/.exec(bg);
    return m ? m[2] : null;
  }

  // สร้าง SVG fallback เป็น data URI (เรียบง่าย)
  function makeBgFallback(i) {
    const colors = ['#7f8c8d', '#95a5a6', '#8e9aa3', '#9aa5ab'];
    const color = colors[i % colors.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Segoe UI' font-size='28' fill='#ffffff'>Background ${i+1}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  // สร้าง QR fallback (data URI)
  function makeQrFallback(name) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320' viewBox='0 0 320 320'><rect width='100%' height='100%' rx='20' fill='#f3f4f6'/><rect x='18' y='18' width='284' height='284' rx='12' fill='white' stroke='#e5e7eb'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Segoe UI' font-size='18' fill='#111'>QR — ${name}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  /* ========== SLIDESHOW (เลื่อนขึ้นจาก assets) ========== */
  function initSlideshow() {
    const container = document.querySelector('.bg-slideshow');
    if (!container) return;

    const slidesNodeList = container.querySelectorAll('.slide');
    if (!slidesNodeList || slidesNodeList.length === 0) return;

    const slides = Array.from(slidesNodeList);

    // เตรียม preload และตั้งค่าเริ่มต้น
    slides.forEach((s, i) => {
      // หา url ที่มีอยู่ (inline style หรือ computed)
      const inlineBg = s.style.backgroundImage;
      const computedBg = window.getComputedStyle(s).backgroundImage;
      let url = extractUrl(inlineBg) || extractUrl(computedBg);

      // ถ้าไม่พบ ให้กำหนดภาพตาม convention assets/bg{i+1}.jpg
      if (!url) {
        url = `${ASSETS_DIR}/bg${i + 1}.jpg`;
        s.style.backgroundImage = `url("${url}")`;
      }

      // preload ภาพ เพื่อลดการกระพริบตอนสลับ
      const img = new Image();
      img.onload = function () {
        // ถ้ามีภาพโหลดได้ ให้เพิ่ม class บน body เพื่อให้ CSS fallback หายไป (ถ้าใช้)
        document.body.classList.add('has-bg-images');
      };
      img.onerror = function () {
        // ถ้าโหลดไม่ขึ้น เปลี่ยนเป็น fallback SVG
        s.style.backgroundImage = `url("${makeBgFallback(i)}")`;
      };
      // เริ่ม preload
      img.src = url;

      // ตั้งค่าการแสดงผล (positioning / transition)
      s.style.position = 'absolute';
      s.style.left = '0';
      s.style.width = '100%';
      s.style.height = '100%';
      s.style.backgroundSize = 'cover';
      s.style.backgroundPosition = 'center';
      s.style.transition = `top ${TRANSITION_MS}ms ease-in-out`;
      s.style.willChange = 'top';
      s.style.top = i === 0 ? '0%' : '100%';
      s.style.zIndex = i === 0 ? '1' : '0';
      s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
    });

    // current index
    let current = 0;

    // ฟังก์ชันเปลี่ยนภาพถัดไป (เลื่อนขึ้น)
    function nextSlide() {
      const prev = current;
      current = (current + 1) % slides.length;

      const prevSlide = slides[prev];
      const nextSlideEl = slides[current];

      // เตรียม z-index ให้ next อยู่เหนือ prev ขณะเลื่อน
      nextSlideEl.style.zIndex = '2';
      nextSlideEl.setAttribute('aria-hidden', 'false');

      // เริ่มแอนิเมชัน: prev เลื่อนขึ้นออก (-100%), next เลื่อนขึ้นมา (0%)
      // (ทั้งสองมี transition ที่กำหนดไว้แล้ว)
      prevSlide.style.top = '-100%';
      nextSlideEl.style.top = '0%';

      // หลัง transition เสร็จ: reset prev ให้กลับลงด้านล่าง (100%) เพื่อใช้ใหม่ในรอบต่อไป
      window.setTimeout(() => {
        // คืนค่า z-index และ position ของ prev เพื่อเตรียมการวนซ้ำ
        prevSlide.style.top = '100%';
        prevSlide.style.zIndex = '0';
        prevSlide.setAttribute('aria-hidden', 'true');

        // next เป็นหลักแล้ว ให้ปรับ zIndex ให้เป็น 1 (ป้องกัน stacking ปัญหา)
        nextSlideEl.style.zIndex = '1';
      }, TRANSITION_MS);
    }

    // เริ่ม loop
    const intervalId = window.setInterval(nextSlide, SLIDE_INTERVAL);

    // บันทึก id ไว้บน container เผื่ออยาก clearLater
    container.__slideshowInterval = intervalId;
  }

  /* ========== DATA (รายชื่อ) ========== */
  const names = [
    "กบิลพัสดุ์​ แสงชัย","แทนคุณ จันงาม","สุรบดี ทองสุก","นราวิชญ์ ไชยหันขวา",
    "จิรัชยานันท์ แข็งขยัน","อภิชา เพียชิน","ญาณาธ ธนชิตชัยกุล","ทิวากร ฉัตรานุฉัตร",
    "พงศกร ขำตา","ยศพร อนะคร","ปัณณวัฒน์ ไทยวังชัย","ภูมิภัทร สามารถกุล",
    "แทนทันฑ์ โยนอก","ณภัทร พลทรักษา","สหัสวรรษ มหาปัญญาวงศ์","พงษ์พล กีรตินันท์กูล",
    "รชต สีลามี","ณภัทร โสดาจันทร์","ยศสรัล สายชม","ธนโชติ โชติจิตร์",
    "ปภาวิน ไตยนำ","ชยังกูร พิมพ์ดีด","ดำรงศิริ รุ่งโรจน์","เทพภาณุ งามนิรัตน์",
    "กิตติภณ คงศิลา","อธิวิทธ์ โยธาสมบัติ","ชิโรดล พิชนะชน","รติวรรธน์ แสนจันทร์ฮาม",
    "ถิรคุณ แถมเงิน","พัทธดนย์ อินทรสงเคราะห์","กฤติณ ปวีณาภรณ์","ภูริธาดา ภูริวัฒมนสุข",
    "กิตติศักดิ์ จันทะนันต์","กูลคูณโชคจ์ ศิริเต็มกุล","ณัฐชนน พราหมณ์ตะขบ","กิตติภัทร อัมมาลา",
    "พงษ์ปภัสร์ สิมลี","เคลวิน สุริสาย ดีเฟนบัค","อธิชัย พวงสูงเนิน","ชลกร นิยมสินธุ์",
    "กันต์นที หลงเก็ม","ธีรภัทร พลดงนอก","ภูวรรษ ควรคำ","ราชิต หงษ์คะ",
    "เนติ เศรษฐ์พงศ์พันธ์","กิตติพัฒน์ ด่านซ้าย","กิตติภัทร อรรถาเวช","หรัณยฤษฎ์ ภูผันผิน",
    "กมลทิศ แก้วบุดดา","นิลพัทธ์ ฆารพุธ","พันทกานต์ กันทา","ธนกร มหามณี",
    "นันทภพ แสงตามี","ณัฐพงษ์ ทัพซ้าย","ณวรรษ วงษ์เทพ","ธรรมสรณ์ อุตาชัย",
    "พอเพียง ชุมแวงวาปี","จารุพัฒน์ คำจุมพล","ศิวกร แสนนาม","ภาคภูมิ จูมเกษ",
    "สุพลวรรธน์ อินทรโก","รัชพล สมภาร","ราม่อน ริชาร์ด เกรนแนน","อินทัช ชินอ้วน",
    "ณัฐพล โชติชัย","อริยะ อุทัยสาง","ธนดล แซงบุญเรือง","ตรินัยน์ ระว้า",
    "ณัฐชนน อุรัญ","ธนพัทร มุลละคร","ภูธิป คำภา","วิวัฒน์ แสงแก้ว",
    "เมธัส บัวดี","ธัชชัย สานทอง","ธนากร มูลคำกาเจริญ","กิตติพัค ภักดีอำนาจ",
    "ศุภกฤต พิลาดา","โชติปุญโญ นนสีลาด","ธีรวัจน์ จิรวัตรชูเลิศ","ธนภัทร มาตุธรรมธาดา",
    "มหัทธโน เลิศเสถียร","กัตภณ นาควัฒนกุล","บุญชนก ชื่อตรง","นราวิชญ์ ผางจันทร์ดา",
    "ณฐกร นาคเจือทอง","คูณอนันต์ สิงห์วิเศษ","ปฐวี ไชยประเสริฐ","กัณตพัฒน์ ม้าเมือง",
    "ภัทรดนัย พลตรี","อิศรานุวัฒน์ เวียงนนท์","ชินดนัย สิงห์อารมย์","จุติราม ไชยมาตย์",
    "อัยยากานต์ โนนศรี","ณปกร กุนอก","ธีร์จุฑา ก้อนแก้ว","คธาธิป วงษ์ภักดี",
    "ไชยณรงค์ เลิศเสถียร","คณิศร แพทย์กิจ","ชวิน ชื่นนิรันด์","ชิษนุพงษ์ สอนสุภาพ",
    "ชิษนุพงษ์ ปิยะวงษ์","ณภัทร สมบัติหอม","ทยากร พัดสุวรรณ","ธนกฤต ฉลูทอง",
    "ธนกฤต ผงทอง","ธนศาสตร์ พวงผกา","ปภังกร นาควิเชียร","ปองคุณ เลนคำมี",
    "ปัณณวิชญ์ วีระพลศิลป์","พีรวัส เหล่าจูม","ภูวสิษฏ์ นูเร","ยศกร ร่วมพัฒนา",
    "วิวิทย์ นาคเครือ","ศิววงศ์ สิทธิศิริสาร","สิรภพ อังคะวรางกูร","อุ้มบุญ ชื่นตา",
    "ฐานพัฒน์ บุตรวงศ์","ธนกร ไพรีรณ"
  ];

  const needFixIndexes = [0,1,4,7,8,11,18,28,48,56,58,63,64,71,74,76,83,100,105,114,115,116];

  /* ========== HELPERS ========== */

  // onReady: ถ้า DOM ยัง loading ให้รอ DOMContentLoaded มิฉะนั้นเรียกทันที
  const onReady = function (fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  // normalize string for search
  const normalize = function (s) {
    return (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  };

  // Levenshtein distance (for fuzzy matching)
  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }

    return dp[m][n];
  }

  const similarity = function (q, t) {
    const L = Math.max(q.length, t.length) || 1;
    return 1 - (levenshtein(q, t) / L);
  };

  /* ========== INDEX (search UI) ========== */
  function initIndex() {
    const nameSelect = document.getElementById('name');
    if (!nameSelect) return;

    const searchInput = document.getElementById('name-search');
    const searchBtn   = document.getElementById('search-btn');
    const resetBtn    = document.getElementById('reset-btn');
    const resultBox   = document.getElementById('result');

    // populate select if empty
    if (nameSelect.options.length <= 1) {
      names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        nameSelect.appendChild(opt);
      });
    }

    // set result box text + classes
    function setResult(text, mode) {
      if (!resultBox) return;
      resultBox.className = '';
      if (!text || mode === 'hide') {
        resultBox.textContent = '';
        resultBox.classList.add('hidden');
        return;
      }
      resultBox.textContent = text;
      resultBox.classList.remove('hidden');
      if (mode === 'ok') resultBox.classList.add('status-ok');
      if (mode === 'bad') resultBox.classList.add('status-bad');
      if (mode === 'warn') resultBox.classList.add('status-warn');
    }

    // fuzzy find best index
    function findBestIndex(query) {
      const q = normalize(query);
      if (q.length < 2) return -1;
      let best = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < names.length; i++) {
        const full = normalize(names[i]);
        const parts = full.split(' ');
        const first = parts[0] || '';
        const last = parts[parts.length - 1] || '';
        let score = 0;
        if (first.includes(q)) score += 0.35;
        if (last.includes(q)) score += 0.45;
        if (full.includes(q)) score += 0.2;
        const sim = Math.max(similarity(q, first), similarity(q, last), similarity(q, full));
        score += sim;
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    }

    // select index and show status
    function selectIndex(idx) {
      if (idx < 0 || idx >= names.length) {
        setResult('⚠️ ไม่พบชื่อที่ใกล้เคียง กรุณาลองพิมพ์ใหม่', 'warn');
        return;
      }
      nameSelect.value = names[idx];
      nameSelect.classList.add('is-matched');
      nameSelect.dispatchEvent(new Event('change', { bubbles: true }));
      try {
        nameSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) { /* ignore */ }
      if (needFixIndexes.includes(idx)) {
        setResult('❌ ติด มผ. — กรุณาแก้ไข❗', 'bad');
      } else {
        setResult('✅ ผ่าน มผ. — ทำดีต่อไป🤟', 'ok');
      }
    }

    function runSearch() {
      if (!searchInput) return;
      const q = searchInput.value.trim();
      if (q.length < 2) {
        searchInput.classList.remove('shake');
        void searchInput.offsetWidth;
        searchInput.classList.add('shake');
        searchInput.focus();
        return;
      }
      const idx = findBestIndex(q);
      selectIndex(idx);
    }

    // events
    if (searchBtn) searchBtn.addEventListener('click', runSearch);
    if (searchInput) searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        runSearch();
      }
    });

    if (nameSelect) nameSelect.addEventListener('change', () => {
      const val = nameSelect.value;
      if (!val) {
        setResult('', 'hide');
        return;
      }
      const idx = names.indexOf(val);
      if (idx === -1) {
        setResult('', 'hide');
        return;
      }
      if (needFixIndexes.includes(idx)) {
        setResult('❌ ติด มผ. — กรุณาแก้ไข❗', 'bad');
      } else {
        setResult('✅ ผ่าน มผ. — ทำดีต่อไป🤟', 'ok');
      }
    });

    if (resetBtn) resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      nameSelect.selectedIndex = 0;
      nameSelect.classList.remove('is-matched');
      nameSelect.dispatchEvent(new Event('change', { bubbles: true }));
      setResult('', 'hide');
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) { /* ignore */ }
    });

    // slideshow fallback: ถ้า slide ไม่มี backgroundImage ให้ใส่ fallback
    const slideEls = document.querySelectorAll('.bg-slideshow .slide');
    slideEls.forEach((div, i) => {
      const bgInline = div.style.backgroundImage;
      const bgComputed = window.getComputedStyle(div).backgroundImage;
      if (!extractUrl(bgInline) && !extractUrl(bgComputed)) {
        div.style.backgroundImage = `url("${makeBgFallback(i)}")`;
      }
    });
  }

  /* ========== CONTACT (QR toggles) ========== */
  function initContact() {
    const qrImg = document.getElementById('contact-qr-img') || document.getElementById('qr-img');
    if (!qrImg) return;

    const labelEl = document.getElementById('qr-platform-label');
    const buttons = Array.from(document.querySelectorAll('[data-show-qr]'));
    const card    = document.querySelector('.card');

    const platforms = {
      ig:   { label: 'Instagram', file: `${ASSETS_DIR}/qr-instagram.png` },
      fb:   { label: 'Facebook',  file: `${ASSETS_DIR}/qr-facebook.png` },
      line: { label: 'LINE',      file: `${ASSETS_DIR}/qr-line.png` }
    };

    // ตรวจสอบ URL ปลอดภัย (relative/absolute)
    function safeUrl(url) {
      try {
        const u = new URL(url, window.location.href);
        if (u.protocol === 'https:' || u.origin === window.location.origin || u.protocol === 'file:') return u.href;
      } catch (e) { /* ignore invalid URL */ }
      return null;
    }

    function setPlatform(key) {
      if (!platforms[key]) return;
      const raw = platforms[key].file;
      const safe = safeUrl(raw) || raw;

      qrImg.onerror = function () {
        qrImg.onerror = null;
        qrImg.src = makeQrFallback(platforms[key].label);
      };

      qrImg.src = safe;
      qrImg.alt = `QR Code ของผู้ดูแล (${platforms[key].label})`;

      if (labelEl) labelEl.textContent = platforms[key].label;

      buttons.forEach(b => {
        const active = b.getAttribute('data-show-qr') === key;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      if (card) {
        card.classList.remove('accent-ig', 'accent-fb', 'accent-line');
        card.classList.add(`accent-${key}`);
      }
    }

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-show-qr');
        setPlatform(p);
        try { qrImg.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
      });
    });

    // ค่าเริ่มต้น
    setPlatform('ig');
  }

  /* ========== BOOT ========== */
  onReady(function () {
    try {
      initSlideshow();
    } catch (e) {
      console.error('slideshow error', e);
    }

    try {
      initIndex();
    } catch (e) {
      console.error('initIndex error', e);
    }

    try {
      initContact();
    } catch (e) {
      console.error('initContact error', e);
    }

    // set year in footer
    const yEl = document.getElementById('year');
    if (yEl) yEl.textContent = new Date().getFullYear();
  });

  /* ========== Minimal helpers for small UI pieces (reset button / QR binds) ========== */
  // Reset button behavior and QR toggles for any remaining elements:
  (function minimalSharedBehaviors() {
    // year in footer (redundant-safe)
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    // reset button (redundant-safe)
    const nameInput = document.getElementById('name-search');
    const resetBtn  = document.getElementById('reset-btn');
    const resultBox = document.getElementById('result');
    const nameSelect = document.getElementById('name');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (nameInput) nameInput.value = '';
        if (nameSelect) nameSelect.selectedIndex = 0;
        if (resultBox) {
          resultBox.classList.add('hidden');
          resultBox.textContent = '';
          resultBox.classList.remove('status-ok', 'status-bad', 'status-warn');
        }
        if (nameInput) nameInput.focus();
      });
    }

    // Simple QR toggle fallback (for elements that might exist outside initContact)
    const qrImg = document.getElementById('contact-qr-img');
    const qrWrap = document.getElementById('qr-wrap');
    const qrLabel = document.getElementById('qr-platform-label');
    const toggleButtons = document.querySelectorAll('[data-show-qr]');

    const map = {
      ig:   { src: `${ASSETS_DIR}/qr-instagram.png`, label: 'Instagram', wrapClass: 'ig' },
      fb:   { src: `${ASSETS_DIR}/qr-facebook.png`,  label: 'Facebook',  wrapClass: 'fb' },
      line: { src: `${ASSETS_DIR}/qr-line.png`,      label: 'LINE',      wrapClass: 'line' }
    };

    if (toggleButtons && toggleButtons.length) {
      toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          toggleButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const key = btn.getAttribute('data-show-qr');
          const conf = map[key];
          if (!conf) return;

          if (qrImg) {
            qrImg.src = conf.src;
            qrImg.alt = `QR Code ของผู้ดูแล (${conf.label})`;
          }
          if (qrLabel) qrLabel.textContent = conf.label;
          if (qrWrap) {
            qrWrap.classList.remove('ig', 'fb', 'line');
            qrWrap.classList.add(conf.wrapClass);
          }
        });
      });
    }
  })();

})();


// js/script.js — robust QR toggle: รองรับทั้ง file:// (direct open) และ http server
document.addEventListener('DOMContentLoaded', function () {
  // set year if element present
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // detect base path:
  // - ถ้าเปิดด้วย file:// ให้ใช้ './assets'
  // - ถ้าใช้ http/https ให้ใช้ '/assets' (root) เพื่อความแน่นอนบน server
  // แต่บาง deployment ต้องการ 'assets' (relative) — log ช่วย debug
  let base;
  if (location.protocol === 'file:') {
    base = './assets';
  } else {
    // ถ้าหน้า html ถูก serve จาก sub-path ของเว็บ คุณอาจต้องเปลี่ยนเป็น relative:
    // base = window.location.pathname.endsWith('/') ? window.location.pathname + 'assets' : '/assets';
    // แต่โดยทั่วไปใช้ '/assets' จะชี้ไปที่ root domain
    base = '/assets';
  }

  // ถ้าต้องการ fallback ให้ใช้ relative ถ้า file not found (try both)
  const trySrc = (p) => {
    return p;
  };

  const map = {
    ig:   { src: trySrc(base + '/qr-instagram.png'), label: 'Instagram', wrapClass: 'ig' },
    fb:   { src: trySrc(base + '/qr-facebook.png'),  label: 'Facebook',  wrapClass: 'fb' },
    line: { src: trySrc(base + '/qr-line.png'),      label: 'LINE',      wrapClass: 'line' }
  };

  // preload (ดีช่วยลด flash)
  Object.values(map).forEach(cfg => {
    const im = new Image();
    im.src = cfg.src;
  });

  const qrImg   = document.getElementById('contact-qr-img');
  const qrWrap  = document.getElementById('qr-wrap');
  const qrLabel = document.getElementById('qr-platform-label');
  const fallback= document.getElementById('qr-fallback');
  const toggleButtons = document.querySelectorAll('[data-show-qr]');

  function showQR(key) {
    if (!map[key]) return;
    const conf = map[key];

    // active button visual
    toggleButtons.forEach(b => b.classList.remove('active'));
    const btn = document.querySelector('[data-show-qr="' + key + '"]');
    if (btn) btn.classList.add('active');

    // change wrapper class for color border
    if (qrWrap) {
      qrWrap.classList.remove('ig','fb','line');
      qrWrap.classList.add(conf.wrapClass);
    }

    if (!qrImg) return;

    // hide fallback during load
    if (fallback) fallback.classList.add('hidden');

    // try load; onerror shows fallback
    qrImg.style.display = 'block';
    qrImg.onload = function () {
      // success
      if (fallback) { fallback.classList.add('hidden'); fallback.setAttribute('aria-hidden','true'); }
    };
    qrImg.onerror = function () {
      qrImg.style.display = 'none';
      if (fallback) { fallback.classList.remove('hidden'); fallback.setAttribute('aria-hidden','false'); }
    };
    // set src (this triggers onload/onerror)
    qrImg.src = conf.src;
    if (qrLabel) qrLabel.textContent = conf.label;
  }

  if (toggleButtons && toggleButtons.length) {
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const key = btn.getAttribute('data-show-qr');
        showQR(key);
      });
    });
  }

  // initial
  const activeBtn = document.querySelector('[data-show-qr].active') || document.querySelector('[data-show-qr="ig"]');
  if (activeBtn) {
    showQR(activeBtn.getAttribute('data-show-qr'));
  } else {
    showQR('ig');
  }

  // DEBUG: ถ้าโหลดไม่ขึ้น ให้ log URL ที่พยายามโหลด
  // (ลบออกได้เมื่อเสร็จ)
  //console.log('QR base used:', base);
});

// js/script.js
(() => {
  const img = document.getElementById('contact-qr-img');
  const wrap = document.getElementById('qr-wrap');
  const label = document.getElementById('qr-platform-label');
  const fallback = document.getElementById('qr-fallback');

  const MAP = {
    ig:   { file: 'qr-instagram.png', label: 'Instagram', cls: 'ig' },
    fb:   { file: 'qr-facebook.png',   label: 'Facebook',  cls: 'fb' },
    line: { file: 'qr-line.png',       label: 'LINE',      cls: 'line' }
  };

  // ใช้ path สัมพันธ์กับไฟล์ HTML เสมอ
  const ASSETS = './assets/';

  function setPlatform(key) {
    const m = MAP[key];
    if (!m) return;

    // สลับปุ่ม active
    document.querySelectorAll('.btn.btn-ghost').forEach(b => {
      b.classList.toggle('active', b.dataset.showQr === key);
      b.setAttribute('aria-pressed', b.dataset.showQr === key ? 'true' : 'false');
    });

    // อัปเดต UI
    wrap.className = `qr-wrap ${m.cls}`;
    label.textContent = m.label;

    // รีเซ็ต fallback + แสดงรูป
    fallback.classList.add('hidden');
    img.style.display = '';
    img.src = ASSETS + m.file;    // ให้โหลดจาก ./assets/ เสมอ
  }

  // bind events
  document.querySelectorAll('[data-show-qr]').forEach(btn => {
    btn.addEventListener('click', () => setPlatform(btn.dataset.showQr));
  });

  // ค่าเริ่มต้น
  setPlatform('ig');
})();

