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
  const oledAnimTimeRef = useRef<number>(0)

  const diff = Math.abs(voltScore - ampScore)
  const isVoltLeading = voltScore > ampScore
  const isAmpLeading = ampScore > voltScore
  const isTied = voltScore === ampScore

  // 1. Draw and animate the 0.96" OLED Display Screen (Live Oscilloscope & Telemetry)
  const renderOLED = (time: number) => {
    const canvas = oledCanvasRef.current
    const texture = oledTextureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear OLED black matrix
    ctx.fillStyle = '#030712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Micro pixel grid texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    for (let x = 3; x < canvas.width; x += 5) {
      for (let y = 3; y < canvas.height; y += 5) {
        ctx.fillRect(x, y, 1.5, 1.5)
      }
    }

    const leaderColor = isVoltLeading ? '#f59e0b' : isAmpLeading ? '#06b6d4' : '#a855f7'
    const leaderTitle = isVoltLeading
      ? `👑 ${voltName.toUpperCase()}`
      : isAmpLeading
        ? `👑 ${ampName.toUpperCase()}`
        : '⚡ TEAMS TIED'

    const subText = isTied ? `${voltScore} PTS EACH` : `+${diff} PTS ADVANTAGE`

    // Header Telemetry Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.roundRect(6, 6, canvas.width - 12, 22, 4)
    ctx.fill()

    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('LIVE CIRCUIT TELEMETRY · 5.0V', canvas.width / 2, 21)

    // Glowing Leader Name
    ctx.shadowColor = leaderColor
    ctx.shadowBlur = 12
    ctx.fillStyle = leaderColor
    ctx.font = '900 18px system-ui, sans-serif'
    ctx.fillText(leaderTitle, canvas.width / 2, 54)
    ctx.shadowBlur = 0

    // Score differential
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 12px monospace'
    ctx.fillText(subText, canvas.width / 2, 74)

    // Animated Oscilloscope / Signal Waveform at bottom
    ctx.strokeStyle = leaderColor
    ctx.lineWidth = 1.8
    ctx.shadowColor = leaderColor
    ctx.shadowBlur = 8
    ctx.beginPath()
    const waveY = 104
    const waveW = canvas.width - 24
    for (let x = 0; x < waveW; x += 2) {
      const freq = isTied ? 0.08 : 0.14
      const yOffset = Math.sin((x + time * 60) * freq) * 10 * Math.sin(x * 0.03)
      if (x === 0) ctx.moveTo(12 + x, waveY + yOffset)
      else ctx.lineTo(12 + x, waveY + yOffset)
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    texture.needsUpdate = true
  }

  // Update static state on score changes
  useEffect(() => {
    if (ledMeshRef.current && ledLightRef.current) {
      const targetColor = new THREE.Color(
        isVoltLeading ? 0xf59e0b : isAmpLeading ? 0x06b6d4 : 0xa855f7,
      )
      const mat = ledMeshRef.current.material as THREE.MeshStandardMaterial
      mat.color.copy(targetColor)
      mat.emissive.copy(targetColor)
      mat.emissiveIntensity = isTied ? 1.0 : 2.5
      ledLightRef.current.color.copy(targetColor)
      ledLightRef.current.intensity = isTied ? 1.2 : 3.5
    }
    renderOLED(oledAnimTimeRef.current)
  }, [voltScore, ampScore, voltName, ampName, diff, isVoltLeading, isAmpLeading, isTied])

  // 2. Setup Three.js 3D Circuit Workbench Scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)

    // Top-down plan perspective camera: elevated high at 76° angle for top-view clarity + 3D depth
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100)
    camera.position.set(0, 16.5, 3.8)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)

    // Bench Lamp Key Light with crisp directional shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8)
    keyLight.position.set(8, 20, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.bias = -0.0001
    scene.add(keyLight)

    // Ambient workbench fill light
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.9)
    fillLight.position.set(-10, 16, -6)
    scene.add(fillLight)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95)
    scene.add(ambientLight)

    // Workbench Mat / Surface
    const benchGeo = new THREE.PlaneGeometry(70, 45)
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
    })
    const benchMesh = new THREE.Mesh(benchGeo, benchMat)
    benchMesh.rotation.x = -Math.PI / 2
    benchMesh.position.y = -0.6
    benchMesh.receiveShadow = true
    scene.add(benchMesh)

    // --- Main 3D Solderless Breadboard Assembly ---
    const boardGroup = new THREE.Group()
    scene.add(boardGroup)

    const boardWidth = 22
    const boardLength = 10
    const boardHeight = 0.95

    // Realistic Breadboard Body (Smooth ABS polymer with chamfered look)
    const boardGeo = new THREE.BoxGeometry(boardWidth, boardHeight, boardLength)
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfb,
      roughness: 0.35,
      metalness: 0.05,
    })
    const boardMesh = new THREE.Mesh(boardGeo, boardMat)
    boardMesh.position.y = 0
    boardMesh.castShadow = true
    boardMesh.receiveShadow = true
    boardGroup.add(boardMesh)

    // Interlocking side tabs (Dovetail notches)
    const tabGeo = new THREE.BoxGeometry(0.4, boardHeight * 0.7, 1.2)
    const tabMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
    const tabLeft1 = new THREE.Mesh(tabGeo, tabMat)
    tabLeft1.position.set(-boardWidth / 2 - 0.15, 0, -2.5)
    boardGroup.add(tabLeft1)

    const tabLeft2 = new THREE.Mesh(tabGeo, tabMat)
    tabLeft2.position.set(-boardWidth / 2 - 0.15, 0, 2.5)
    boardGroup.add(tabLeft2)

    // Center IC Isolation Valley Trench
    const trenchGeo = new THREE.BoxGeometry(boardWidth - 1.2, 0.28, 0.75)
    const trenchMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.8,
    })
    const trenchMesh = new THREE.Mesh(trenchGeo, trenchMat)
    trenchMesh.position.set(0, boardHeight / 2 - 0.08, 0)
    boardGroup.add(trenchMesh)

    // Authentic Solderless Breadboard Markings Canvas Texture
    const socketCanvas = document.createElement('canvas')
    socketCanvas.width = 2048
    socketCanvas.height = 1024
    const sCtx = socketCanvas.getContext('2d')
    if (sCtx) {
      sCtx.fillStyle = '#fafafa'
      sCtx.fillRect(0, 0, socketCanvas.width, socketCanvas.height)

      // Power rail red (+) lines
      sCtx.fillStyle = '#ef4444'
      sCtx.fillRect(40, 70, socketCanvas.width - 80, 8)
      sCtx.fillRect(40, socketCanvas.height - 130, socketCanvas.width - 80, 8)

      // Power rail blue (-) lines
      sCtx.fillStyle = '#2563eb'
      sCtx.fillRect(40, 130, socketCanvas.width - 80, 8)
      sCtx.fillRect(40, socketCanvas.height - 70, socketCanvas.width - 80, 8)

      // Printed rail symbols + / -
      sCtx.font = 'bold 24px monospace'
      for (let x = 60; x < socketCanvas.width - 60; x += 180) {
        sCtx.fillStyle = '#ef4444'
        sCtx.fillText('+', x, 65)
        sCtx.fillText('+', x, socketCanvas.height - 135)

        sCtx.fillStyle = '#2563eb'
        sCtx.fillText('−', x, 160)
        sCtx.fillText('−', x, socketCanvas.height - 45)
      }

      // Printed Column Numbers (1, 5, 10, 15, 20... 60)
      sCtx.fillStyle = '#64748b'
      sCtx.font = 'bold 18px monospace'
      sCtx.textAlign = 'center'
      for (let col = 1; col <= 60; col++) {
        const x = 70 + (col - 1) * 31.8
        if (col === 1 || col % 5 === 0) {
          sCtx.fillText(`${col}`, x, 195)
          sCtx.fillText(`${col}`, x, 840)
        }
      }

      // Printed Row Letters A-E and F-J
      const lettersTop = ['A', 'B', 'C', 'D', 'E']
      const lettersBottom = ['F', 'G', 'H', 'I', 'J']
      sCtx.font = 'bold 16px monospace'
      lettersTop.forEach((l, idx) => {
        const y = 235 + idx * 45
        sCtx.fillText(l, 40, y)
        sCtx.fillText(l, socketCanvas.width - 40, y)
      })
      lettersBottom.forEach((l, idx) => {
        const y = 560 + idx * 45
        sCtx.fillText(l, 40, y)
        sCtx.fillText(l, socketCanvas.width - 40, y)
      })

      // Grid of recessed tie-point sockets with nickel-plated spring clip interiors
      for (let col = 0; col < 60; col++) {
        const x = 70 + col * 31.8

        // Top power tie-points
        sCtx.fillStyle = '#334155'
        sCtx.fillRect(x - 6, 90, 12, 12)
        sCtx.fillRect(x - 6, 110, 12, 12)
        sCtx.fillStyle = '#94a3b8'
        sCtx.fillRect(x - 3, 93, 6, 6)
        sCtx.fillRect(x - 3, 113, 6, 6)

        // Terminal rows A-E
        for (let r = 0; r < 5; r++) {
          const y = 225 + r * 45
          sCtx.fillStyle = '#1e293b'
          sCtx.fillRect(x - 7, y - 7, 14, 14)
          // Nickel spring contact shine inside hole
          sCtx.fillStyle = '#cbd5e1'
          sCtx.fillRect(x - 3, y - 3, 6, 6)
        }

        // Terminal rows F-J
        for (let r = 0; r < 5; r++) {
          const y = 550 + r * 45
          sCtx.fillStyle = '#1e293b'
          sCtx.fillRect(x - 7, y - 7, 14, 14)
          sCtx.fillStyle = '#cbd5e1'
          sCtx.fillRect(x - 3, y - 3, 6, 6)
        }

        // Bottom power tie-points
        sCtx.fillStyle = '#334155'
        sCtx.fillRect(x - 6, socketCanvas.height - 110, 12, 12)
        sCtx.fillRect(x - 6, socketCanvas.height - 90, 12, 12)
        sCtx.fillStyle = '#94a3b8'
        sCtx.fillRect(x - 3, socketCanvas.height - 107, 6, 6)
        sCtx.fillRect(x - 3, socketCanvas.height - 87, 6, 6)
      }
    }

    const socketTex = new THREE.CanvasTexture(socketCanvas)
    const overlayGeo = new THREE.PlaneGeometry(boardWidth - 0.8, boardLength - 0.8)
    const overlayMat = new THREE.MeshBasicMaterial({
      map: socketTex,
      transparent: true,
      opacity: 0.85,
    })
    const overlayMesh = new THREE.Mesh(overlayGeo, overlayMat)
    overlayMesh.rotation.x = -Math.PI / 2
    overlayMesh.position.set(0, boardHeight / 2 + 0.015, 0)
    boardGroup.add(overlayMesh)

    // --- Laboratory Binding Posts (Left side power terminal strip) ---
    const postMatRed = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.4, roughness: 0.3 })
    const postMatBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.4, roughness: 0.3 })
    const postMatGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })

    function createBindingPost(x: number, z: number, mat: THREE.Material) {
      const pGroup = new THREE.Group()
      pGroup.position.set(x, boardHeight / 2, z)

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.4, 20), mat)
      base.castShadow = true
      pGroup.add(base)

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.45, 20), postMatGold)
      collar.position.y = 0.35
      collar.castShadow = true
      pGroup.add(collar)

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 20), mat)
      cap.position.y = 0.65
      cap.castShadow = true
      pGroup.add(cap)

      boardGroup.add(pGroup)
    }

    createBindingPost(-boardWidth / 2 + 1.2, -3.2, postMatRed)
    createBindingPost(-boardWidth / 2 + 1.2, -1.2, postMatBlack)
    createBindingPost(-boardWidth / 2 + 1.2, 1.2, postMatGold)

    // --- High-Fidelity 3D Electronic Components ---

    // 1. DIP-14 Microcontroller IC (Matte epoxy package with silver pins & laser marking)
    const icWidth = 4.6
    const icLength = 1.45
    const icHeight = 0.52
    const icGeo = new THREE.BoxGeometry(icWidth, icHeight, icLength)
    const icMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.65,
      metalness: 0.15,
    })
    const icMesh = new THREE.Mesh(icGeo, icMat)
    icMesh.position.set(-4.2, boardHeight / 2 + icHeight / 2, 0)
    icMesh.castShadow = true
    boardGroup.add(icMesh)

    // IC Polarity Notch
    const notchMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x030712, roughness: 0.9 }),
    )
    notchMesh.position.set(-4.2 - icWidth / 2 + 0.12, boardHeight / 2 + icHeight, 0)
    boardGroup.add(notchMesh)

    // Laser-etched IC Text
    const icLabelCanvas = document.createElement('canvas')
    icLabelCanvas.width = 256
    icLabelCanvas.height = 64
    const icCtx = icLabelCanvas.getContext('2d')
    if (icCtx) {
      icCtx.fillStyle = '#111827'
      icCtx.fillRect(0, 0, icLabelCanvas.width, icLabelCanvas.height)
      icCtx.fillStyle = '#94a3b8'
      icCtx.font = 'bold 22px monospace'
      icCtx.textAlign = 'center'
      icCtx.fillText('ATMEGA-328P', 128, 38)
    }
    const icLabelTex = new THREE.CanvasTexture(icLabelCanvas)
    const icLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(icWidth * 0.85, icLength * 0.75),
      new THREE.MeshBasicMaterial({ map: icLabelTex }),
    )
    icLabel.rotation.x = -Math.PI / 2
    icLabel.position.set(-4.2, boardHeight / 2 + icHeight + 0.005, 0)
    boardGroup.add(icLabel)

    // 14 Silver Metal Pins
    const pinGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12)
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.15,
    })
    for (let i = 0; i < 7; i++) {
      const px = -4.2 - icWidth / 2 + 0.4 + i * 0.62
      const pTop = new THREE.Mesh(pinGeo, pinMat)
      pTop.position.set(px, boardHeight / 2 + 0.1, -icLength / 2 - 0.06)
      pTop.castShadow = true
      boardGroup.add(pTop)

      const pBottom = new THREE.Mesh(pinGeo, pinMat)
      pBottom.position.set(px, boardHeight / 2 + 0.1, icLength / 2 + 0.06)
      pBottom.castShadow = true
      boardGroup.add(pBottom)
    }

    // 2. 0.96" Live OLED Display Module
    const oledPcbGeo = new THREE.BoxGeometry(5.0, 0.16, 3.6)
    const oledPcbMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.35,
      metalness: 0.2,
    })
    const oledPcb = new THREE.Mesh(oledPcbGeo, oledPcbMat)
    oledPcb.position.set(4.5, boardHeight / 2 + 0.25, 0)
    oledPcb.castShadow = true
    boardGroup.add(oledPcb)

    // Gold mounting holes on OLED corners
    const holeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    const holeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.18, 16)
    ;[
      [-2.2, -1.5],
      [2.2, -1.5],
      [-2.2, 1.5],
      [2.2, 1.5],
    ].forEach(([dx, dz]) => {
      const hole = new THREE.Mesh(holeGeo, holeMat)
      hole.position.set(4.5 + dx, boardHeight / 2 + 0.26, dz)
      boardGroup.add(hole)
    })

    // OLED Screen Glass Panel with Live Dynamic Texture
    const oledCanvas = document.createElement('canvas')
    oledCanvas.width = 256
    oledCanvas.height = 128
    oledCanvasRef.current = oledCanvas

    const oledTexture = new THREE.CanvasTexture(oledCanvas)
    oledTextureRef.current = oledTexture

    const screenGeo = new THREE.PlaneGeometry(4.4, 2.9)
    const screenMat = new THREE.MeshBasicMaterial({ map: oledTexture })
    const screenMesh = new THREE.Mesh(screenGeo, screenMat)
    screenMesh.rotation.x = -Math.PI / 2
    screenMesh.position.set(4.5, boardHeight / 2 + 0.34, 0)
    boardGroup.add(screenMesh)

    // 3. Radial Electrolytic Capacitor (Aluminum Can with Vent)
    const capGeo = new THREE.CylinderGeometry(0.58, 0.58, 1.6, 32)
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.3,
      metalness: 0.3,
    })
    const capMesh = new THREE.Mesh(capGeo, capMat)
    capMesh.position.set(-0.6, boardHeight / 2 + 0.8, 2.0)
    capMesh.castShadow = true
    boardGroup.add(capMesh)

    // Shiny silver vent top
    const ventMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 0.08, 32),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 }),
    )
    ventMesh.position.set(-0.6, boardHeight / 2 + 1.62, 2.0)
    boardGroup.add(ventMesh)

    // 4. Blue Precision Trimpot Potentiometer
    const potGroup = new THREE.Group()
    potGroup.position.set(-0.6, boardHeight / 2 + 0.45, -2.4)
    const potBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.85, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }),
    )
    potBody.castShadow = true
    potGroup.add(potBody)

    // Brass adjustment dial screw on top
    const screwMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 }),
    )
    screwMesh.position.y = 0.48
    potGroup.add(screwMesh)
    boardGroup.add(potGroup)

    // 5. Ceramic Disc Capacitor (Orange disc)
    const discMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 }),
    )
    discMesh.rotation.x = Math.PI / 2
    discMesh.position.set(-1.0, boardHeight / 2 + 0.65, 0)
    discMesh.castShadow = true
    boardGroup.add(discMesh)

    // 6. Tactile Pushbutton Switch (6x6mm micro-switch)
    const btnGroup = new THREE.Group()
    btnGroup.position.set(0.6, boardHeight / 2 + 0.25, 0)
    const btnBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.35, 0.9),
      new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.6, roughness: 0.3 }),
    )
    btnBase.castShadow = true
    btnGroup.add(btnBase)

    const btnPlunger = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 }),
    )
    btnPlunger.position.y = 0.28
    btnPlunger.castShadow = true
    btnGroup.add(btnPlunger)
    boardGroup.add(btnGroup)

    // 7. Banded Carbon-Film Resistors
    function createResistor(x: number, z: number, rotY: number, bandColors: number[]) {
      const rGroup = new THREE.Group()
      rGroup.position.set(x, boardHeight / 2 + 0.24, z)
      rGroup.rotation.y = rotY

      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.1, 16)
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 })
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
      bodyMesh.rotation.z = Math.PI / 2
      bodyMesh.castShadow = true
      rGroup.add(bodyMesh)

      bandColors.forEach((color, idx) => {
        const bandMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.19, 0.19, 0.09, 16),
          new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
        )
        bandMesh.rotation.z = Math.PI / 2
        bandMesh.position.x = -0.32 + idx * 0.18
        rGroup.add(bandMesh)
      })

      const leadGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8)
      const leadMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.3 })
      const l1 = new THREE.Mesh(leadGeo, leadMat)
      l1.rotation.z = Math.PI / 2
      l1.position.x = -0.75
      rGroup.add(l1)

      const l2 = new THREE.Mesh(leadGeo, leadMat)
      l2.rotation.z = Math.PI / 2
      l2.position.x = 0.75
      rGroup.add(l2)

      boardGroup.add(rGroup)
    }

    createResistor(-4.2, 2.4, 0, [0x78350f, 0x000000, 0xd97706, 0xeab308]) // 1k
    createResistor(-4.2, -2.4, 0, [0xd97706, 0xd97706, 0x78350f, 0xeab308]) // 220Ω
    createResistor(1.8, -2.4, Math.PI / 2, [0x78350f, 0x000000, 0xf97316, 0xeab308]) // 10k
    createResistor(1.8, 2.4, Math.PI / 2, [0x10b981, 0x2563eb, 0x78350f, 0xeab308]) // 560Ω

    // 8. Bi-Color 5mm Domed LED with Dynamic PointLight
    const ledBaseGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.5, 24)
    const ledDomeGeo = new THREE.SphereGeometry(0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const initialColor = new THREE.Color(
      isVoltLeading ? 0xf59e0b : isAmpLeading ? 0x06b6d4 : 0xa855f7,
    )
    const ledMat = new THREE.MeshStandardMaterial({
      color: initialColor,
      emissive: initialColor,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.1,
    })

    const ledGroup = new THREE.Group()
    ledGroup.position.set(-0.6, boardHeight / 2 + 0.28, -0.9)

    const ledBase = new THREE.Mesh(ledBaseGeo, ledMat)
    ledBase.castShadow = true
    ledGroup.add(ledBase)

    const ledDome = new THREE.Mesh(ledDomeGeo, ledMat)
    ledDome.position.y = 0.25
    ledDome.castShadow = true
    ledGroup.add(ledDome)

    boardGroup.add(ledGroup)
    ledMeshRef.current = ledBase

    const ledLight = new THREE.PointLight(initialColor, 3.0, 9)
    ledLight.position.set(-0.6, boardHeight / 2 + 1.2, -0.9)
    boardGroup.add(ledLight)
    ledLightRef.current = ledLight

    // 9. Flexible 3D Jumper Wires with Animated Electron Flow Pulses
    interface WireData {
      curve: THREE.CatmullRomCurve3
      pulseMesh: THREE.Mesh
      speed: number
      offset: number
    }
    const animatedWires: WireData[] = []

    const pulseGeo = new THREE.SphereGeometry(0.14, 12, 12)

    function createCurvedJumper(
      points: THREE.Vector3[],
      color: number,
      radius = 0.08,
      hasPulse = true,
      pulseColor = 0xffffff,
    ) {
      const curve = new THREE.CatmullRomCurve3(points)
      const wireGeo = new THREE.TubeGeometry(curve, 40, radius, 12, false)
      const wireMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.15,
      })
      const wireMesh = new THREE.Mesh(wireGeo, wireMat)
      wireMesh.castShadow = true
      boardGroup.add(wireMesh)

      if (hasPulse) {
        const pMat = new THREE.MeshBasicMaterial({ color: pulseColor })
        const pMesh = new THREE.Mesh(pulseGeo, pMat)
        boardGroup.add(pMesh)
        animatedWires.push({
          curve,
          pulseMesh: pMesh,
          speed: 0.25 + Math.random() * 0.15,
          offset: Math.random(),
        })
      }
    }

    const yB = boardHeight / 2 + 0.02

    // Red positive rail feed wire
    createCurvedJumper(
      [
        new THREE.Vector3(-6.8, yB, -boardLength / 2 + 0.45),
        new THREE.Vector3(-6.2, yB + 1.8, -2.4),
        new THREE.Vector3(-5.8, yB, -1.0),
      ],
      0xef4444,
      0.09,
      true,
      0xff6b6b,
    )

    // Blue ground rail wire
    createCurvedJumper(
      [
        new THREE.Vector3(-2.8, yB, 1.0),
        new THREE.Vector3(-2.2, yB + 1.6, 2.6),
        new THREE.Vector3(-1.8, yB, boardLength / 2 - 0.45),
      ],
      0x2563eb,
      0.09,
      true,
      0x60a5fa,
    )

    // Yellow signal bridge wire
    createCurvedJumper(
      [
        new THREE.Vector3(-2.5, yB, -0.9),
        new THREE.Vector3(-1.6, yB + 1.3, -1.4),
        new THREE.Vector3(-0.6, yB, -1.6),
      ],
      0xeab308,
      0.08,
      true,
      0xfef08a,
    )

    // Green IC data line
    createCurvedJumper(
      [
        new THREE.Vector3(1.0, yB, -1.4),
        new THREE.Vector3(1.6, yB + 1.4, 0.2),
        new THREE.Vector3(1.8, yB, 1.8),
      ],
      0x10b981,
      0.08,
      true,
      0xa7f3d0,
    )

    // Arching Team Volt Jumper Wire (left side)
    createCurvedJumper(
      [
        new THREE.Vector3(-7.2, yB, 1.6),
        new THREE.Vector3(-10.5, yB + 3.0, 1.0),
        new THREE.Vector3(-14.0, yB + 4.5, -0.4),
      ],
      0xf59e0b,
      0.11,
      true,
      0xfde68a,
    )

    // Arching Team Ampere Jumper Wire (right side)
    createCurvedJumper(
      [
        new THREE.Vector3(7.2, yB, 1.6),
        new THREE.Vector3(10.5, yB + 3.0, 1.0),
        new THREE.Vector3(14.0, yB + 4.5, -0.4),
      ],
      0x06b6d4,
      0.11,
      true,
      0xa5f3fc,
    )

    // Render loop with animated oscilloscope wave, electron pulses, and subtle ambient breathing
    let frameId: number
    const clock = new THREE.Clock()

    function animate() {
      frameId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      oledAnimTimeRef.current = t

      // Animate OLED Oscilloscope display every ~3 frames for 20fps telemetry refresh
      if (Math.floor(t * 24) % 2 === 0) {
        renderOLED(t)
      }

      // Animate flowing electron pulses along jumper wires
      animatedWires.forEach((w) => {
        const progress = (t * w.speed + w.offset) % 1
        const pt = w.curve.getPointAt(progress)
        w.pulseMesh.position.copy(pt)
      })

      // Gentle, organic breathing micro-sway for tangible 3D physical depth
      boardGroup.rotation.z = Math.sin(t * 0.2) * 0.005
      boardGroup.position.y = Math.sin(t * 0.3) * 0.03

      renderer.render(scene, camera)
    }

    animate()

    function handleResize() {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      const aspect = w / h
      camera.aspect = aspect
      if (aspect < 1.4) {
        camera.position.y = 16.5 * (1.4 / Math.max(0.65, aspect))
      } else {
        camera.position.y = 16.5
      }
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    handleResize()
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
      {/* 3D WebGL Workbench Circuit Scene */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full opacity-90" />

      {/* Team Ambient Glow Aura on Left (Volt) & Right (Ampere) */}
      <div
        className="absolute -left-36 top-1/4 h-[550px] w-[500px] rounded-full blur-[130px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -right-36 top-1/4 h-[550px] w-[500px] rounded-full blur-[130px] pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)' }}
      />
    </div>
  )
}
