import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGame } from '../context/GameContext'

export function Circuit3DBackground() {
  const { state } = useGame()
  const containerRef = useRef<HTMLDivElement>(null)

  const voltScore = state.teams.volt.score
  const ampScore = state.teams.ampere.score
  const voltName = state.teams.volt.name
  const ampName = state.teams.ampere.name

  const oledCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const oledTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const ledLightRef = useRef<THREE.PointLight | null>(null)
  const ledMeshRef = useRef<THREE.Mesh | null>(null)

  const diff = Math.abs(voltScore - ampScore)
  const isVoltLeading = voltScore > ampScore
  const isAmpLeading = ampScore > voltScore
  const isTied = voltScore === ampScore

  // 1. Update OLED Screen Texture whenever scores or leader changes
  useEffect(() => {
    const canvas = oledCanvasRef.current
    const texture = oledTextureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear OLED dark matrix
    ctx.fillStyle = '#030712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle pixel grid background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    for (let x = 4; x < canvas.width; x += 6) {
      for (let y = 4; y < canvas.height; y += 6) {
        ctx.fillRect(x, y, 2, 2)
      }
    }

    const leaderColor = isVoltLeading ? '#f59e0b' : isAmpLeading ? '#06b6d4' : '#94a3b8'
    const leaderTitle = isVoltLeading
      ? `👑 ${voltName.toUpperCase()}`
      : isAmpLeading
        ? `👑 ${ampName.toUpperCase()}`
        : '⚡ TEAMS TIED'

    const subText = isTied ? `${voltScore} PTS EACH` : `+${diff} PTS ADVANTAGE`

    // Telemetry Header Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.roundRect(8, 8, canvas.width - 16, 24, 4)
    ctx.fill()

    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('CIRCUIT CLASH TELEMETRY', canvas.width / 2, 24)

    // Glowing Leader Name
    ctx.shadowColor = leaderColor
    ctx.shadowBlur = 10
    ctx.fillStyle = leaderColor
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.fillText(leaderTitle, canvas.width / 2, 60)
    ctx.shadowBlur = 0

    // Subtext differential
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 13px monospace'
    ctx.fillText(subText, canvas.width / 2, 84)

    // Live Telemetry Signal Bar
    const barWidth = canvas.width - 36
    const voltFrac = voltScore + ampScore > 0 ? voltScore / (voltScore + ampScore) : 0.5
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(18, 98, barWidth, 6)

    ctx.fillStyle = '#f59e0b'
    ctx.fillRect(18, 98, barWidth * voltFrac, 6)

    ctx.fillStyle = '#06b6d4'
    ctx.fillRect(18 + barWidth * voltFrac, 98, barWidth * (1 - voltFrac), 6)

    texture.needsUpdate = true

    // Update LED Color & Point Light Glow
    if (ledMeshRef.current && ledLightRef.current) {
      const targetColor = new THREE.Color(
        isVoltLeading ? 0xf59e0b : isAmpLeading ? 0x06b6d4 : 0x94a3b8,
      )
      const mat = ledMeshRef.current.material as THREE.MeshStandardMaterial
      mat.color.copy(targetColor)
      mat.emissive.copy(targetColor)
      mat.emissiveIntensity = isTied ? 0.8 : 2.2
      ledLightRef.current.color.copy(targetColor)
      ledLightRef.current.intensity = isTied ? 1.0 : 3.0
    }
  }, [voltScore, ampScore, voltName, ampName, diff, isVoltLeading, isAmpLeading, isTied])

  // 2. Setup Three.js Realistic 3D Breadboard Scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 8.5, 13)
    camera.lookAt(0, -0.4, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    keyLight.position.set(6, 14, 8)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.7)
    fillLight.position.set(-8, 10, 6)
    scene.add(fillLight)

    // Workbench Shadow Plane
    const benchGeo = new THREE.PlaneGeometry(60, 40)
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
    })
    const benchMesh = new THREE.Mesh(benchGeo, benchMat)
    benchMesh.rotation.x = -Math.PI / 2
    benchMesh.position.y = -0.6
    benchMesh.receiveShadow = true
    scene.add(benchMesh)

    // --- Main 3D Solderless Breadboard Slab ---
    const boardGroup = new THREE.Group()
    scene.add(boardGroup)

    // Breadboard body (White plastic chassis)
    const boardWidth = 20
    const boardLength = 9.5
    const boardHeight = 0.9
    const boardGeo = new THREE.BoxGeometry(boardWidth, boardHeight, boardLength)
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.45,
      metalness: 0.05,
    })
    const boardMesh = new THREE.Mesh(boardGeo, boardMat)
    boardMesh.position.y = 0
    boardMesh.castShadow = true
    boardMesh.receiveShadow = true
    boardGroup.add(boardMesh)

    // Center IC Isolation Trench
    const trenchGeo = new THREE.BoxGeometry(boardWidth - 1.2, 0.25, 0.7)
    const trenchMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.8,
    })
    const trenchMesh = new THREE.Mesh(trenchGeo, trenchMat)
    trenchMesh.position.set(0, boardHeight / 2 - 0.08, 0)
    boardGroup.add(trenchMesh)

    // Power Bus Stripes (Red + and Blue -)
    const busGeo = new THREE.BoxGeometry(boardWidth - 1.2, 0.04, 0.12)
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 })

    const redTop = new THREE.Mesh(busGeo, redMat)
    redTop.position.set(0, boardHeight / 2 + 0.01, -boardLength / 2 + 0.45)
    boardGroup.add(redTop)

    const blueTop = new THREE.Mesh(busGeo, blueMat)
    blueTop.position.set(0, boardHeight / 2 + 0.01, -boardLength / 2 + 0.75)
    boardGroup.add(blueTop)

    const redBottom = new THREE.Mesh(busGeo, redMat)
    redBottom.position.set(0, boardHeight / 2 + 0.01, boardLength / 2 - 0.75)
    boardGroup.add(redBottom)

    const blueBottom = new THREE.Mesh(busGeo, blueMat)
    blueBottom.position.set(0, boardHeight / 2 + 0.01, boardLength / 2 - 0.45)
    boardGroup.add(blueBottom)

    // Tie-Point Socket Hole Texture
    const socketCanvas = document.createElement('canvas')
    socketCanvas.width = 1024
    socketCanvas.height = 512
    const sCtx = socketCanvas.getContext('2d')
    if (sCtx) {
      sCtx.fillStyle = '#fafafa'
      sCtx.fillRect(0, 0, socketCanvas.width, socketCanvas.height)

      sCtx.fillStyle = '#64748b'
      sCtx.font = 'bold 11px monospace'

      // Draw tie-point socket squares
      sCtx.fillStyle = '#475569'
      for (let c = 0; c < 48; c++) {
        const x = 32 + c * 20
        // Top terminal section (5 rows A-E)
        for (let r = 0; r < 5; r++) {
          const y = 80 + r * 18
          sCtx.fillRect(x, y, 9, 9)
        }
        // Bottom terminal section (5 rows F-J)
        for (let r = 0; r < 5; r++) {
          const y = 260 + r * 18
          sCtx.fillRect(x, y, 9, 9)
        }
      }
    }
    const socketTex = new THREE.CanvasTexture(socketCanvas)
    const overlayGeo = new THREE.PlaneGeometry(boardWidth - 1.2, boardLength - 2.0)
    const overlayMat = new THREE.MeshBasicMaterial({
      map: socketTex,
      transparent: true,
      opacity: 0.55,
    })
    const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat)
    overlayMesh.rotation.x = -Math.PI / 2
    overlayMesh.position.set(0, boardHeight / 2 + 0.02, 0)
    boardGroup.add(overlayMesh)

    // --- 3D Electronic Components ---

    // 1. DIP-14 Microcontroller IC
    const icWidth = 4.4
    const icLength = 1.4
    const icHeight = 0.5
    const icGeo = new THREE.BoxGeometry(icWidth, icHeight, icLength)
    const icMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.1,
    })
    const icMesh = new THREE.Mesh(icGeo, icMat)
    icMesh.position.set(-4.0, boardHeight / 2 + icHeight / 2, 0)
    icMesh.castShadow = true
    boardGroup.add(icMesh)

    // IC Notch (Pin 1 indicator)
    const notchGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16)
    const notchMat = new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 })
    const notchMesh = new THREE.Mesh(notchGeo, notchMat)
    notchMesh.position.set(-4.0 - icWidth / 2 + 0.15, boardHeight / 2 + icHeight, 0)
    boardGroup.add(notchMesh)

    // IC Pins (14 silver metal legs)
    const pinGeo = new THREE.BoxGeometry(0.1, 0.45, 0.1)
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.2,
    })
    for (let i = 0; i < 7; i++) {
      const px = -4.0 - icWidth / 2 + 0.4 + i * 0.6
      const pinTop = new THREE.Mesh(pinGeo, pinMat)
      pinTop.position.set(px, boardHeight / 2 + 0.1, -icLength / 2 - 0.05)
      boardGroup.add(pinTop)

      const pinBottom = new THREE.Mesh(pinGeo, pinMat)
      pinBottom.position.set(px, boardHeight / 2 + 0.1, icLength / 2 + 0.05)
      boardGroup.add(pinBottom)
    }

    // 2. 0.96" OLED Display Module
    const oledPcbGeo = new THREE.BoxGeometry(4.8, 0.14, 3.4)
    const oledPcbMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.4,
      metalness: 0.2,
    })
    const oledPcb = new THREE.Mesh(oledPcbGeo, oledPcbMat)
    oledPcb.position.set(4.0, boardHeight / 2 + 0.2, 0)
    oledPcb.castShadow = true
    boardGroup.add(oledPcb)

    // OLED Screen Surface with Dynamic Canvas Texture
    const oledCanvas = document.createElement('canvas')
    oledCanvas.width = 256
    oledCanvas.height = 128
    oledCanvasRef.current = oledCanvas

    const oledTexture = new THREE.CanvasTexture(oledCanvas)
    oledTextureRef.current = oledTexture

    const screenGeo = new THREE.PlaneGeometry(4.2, 2.7)
    const screenMat = new THREE.MeshBasicMaterial({ map: oledTexture })
    const screenMesh = new THREE.Mesh(screenGeo, screenMat)
    screenMesh.rotation.x = -Math.PI / 2
    screenMesh.position.set(4.0, boardHeight / 2 + 0.28, 0)
    boardGroup.add(screenMesh)

    // 3. Radial Electrolytic Capacitor
    const capGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.5, 32)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.35,
      metalness: 0.2,
    })
    const capMesh = new THREE.Mesh(capGeo, capMat)
    capMesh.position.set(-0.8, boardHeight / 2 + 0.75, 1.8)
    capMesh.castShadow = true
    boardGroup.add(capMesh)

    // Metallic Cap Vent Top
    const ventGeo = new THREE.CylinderGeometry(0.53, 0.53, 0.08, 32)
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.15,
    })
    const ventMesh = new THREE.Mesh(ventGeo, ventMat)
    ventMesh.position.set(-0.8, boardHeight / 2 + 1.52, 1.8)
    boardGroup.add(ventMesh)

    // 4. Ceramic Disc Capacitor
    const discGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.12, 24)
    const discMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.6,
    })
    const discMesh = new THREE.Mesh(discGeo, discMat)
    discMesh.rotation.x = Math.PI / 2
    discMesh.position.set(-1.0, boardHeight / 2 + 0.6, -2.0)
    discMesh.castShadow = true
    boardGroup.add(discMesh)

    // 5. Banded Carbon-Film Resistors
    function createResistor(x: number, z: number, rotY: number, bandColors: number[]) {
      const rGroup = new THREE.Group()
      rGroup.position.set(x, boardHeight / 2 + 0.22, z)
      rGroup.rotation.y = rotY

      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.0, 16)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 })
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
      bodyMesh.rotation.z = Math.PI / 2
      bodyMesh.castShadow = true
      rGroup.add(bodyMesh)

      // Color bands
      bandColors.forEach((color, idx) => {
        const bandGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.08, 16)
        const bandMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 })
        const bandMesh = new THREE.Mesh(bandGeo, bandMat)
        bandMesh.rotation.z = Math.PI / 2
        bandMesh.position.x = -0.3 + idx * 0.18
        rGroup.add(bandMesh)
      })

      // Wire leads
      const leadGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8)
      const leadMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.3 })
      const lead1 = new THREE.Mesh(leadGeo, leadMat)
      lead1.rotation.z = Math.PI / 2
      lead1.position.x = -0.7
      rGroup.add(lead1)

      const lead2 = new THREE.Mesh(leadGeo, leadMat)
      lead2.rotation.z = Math.PI / 2
      lead2.position.x = 0.7
      rGroup.add(lead2)

      boardGroup.add(rGroup)
    }

    // 1k Resistor (Brown, Black, Red, Gold)
    createResistor(-4.2, 2.2, 0, [0x78350f, 0x000000, 0xd97706, 0xeab308])
    // 220 Ohm Resistor (Red, Red, Brown, Gold)
    createResistor(-0.5, -0.2, Math.PI / 2, [0xd97706, 0xd97706, 0x78350f, 0xeab308])
    // 10k Resistor (Brown, Black, Orange, Gold)
    createResistor(4.0, 2.4, 0, [0x78350f, 0x000000, 0xf97316, 0xeab308])

    // 6. Bi-Color 5mm Domed LED with Dynamic PointLight
    const ledBaseGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 24)
    const ledDomeGeo = new THREE.SphereGeometry(0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const initialColor = new THREE.Color(
      isVoltLeading ? 0xf59e0b : isAmpLeading ? 0x06b6d4 : 0x94a3b8,
    )
    const ledMat = new THREE.MeshStandardMaterial({
      color: initialColor,
      emissive: initialColor,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    })

    const ledGroup = new THREE.Group()
    ledGroup.position.set(-0.8, boardHeight / 2 + 0.25, -1.8)

    const ledBase = new THREE.Mesh(ledBaseGeo, ledMat)
    ledBase.castShadow = true
    ledGroup.add(ledBase)

    const ledDome = new THREE.Mesh(ledDomeGeo, ledMat)
    ledDome.position.y = 0.22
    ledDome.castShadow = true
    ledGroup.add(ledDome)

    boardGroup.add(ledGroup)
    ledMeshRef.current = ledBase

    const ledLight = new THREE.PointLight(initialColor, 2.5, 8)
    ledLight.position.set(-0.8, boardHeight / 2 + 1.2, -1.8)
    boardGroup.add(ledLight)
    ledLightRef.current = ledLight

    // 7. Flexible Curved 3D Jumper Wires
    function createJumperWire(points: THREE.Vector3[], color: number, radius = 0.08) {
      const curve = new THREE.CatmullRomCurve3(points)
      const wireGeo = new THREE.TubeGeometry(curve, 32, radius, 12, false)
      const wireMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.1,
      })
      const wireMesh = new THREE.Mesh(wireGeo, wireMat)
      wireMesh.castShadow = true
      boardGroup.add(wireMesh)
    }

    const yBase = boardHeight / 2 + 0.02
    // Red power feed wire (+ rail to IC VCC)
    createJumperWire(
      [
        new THREE.Vector3(-6.2, yBase, -boardLength / 2 + 0.45),
        new THREE.Vector3(-5.8, yBase + 1.4, -2.5),
        new THREE.Vector3(-5.4, yBase, -1.0),
      ],
      0xef4444,
    )

    // Blue ground wire (- rail to IC GND)
    createJumperWire(
      [
        new THREE.Vector3(-2.8, yBase, 1.0),
        new THREE.Vector3(-2.4, yBase + 1.2, 2.8),
        new THREE.Vector3(-2.0, yBase, boardLength / 2 - 0.45),
      ],
      0x3b82f6,
    )

    // Yellow signal jumper
    createJumperWire(
      [
        new THREE.Vector3(-2.5, yBase, -0.8),
        new THREE.Vector3(-1.8, yBase + 1.1, -1.2),
        new THREE.Vector3(-0.8, yBase, -1.4),
      ],
      0xeab308,
    )

    // Green bridge wire
    createJumperWire(
      [
        new THREE.Vector3(1.2, yBase, -1.2),
        new THREE.Vector3(1.6, yBase + 1.2, 0.4),
        new THREE.Vector3(1.6, yBase, 1.8),
      ],
      0x10b981,
    )

    // Arching Team Volt Jumper Wire (left flank toward Volt pod)
    createJumperWire(
      [
        new THREE.Vector3(-6.5, yBase, 1.4),
        new THREE.Vector3(-9.2, yBase + 2.8, 1.0),
        new THREE.Vector3(-12.5, yBase + 4.2, -0.5),
      ],
      0xf59e0b,
      0.1,
    )

    // Arching Team Ampere Jumper Wire (right flank toward Ampere pod)
    createJumperWire(
      [
        new THREE.Vector3(6.5, yBase, 1.4),
        new THREE.Vector3(9.2, yBase + 2.8, 1.0),
        new THREE.Vector3(12.5, yBase + 4.2, -0.5),
      ],
      0x06b6d4,
      0.1,
    )

    // Gentle camera parallax / subtle breath
    let frameId: number
    let clock = new THREE.Clock()

    function animate() {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Extremely subtle, smooth breathing tilt so 3D depth of wires & pins is tangible
      boardGroup.rotation.y = Math.sin(t * 0.35) * 0.03
      boardGroup.rotation.x = Math.cos(t * 0.25) * 0.015

      renderer.render(scene, camera)
    }

    animate()

    function handleResize() {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden"
    >
      {/* 3D WebGL Breadboard Scene Container */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full opacity-85" />

      {/* Subtle Flank Team Ambient Glows */}
      <div
        className="absolute -left-36 top-1/3 h-[500px] w-[450px] rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -right-36 top-1/3 h-[500px] w-[450px] rounded-full blur-[120px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, transparent 70%)' }}
      />
    </div>
  )
}
