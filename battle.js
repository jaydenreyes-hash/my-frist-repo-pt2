(() => {
  const canvas = document.getElementById('battleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = canvas.getAttribute('width') ? parseInt(canvas.getAttribute('width'), 10) : 800;
  const H = canvas.getAttribute('height') ? parseInt(canvas.getAttribute('height'), 10) : 300;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  const A = {x: 100, y: H / 2, r: 30, vx: 3, color: '#ffd27a'}; // left ball
  const B = {x: W - 100, y: H / 2, r: 36, vx: -2.6, color: '#222'}; // right ball
  let collided = false;
  let impactT = 0;

  // mass proportional to area
  function mass(o){ return o.r * o.r; }

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
  }

  function impactLighting(cx, cy, t){
    const life = 80;
    const intensity = Math.max(0, 1 - t / life);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300);
    grad.addColorStop(0, `rgba(255,230,120,${0.9 * intensity})`);
    grad.addColorStop(0.5, `rgba(255,170,60,${0.45 * intensity})`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = grad; ctx.fillRect(cx-300, cy-300, 600, 600);
    ctx.beginPath(); ctx.strokeStyle = `rgba(255,220,120,${0.9 * intensity})`; ctx.lineWidth = 6 * intensity; ctx.arc(cx, cy, 120 * (t / life), 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  function handleCollision(a, b){
    // simple 1D elastic collision along x
    const m1 = mass(a), m2 = mass(b);
    const u1 = a.vx, u2 = b.vx;
    const v1 = (u1*(m1 - m2) + 2*m2*u2) / (m1 + m2);
    const v2 = (u2*(m2 - m1) + 2*m1*u1) / (m1 + m2);
    a.vx = v1; b.vx = v2;
    collided = true; impactT = 0;
  }

  function step(){
    // move
    A.x += A.vx; B.x += B.vx;

    // detect collision (distance on x since same y)
    const dist = Math.abs(B.x - A.x);
    if (!collided && dist <= (A.r + B.r)){
      handleCollision(A, B);
    }

    // draw
    clearCanvas(); drawBackground();
    if (collided && impactT < 100){
      const cx = (A.x + B.x) / 2; const cy = H/2;
      impactLighting(cx, cy, impactT);
      impactT++;
    }
    drawBall(A); drawBall(B);

    // stop after effect completes
    if (!(collided && impactT >= 100)) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
      drawBall(B);
