"use client"
import { useEffect, useRef, useState } from "react"

const STEPS = [
  {
    name: "Transcript",
    icon: "📄",
    title: "Reading your",
    accent: "video",
    sub: "Extracting audio transcript & timestamps",
    msgs: ["Parsing captions...", "Syncing audio frames...", "Mapping timestamps..."],
    lightColor: 0x6366f1,
  },
  {
    name: "Summary",
    icon: "✦",
    title: "Generating",
    accent: "insights",
    sub: "AI distilling your video into key concepts",
    msgs: ["Finding key ideas...", "Ranking concepts...", "Drafting summary..."],
    lightColor: 0x8b5cf6,
  },
  {
    name: "Podcast",
    icon: "🎙",
    title: "Crafting the",
    accent: "podcast",
    sub: "Writing scripts & generating voice audio",
    msgs: ["Scripting dialogue...", "Synthesising voice...", "Mixing audio..."],
    lightColor: 0xf59e0b,
  },
  {
    name: "Tutor",
    icon: "🧠",
    title: "Building your",
    accent: "tutor",
    sub: "Creating flashcards & knowledge graph",
    msgs: ["Mapping topics...", "Writing quiz...", "Saving to library..."],
    lightColor: 0x22c55e,
  },
]

interface Props {
  currentStep: number
  stepProgress: number
  videoUrl?: string
  status?: string
  onComplete?: () => void
}

function statusToStep(s: string): number {
  if (s === "fetching_transcript") return 0
  if (s === "generating_summary") return 1
  if (s === "creating_podcast") return 2
  if (s === "building_tutor") return 3
  return 0
}

