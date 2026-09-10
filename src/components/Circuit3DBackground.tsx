import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Circuit3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ''

    // 1. Scene & Studio Lighting Setup
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xf8fafc, 18, 38)

    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 24)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    // Soft Studio Clay Lights
    scene.add(new THREE.AmbientLight(0xffffff, 2.4))

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8)
    keyLight.position.set(10, 15, 12)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xf0fdfa, 1.3)
    fillLight.position.set(-10, -8, 8)
    scene.add(fillLight)

    // Clay Material Factory
    function createClay(colorHex: number, emissiveHex = 0x000000, emissiveInt = 0) {
      return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.9,
        metalness: 0.02,
        emissive: emissiveHex,
        emissiveIntensity: emissiveInt,
      })
    }

    // Eye Material (Glossy Clay Bead)
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.1,
    })

    // 2. Team Volt Mascot: "Volt-Bot" (Chubby Clay Battery on Left Flank)
    const voltGroup = new THREE.Group()

    // Body
    const voltBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.25, 2.6, 32),
      createClay(0xf59e0b)
    )
    voltGroup.add(voltBody)

    // Brass Terminal Cap (Crown)
    const voltCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.4, 24),
      createClay(0xfef08a, 0xf59e0b, 0.3)
    )
    voltCap.position.y = 1.45
    voltGroup.add(voltCap)

    // Base Rim
    const voltBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.28, 0.25, 32),
      createClay(0xd97706)
    )
    voltBase.position.y = -1.25
    voltGroup.add(voltBase)

    // Eyes
    const voltLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), eyeMat)
    voltLeftEye.position.set(-0.42, 0.25, 1.15)
    voltGroup.add(voltLeftEye)

    const voltRightEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), eyeMat)
    voltRightEye.position.set(0.42, 0.25, 1.15)
    voltGroup.add(voltRightEye)

    // Cute Cheeks
    const cheekMat = createClay(0xfca5a5)
    const voltLeftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cheekMat)
    voltLeftCheek.position.set(-0.65, 0.05, 1.08)
    voltGroup.add(voltLeftCheek)

    const voltRightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cheekMat)
    voltRightCheek.position.set(0.65, 0.05, 1.08)
    voltGroup.add(voltRightCheek)

    // Antenna & Glowing Plasma Orb
    const antennaStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12),
      createClay(0x94a3b8)
    )
    antennaStem.position.set(0, 1.85, 0)
    voltGroup.add(antennaStem)

    const voltOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 20),
      createClay(0xffffff, 0xfbbf24, 2.2)
    )
    voltOrb.position.set(0, 2.3, 0)
    voltGroup.add(voltOrb)

    // Cute Chubby Feet
    const footMat = createClay(0xd97706)
    const voltLeftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), footMat)
    voltLeftFoot.scale.set(1, 0.6, 1.3)
    voltLeftFoot.position.set(-0.65, -1.35, 0.2)
    voltGroup.add(voltLeftFoot)

    const voltRightFoot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), footMat)
    voltRightFoot.scale.set(1, 0.6, 1.3)
    voltRightFoot.position.set(0.65, -1.35, 0.2)
    voltGroup.add(voltRightFoot)

    scene.add(voltGroup)

    // 3. Team Ampere Mascot: "Amp-Bot" (Chubby Clay Capacitor on Right Flank)
    const ampGroup = new THREE.Group()

    // Body
    const ampBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.25, 2.6, 32),
      createClay(0x06b6d4)
    )
    ampGroup.add(ampBody)

    // Top Header with Vent Details
    const ampCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.2, 32),
      createClay(0xe2e8f0)
    )
    ampCap.position.y = 1.35
    ampGroup.add(ampCap)

    // Glowing Neon Energy Ring around Belly
    const ampRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.12, 16, 36),
      createClay(0xffffff, 0x38bdf8, 2.0)
    )
    ampRing.rotation.x = Math.PI / 2
    ampRing.position.y = -0.3
    ampGroup.add(ampRing)

    // Eyes
    const ampLeftEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), eyeMat)
    ampLeftEye.position.set(-0.42, 0.25, 1.15)
    ampGroup.add(ampLeftEye)

    const ampRightEye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), eyeMat)
    ampRightEye.position.set(0.42, 0.25, 1.15)
    ampGroup.add(ampRightEye)

    // Cute Cheeks
    const ampLeftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cheekMat)
    ampLeftCheek.position.set(-0.65, 0.05, 1.08)
    ampGroup.add(ampLeftCheek)

    const ampRightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), cheekMat)
    ampRightCheek.position.set(0.65, 0.05, 1.08)
    ampGroup.add(ampRightCheek)

    // Dual Twin Terminals (Rabbit Ears)
    const pinMat = createClay(0xe2e8f0)
    const leftPin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12), pinMat)
    leftPin.position.set(-0.4, 1.65, 0)
    ampGroup.add(leftPin)

    const rightPin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12), pinMat)
    rightPin.position.set(0.4, 1.65, 0)
    ampGroup.add(rightPin)

    // Feet
    const ampFootMat = createClay(0x0891b2)
    const ampLeftFoot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), ampFootMat)
    ampLeftFoot.scale.set(1, 0.6, 1.3)
    ampLeftFoot.position.set(-0.65, -1.35, 0.2)
    ampGroup.add(ampLeftFoot)

    const ampRightFoot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), ampFootMat)
    ampRightFoot.scale.set(1, 0.6, 1.3)
    ampRightFoot.position.set(0.65, -1.35, 0.2)
    ampGroup.add(ampRightFoot)

    scene.add(ampGroup)

    // 4. Ambient Floating Clay Electronics in Deep Z-Space (Z = -10 to -22)
    const ambientGroup = new THREE.Group()
    scene.add(ambientGroup)

    // A. Floating Clay Lightbulb (Upper Left Depth)
    const bulbGroup = new THREE.Group()
    const bulbGlass = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 24, 24),
      createClay(0xfef3c7, 0xf59e0b, 0.4)
    )
    bulbGroup.add(bulbGlass)
    const bulbScrew = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.6, 20),
      createClay(0xcfd8dc)
    )
    bulbScrew.position.y = -1.1
    bulbGroup.add(bulbScrew)
    bulbGroup.position.set(-10, 6.5, -14)
    bulbGroup.rotation.set(0.3, 0.2, -0.4)
    ambientGroup.add(bulbGroup)

    // B. Floating Clay Striped Resistor (Upper Right Depth)
    const resGroup = new THREE.Group()
    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 2.2, 24),
      createClay(0xffedd5)
    )
    resGroup.add(resBody)
    const stripeMats = [createClay(0xef4444), createClay(0x8b5cf6), createClay(0xf97316)]
    stripeMats.forEach((m, idx) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.08, 12, 24), m)
      ring.position.y = -0.6 + idx * 0.6
      ring.rotation.x = Math.PI / 2
      resGroup.add(ring)
    })
    resGroup.position.set(10, 6.0, -15)
    resGroup.rotation.set(0.4, -0.3, 0.5)
    ambientGroup.add(resGroup)

    // C. Soft Floating Spark Particles
    const sparkMat = createClay(0xfef08a, 0xfacc15, 1.2)
    const sparkGeo = new THREE.OctahedronGeometry(0.24, 0)
    const sparkCount = 18
    const sparks: { mesh: THREE.Mesh; speed: number; phase: number; radius: number }[] = []

    for (let i = 0; i < sparkCount; i++) {
      const mesh = new THREE.Mesh(sparkGeo, sparkMat)
      const side = i % 2 === 0 ? -1 : 1
      mesh.position.set(
        side * (7.5 + Math.random() * 8),
        (Math.random() - 0.5) * 14,
        -10 - Math.random() * 10
      )
      ambientGroup.add(mesh)
      sparks.push({
        mesh,
        speed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        radius: 0.3 + Math.random() * 0.4,
      })
    }

    // 5. Responsive Mascot Positioning
    function updateFlankPositions() {
      const aspect = window.innerWidth / window.innerHeight
      // Keep mascots right along the outer flanks so the center is 100% unobstructed
      const flankX = Math.max(9.5, Math.min(14.5, aspect * 7.5))
      voltGroup.position.set(-flankX, -1.0, 0)
      ampGroup.position.set(flankX, -1.0, 0)
    }
    updateFlankPositions()

    // 6. Smooth Animation Loop
    let animId: number
    const clock = new THREE.Clock()
    let isPaused = false

    // Mouse Parallax
    let targetParallaxX = 0
    let targetParallaxY = 0
    let currentParallaxX = 0
    let currentParallaxY = 0

    const onMouseMove = (e: MouseEvent) => {
      targetParallaxX = (e.clientX / window.innerWidth - 0.5) * 0.8
      targetParallaxY = (e.clientY / window.innerHeight - 0.5) * 0.5
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (isPaused) return

      const t = clock.getElapsedTime()

      // Smooth camera parallax
      currentParallaxX += (targetParallaxX - currentParallaxX) * 0.05
      currentParallaxY += (targetParallaxY - currentParallaxY) * 0.05
      camera.position.x = currentParallaxX * 2.0
      camera.position.y = -currentParallaxY * 1.5
      camera.lookAt(0, 0, 0)

      // Volt-Bot idle bounce (warm joyful rhythm)
      const voltBounce = Math.sin(t * 2.4)
      voltGroup.position.y = -1.0 + Math.abs(voltBounce) * 0.4
      voltGroup.rotation.y = 0.25 + Math.sin(t * 1.2) * 0.12
      voltGroup.scale.y = 1.0 - Math.abs(voltBounce) * 0.05
      voltGroup.scale.x = 1.0 + Math.abs(voltBounce) * 0.03
      voltGroup.scale.z = 1.0 + Math.abs(voltBounce) * 0.03
      voltOrb.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.15)

      // Amp-Bot idle bounce (cool syncopated rhythm)
      const ampBounce = Math.sin(t * 2.4 + 1.2)
      ampGroup.position.y = -1.0 + Math.abs(ampBounce) * 0.4
      ampGroup.rotation.y = -0.25 - Math.sin(t * 1.2 + 0.5) * 0.12
      ampGroup.scale.y = 1.0 - Math.abs(ampBounce) * 0.05
      ampGroup.scale.x = 1.0 + Math.abs(ampBounce) * 0.03
      ampGroup.scale.z = 1.0 + Math.abs(ampBounce) * 0.03
      ampRing.rotation.z = t * 1.5

      // Floating ambient toys
      bulbGroup.rotation.y = Math.sin(t * 0.6) * 0.4
      bulbGroup.rotation.z = -0.4 + Math.cos(t * 0.8) * 0.15
      bulbGroup.position.y = 6.5 + Math.sin(t * 0.9) * 0.35

      resGroup.rotation.x = 0.4 + t * 0.5
      resGroup.rotation.y = t * 0.3
      resGroup.position.y = 6.0 + Math.cos(t * 1.0) * 0.35

      // Spark particles drifting
      sparks.forEach((sp) => {
        sp.mesh.rotation.x += 0.02 * sp.speed
        sp.mesh.rotation.y += 0.03 * sp.speed
        sp.mesh.position.y += Math.sin(t * sp.speed + sp.phase) * 0.008
      })

      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      updateFlankPositions()
    }
    window.addEventListener('resize', onResize)

    const onVisibilityChange = () => {
      isPaused = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 select-none opacity-95 transition-opacity duration-700"
    />
  )
}
