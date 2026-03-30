"use client"
import { useEffect, useRef, useState, useCallback } from "react"

/* ─── Step definitions ─────────────────────────────────────────── */
const STEPS = [
  {
    name: "Transcript", icon: "📄",
    title: "Reading your", accentWord: "video",
    sub: "Extracting audio transcript & timestamps",
    color: "#6366f1",
    msgs: ["Parsing captions...", "Syncing audio frames...", "Mapping timestamps..."],
  },
  {
    name: "Summary", icon: "✦",
    title: "Generating", accentWord: "insights",
    sub: "AI distilling your video into key concepts",
    color: "#8b5cf6",
    msgs: ["Finding key ideas...", "Ranking concepts...", "Drafting summary..."],
  },
  {
    name: "Podcast", icon: "🎙",
    title: "Crafting the", accentWord: "podcast",
    sub: "Writing scripts & generating voice audio",
    color: "#f59e0b",
    msgs: ["Scripting dialogue...", "Synthesising voice...", "Mixing audio..."],
  },
  {
    name: "Tutor", icon: "🧠",
    title: "Building your", accentWord: "tutor",
    sub: "Creating flashcards & knowledge graph",
    color: "#22c55e",
    msgs: ["Mapping topics...", "Writing quiz...", "Saving to library..."],
  },
]

/* Estimated seconds per step */
const STEP_DURATIONS = [18, 22, 35, 15]

interface Props {
  currentStep: number      // 0–3
  stepProgress: number     // 0–100
  videoUrl?: string
  onComplete?: () => void
  /** Legacy compat: pass status string from old API */
  status?: string
}

/* Map old status strings → step index */
function statusToStep(s: string): number {
  if (s === "fetching_transcript") return 0
  if (s === "generating_summary")  return 1
  if (s === "creating_podcast")    return 2
  if (s === "building_tutor")      return 3
  return 0
}