export function ProcessingScreen({ currentStep, stepProgress, videoUrl, status, onComplete }: Props) {
  const step = status ? statusToStep(status) : currentStep
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<any>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  // Rotate subtitle messages every 3s
  useEffect(() => {
    setMsgIndex(0)
    const iv = setInterval(() => setMsgIndex(i => (i + 1) % STEPS[step].msgs.length), 3000)
    return () => clearInterval(iv)
  }, [step])

  // Three.js scene
  useEffect(() => {
    if (!mountRef.current) return
    let rafId: number
    let THREE: any

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
    script.onload = () => {
      THREE = (window as any).THREE
      initScene(THREE)
    }
    // If already loaded
    if ((window as any).THREE) {
      THREE = (window as any).THREE
      initScene(THREE)
      return
    }
    document.head.appendChild(script)

    function initScene(T: any) {
      const container = mountRef.current!
      const W = container.clientWidth
      const H = 360

      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(W, H)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      container.appendChild(renderer.domElement)

      const scene = new T.Scene()
      const camera = new T.PerspectiveCamera(45, W / H, 0.1, 100)
      camera.position.set(0, 0, 5.5)
      camera.lookAt(0, 0, 0)

      // Lights
      const ambientLight = new T.AmbientLight(0x4338ca, 0.5)
      scene.add(ambientLight)
      const pointLight1 = new T.PointLight(0x6366f1, 8, 18)
      scene.add(pointLight1)
      const pointLight2 = new T.PointLight(0x8b5cf6, 4, 14)
      scene.add(pointLight2)
      const pointLight3 = new T.PointLight(0x06b6d4, 3, 12)
      scene.add(pointLight3)

      // Atom group
      const group = new T.Group()
      scene.add(group)

      // Nucleus
      const nucleusGeo = new T.SphereGeometry(0.38, 32, 32)
      const nucleusMat = new T.MeshStandardMaterial({
        color: 0xc7d2fe, emissive: 0x6366f1, emissiveIntensity: 1.5,
        roughness: 0.0, metalness: 1.0,
      })
      const nucleus = new T.Mesh(nucleusGeo, nucleusMat)
      group.add(nucleus)

      const glowGeo = new T.SphereGeometry(0.44, 32, 32)
      const glowMat = new T.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.15 })
      group.add(new T.Mesh(glowGeo, glowMat))

      // Rings
      const ringDefs = [
        { color: 0x6366f1, emissive: 0x4338ca, rx: 0, ry: 0, rz: 0 },
        { color: 0x8b5cf6, emissive: 0x6d28d9, rx: Math.PI / 3, ry: Math.PI / 6, rz: 0 },
        { color: 0x06b6d4, emissive: 0x0891b2, rx: -Math.PI / 3, ry: -Math.PI / 6, rz: Math.PI / 4 },
      ]
      const rings: any[] = []
      ringDefs.forEach(def => {
        const geo = new T.TorusGeometry(1.6, 0.018, 16, 160)
        const mat = new T.MeshStandardMaterial({
          color: def.color, emissive: def.emissive, emissiveIntensity: 0.9,
          metalness: 0.9, roughness: 0.05,
        })
        const mesh = new T.Mesh(geo, mat)
        mesh.rotation.set(def.rx, def.ry, def.rz)
        group.add(mesh)
        rings.push(mesh)
      })

      // Electrons
      const electronDefs = [
        { color: 0xa5b4fc, emissive: 0x6366f1, speed: 0.022 },
        { color: 0xc4b5fd, emissive: 0x8b5cf6, speed: 0.016 },
        { color: 0x67e8f9, emissive: 0x06b6d4, speed: 0.019 },
      ]
      const electrons: { mesh: any; angle: number; speed: number; ringIdx: number }[] = []
      electronDefs.forEach((def, i) => {
        const geo = new T.SphereGeometry(0.075, 16, 16)
        const mat = new T.MeshStandardMaterial({
          color: def.color, emissive: def.emissive, emissiveIntensity: 3.0,
        })
        const mesh = new T.Mesh(geo, mat)
        group.add(mesh)
        electrons.push({ mesh, angle: (i * Math.PI * 2) / 3, speed: def.speed, ringIdx: i })
      })

      // Particle field
      const particleCount = 280
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const pColors = [
        new T.Color(0x818cf8), new T.Color(0xa78bfa),
        new T.Color(0x67e8f9), new T.Color(0xc4b5fd),
      ]
      for (let i = 0; i < particleCount; i++) {
        const r = 2.2 + Math.random() * 1.6
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = r * Math.cos(phi)
        const c = pColors[Math.floor(Math.random() * pColors.length)]
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
      }
      const pGeo = new T.BufferGeometry()
      pGeo.setAttribute("position", new T.BufferAttribute(positions, 3))
      pGeo.setAttribute("color", new T.BufferAttribute(colors, 3))
      const pMat = new T.PointsMaterial({ size: 0.03, opacity: 0.6, transparent: true, vertexColors: true })
      const particles = new T.Points(pGeo, pMat)
      scene.add(particles)

      // Store refs for step color updates
      sceneRef.current = { ambientLight, pointLight1, nucleusMat, rings }

      const vec3 = new T.Vector3()
      let t = 0

      function animate() {
        rafId = requestAnimationFrame(animate)
        t += 0.016

        // Lights animate
        pointLight1.position.set(Math.sin(t * 0.7) * 3, Math.cos(t * 0.5) * 3, 3)
        pointLight2.position.set(Math.cos(t * 0.4) * -3, -2, Math.sin(t * 0.6) * 2)
        pointLight3.position.set(0, Math.sin(t * 0.3) * 3, -2)

        // Nucleus rotate
        nucleus.rotation.y += 0.008

        // Electrons orbit
        electrons.forEach(e => {
          e.angle += e.speed
          const R = 1.6
          vec3.set(Math.cos(e.angle) * R, Math.sin(e.angle) * R, 0)
          vec3.applyQuaternion(rings[e.ringIdx].quaternion)
          e.mesh.position.copy(vec3)
        })

        // Group rotation
        group.rotation.y += 0.004
        group.rotation.x = Math.sin(t * 0.25) * 0.12

        // Particles
        particles.rotation.y += 0.0008

        renderer.render(scene, camera)
      }
      animate()

      // Handle resize
      const onResize = () => {
        const w = container.clientWidth
        camera.aspect = w / H
        camera.updateProjectionMatrix()
        renderer.setSize(w, H)
      }
      window.addEventListener("resize", onResize)

      // Cleanup stored
      sceneRef.current._cleanup = () => {
        cancelAnimationFrame(rafId)
        renderer.dispose()
        window.removeEventListener("resize", onResize)
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      }
    }

    return () => {
      if (sceneRef.current?._cleanup) sceneRef.current._cleanup()
    }
  }, [])

  // Update Three.js colors on step change
  useEffect(() => {
    if (!sceneRef.current) return
    const { ambientLight, pointLight1, nucleusMat, rings } = sceneRef.current
    const color = STEPS[step].lightColor
    const T = (window as any).THREE
    if (!T) return
    ambientLight.color.set(color)
    pointLight1.color.set(color)
    nucleusMat.emissive.set(color)
    rings[0].material.emissive.set(color)
  }, [step])

  const overall = ((step * 100) + stepProgress) / 4
  const stepData = STEPS[step]

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#04040a", borderRadius: 20, overflow: "hidden", width: "100%" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap" rel="stylesheet" />

      {/* ZONE 1 — 3D Atom */}
      <div style={{ position: "relative", height: 360, background: "#04040a", overflow: "hidden" }}>
        <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* URL chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderRadius: 10, padding: "5px 10px" }}>
            <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
              <rect width="18" height="13" rx="3" fill="#FF0000" />
              <polygon points="7,3 14,6.5 7,10" fill="white" />
            </svg>
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {videoUrl || "youtube.com/watch?v=..."}
            </span>
          </div>
          {/* Processing badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 20, padding: "5px 10px" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "blink 1.4s ease-in-out infinite" }} />
            <span style={{ fontSize: 9.5, color: "rgba(34,197,94,0.8)", letterSpacing: "0.1em", fontWeight: 600 }}>PROCESSING</span>
          </div>
        </div>


      </div>

      {/* ZONE 2 — Progress Panel */}
      <div style={{ background: "rgba(6,6,14,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "20px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Step cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {STEPS.map((s, i) => {
            const isDone = i < step
            const isActive = i === step
            return (
              <div key={i} style={{
                borderRadius: 14, padding: "14px 12px",
                display: "flex", flexDirection: "column", gap: 8,
                overflow: "hidden", position: "relative",
                background: isDone ? "rgba(34,197,94,0.06)" : isActive ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.025)",
                border: isDone ? "1px solid rgba(34,197,94,0.2)" : isActive ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(255,255,255,0.06)",
                boxShadow: isActive ? "0 0 28px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
              }}>
                {isActive && (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", animation: "shimmer 1.8s infinite", pointerEvents: "none" }} />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, opacity: isDone ? 1 : isActive ? 1 : 0.3 }}>
                    {isDone ? <span style={{ color: "#22c55e", fontSize: 14, fontWeight: 600 }}>✓</span> : s.icon}
                  </span>
                  {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block", animation: "blink 1.4s ease-in-out infinite" }} />}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: isDone ? "rgba(34,197,94,0.75)" : isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.18)" }}>
                  {s.name}
                </div>
                <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: isDone ? "transparent" : isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    background: isDone ? "linear-gradient(90deg, #22c55e, #4ade80)" : isActive ? "linear-gradient(90deg, #6366f1, #a5b4fc)" : "none",
                    width: isDone ? "100%" : isActive ? `${stepProgress}%` : "0%",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 500, color: isDone ? "rgba(34,197,94,0.7)" : isActive ? "#a5b4fc" : "rgba(255,255,255,0.08)" }}>
                  {isDone ? "done" : isActive ? `${Math.round(stepProgress)}%` : "—"}
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall progress + countdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.08em", fontWeight: 500 }}>OVERALL PROGRESS</span>
              <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>{Math.round(overall)}%</span>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
                backgroundSize: "300% 100%",
                animation: "gradientShift 3s ease infinite",
                width: `${overall}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
          <div style={{ textAlign: "center", minWidth: 52 }}>
            <div style={{ fontSize: 32, fontWeight: 200, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.04em", lineHeight: 1 }}>{Math.round(overall)}%</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
      `}</style>
    </div>
  )
}
