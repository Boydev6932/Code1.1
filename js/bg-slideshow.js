// bg-slideshow.js
// -----------------------------------------------------------
// ทำสไลด์พื้นหลังแบบ "เลื่อนขึ้นด้านบน" แล้ววนเปลี่ยนภาพ
// ใช้ภาพจากโฟลเดอร์ assets:
//   bg1.jpg, bg2.jpg, bg3.jpg, bg4.jpg
// -----------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".bg-slideshow .slide");
  let current = 0;
  const intervalTime = 7000; // เปลี่ยนภาพทุก 7 วินาที
  const transitionTime = 2000; // เวลาเลื่อน (ms)

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.top = (i === index) ? "0" : "100%";
      slide.style.opacity = (i === index) ? "1" : "0";
    });
  }

  function nextSlide() {
    current = (current + 1) % slides.length;
    showSlide(current);
  }

  // เริ่มต้น: แสดงภาพแรก
  showSlide(current);

  // เริ่ม loop
  setInterval(nextSlide, intervalTime);
});
