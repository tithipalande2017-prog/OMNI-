(() => {
  const canvas = document.getElementById("scannerCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const readoutStatus = document.getElementById("readoutStatus");
  const readoutAct = document.getElementById("readoutAct");
  const readoutRooms = document.getElementById("readoutRooms");
  const readoutAnomalies = document.getElementById("readoutAnomalies");
  const readoutLife = document.getElementById("readoutLife");
  const readoutConfidence = document.getElementById("readoutConfidence");
  const readoutProgress = document.getElementById("readoutProgress");
  const scanBar = document.getElementById("scanBar");
  const eventLog = document.getElementById("eventLog");
  const rotateSlider = document.getElementById("rotateSlider");
  const interferenceToggle = document.getElementById("interferenceToggle");
  const layerButtons = document.querySelectorAll(".layer-toggle");

  const state = {
    width: 0,
    height: 0,
    rotate: 18,
    scanProgress: 0,
    scanRunning: false,
    scanDone: false,
    thermalMode: false,
    interference: false,
    confidence: 87,
    layers: {
      blueprint: true,
      thermal: true,
      anomaly: true,
      hidden: true
    },
    hiddenLayouts: {
      idle: { hiddenRooms: [], people: [], gas: [] },
      normal: {
        hiddenRooms: [
          { x: -170, y: -150, z: 36, radius: 26 },
          { x: 150, y: -110, z: 36, radius: 24 },
          { x: -120, y: 90, z: 36, radius: 28 },
          { x: 200, y: 90, z: 36, radius: 26 }
        ],
        people: [
          { x: -150, y: -120, z: 38, speed: 0.8, drift: 0.9 },
          { x: 170, y: -82, z: 38, speed: 1.1, drift: 1.4 },
          { x: -88, y: 118, z: 38, speed: 1.3, drift: 1.7 },
          { x: 220, y: 118, z: 38, speed: 0.9, drift: 1.2 }
        ],
        gas: [
          { x: -150, y: -100, z: 38, radius: 18, drift: 1.0 },
          { x: 200, y: -90, z: 38, radius: 20, drift: 1.7 },
          { x: -100, y: 130, z: 38, radius: 18, drift: 1.2 },
          { x: 230, y: 135, z: 38, radius: 20, drift: 1.5 }
        ]
      },
      thermal: {
        hiddenRooms: [
          { x: -170, y: -150, z: 36, radius: 28 },
          { x: 30, y: -110, z: 36, radius: 26 },
          { x: -100, y: 80, z: 36, radius: 30 },
          { x: 170, y: 110, z: 36, radius: 24 }
        ],
        people: [
          { x: -150, y: -130, z: 38, speed: 1.1, drift: 1.4 },
          { x: 10, y: -92, z: 38, speed: 1.5, drift: 1.8 },
          { x: -90, y: 108, z: 38, speed: 1.4, drift: 1.0 },
          { x: 182, y: 138, z: 38, speed: 1.0, drift: 1.7 },
          { x: 70, y: -18, z: 38, speed: 1.2, drift: 1.3 }
        ],
        gas: [
          { x: -165, y: -118, z: 38, radius: 22, drift: 1.5 },
          { x: 26, y: -80, z: 38, radius: 18, drift: 1.1 },
          { x: -56, y: 112, z: 38, radius: 24, drift: 1.8 },
          { x: 185, y: 152, z: 38, radius: 22, drift: 1.3 },
          { x: 82, y: 12, z: 38, radius: 18, drift: 1.4 }
        ]
      },
      interference: {
        hiddenRooms: [
          { x: -180, y: -145, z: 36, radius: 30 },
          { x: 60, y: -60, z: 36, radius: 28 },
          { x: 180, y: 120, z: 36, radius: 30 }
        ],
        people: [
          { x: -165, y: -118, z: 38, speed: 0.8, drift: 0.9 },
          { x: 72, y: -38, z: 38, speed: 1.0, drift: 1.2 },
          { x: 192, y: 138, z: 38, speed: 0.7, drift: 1.5 }
        ],
        gas: [
          { x: -180, y: -120, z: 38, radius: 24, drift: 1.0 },
          { x: 66, y: -50, z: 38, radius: 20, drift: 1.4 },
          { x: 196, y: 144, z: 38, radius: 22, drift: 1.2 }
        ]
      }
    }
  };

  function logEvent(message) {
    if (!eventLog) return;
    const entry = document.createElement("div");
    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    entry.innerHTML = `<span>${stamp}</span> ${message}`;
    eventLog.prepend(entry);
    while (eventLog.children.length > 6) eventLog.removeChild(eventLog.lastChild);
  }

  function updateReadout() {
    if (!readoutStatus || !readoutAct || !readoutRooms || !readoutAnomalies || !readoutLife || !readoutConfidence || !readoutProgress || !scanBar) return;

    const status = state.interference ? "UNRELIABLE" : state.thermalMode ? "THERMAL MODE" : state.scanDone ? "HIDDEN DETECTED" : state.scanRunning ? "SCANNING" : "IDLE";
    readoutStatus.textContent = status;
    readoutAct.textContent = state.thermalMode ? "LIFE SIGNATURES" : state.scanDone ? "ANOMALY MAP" : state.scanRunning ? "EMITTING WAVES" : "STAND BY";
    readoutRooms.textContent = state.scanDone || state.thermalMode ? "05" : "00";
    readoutAnomalies.textContent = state.scanDone || state.thermalMode ? "02" : "00";
    readoutLife.textContent = state.scanDone || state.thermalMode ? "04" : "00";
    readoutConfidence.textContent = `${Math.round(state.confidence)}%`;
    readoutProgress.textContent = `${Math.round(state.scanProgress * 100)}%`;
    scanBar.style.width = `${Math.round(state.scanProgress * 100)}%`;
  }

  function setStatus(text, act = "STAND BY") {
    if (readoutStatus) readoutStatus.textContent = text;
    if (readoutAct) readoutAct.textContent = act;
  }

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.width = rect.width;
    state.height = rect.height;
  }

  const resizeObserver = new ResizeObserver(() => resizeCanvas());
  resizeObserver.observe(canvas.parentElement);

  function buildRoomPoints() {
    return [
      { x: -220, y: -170, w: 120, h: 92, name: "ENTRY" },
      { x: -90, y: -170, w: 170, h: 92, name: "LIVING" },
      { x: 100, y: -170, w: 160, h: 92, name: "DINING" },
      { x: -220, y: -60, w: 120, h: 112, name: "KITCHEN" },
      { x: -90, y: -60, w: 120, h: 112, name: "STUDY" },
      { x: 50, y: -60, w: 120, h: 112, name: "LIBRARY" },
      { x: 190, y: -60, w: 120, h: 112, name: "PANTRY" },
      { x: -220, y: 70, w: 160, h: 128, name: "BED 1" },
      { x: -40, y: 70, w: 170, h: 128, name: "BED 2" },
      { x: 150, y: 70, w: 160, h: 128, name: "BATH" }
    ];
  }

  function projectPoint(x, y, z) {
    const angle = (state.rotate * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;

    const scale = 1.2;
    const sx = rx * scale + state.width * 0.5;
    const sy = y * scale + state.height * 0.62;
    return { x: sx, y: sy, z: rz };
  }

  function drawGridPattern() {
    ctx.save();
    ctx.strokeStyle = "rgba(74,163,255,0.18)";
    ctx.lineWidth = 1;

    const step = 26;
    for (let x = 0; x <= state.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.height);
      ctx.stroke();
    }
    for (let y = 0; y <= state.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBlueprint() {
    if (!state.layers.blueprint) return;

    const rooms = buildRoomPoints();

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(74,163,255,0.9)";
    ctx.fillStyle = "rgba(74,163,255,0.04)";

    rooms.forEach((room) => {
      const x1 = room.x;
      const y1 = room.y;
      const x2 = room.x + room.w;
      const y2 = room.y;
      const x3 = room.x + room.w;
      const y3 = room.y + room.h;
      const x4 = room.x;
      const y4 = room.y + room.h;

      const p1 = projectPoint(x1, y1, 12);
      const p2 = projectPoint(x2, y2, 12);
      const p3 = projectPoint(x3, y3, 12);
      const p4 = projectPoint(x4, y4, 12);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();

      const center = projectPoint(room.x + room.w / 2, room.y + room.h / 2, 12);
      ctx.fillStyle = "rgba(160, 210, 255, 0.9)";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillText(room.name, center.x, center.y + 4);

      if (state.scanDone && state.layers.hidden) {
        const wallX = room.x + room.w * 0.7;
        const wallY = room.y + room.h * 0.32;
        const hiddenP1 = projectPoint(wallX, wallY, 35);
        const hiddenP2 = projectPoint(wallX + 80, wallY + 6, 35);
        const hiddenP3 = projectPoint(wallX + 90, wallY + 72, 35);
        const hiddenP4 = projectPoint(wallX + 28, wallY + 92, 35);

        ctx.setLineDash([10, 8]);
        ctx.strokeStyle = "rgba(138,92,246,0.9)";
        ctx.beginPath();
        ctx.moveTo(hiddenP1.x, hiddenP1.y);
        ctx.lineTo(hiddenP2.x, hiddenP2.y);
        ctx.lineTo(hiddenP3.x, hiddenP3.y);
        ctx.lineTo(hiddenP4.x, hiddenP4.y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (state.scanDone) {
        ctx.strokeStyle = "rgba(74,163,255,0.62)";
        const pathA = projectPoint(0, 0, 8);
        const pathB = projectPoint(220, 120, 8);
        ctx.beginPath();
        ctx.moveTo(pathA.x, pathA.y);
        ctx.lineTo(pathB.x, pathB.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  function getHiddenLayout() {
    if (state.interference) return state.hiddenLayouts.interference;
    if (state.thermalMode) return state.hiddenLayouts.thermal;
    if (state.scanDone) return state.hiddenLayouts.normal;
    return state.hiddenLayouts.idle;
  }

  function drawHiddenRoom() {
    if (!state.layers.hidden) return;

    const layout = getHiddenLayout();
    const reveal = state.scanDone || state.thermalMode || state.interference;
    if (!reveal || layout.hiddenRooms.length === 0) return;

    ctx.save();
    const t = Date.now() * 0.001;

    layout.hiddenRooms.forEach((room) => {
      const p = projectPoint(room.x, room.y, room.z);
      ctx.beginPath();
      ctx.arc(p.x, p.y, room.radius, 0, Math.PI * 2);
      ctx.strokeStyle = state.interference ? "rgba(0, 0, 0, 0.8)" : "rgba(138,92,246,0.9)";
      ctx.lineWidth = state.interference ? 2.6 : 2.0;
      ctx.setLineDash(state.interference ? [3, 5] : [9, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    layout.people.forEach((person, index) => {
      const x = person.x + Math.sin(t * person.speed + index) * 16;
      const y = person.y + Math.cos(t * person.drift + index) * 12;
      const p = projectPoint(x, y, person.z);
      const glowRadius = state.thermalMode ? 18 : 12;
      const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, glowRadius + 12);

      glow.addColorStop(0, state.thermalMode ? "rgba(255,160,110,1)" : state.interference ? "rgba(12,12,12,0.95)" : "rgba(255,214,120,0.9)");
      glow.addColorStop(0.45, state.thermalMode ? "rgba(255,120,80,0.8)" : state.interference ? "rgba(18,18,18,0.55)" : "rgba(255,214,120,0.45)");
      glow.addColorStop(1, "rgba(255,120,80,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius + 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = state.interference ? "rgba(10, 10, 12, 0.9)" : state.thermalMode ? "rgba(255,220,170,0.98)" : "rgba(255,235,170,0.8)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, state.thermalMode ? 4.8 : state.interference ? 3.6 : 3.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 6);
      ctx.lineTo(p.x, p.y + 12);
      ctx.strokeStyle = state.interference ? "rgba(18,18,18,0.95)" : state.thermalMode ? "rgba(255,210,150,0.95)" : "rgba(255,220,140,0.7)";
      ctx.lineWidth = 1.8;
      ctx.stroke();
    });

    layout.gas.forEach((puff, index) => {
      const x = puff.x + Math.sin(t * puff.drift + index) * 10;
      const y = puff.y + Math.cos(t * (puff.drift + 0.5) + index) * 8;
      const pt = projectPoint(x, y, puff.z);
      const gasGlow = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, puff.radius + 18);
      gasGlow.addColorStop(0, state.interference ? "rgba(42, 42, 42, 0.3)" : "rgba(122,255,196,0.35)");
      gasGlow.addColorStop(0.5, state.interference ? "rgba(32, 32, 32, 0.22)" : "rgba(122,255,196,0.2)");
      gasGlow.addColorStop(1, "rgba(122,255,196,0)");

      ctx.fillStyle = gasGlow;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, puff.radius + 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = state.interference ? "rgba(35, 35, 35, 0.2)" : "rgba(122,255,196,0.18)";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (state.thermalMode || state.scanDone || state.interference) {
      ctx.fillStyle = state.interference ? "rgba(220, 220, 220, 0.72)" : "rgba(255, 230, 170, 0.8)";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText(state.interference ? "BLACKOUT CIRCLES / SIGNAL DEGRADE" : state.thermalMode ? "HIDDEN PERSONNEL DETECTED" : "HIDDEN PERSONNEL DETECTED", 250, 92);
      ctx.fillText(state.interference ? "INTERFERENCE FIELD" : "GAS - LOW CONCENTRATION", 272, 232);
    }

    ctx.restore();
  }

  function drawScanSweep() {
    if (!state.scanRunning) return;

    const progress = state.scanProgress;
    const xStart = state.width * 0.12;
    const xEnd = state.width * 0.88;
    const sweepX = xStart + (xEnd - xStart) * progress;

    ctx.save();
    ctx.strokeStyle = "rgba(240,210,122,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sweepX, state.height * 0.15);
    ctx.lineTo(sweepX, state.height * 0.8);
    ctx.stroke();

    ctx.strokeStyle = "rgba(240,210,122,0.18)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(sweepX, state.height * 0.2);
    ctx.lineTo(sweepX, state.height * 0.75);
    ctx.stroke();
    ctx.restore();
  }

  function drawAnomalies() {
    if (!state.layers.anomaly || (!state.scanDone && !state.thermalMode)) return;

    const p = projectPoint(300, 120, 38);
    ctx.save();
    ctx.strokeStyle = "rgba(240,210,122,0.85)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(240,210,122,0.16)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(240,210,122,0.9)";
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillText(state.thermalMode ? "BODY HEAT + GAS TRACE" : "HIDDEN SPACE DETECTED", p.x - 78, p.y - 40);
    ctx.restore();
  }

  function drawThermal() {
    if (!state.layers.thermal || (!state.scanDone && !state.thermalMode)) return;

    const baseAlpha = state.thermalMode ? 0.26 : 0.12;

    ctx.save();
    const hiddenCenter = projectPoint(310, 150, 38);
    const hotspot = ctx.createRadialGradient(hiddenCenter.x, hiddenCenter.y, 18, hiddenCenter.x, hiddenCenter.y, 140);
    hotspot.addColorStop(0, `rgba(255, 128, 80, ${state.thermalMode ? 0.9 : 0.45})`);
    hotspot.addColorStop(0.25, `rgba(255, 110, 60, ${state.thermalMode ? 0.55 : 0.26})`);
    hotspot.addColorStop(1, "rgba(255, 110, 60, 0)");
    ctx.fillStyle = hotspot;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.fillStyle = `rgba(255, 110, 60, ${baseAlpha})`;
    ctx.fillRect(0, 0, state.width, state.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, "rgba(255,118,70,0.08)");
    gradient.addColorStop(0.5, "rgba(255,118,70,0.18)");
    gradient.addColorStop(1, "rgba(11,10,20,0.75)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, state.width, state.height);

    if (state.interference) {
      ctx.fillStyle = "rgba(15, 12, 18, 0.88)";
      ctx.fillRect(0, 0, state.width, state.height);
      for (let i = 0; i < 160; i++) {
        const x = Math.random() * state.width;
        const y = Math.random() * state.height;
        const size = Math.random() * 2.5 + 1;
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(x, y, size, size);
      }
    }

    drawGridPattern();
    drawThermal();
    drawBlueprint();
    drawHiddenRoom();
    drawAnomalies();
    drawScanSweep();

    if (state.scanRunning) {
      ctx.fillStyle = "rgba(255, 245, 200, 0.7)";
      ctx.font = "14px JetBrains Mono, monospace";
      ctx.fillText("EMITTING WAVES…", 24, 28);
    }
  }

  function startScan() {
    state.scanRunning = true;
    state.scanDone = false;
    state.thermalMode = false;
    state.scanProgress = 0;
    state.confidence = state.interference ? 41 : 87;
    setStatus("SCANNING", "EMITTING WAVES");

    const startTime = performance.now();

    function tick(now) {
      if (!state.scanRunning) return;
      const elapsed = (now - startTime) / 2400;
      state.scanProgress = Math.min(elapsed, 1);

      if (state.scanProgress < 0.25) {
        setStatus("SCANNING", "EMITTING WAVES");
      } else if (state.scanProgress < 0.55) {
        setStatus("SCANNING", "READING ECHOES");
      } else if (state.scanProgress < 0.8) {
        setStatus("SCANNING", "ANALYSING");
      } else {
        setStatus("SCANNING", "RECONSTRUCTING");
      }

      updateReadout();

      if (state.scanProgress < 1) {
        requestAnimationFrame(tick);
      } else {
        state.scanRunning = false;
        state.scanDone = true;
        state.confidence = state.interference ? 41 : 87;
        setStatus(state.interference ? "UNRELIABLE" : "HIDDEN DETECTED", state.interference ? "STRONG WARD INTERFERENCE" : "HIDDEN SPACE DETECTED");
        logEvent(state.interference ? "Strong ward interference: reading unreliable" : "Hidden room detected - confidence 87%");
        updateReadout();
      }
    }

    requestAnimationFrame(tick);
  }

  function resetScan() {
    state.scanRunning = false;
    state.scanDone = false;
    state.scanProgress = 0;
    state.confidence = 87;
    state.thermalMode = false;
    if (interferenceToggle) interferenceToggle.checked = false;
    state.interference = false;
    setStatus("IDLE", "STAND BY");
    logEvent("Scan reset");
    updateReadout();
  }

  function toggleLayer(name) {
    state.layers[name] = !state.layers[name];
    const targetButton = [...layerButtons].find((button) => button.dataset.layer === name);
    targetButton?.classList.toggle("active", state.layers[name]);
  }

  document.querySelector('[data-action="scan"]')?.addEventListener("click", () => startScan());

  document.querySelector('[data-action="thermal"]')?.addEventListener("click", () => {
    state.scanRunning = false;
    state.scanDone = true;
    state.thermalMode = !state.thermalMode;
    state.confidence = state.interference ? 41 : 96;
    if (state.thermalMode) {
      logEvent("Thermal view enabled: 4 body heat signatures detected behind wall");
      setStatus("THERMAL MODE", "LIFE SIGNATURES");
    } else {
      logEvent("Thermal view disabled");
      setStatus("HIDDEN DETECTED", "ANOMALY MAP");
    }
    updateReadout();
  });

  document.querySelector('[data-action="reset"]')?.addEventListener("click", resetScan);

  layerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const layerName = button.dataset.layer;
      if (!layerName) return;
      toggleLayer(layerName);
      logEvent(`${layerName.toUpperCase()} layer ${state.layers[layerName] ? "enabled" : "disabled"}`);
    });
  });

  rotateSlider?.addEventListener("input", (event) => {
    state.rotate = Number(event.target.value);
  });

  interferenceToggle?.addEventListener("change", (event) => {
    state.interference = event.target.checked;
    state.confidence = state.interference ? 41 : 87;
    if (state.interference) {
      logEvent("Strong ward interference: reading unreliable");
      if (state.scanDone) {
        setStatus("UNRELIABLE", "STRONG WARD INTERFERENCE");
      }
    } else {
      logEvent("Interference neutralized");
    }
    updateReadout();
  });

  canvas.addEventListener("pointerdown", (event) => {
    const startX = event.clientX;
    let lastX = startX;

    const move = (moveEvent) => {
      const dx = moveEvent.clientX - lastX;
      state.rotate += dx * 0.22;
      if (rotateSlider) rotateSlider.value = String(Math.round(state.rotate));
      lastX = moveEvent.clientX;
    };

    const stop = () => {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", stop);
      canvas.removeEventListener("pointerleave", stop);
    };

    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointerleave", stop);
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  updateReadout();
  render();

  function animate() {
    render();
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
