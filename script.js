/* =======================
   script.js — ใช้ร่วม 2 หน้า (index + contact-admin)
   ปลอดภัย: ไม่มี innerHTML, ไม่มี eval, ไม่มี inline script
   ✅ ใช้ class แทน inline-style ตาม CSP
   ======================= */

/* ---------- รายชื่อ (ฐานข้อมูล) ---------- */
const data = [
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
const needFix = [1,2,5,8,9,12,19,29,49,57,59,64,65,72,75,77,84,101,106,115,116,117].map(n => n-1);

/* ---------- ยูทิลทั่วไป ---------- */
function domReady(cb){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',cb);
  } else { cb(); }
}
const normalize = (s)=> (s||'').toString().trim().replace(/\s+/g,' ').toLowerCase();

// Levenshtein (สำหรับ fuzzy search)
function levenshtein(a,b){
  const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[m][n];
}
const similarity=(q,t)=>{const L=Math.max(q.length,t.length)||1; return 1-(levenshtein(q,t)/L);};

/* ---------- หน้า index.html ---------- */
function initIndexPage(){
  const nameSelect = document.getElementById('name');
  const resultBox  = document.getElementById('result');
  const searchInput= document.getElementById('name-search');
  const searchBtn  = document.getElementById('search-btn');
  const resetBtn   = document.getElementById('reset-btn');
  if(!nameSelect || !resultBox) return; // ไม่ใช่หน้านี้ก็ออก

  // เติมรายชื่อใน dropdown (ป้องกัน XSS ด้วย textContent)
  if (nameSelect.options.length <= 1) {
    data.forEach(name => {
      const opt=document.createElement('option');
      opt.value=name; opt.textContent=name;
      nameSelect.appendChild(opt);
    });
  }

  function clearMatchHighlight(){ nameSelect.classList.remove('is-matched'); }
  nameSelect.addEventListener('change', clearMatchHighlight);

  // ค้นหาชื่อที่ใกล้ที่สุด (fuzzy)
  function findBestIndex(query){
    const q=normalize(query); if(q.length<2) return -1;
    let bestIdx=-1, bestScore=-Infinity;
    for(let i=0;i<data.length;i++){
      const full=normalize(data[i]); const [first='',last='']=full.split(' ');
      let score=0;
      if(first.includes(q)) score+=0.35;
      if(last.includes(q))  score+=0.45;
      if(full.includes(q))  score+=0.20;
      const sim=Math.max(similarity(q,first), similarity(q,last), similarity(q,full));
      score+=sim;
      if(score>bestScore){ bestScore=score; bestIdx=i; }
    }
    return bestIdx;
  }

  // แสดงผลสถานะ (ใช้ class แทนปรับ style ตรง ๆ)
  function setResult(message, mode){ // mode: ok|bad|warn|hide
    resultBox.classList.remove('hidden','status-ok','status-bad','status-warn');
    if(mode==='hide'){ resultBox.textContent=''; resultBox.classList.add('hidden'); return; }
    if(mode==='ok')   resultBox.classList.add('status-ok');
    if(mode==='bad')  resultBox.classList.add('status-bad');
    if(mode==='warn') resultBox.classList.add('status-warn');
    resultBox.textContent = message;
  }

  function checkStatus(){
    const name=nameSelect.value;
    if(!name){ setResult('', 'hide'); return; }
    const index=data.indexOf(name);
    if(index===-1){ setResult('', 'hide'); return; }
    if(needFix.includes(index)){
      setResult("❌ ติด มผ. แก้ด้วย!", 'bad');
    }else{
      setResult("✅ ผ่าน มผ. ทำดีต่อไป!", 'ok');
    }
  }

  // เลือก index และเลื่อนโฟกัส
  function selectIndex(idx){
    if(idx<0 || idx>=data.length) {
      setResult("⚠️ ไม่พบชื่อที่ใกล้เคียง กรุณาลองพิมพ์ใหม่", 'warn');
      return;
    }
    nameSelect.value=data[idx];
    nameSelect.classList.add('is-matched');
    nameSelect.dispatchEvent(new Event('change',{bubbles:true}));
    nameSelect.focus({preventScroll:true});
    nameSelect.scrollIntoView({behavior:'smooth', block:'center'});
    setTimeout(()=>{ if(!resultBox.classList.contains('hidden')){ resultBox.scrollIntoView({behavior:'smooth', block:'center'});} },150);
  }

  // ทำงานค้นหา (ใช้ class .shake)
  function runSearch(){
    if(!searchInput) return;
    const q=searchInput.value.trim();
    if(q.length<2){
      searchInput.classList.remove('shake'); void searchInput.offsetWidth; searchInput.classList.add('shake');
      searchInput.focus(); return;
    }
    const idx=findBestIndex(q);
    selectIndex(idx);
  }

  if(searchBtn)   searchBtn.addEventListener('click', runSearch);
  if(searchInput) searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); runSearch(); }});

  // ผูก change เพื่อคำนวณสถานะ
  nameSelect.addEventListener('change', checkStatus);

  // RESET ครบถ้วน
  if(resetBtn){
    resetBtn.addEventListener('click', ()=>{
      if(searchInput) searchInput.value='';
      nameSelect.classList.remove('is-matched');
      nameSelect.selectedIndex=0;
      nameSelect.dispatchEvent(new Event('change',{bubbles:true}));
      setResult('', 'hide');
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }
}

/* ---------- หน้า contact-admin.html ---------- */
function initContactPage(){
  const qrImg   = document.getElementById('contact-qr-img');
  const caption = document.querySelector('.qr-caption');
  const buttons = Array.from(document.querySelectorAll('[data-show-qr]'));
  if(!qrImg || !caption || buttons.length===0) return; // ไม่ใช่หน้านี้

  // whitelist ปุ่ม
  const allow = new Set(['ig','fb','line']);

  // สามารถใส่ URL https ภายนอกได้
  const qrUrls = {
    ig:   '/assets/qr-instagram.png',
    fb:   '/assets/qr-facebook.png',
    line: '/assets/qr-line.png'
  };

  let current='ig';

  // อนุญาตเฉพาะ https: หรือรูปภายในโดเมนเดียวกัน
  function safeImageUrl(url){
    try {
      const u = new URL(url, window.location.origin);
      if (u.origin === window.location.origin) return u.href;
      if (u.protocol === 'https:') return u.href;
    } catch(e){}
    return null; // ไม่ผ่าน
  }

  function setActive(platform){
    if(!allow.has(platform)) return;
    const raw = qrUrls[platform];
    const safe = safeImageUrl(raw);
    if(!safe) return;

    qrImg.src = safe;
    qrImg.alt = `QR Code ของผู้ดูแล (${platform.toUpperCase()})`;

    if(platform==='ig')   caption.textContent='สแกนเพื่อเริ่มแชท — Instagram';
    if(platform==='fb')   caption.textContent='สแกนเพื่อเริ่มแชท — Facebook';
    if(platform==='line') caption.textContent='สแกนเพื่อเริ่มแชท — LINE';

    buttons.forEach(b => {
      const active = b.getAttribute('data-show-qr')===platform;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    current=platform;
  }

  buttons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const platform = btn.getAttribute('data-show-qr');
      setActive(platform);
      qrImg.scrollIntoView({behavior:'smooth', block:'center'});
    });
  });

  // ค่าเริ่มต้น
  setActive(current);
}

/* ---------- บูตระบบ ---------- */
domReady(()=>{
  initIndexPage();
  initContactPage();
});
