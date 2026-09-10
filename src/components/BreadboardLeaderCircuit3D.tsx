import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  voltScore: number
  ampScore: number
  voltName: string
  ampName: string
}

export function BreadboardLeaderCircuit3D({ voltScore, ampScore, voltName, ampName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const oledCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const oledTextureRef = useRef<THREE.CanvasTexture | null>(null)
  const ledLightRef = useRef<THREE.PointLight | null>(null)
  const ledMeshRef = useRef<THREE.Mesh | null>(null)

  const diff = Math.abs(voltScore - ampScore)
  const isVoltLeading = voltScore > ampScore
  const isAmpLeading = ampScore > voltScore
  const isTied = voltScore === ampScore

  // Update OLED Canvas Texture
  useEffect(() => {
    const canvas = oledCanvasRef.current
    const texture = oledTextureRef.current
    if (!canvas || !texture) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Deep OLED dark background with subtle pixel grid
    ctx.fillStyle = '#030712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Faint pixel matrix dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
    for (let x = 4; x < canvas.width; x += 6) {
      for (let y = 4; y < canvas.height; y += 6) {
        ctx.fillRect(x, y, 2, 2)
      }
    }

    const leaderColor = isVoltLeading ? '#f59e0b' : isAmpLeading ? '#06b6d4' : '#e2e8f0'
    const leaderTitle = isVoltLeading
      ? `👑 ${voltName.toUpperCase()}`
      : isAmpLeading
        ? `👑 ${ampName.toUpperCase()}`
        : '⚡ TEAMS TIED'

    const subText = isTied ? `${voltScore} PTS EACH` : `+${diff} PTS LEAD`

    // Header Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.roundRect(8, 8, canvas.width - 16, 26, 4)
    ctx.fill()

    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('LIVE MATCH STATUS', canvas.width / 2, 25)

    // Leader Name
    ctx.fillStyle = leaderColor
    ctx.font = '900 20px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(leaderTitle, canvas.width / 2, 64)

    // Margin / Differential
    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 15px monospace'
    ctx.fillText(subText, canvas.width / 2, 92)

    // Status Bar Graphic at bottom
    ctx.fillStyle = isVoltLeading ? '#d97706' : isAmpLeading ? '#0891b2' : '#64748b'
    const barWidth = isTied ? 120 : Math.min(220, 60 + diff * 0.4)
    ctx.fillRect((canvas.width - barWidth) / 2, 108, barWidth, 6)

    texture.needsUpdate = true

    // Update 5mm LED and PointLight
    if (ledLightRef.current && ledMeshRef.current) {
      const ledColorHex = isVoltLeading ? 0xf59e0b : isAmpLeading ? 0x06b6d4 : 0xfef08a
      ledLightRef.current.color.setHex(ledColorHex)
      ledLightRef.current.intensity = isTied ? 1.5 : 3.0

      const mat = ledMeshRef.current.material as THREE.MeshStandardMaterial
      mat.color.setHex(ledColorHex)
      mat.emissive.setHex(ledColorHex)
      mat.emissiveIntensity = isTied ? 1.2 : 2.5
    }
  }, [voltScore, ampScore, voltName, ampName, isVoltLeading, isAmpLeading, isTied, diff])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    const width = container.clientWidth || 240
    const height = container.clientHeight || 96

    // 1. Scene & Lighting Setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50)
    camera.position.set(0, 3.4, 4.8)
    camera.lookAt(0, -0.1, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Studio Clay Lights
    scene.add(new THREE.AmbientLight(0xffffff, 2.2))

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8)
    keyLight.position.set(4, 6, 4)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2)
    fillLight.position.set(-4, 3, 2)
    scene.add(fillLight)

    // 2. Procedural Breadboard Texture
    const bbCanvas = document.createElement('canvas')
    bbCanvas.width = 512
    bbCanvas.height = 256
    const bbCtx = bbCanvas.getContext('2d')!

    // Base cream-white plastic body
    bbCtx.fillStyle = '#f8fafc'
    bbCtx.fillRect(0, 0, 512, 256)

    // Power Bus Lines (Red positive, Blue negative)
    bbCtx.fillStyle = '#ef4444' // top red rail
    bbCtx.fillRect(16, 22, 480, 4)
    bbCtx.fillStyle = '#3b82f6' // top blue rail
    bbCtx.fillRect(16, 40, 480, 4)

    bbCtx.fillStyle = '#3b82f6' // bottom blue rail
    bbCtx.fillRect(16, 212, 480, 4)
    bbCtx.fillStyle = '#ef4444' // bottom red rail
    bbCtx.fillRect(16, 230, 480, 4)

    // Center divider trough
    bbCtx.fillStyle = '#cbd5e1'
    bbCtx.fillRect(16, 124, 480, 8)

    // Socket Tie-Point Holes Matrix
    bbCtx.fillStyle = '#64748b'
    for (let x = 28; x < 490; x += 15) {
      // Power rails sockets
      bbCtx.fillRect(x, 14, 4, 4)
      bbCtx.fillRect(x, 32, 4, 4)
      bbCtx.fillRect(x, 220, 4, 4)
      bbCtx.fillRect(x, 238, 4, 4)

      // Top bank (5 rows)
      for (let y = 56; y <= 112; y += 14) {
        bbCtx.fillRect(x, y, 4, 4)
      }
      // Bottom bank (5 rows)
      for (let y = 140; y <= 196; y += 14) {
        bbCtx.fillRect(x, y, 4, 4)
      }
    }

    const bbTexture = new THREE.CanvasTexture(bbCanvas)
    bbTexture.generateMipmaps = true

    // 3. Breadboard Body Mesh
    const bbGeo = new THREE.BoxGeometry(4.4, 0.28, 2.2)
    const bbMat = new THREE.MeshStandardMaterial({
      map: bbTexture,
      roughness: 0.85,
      metalness: 0.05,
    })
    const breadboard = new THREE.Mesh(bbGeo, bbMat)
    breadboard.position.y = -0.15
    scene.add(breadboard)

    // 4. DIP-14 Microcontroller ("ATmega-STEM")
    const icGroup = new THREE.Group()
    const icBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.22, 0.62),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.1 })
    )
    icGroup.add(icBody)

    // Silver gull-wing pins
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 })
    const pinGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08)
    for (let i = 0; i < 7; i++) {
      const px = -0.54 + i * 0.18
      const pinTop = new THREE.Mesh(pinGeo, pinMat)
      pinTop.position.set(px, -0.06, 0.35)
      icGroup.add(pinTop)

      const pinBottom = new THREE.Mesh(pinGeo, pinMat)
      pinBottom.position.set(px, -0.06, -0.35)
      icGroup.add(pinBottom)
    }

    icGroup.position.set(-1.1, 0.04, 0)
    scene.add(icGroup)

    // 5. Banded Metal Film Resistor
    const resGroup = new THREE.Group()
    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 })
    )
    resBody.rotation.z = Math.PI / 2
    resGroup.add(resBody)

    // Lead wires
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.3, metalness: 0.8 })
    const leftLead = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), leadMat)
    leftLead.position.set(-0.35, -0.1, 0)
    resGroup.add(leftLead)
    const rightLead = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), leadMat)
    rightLead.position.set(0.35, -0.1, 0)
    resGroup.add(rightLead)

    resGroup.position.set(-1.1, 0.1, 0.72)
    scene.add(resGroup)

    // 6. Blue Electrolytic Radial Capacitor
    const capGroup = new THREE.Group()
    const capCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.55, 20),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
    )
    capGroup.add(capCan)
    const capTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 })
    )
    capTop.position.y = 0.28
    capGroup.add(capTop)
    capGroup.position.set(-0.25, 0.2, 0.68)
    scene.add(capGroup)

    // 7. Glowing 5mm Status LED
    const ledGroup = new THREE.Group()
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.05,
    })
    const ledDome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), ledMat)
    ledDome.position.y = 0.2
    ledGroup.add(ledDome)
    const ledBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.2, 16),
      ledMat
    )
    ledBase.position.y = 0.1
    ledGroup.add(ledBase)

    const ledLight = new THREE.PointLight(0xf59e0b, 2.5, 3.5)
    ledLight.position.set(0, 0.25, 0)
    ledGroup.add(ledLight)

    ledLightRef.current = ledLight
    ledMeshRef.current = ledDome

    ledGroup.position.set(-0.25, 0.05, -0.65)
    scene.add(ledGroup)

    // 8. 0.96" Live OLED Display Module
    const oledGroup = new THREE.Group()

    // Blue Breakout PCB
    const oledPcb = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.06, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6 })
    )
    oledGroup.add(oledPcb)

    // Gold Header Pins into Breadboard
    const goldPinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 })
    for (let p = 0; p < 4; p++) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8), goldPinMat)
      pin.position.set(-0.45 + p * 0.3, -0.15, -0.55)
      oledGroup.add(pin)
    }

    // OLED Screen Surface
    const oledCanvas = document.createElement('canvas')
    oledCanvas.width = 256
    oledCanvas.height = 128
    oledCanvasRef.current = oledCanvas

    const oledTexture = new THREE.CanvasTexture(oledCanvas)
    oledTextureRef.current = oledTexture

    const oledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.95),
      new THREE.MeshStandardMaterial({
        map: oledTexture,
        roughness: 0.2,
        metalness: 0.1,
        emissive: 0xffffff,
        emissiveMap: oledTexture,
        emissiveIntensity: 0.9,
      })
    )
    oledScreen.rotation.x = -Math.PI / 2
    oledScreen.position.y = 0.035
    oledScreen.position.z = 0.08
    oledGroup.add(oledScreen)

    oledGroup.position.set(0.95, 0.12, 0)
    scene.add(oledGroup)

    // 9. Curved Jumper Wires Arching to Scoreboard
    function createJumperWire(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, colorHex: number) {
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2])
      const geo = new THREE.TubeGeometry(curve, 20, 0.035, 8, false)
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.4,
        metalness: 0.1,
      })
      return new THREE.Mesh(geo, mat)
    }

    // Left Bank Wires (Team Volt Amber)
    const voltWire1 = createJumperWire(
      new THREE.Vector3(-1.8, 0.05, 0.8),
      new THREE.Vector3(-2.4, 0.6, 0.5),
      new THREE.Vector3(-2.8, 0.8, 0.2),
      0xf59e0b
    )
    scene.add(voltWire1)

    const voltWire2 = createJumperWire(
      new THREE.Vector3(-1.5, 0.05, -0.8),
      new THREE.Vector3(-2.2, 0.7, -0.5),
      new THREE.Vector3(-2.8, 0.9, -0.2),
      0xd97706
    )
    scene.add(voltWire2)

    // Right Bank Wires (Team Ampere Cyan)
    const ampWire1 = createJumperWire(
      new THREE.Vector3(1.8, 0.05, 0.8),
      new THREE.Vector3(2.4, 0.6, 0.5),
      new THREE.Vector3(2.8, 0.8, 0.2),
      0x06b6d4
    )
    scene.add(ampWire1)

    const ampWire2 = createJumperWire(
      new THREE.Vector3(1.5, 0.05, -0.8),
      new THREE.Vector3(2.2, 0.7, -0.5),
      new THREE.Vector3(2.8, 0.9, -0.2),
      0x0891b2
    )
    scene.add(ampWire2)

    // Render loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Gentle isometric floating sway
      breadboard.position.y = -0.15 + Math.sin(t * 1.5) * 0.02
      icGroup.position.y = 0.04 + Math.sin(t * 1.5) * 0.02
      resGroup.position.y = 0.1 + Math.sin(t * 1.5) * 0.02
      capGroup.position.y = 0.2 + Math.sin(t * 1.5) * 0.02
      ledGroup.position.y = 0.05 + Math.sin(t * 1.5) * 0.02
      oledGroup.position.y = 0.12 + Math.sin(t * 1.5) * 0.02

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth || 240
      const h = container.clientHeight || 96
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative h-24 w-60 shrink-0 cursor-default select-none rounded-2xl border-2 border-slate-300 bg-slate-50/90 shadow-md backdrop-blur-xs transition-all hover:scale-[1.02]"
      title={`Live Breadboard Leader Circuit: ${isVoltLeading ? voltName : isAmpLeading ? ampName : 'Tied'}`}
    />
  )
}
