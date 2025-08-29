/* ==========================================================================
   script.js — FINAL CLEAN
   - ไม่แตะต้อง/ไม่ใส่ฟิลเตอร์กับพื้นหลัง (ปล่อยให้ CSS ทำ crossfade)
   - ใช้ภาพจาก ./assets/bg1.jpg ... bg4.jpg เท่านั้น
   - ไม่มี overlay/เลเยอร์ซ้อน/โค้ดซ้ำ/บั๊ก nextSlide
   - รวมเฉพาะฟังก์ชันที่จำเป็น: year + preload, Index search, Contact QR
   ========================================================================== */

(() => {
  'use strict';

  /* ========== CONFIG (คงที่เพื่อกันพาธเพี้ยน) ========== */
  const ASSETS_DIR  = './assets';
  const SLIDE_FILES = ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg']; // ต้องมีใน ./assets

  /* ========== UTILS ========== */
  const onReady = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  };

  const normalize = (s) => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

  // Levenshtein distance + similarity (ใช้กับ fuzzy search)
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
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
  const similarity = (q, t) => {
    const L = Math.max(q.length, t.length) || 1;
    return 1 - (levenshtein(q, t) / L);
  };

  /* ========== ปีใน footer + พรีโหลดภาพสไลด์ + เก็บกวาดสไลด์ (ไม่มีการเปลี่ยนภาพด้วย JS) ========== */
  function initYearAndPreload() {
    const yEl = document.getElementById('year');
    if (yEl) yEl.textContent = new Date().getFullYear();

    // พรีโหลดภาพเพื่อลดการกระพริบ (ไม่แก้ไข style พื้นหลัง)
    SLIDE_FILES.forEach(f => {
      const img = new Image();
      img.src = `${ASSETS_DIR}/${f}`;
    });

    // ลบชิ้นส่วนที่อาจบังภาพภายใน .bg-slideshow เท่านั้น (กันหมอก/veil)
    const cont = document.querySelector('.bg-slideshow');
    if (cont) {
      cont.querySelectorAll('.slide .slide-overlay, .slide .veil, .slide .bg-tint, .slide .tint, .slide .mask')
          .forEach(n => n.remove());
      // ไม่ตั้ง filter/opacity/background ใด ๆ เพิ่ม — ปล่อยให้ CSS คุมล้วน ๆ
    }
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

  /* ========== INDEX (search UI) ========== */
  function initIndex() {
    const nameSelect = document.getElementById('name');
    if (!nameSelect) return;

    const searchInput = document.getElementById('name-search');
    const searchBtn   = document.getElementById('search-btn');
    const resetBtn    = document.getElementById('reset-btn');
    const resultBox   = document.getElementById('result');

    // เติมรายชื่อใน <select> ถ้ายังไม่มี
    if (nameSelect.options.length <= 1) {
      names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        nameSelect.appendChild(opt);
      });
    }

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
      if (mode === 'ok')   resultBox.classList.add('status-ok');
      if (mode === 'bad')  resultBox.classList.add('status-bad');
      if (mode === 'warn') resultBox.classList.add('status-warn');
    }

    function findBestIndex(query) {
      const q = normalize(query);
      if (q.length < 2) return -1;
      let best = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < names.length; i++) {
        const full = normalize(names[i]);
        const parts = full.split(' ');
        const first = parts[0] || '';
        const last  = parts[parts.length - 1] || '';
        let score = 0;
        if (first.includes(q)) score += 0.35;
        if (last.includes(q))  score += 0.45;
        if (full.includes(q))  score += 0.20;
        const sim = Math.max(similarity(q, first), similarity(q, last), similarity(q, full));
        score += sim;
        if (score > bestScore) { bestScore = score; best = i; }
      }
      return best;
    }

    function selectIndex(idx) {
      if (idx < 0 || idx >= names.length) {
        setResult('⚠️ ไม่พบชื่อที่ใกล้เคียง กรุณาลองพิมพ์ใหม่', 'warn');
        return;
      }
      nameSelect.value = names[idx];
      nameSelect.classList.add('is-matched');
      nameSelect.dispatchEvent(new Event('change', { bubbles: true }));
      try { nameSelect.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}

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
        void searchInput.offsetWidth; // reflow
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
      if (e.key === 'Enter') { e.preventDefault(); runSearch(); }
    });

    if (nameSelect) nameSelect.addEventListener('change', () => {
      const val = nameSelect.value;
      if (!val) { setResult('', 'hide'); return; }
      const idx = names.indexOf(val);
      if (idx === -1) { setResult('', 'hide'); return; }
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
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {}
    });
  }

  /* ========== CONTACT (QR toggles) ========== */
  function initContact() {
    const qrImg   = document.getElementById('contact-qr-img') || document.getElementById('qr-img');
    const labelEl = document.getElementById('qr-platform-label');
    const wrap    = document.getElementById('qr-wrap');
    const buttons = Array.from(document.querySelectorAll('[data-show-qr]'));
    if (!qrImg || buttons.length === 0) return;

    const platforms = {
      ig:   { label: 'Instagram', src: `${ASSETS_DIR}/qr-instagram.png`, cls: 'ig' },
      fb:   { label: 'Facebook',  src: `${ASSETS_DIR}/qr-facebook.png`,  cls: 'fb' },
      line: { label: 'LINE',      src: `${ASSETS_DIR}/qr-line.png`,      cls: 'line' }
    };

    // พรีโหลด QR
    Object.values(platforms).forEach(p => { const im = new Image(); im.src = p.src; });

    function setPlatform(key) {
      const p = platforms[key];
      if (!p) return;
      buttons.forEach(b => {
        const active = b.getAttribute('data-show-qr') === key;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      if (wrap) {
        wrap.classList.remove('ig','fb','line');
        wrap.classList.add(p.cls);
      }
      qrImg.src = p.src;
      qrImg.alt = `QR Code ของผู้ดูแล (${p.label})`;
      if (labelEl) labelEl.textContent = p.label;
    }

    buttons.forEach(btn => btn.addEventListener('click', () => setPlatform(btn.getAttribute('data-show-qr'))));
    setPlatform('ig'); // ค่าเริ่มต้น
  }

  /* ========== BOOT ========== */
  onReady(() => {
    initYearAndPreload();
    initIndex();
    initContact();
  });

})();
