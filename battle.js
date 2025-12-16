(() => {
  const canvas = document.getElementById('battleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = canvas.width;
  const H = canvas.height;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  const luffy = {x: 120, y: H/2, r: 28, color: '#ffd27a', vx: 2.6};
  const black = {x: W - 120, y: H/2, r: 36, color: '#222', vx: -2.2};
  let phase = 'approach';
  let impactTimer = 0;

  function drawFighter(f){
    // body
    ctx.beginPath();
    ctx.fillStyle = f.color;
    ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
    ctx.fill();
    // eyes / mouth hint
    ctx.fillStyle = f === luffy ? '#1a1200' : '#fff';
    ctx.beginPath();
    ctx.arc(f.x - f.r/3, f.y - 4, Math.max(2, f.r/6), 0, Math.PI*2);
    ctx.fill();
  }

  function drawBackground(){
    // subtle gradient sea/sky
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(8,12,24,0.7)');
    g.addColorStop(1, 'rgba(6,8,16,0.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);
  }

  function impactEffect(cx, cy, t){
    const maxR = 120;
    const alpha = Math.max(0, 1 - t/36);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,204,60,${alpha})`;
    ctx.lineWidth = 6 * alpha;
    ctx.arc(cx, cy, maxR * (t/36), 0, Math.PI*2);
    ctx.stroke();
  }

  function step(){
    // update
    if(phase === 'approach'){
      if (luffy.x + luffy.r + 6 < black.x - black.r - 6){
        luffy.x += luffy.vx;
        black.x += black.vx;
      } else {
        phase = 'impact';
        impactTimer = 0;
        canvas.classList.add('impact-flash');
        setTimeout(()=>canvas.classList.remove('impact-flash'), 420);
      }
    } else if(phase === 'impact'){
      impactTimer++;
      // simple recoil
      const recoil = Math.sin((impactTimer/18)*Math.PI)*12;
      luffy.x -= recoil * 0.02;
      black.x += recoil * 0.02;
      if(impactTimer > 48) phase = 'post';
    }

    // draw
    drawBackground();

    // center energy glow during impact
    if(phase === 'impact'){
      const cx = (luffy.x + black.x)/2;
      const cy = H/2;
      impactEffect(cx, cy, impactTimer);
    }

    drawFighter(luffy);
    drawFighter(black);

    if(phase !== 'post') requestAnimationFrame(step);
  }

  // kick off
  requestAnimationFrame(step);
})();
