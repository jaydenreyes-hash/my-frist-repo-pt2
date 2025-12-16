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

  // Web Audio context for sound effects (created on first user interaction)
  let audioCtx = null;
  let masterGain = null;
  function ensureAudioContext() {
    if (audioCtx && masterGain) return true;
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return false;
    audioCtx = new Ctor({ latencyHint: 'interactive' });
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(audioCtx.destination);
    return true;
  }

  // Safely resume audio within any user gesture (helps Safari/iOS)
  function resumeAudioContext() {
    if (!ensureAudioContext()) return false;
    if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
      audioCtx.resume().catch(() => {});
    }
    return true;
  }

  let isMuted = false;
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.addEventListener('click', () => {
      if (!ensureAudioContext()) return;
      isMuted = !isMuted;
      masterGain.gain.value = isMuted ? 0 : 0.9;
      muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
    });
  }

  function playClash(){
    if (!ensureAudioContext()) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    const now = audioCtx.currentTime;
    // metallic clang
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
    const oscGain = audioCtx.createGain();
    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(0.8, now + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc.connect(oscGain); oscGain.connect(masterGain);
    osc.start(now); osc.stop(now + 0.8);

    // noise sparks
    const dur = 0.25;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = audioCtx.createBiquadFilter(); noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 1800;
    const noiseGain = audioCtx.createGain(); noiseGain.gain.setValueAtTime(0.9, now); noiseGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain);
    noise.start(now); noise.stop(now + dur + 0.02);

    // small low rumble for weight
    const low = audioCtx.createOscillator(); low.type = 'sine'; low.frequency.setValueAtTime(60, now);
    const lowGain = audioCtx.createGain(); lowGain.gain.setValueAtTime(0.07, now); lowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    low.connect(lowGain); lowGain.connect(masterGain);
    low.start(now); low.stop(now + 0.26);
  }

  function playYell({
    pitch = 140,
    growl = 80,
    vibratoRate = 5,
    vibratoDepth = 6,
    formantMult = 3,
    noiseLevel = 0.04,
    ampLevel = 0.28,
    duration = 0.7,
    subFreq = null
  } = {}){
    if (!ensureAudioContext()) return;
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    const now = audioCtx.currentTime;

    // main tone
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.92, now + duration * 0.7);

    // vibrato
    const vibratoOsc = audioCtx.createOscillator();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(vibratoRate, now);
    const vibratoGain = audioCtx.createGain();
    vibratoGain.gain.setValueAtTime(vibratoDepth, now);
    vibratoOsc.connect(vibratoGain).connect(osc.frequency);

    const formant = audioCtx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(pitch * formantMult, now);
    formant.Q.value = 5;

    const growlOsc = audioCtx.createOscillator();
    growlOsc.type = 'triangle';
    growlOsc.frequency.setValueAtTime(growl, now);

    const subOsc = subFreq ? audioCtx.createOscillator() : null;
    if (subOsc) {
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(subFreq, now);
    }

    // noise bed
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);

    const amp = audioCtx.createGain();
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(isMuted ? 0 : ampLevel, now + 0.05);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(formant).connect(amp).connect(masterGain);
    growlOsc.connect(amp);
    if (subOsc) subOsc.connect(amp);
    noise.connect(noiseGain).connect(amp);

    osc.start(now); osc.stop(now + duration + 0.05);
    vibratoOsc.start(now); vibratoOsc.stop(now + duration + 0.05);
    growlOsc.start(now); growlOsc.stop(now + duration + 0.05);
    if (subOsc) subOsc.start(now), subOsc.stop(now + duration + 0.05);
    noise.start(now); noise.stop(now + duration + 0.05);
  }

  // Sustained yell until stopped (used pre-clash)
  function startYellLoop({
    pitch = 140,
    growl = 80,
    vibratoRate = 5,
    vibratoDepth = 6,
    formantMult = 3,
    noiseLevel = 0.04,
    ampLevel = 0.25,
    subFreq = null
  } = {}){
    if (!ensureAudioContext()) return () => {};
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch, now);

    // vibrato
    const vibratoOsc = audioCtx.createOscillator();
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(vibratoRate, now);
    const vibratoGain = audioCtx.createGain();
    vibratoGain.gain.setValueAtTime(vibratoDepth, now);
    vibratoOsc.connect(vibratoGain).connect(osc.frequency);

    const formant = audioCtx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.setValueAtTime(pitch * formantMult, now);
    formant.Q.value = 5;

    const growlOsc = audioCtx.createOscillator();
    growlOsc.type = 'triangle';
    growlOsc.frequency.setValueAtTime(growl, now);

    const subOsc = subFreq ? audioCtx.createOscillator() : null;
    if (subOsc) {
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(subFreq, now);
    }

    // noise bed (looping)
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random() * 2 - 1);
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(noiseLevel, now);

    const amp = audioCtx.createGain();
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(isMuted ? 0 : ampLevel, now + 0.08);

    osc.connect(formant).connect(amp).connect(masterGain);
    growlOsc.connect(amp);
    if (subOsc) subOsc.connect(amp);
    noise.connect(noiseGain).connect(amp);

    osc.start(now);
    vibratoOsc.start(now);
    growlOsc.start(now);
    if (subOsc) subOsc.start(now);
    noise.start(now);

    const stop = () => {
      const t = audioCtx.currentTime;
      amp.gain.cancelScheduledValues(t);
      amp.gain.setValueAtTime(amp.gain.value, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      osc.stop(t + 0.3);
      vibratoOsc.stop(t + 0.3);
      growlOsc.stop(t + 0.3);
      if (subOsc) subOsc.stop(t + 0.3);
      noise.stop(t + 0.3);
    };

    return stop;
  }

  let screenShakeIntensity = 0;
  const weaponTrails = {A: [], B: []};

  function clearCanvas(){ ctx.clearRect(0, 0, W, H); }

  function drawBackground(){
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(8,12,24,0.7)');
    g.addColorStop(1, 'rgba(4,6,12,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  }

  function baseSwordAngle(o){
    return o.isLuffy ? 0 : Math.PI;
  }

  function swordAnchor(o){
    return {
      x: o.isLuffy ? o.x + o.r + 8 : o.x - o.r - 8,
      y: o.y - 3
    };
  }

  function swordTip(o, len = 90){
    const a = swordAnchor(o);
    return {
      x: a.x + Math.cos(o.angle) * len,
      y: a.y + Math.sin(o.angle) * len
    };
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
    
    const swordColor = isLeft ? '#ff3333' : '#9933ff';
    const anchor = swordAnchor(o);
    const length = 90;

    ctx.save();
    ctx.translate(anchor.x, anchor.y);
    ctx.rotate(o.angle);

    // blade
    ctx.strokeStyle = swordColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    // blade edge
    ctx.strokeStyle = isLeft ? '#ff9999' : '#cc99ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(length, -1);
    ctx.stroke();

    // tip triangle
    ctx.fillStyle = swordColor;
    ctx.beginPath();
    ctx.moveTo(length, -3);
    ctx.lineTo(length + 12, 0);
    ctx.lineTo(length, 3);
    ctx.fill();

    // guard
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(-4, -9, 8, 18);
    ctx.restore();
  }

  function drawWeaponTrails(){
    ctx.save();
    const drawTrail = (trail, glow, core) => {
      if (trail.length < 2) return;
      const n = trail.length;
      // Smooth join using previous segment end
      for (let idx = 0; idx < n; idx++){
        const p = trail[idx];
        const prev = idx === 0 ? p : trail[idx-1];
        const t = idx / n;
        const ease = (1 - t) * (1 - t);

        // glow
        ctx.strokeStyle = `${glow}${(0.65 * ease).toFixed(3)})`;
        ctx.lineWidth = 18 - t * 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x2, prev.y2);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();

        // core
        ctx.strokeStyle = `${core}${(0.95 * ease).toFixed(3)})`;
        ctx.lineWidth = 9 - t * 5;
        ctx.beginPath();
        ctx.moveTo(prev.x2, prev.y2);
        ctx.lineTo(p.x2, p.y2);
        ctx.stroke();
      }
    };

    drawTrail(weaponTrails.A, 'rgba(255,100,100,', 'rgba(255,200,120,');
    drawTrail(weaponTrails.B, 'rgba(180,100,255,', 'rgba(200,150,255,');
    ctx.restore();
  }

  function recordWeaponTrail(o, isLeft){
    const anchor = swordAnchor(o);
    const tip = swordTip(o);
    const trail = isLeft ? weaponTrails.A : weaponTrails.B;
    trail.push({x1: anchor.x, y1: anchor.y, x2: tip.x, y2: tip.y});
    if (trail.length > 16) trail.shift();
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

  function updateSwordMotion(o){
    const stiffness = 0.12;
    const damping = 0.86;
    const delta = o.targetAngle - o.angle;
    o.angularVelocity += delta * stiffness;
    o.angularVelocity *= damping;
    o.angle += o.angularVelocity;
  }

  window.startBattle = function() {
    const baseAL = baseSwordAngle({isLuffy: true});
    const baseBR = baseSwordAngle({isLuffy: false});

    const A = {x: 100, y: H / 2, r: 30, vx: 3, color: '#ffd27a', isLuffy: true, angle: baseAL - 0.7, angularVelocity: 0, targetAngle: baseAL + 0.12};
    // Make Blackbeard noticeably larger than Luffy
    const B = {x: W - 100, y: H / 2, r: 46, vx: -2.6, color: '#222', isLuffy: false, angle: baseBR + 0.7, angularVelocity: 0, targetAngle: baseBR - 0.12};
    let collided = false;
    let impactT = 0;
    weaponTrails.A = [];
    weaponTrails.B = [];

    // pre-clash sustained yells (anime-flavored per character)
    const stopYellA = startYellLoop({
      pitch: 220,          // brighter
      growl: 95,
      vibratoRate: 6,
      vibratoDepth: 12,
      formantMult: 3.4,
      noiseLevel: 0.06,
      ampLevel: 0.28,
      subFreq: null
    });
    const stopYellB = startYellLoop({
      pitch: 120,          // heavier
      growl: 60,
      vibratoRate: 4,
      vibratoDepth: 8,
      formantMult: 2.4,
      noiseLevel: 0.08,
      ampLevel: 0.32,
      subFreq: 55
    });

    function step(){
      A.x += A.vx; B.x += B.vx;

      updateSwordMotion(A);
      updateSwordMotion(B);

      // subtle bend toward target for visual softness
      A.angle += A.angularVelocity * 0.05;
      B.angle += B.angularVelocity * 0.05;
      
      recordWeaponTrail(A, true);
      recordWeaponTrail(B, false);
      
      const ASwdTip = swordTip(A);
      const BSwdTip = swordTip(B);

      const tipDistSq = (ASwdTip.x - BSwdTip.x)**2 + (ASwdTip.y - BSwdTip.y)**2;
      const tipCollision = tipDistSq <= (18*18);

      if (!collided && tipCollision){
        // handle collision effects
        handleCollision(A, B);
        collided = true;
        // stop sustained yells
        stopYellA(); stopYellB();
        // play clash sound
        try { playClash(); } catch(e) { /* ignore audio errors */ }
        // battle yells (shorter punctuated shouts)
        try { playYell({ pitch: 230, growl: 100, vibratoRate: 6, vibratoDepth: 10, formantMult: 3.4, noiseLevel: 0.07, ampLevel: 0.32, duration: 0.65 }); } catch(e) {}
        try { playYell({ pitch: 130, growl: 65, vibratoRate: 4, vibratoDepth: 7, formantMult: 2.4, noiseLevel: 0.1, ampLevel: 0.36, subFreq: 55, duration: 0.7 }); } catch(e) {}
        // freeze movement so they don't swap positions/sizes
        A.vx = 0; B.vx = 0;
        // recoil + crossed pose
        A.angularVelocity = -0.35; B.angularVelocity = 0.35;
        A.targetAngle = baseSwordAngle(A) - 0.25;
        B.targetAngle = baseSwordAngle(B) + 0.25;
      }

      ctx.save();
      applyScreenShake();
      clearCanvas(); drawBackground();
      drawWeaponTrails();
      
      if (collided && impactT < 100){
        const cx = (ASwdTip.x + BSwdTip.x) / 2; const cy = 150;
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

  // Wire up the "Witness the Clash" button so audio + battle start from a user gesture
  window.addEventListener('DOMContentLoaded', () => {
    const cta = document.querySelector('a.cta');
    if (!cta) return;
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      // Ensure audio context is created/resumed inside the click gesture
      resumeAudioContext();
      window.startBattle();
    });
  });

  // Extra safety: unlock audio on first user interaction anywhere
  ['pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, resumeAudioContext, { once: true, capture: true });
  });
})();