export function ProcessingScreen({ currentStep: csProp, stepProgress: spProp, videoUrl = "", onComplete, status }: Props) {
  /* Legacy compat */
  const currentStep  = status !== undefined ? statusToStep(status) : csProp
  const stepProgress = status !== undefined ? 50 : spProp          // fake 50% when driven by status string

  const step = STEPS[currentStep] ?? STEPS[0]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threeRef  = useRef<any>(null)

  /* Cycling subtitle message */
  const [msgIdx, setMsgIdx]         = useState(0)
  const [msgVisible, setMsgVisible] = useState(true)
  const prevStepRef = useRef(-1)

  /* Countdown */
  const [secsLeft, setSecsLeft] = useState(90)

  /* ── Subtitle cycling ── */
  useEffect(() => {
    setMsgIdx(0)
    const id = setInterval(() => {
      setMsgVisible(false)
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % step.msgs.length)
        setMsgVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(id)
  }, [currentStep, step.msgs.length])

  /* ── Title fade on step change ── */
  useEffect(() => {
    prevStepRef.current = currentStep
  }, [currentStep])

  /* ── Countdown ── */
  useEffect(() => {
    const remaining = STEP_DURATIONS.slice(currentStep).reduce((a, b) => a + b, 0)
    const adjusted  = Math.round(remaining * (1 - stepProgress / 100))
    setSecsLeft(Math.max(1, adjusted))
    const id = setInterval(() => setSecsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [currentStep, stepProgress])

  /* ── onComplete ── */
  useEffect(() => {
    if (currentStep >= 3 && stepProgress >= 100) onComplete?.()
  }, [currentStep, stepProgress, onComplete])

  /* ── Three.js scene ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animId: number
    let THREE: any

    const init = (T: any) => {
      THREE = T
      const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)

      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)

      const scene  = new T.Scene()
      const camera = new T.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(0, 0, 4.8)
      camera.lookAt(0, 0, 0)

      const group = new T.Group()
      scene.add(group)

      /* Torus 1 */
      const t1 = new T.Mesh(
        new T.TorusGeometry(1.2, 0.045, 16, 100),
        new T.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x4338ca, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 })
      )
      group.add(t1)

      /* Torus 2 */
      const t2 = new T.Mesh(
        new T.TorusGeometry(0.85, 0.03, 16, 100),
        new T.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x6d28d9, emissiveIntensity: 0.7, metalness: 0.85, roughness: 0.1 })
      )
      t2.rotation.x = Math.PI / 2.5
      t2.rotation.y = Math.PI / 4
      group.add(t2)

      /* Torus 3 */
      const t3 = new T.Mesh(
        new T.TorusGeometry(0.55, 0.022, 16, 100),
        new T.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 0.8, metalness: 0.95, roughness: 0.1 })
      )
      t3.rotation.x = Math.PI / 1.8
      t3.rotation.z = Math.PI / 3
      group.add(t3)

      /* Core gem */
      const gem = new T.Mesh(
        new T.IcosahedronGeometry(0.32, 2),
        new T.MeshStandardMaterial({ color: 0xc7d2fe, emissive: 0x6366f1, emissiveIntensity: 1.2, metalness: 1.0, roughness: 0 })
      )
      group.add(gem)

      /* Wireframe shell */
      const wire = new T.Mesh(
        new T.IcosahedronGeometry(0.37, 1),
        new T.MeshBasicMaterial({ color: 0xa5b4fc, wireframe: true, transparent: true, opacity: 0.3 })
      )
      group.add(wire)

      /* Particle cloud */
      const pCount = 320
      const pPos   = new Float32Array(pCount * 3)
      const pColors = [0x818cf8, 0xa78bfa, 0x67e8f9, 0xc4b5fd]
      const pColArr = new Float32Array(pCount * 3)
      for (let i = 0; i < pCount; i++) {
        const r     = 1.5 + Math.random() * 1.4
        const theta = Math.random() * Math.PI * 2
        const phi   = Math.acos(2 * Math.random() - 1)
        pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
        pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        pPos[i * 3 + 2] = r * Math.cos(phi)
        const c = new T.Color(pColors[Math.floor(Math.random() * pColors.length)])
        pColArr[i * 3]     = c.r
        pColArr[i * 3 + 1] = c.g
        pColArr[i * 3 + 2] = c.b
      }
      const pGeo = new T.BufferGeometry()
      pGeo.setAttribute("position", new T.BufferAttribute(pPos, 3))
      pGeo.setAttribute("color",    new T.BufferAttribute(pColArr, 3))
      const particles = new T.Points(pGeo, new T.PointsMaterial({ size: 0.04, vertexColors: true, transparent: true, opacity: 0.85 }))
      group.add(particles)

      /* Orbiting orbs */
      const orbData = [
        { r: 0.68, tilt: 0.2,  speed: 1.8,  color: 0x818cf8 },
        { r: 0.82, tilt: 0.9,  speed: 1.3,  color: 0xa78bfa },
        { r: 0.95, tilt: 1.4,  speed: 2.1,  color: 0x67e8f9 },
        { r: 1.05, tilt: 0.5,  speed: 0.9,  color: 0xc4b5fd },
        { r: 1.15, tilt: 1.1,  speed: 1.6,  color: 0x6366f1 },
        { r: 1.28, tilt: 0.7,  speed: 1.1,  color: 0x8b5cf6 },
      ]
      const orbs = orbData.map(d => {
        const m = new T.Mesh(
          new T.SphereGeometry(0.055, 8, 8),
          new T.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 2.0, metalness: 1, roughness: 0 })
        )
        group.add(m)
        return { mesh: m, ...d }
      })

      /* Lights */
      const ambLight = new T.AmbientLight(0x6366f1, 0.6)
      scene.add(ambLight)
      const ptLight1 = new T.PointLight(0x6366f1, 6, 20)
      scene.add(ptLight1)
      const ptLight2 = new T.PointLight(0x8b5cf6, 4, 15)
      ptLight2.position.set(-3, 2, 2)
      scene.add(ptLight2)
      const ptLight3 = new T.PointLight(0x06b6d4, 3, 15)
      ptLight3.position.set(3, -2, -2)
      scene.add(ptLight3)

      /* Store refs for color updates */
      threeRef.current = { ambLight, ptLight1, t1, T }

      /* Resize observer */
      const ro = new ResizeObserver(() => {
        const w2 = canvas.clientWidth, h2 = canvas.clientHeight
        renderer.setSize(w2, h2, false)
        camera.aspect = w2 / h2
        camera.updateProjectionMatrix()
      })
      ro.observe(canvas)

      /* Animation */
      let time = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        time += 0.016

        group.rotation.y += 0.0025
        group.rotation.x  = Math.sin(time * 0.3) * 0.15

        t1.rotation.z += 0.008
        t2.rotation.z += 0.012
        t2.rotation.x += 0.005
        t3.rotation.y += 0.018
        t3.rotation.x += 0.007

        gem.rotation.y  += 0.01
        gem.rotation.x  += 0.007
        wire.rotation.y -= 0.008
        wire.rotation.z += 0.005

        particles.rotation.y += 0.001

        orbs.forEach((o, i) => {
          const angle = time * o.speed + i * 1.05
          o.mesh.position.x = Math.cos(angle) * o.r
          o.mesh.position.y = Math.sin(angle * 0.7) * o.r * Math.sin(o.tilt)
          o.mesh.position.z = Math.sin(angle) * o.r * Math.cos(o.tilt)
        })

        ptLight1.position.set(Math.sin(time * 0.7) * 3, Math.cos(time * 0.5) * 2, 2)
        ptLight2.position.set(Math.cos(time * 0.4) * 3, Math.sin(time * 0.6) * 2, -2)

        renderer.render(scene, camera)
      }
      animate()

      return () => {
        cancelAnimationFrame(animId)
        ro.disconnect()
        renderer.dispose()
        threeRef.current = null
      }
    }

    /* Load Three.js from CDN */
    const existing = (window as any).__THREE__
    if (existing) {
      const cleanup = init(existing)
      return cleanup
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = () => {
      (window as any).__THREE__ = (window as any).THREE
      init((window as any).THREE)
    }
    document.head.appendChild(script)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  /* ── Update light colors when step changes ── */
  useEffect(() => {
    const ref = threeRef.current
    if (!ref) return
    const { ambLight, ptLight1, t1, T } = ref
    const c = new T.Color(step.color)
    ambLight.color.set(c)
    ptLight1.color.set(c)
    t1.material.emissive.set(c)
  }, [currentStep, step.color])

  /* ── Derived values ── */
  const overallPct = Math.round(((currentStep * 100) + stepProgress) / 4)

  const displayUrl = videoUrl
    ? videoUrl.replace(/^https?:\/\/(www\.)?/, "").slice(0, 42) + (videoUrl.length > 52 ? "…" : "")
    : "youtube.com/watch?v=..."

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#04040a", borderRadius: 20, overflow: "hidden", userSelect: "none" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap');
        @keyframes processingPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmerSweep { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes orbPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
      `}</style>

      {/* ══ ZONE 1 — 3D Scene ══ */}
      <div style={{ position: "relative", height: 340, background: "#04040a", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* Top bar overlay */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
          {/* URL chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
            </svg>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 400, letterSpacing: "0.01em" }}>{displayUrl}</span>
          </div>

          {/* Processing badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", border: "1px solid rgba(34,197,94,0.3)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "processingPulse 1.2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Processing</span>
          </div>
        </div>


      </div>

      {/* ══ ZONE 2 — Progress Panel ══ */}
      <div style={{ background: "rgba(8,8,18,0.95)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: 20 }}>

        {/* Step cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {STEPS.map((s, i) => {
            const isDone   = i < currentStep || (i === currentStep && stepProgress >= 100)
            const isActive = i === currentStep && stepProgress < 100
            const pct      = isDone ? 100 : isActive ? stepProgress : 0

            const cardBg     = isDone ? "rgba(34,197,94,0.06)"   : isActive ? "rgba(99,102,241,0.1)"  : "rgba(255,255,255,0.03)"
            const cardBorder = isDone ? "rgba(34,197,94,0.22)"   : isActive ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"
            const cardShadow = isActive ? "0 0 24px rgba(99,102,241,0.12)" : "none"
            const nameColor  = isDone ? "#22c55e" : isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.25)"
            const pctColor   = isDone ? "#4ade80" : isActive ? "#a5b4fc" : "rgba(255,255,255,0.2)"
            const barFill    = isDone
              ? "linear-gradient(90deg,#22c55e,#4ade80)"
              : "linear-gradient(90deg,#6366f1,#a5b4fc)"

            return (
              <div key={s.name} style={{ borderRadius: 14, border: `1px solid ${cardBorder}`, background: cardBg, padding: "14px 12px", boxShadow: cardShadow, position: "relative", overflow: "hidden", transition: "all 0.4s ease" }}>
                {/* Shimmer on active */}
                {isActive && (
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 14, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)", animation: "shimmerSweep 2.2s ease-in-out infinite" }} />
                  </div>
                )}

                {/* Icon row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, opacity: isDone ? 0 : 1, transition: "opacity 0.3s" }}>{s.icon}</span>
                  <span style={{ fontSize: 14, opacity: isDone ? 1 : 0, transition: "opacity 0.3s", color: "#22c55e" }}>✓</span>
                </div>

                {/* Name */}
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: nameColor, marginBottom: 8, transition: "color 0.4s" }}>
                  {s.name}
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)", marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: barFill, transition: "width 0.6s ease" }} />
                </div>

                {/* Percentage */}
                <div style={{ fontSize: 10, fontWeight: 500, color: pctColor, transition: "color 0.4s" }}>
                  {pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          {/* Overall progress */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Overall Progress
            </div>
            <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${overallPct}%`,
                background: "linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)",
                backgroundSize: "300% 100%",
                animation: "gradientShift 3s ease infinite",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>

          {/* Countdown */}
          <div style={{ textAlign: "right", minWidth: 60 }}>
            <div style={{ fontSize: 30, fontWeight: 200, color: "rgba(255,255,255,0.85)", lineHeight: 1, letterSpacing: "-0.03em" }}>
              {secsLeft}
            </div>
            <div style={{ fontSize: 9, fontWeight: 500, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
              sec left
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
