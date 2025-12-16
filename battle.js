(() => {
  const canvas = document.getElementById('battleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = 800, H = 300;
  
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  let screenShakeIntensity = 0;
  const weaponTrails = {A: [], B: []};

  function clearCanvas(){ ctx.clearRect(0, 0, W, H); }

  function drawBackground(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(8,12,24,0.7)');
    g.addColorStop(1, 'rgba(4,6,12,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  }

  function drawBall(o){
    ctx.beginPath(); ctx.fillStyle = o.color; ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.ellipse(o.x - o.r*0.25, o.y - o.r*0.28, o.r*0.28, o.r*0.18, 0, 0, Math.PI*2); ctx.fill();
    
    const isLeft = !!o.isLuffy;

    if (isLeft) {
      ctx.fillStyle = '#ffe3b8';
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.95, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(o.x - o.r*0.3, o.y - o.r*0.15, o.r*0.15, o.r*0.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(o.x + o.r*0.15, o.y - o.r*0.15, o.r*0.15, o.r*0.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o.x - o.r*0.25, o.y - o.r*0.2, o.r*0.06, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + o.r*0.2, o.y - o.r*0.2, o.r*0.06, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = o.r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(o.x, o.y + o.r*0.1, o.r*0.32, 0, Math.PI); ctx.stroke();
      ctx.strokeStyle = '#d4a574'; ctx.lineWidth = o.r * 0.06; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.r*0.25); ctx.lineTo(o.x, o.y + o.r*0.05); ctx.stroke();
      
      // straw hat drawn on top
      ctx.save();
      ctx.translate(o.x, o.y - o.r * 1.0);
      // brim
      ctx.beginPath(); ctx.fillStyle = '#ffda76'; ctx.ellipse(0, 8, o.r*1.35, o.r*0.5, 0, 0, Math.PI*2); ctx.fill();
      // crown
      ctx.beginPath(); ctx.fillStyle = '#ffd27a'; ctx.arc(0, -8, o.r*0.7, Math.PI, 0); ctx.fill();
      // band
      ctx.beginPath(); ctx.fillStyle = '#c33'; ctx.rect(-o.r*0.65, -8, o.r*1.3, 6); ctx.fill();
      ctx.restore();
      
    } else {
      ctx.beginPath(); ctx.fillStyle = '#d4a574'; ctx.arc(o.x, o.y, o.r * 0.98, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.fillStyle = '#0c0c0c'; ctx.ellipse(o.x, o.y + o.r*0.25, o.r*0.85, o.r*0.55, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = o.r * 0.05;
      for (let i = -2; i <= 2; i++){
        ctx.beginPath(); ctx.moveTo(o.x + i*o.r*0.2, o.y + o.r*0.15); ctx.quadraticCurveTo(o.x + i*o.r*0.2 + o.r*0.1, o.y + o.r*0.35, o.x + i*o.r*0.2, o.y + o.r*0.45); ctx.stroke();
      }
      ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.ellipse(o.x - o.r*0.32, o.y - o.r*0.15, o.r*0.16, o.r*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(o.x + o.r*0.18, o.y - o.r*0.15, o.r*0.16, o.r*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(o.x - o.r*0.32, o.y - o.r*0.1, o.r*0.1, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(o.x + o.r*0.18, o.y - o.r*0.1, o.r*0.1, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#b33'; ctx.lineWidth = o.r * 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(o.x - o.r*0.5, o.y); ctx.lineTo(o.x - o.r*0.15, o.y + o.r*0.15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o.x + o.r*0.35, o.y - o.r*0.05); ctx.lineTo(o.x + o.r*0.55, o.y + o.r*0.1); ctx.stroke();
    }
    
    const swordStart = isLeft ? o.x + o.r + 8 : o.x - o.r - 8;
    const swordEnd = isLeft ? o.x + o.r + 90 : o.x - o.r - 90;
    const swordColor = isLeft ? '#ff3333' : '#9933ff';
    
    ctx.strokeStyle = swordColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(swordStart, o.y - 3);
    ctx.lineTo(swordEnd, o.y - 3);
    ctx.stroke();
    
    ctx.strokeStyle = isLeft ? '#ff9999' : '#cc99ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(swordStart, o.y - 2);
    ctx.lineTo(swordEnd, o.y - 2);
    ctx.stroke();
    
    ctx.fillStyle = swordColor;
    ctx.beginPath();
    ctx.moveTo(swordEnd, o.y - 6);
    ctx.lineTo(swordEnd + (isLeft ? 12 : -12), o.y);
    ctx.lineTo(swordEnd, o.y + 6);
    ctx.fill();
    
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(swordStart - 4, o.y - 12, 8, 24);
  }

  function drawWeaponTrails(){
    ctx.save();
    // Luffy's red trail
    weaponTrails.A.forEach((p, idx) => {
      const alpha = (idx / weaponTrails.A.length) * 0.8;
      // glow layer
      ctx.strokeStyle = `rgba(255,100,100,${alpha * 0.6})`;
      ctx.lineWidth = 16 - (idx / weaponTrails.A.length) * 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (idx === 0) ctx.moveTo(p.x1, p.y1);
      else ctx.moveTo(weaponTrails.A[idx-1].x2, weaponTrails.A[idx-1].y2);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
      
      // bright core
      ctx.strokeStyle = `rgba(255,200,100,${alpha})`;
      ctx.lineWidth = 8 - (idx / weaponTrails.A.length) * 4;
      ctx.beginPath();
      if (idx === 0) ctx.moveTo(p.x1, p.y1);
      else ctx.moveTo(weaponTrails.A[idx-1].x2, weaponTrails.A[idx-1].y2);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });
    
    // Blackbeard's purple trail
    weaponTrails.B.forEach((p, idx) => {
      const alpha = (idx / weaponTrails.B.length) * 0.8;
      // glow layer
      ctx.strokeStyle = `rgba(180,100,255,${alpha * 0.6})`;
      ctx.lineWidth = 16 - (idx / weaponTrails.B.length) * 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (idx === 0) ctx.moveTo(p.x1, p.y1);
      else ctx.moveTo(weaponTrails.B[idx-1].x2, weaponTrails.B[idx-1].y2);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
      
      // bright core
      ctx.strokeStyle = `rgba(200,150,255,${alpha})`;
      ctx.lineWidth = 8 - (idx / weaponTrails.B.length) * 4;
      ctx.beginPath();
      if (idx === 0) ctx.moveTo(p.x1, p.y1);
      else ctx.moveTo(weaponTrails.B[idx-1].x2, weaponTrails.B[idx-1].y2);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    });
    ctx.restore();
  }

  function recordWeaponTrail(o, isLeft){
    const start = isLeft ? o.x + o.r + 8 : o.x - o.r - 8;
    const end = isLeft ? o.x + o.r + 90 : o.x - o.r - 90;
    const trail = isLeft ? weaponTrails.A : weaponTrails.B;
    trail.push({x1: start, y1: o.y - 3, x2: end, y2: o.y - 3});
    if (trail.length > 10) trail.shift();
  }

  function impactLighting(cx, cy, t){
    const life = 80;
    const intensity = Math.max(0, 1 - t / life);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 400);
    grad.addColorStop(0, `rgba(255,255,200,${1.2 * intensity})`);
    grad.addColorStop(0.3, `rgba(255,230,100,${0.95 * intensity})`);
    grad.addColorStop(0.6, `rgba(255,160,60,${0.55 * intensity})`);
    grad.addColorStop(1, `rgba(200,100,0,${0.0})`);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 400, cy - 400, 800, 800);
    for (let i = 1; i <= 3; i++){
      const ringAlpha = Math.max(0, intensity - (i * 0.2));
      const ringR = 80 * (t / life) + (i * 30);
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,220,120,${0.8 * ringAlpha})`;
      ctx.lineWidth = 4 + (2 * ringAlpha);
      ctx.arc(cx, cy, ringR, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(255,240,150,${0.25 * intensity})`;
    ctx.lineWidth = 3 + (4 * intensity);
    for (let i = 0; i < 16; i++){
      const a = (i / 16) * Math.PI * 2 + (t * 0.12);
      const dist = 120 + (80 * intensity);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSparks(cx, cy, t){
    const sparkLife = 40;
    const numSparks = 12;
    const sparkIntensity = Math.max(0, 1 - t / sparkLife);
    ctx.save();
    for (let i = 0; i < numSparks; i++){
      const angle = (i / numSparks) * Math.PI * 2;
      const speed = 80 + Math.random() * 40;
      const x = cx + Math.cos(angle) * speed * (t / sparkLife);
      const y = cy + Math.sin(angle) * speed * (t / sparkLife);
      const size = 3 + Math.random() * 2;
      const colorChoice = Math.random();
      if (colorChoice < 0.4) ctx.fillStyle = `rgba(255,255,100,${sparkIntensity * 0.9})`;
      else if (colorChoice < 0.7) ctx.fillStyle = `rgba(255,200,50,${sparkIntensity * 0.8})`;
      else ctx.fillStyle = `rgba(255,150,0,${sparkIntensity * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSmoke(cx, cy, t){
    const smokeLife = 60;
    const numSmokes = 8;
    const smokeAlpha = Math.max(0, 0.8 * (1 - t / smokeLife));
    ctx.save();
    for (let i = 0; i < numSmokes; i++){
      const angle = (i / numSmokes) * Math.PI * 2;
      const speed = 40 + Math.random() * 30;
      const x = cx + Math.cos(angle) * speed * (t / smokeLife);
      const y = cy + Math.sin(angle) * speed * (t / smokeLife);
      const size = 20 + (t / smokeLife) * 30;
      ctx.fillStyle = `rgba(100,100,100,${smokeAlpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function applyScreenShake(){
    if (screenShakeIntensity <= 0) return;
    const offsetX = (Math.random() - 0.5) * screenShakeIntensity;
    const offsetY = (Math.random() - 0.5) * screenShakeIntensity;
    ctx.translate(offsetX, offsetY);
  }

  function mass(o){ return o.r * o.r; }

  function handleCollision(a, b){
    const m1 = mass(a), m2 = mass(b);
    const u1 = a.vx, u2 = b.vx;
    const v1 = (u1*(m1 - m2) + 2*m2*u2) / (m1 + m2);
    const v2 = (u2*(m2 - m1) + 2*m1*u1) / (m1 + m2);
    a.vx = v1; b.vx = v2;
    screenShakeIntensity = 12;
    return true;
  }

  window.startBattle = function() {
    const A = {x: 100, y: H / 2, r: 30, vx: 3, color: '#ffd27a', isLuffy: true};
    // Make Blackbeard noticeably larger than Luffy
    const B = {x: W - 100, y: H / 2, r: 46, vx: -2.6, color: '#222', isLuffy: false};
    let collided = false;
    let impactT = 0;
    weaponTrails.A = [];
    weaponTrails.B = [];

    function step(){
      A.x += A.vx; B.x += B.vx;
      
      recordWeaponTrail(A, true);
      recordWeaponTrail(B, false);
      
      const ASwdTip = A.x + A.r + 90;
      const BSwdTip = B.x - B.r - 90;

      if (!collided && ASwdTip >= BSwdTip){
        // handle collision effects
        handleCollision(A, B);
        collided = true;
        // freeze movement so they don't swap positions/sizes
        A.vx = 0; B.vx = 0;
        // align them so sword tips meet exactly at impactX
        const impactX = (ASwdTip + BSwdTip) / 2;
        A.x = impactX - A.r - 90;
        B.x = impactX + B.r + 90;
      }

      ctx.save();
      applyScreenShake();
      clearCanvas(); drawBackground();
      drawWeaponTrails();
      
      if (collided && impactT < 100){
        const cx = (ASwdTip + BSwdTip) / 2; const cy = 150;
        impactLighting(cx, cy, impactT);
        if (impactT < 40) drawSparks(cx, cy, impactT);
        if (impactT < 60) drawSmoke(cx, cy, impactT);
        impactT++;
      }
      drawBall(A); drawBall(B);
      ctx.restore();
      
      screenShakeIntensity *= 0.92;

      if (!(collided && impactT >= 100)) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  };

  window.addEventListener('DOMContentLoaded', window.startBattle);
})();
