'use client'
import { useEffect, useRef, useState } from 'react'
import { TouchActionButton, useIsTouchDevice } from '@/components/games/TouchControls'
const VIOLET = '#b400ff'

// Normaliza un ángulo al rango (-PI, PI] para interpolar por el camino corto.
function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

export default function TricksterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const isTouch = useIsTouchDevice()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    let engine: any
    let disposed = false

    const init = async () => {
      const B = await import('@babylonjs/core')
      await import('@babylonjs/loaders/glTF')

      engine = new B.Engine(canvasRef.current!, true)
      const scene = new B.Scene(engine)
      scene.clearColor = new B.Color4(0, 0.006, 0.016, 1)

      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2.3, Math.PI / 2.5, 7, new B.Vector3(0, 1, 0), scene)
      camera.attachControl(canvasRef.current!, true)
      camera.lowerRadiusLimit = 3
      camera.upperRadiusLimit = 16
      camera.wheelPrecision = 40
      camera.minZ = 0.05

      new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene).intensity = 0.4
      const rim = new B.PointLight('rim', new B.Vector3(3, 4, -3), scene)
      rim.diffuse = B.Color3.FromHexString(VIOLET)
      rim.intensity = 1.1
      const rim2 = new B.PointLight('rim2', new B.Vector3(-3, 3, 3), scene)
      rim2.diffuse = new B.Color3(0.6, 0.8, 1)
      rim2.intensity = 0.4

      const glow = new B.GlowLayer('glow', scene)
      glow.intensity = 0.6

      // Piso — misma estética wireframe que el visor de Arsenal.
      const ground = B.MeshBuilder.CreateGround('ground', { width: 60, height: 60, subdivisions: 30 }, scene)
      const groundMat = new B.StandardMaterial('groundMat', scene)
      groundMat.wireframe = true
      groundMat.emissiveColor = B.Color3.FromHexString(VIOLET)
      groundMat.alpha = 0.14
      ground.material = groundMat

      // Motas ambientales — decorativas, sin colisión ni recolección (todavía).
      for (let i = 0; i < 60; i++) {
        const dust = B.MeshBuilder.CreateSphere('dust' + i, { diameter: 0.04 + Math.random() * 0.05 }, scene)
        dust.position = new B.Vector3((Math.random() - 0.5) * 50, Math.random() * 6 + 0.2, (Math.random() - 0.5) * 50)
        const dm = new B.StandardMaterial('dm' + i, scene)
        dm.emissiveColor = Math.random() > 0.5 ? B.Color3.FromHexString(VIOLET) : new B.Color3(0.5, 0.8, 1)
        dust.material = dm
      }

      // Personaje — input por teclado + mobile. En mobile no hay D-pad:
      // tocar la pantalla alcanza para correr hacia adelante (misma tecla
      // KeyW que ya mueve en desktop), el botón aparte es solo para saltar.
      keysRef.current = {}
      const keys = keysRef.current
      const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault() }
      const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      // touchstart/touchend son eventos táctiles puros (nunca disparan con
      // mouse), así que esto no interfiere con el drag de la cámara en
      // desktop ni con el orbit táctil — sigue andando porque Babylon
      // escucha sus propios pointer events en paralelo sobre el mismo canvas.
      const canvasEl = canvasRef.current!
      const onTouchStart = () => { keys['KeyW'] = true }
      const onTouchEnd = () => { keys['KeyW'] = false }
      canvasEl.addEventListener('touchstart', onTouchStart, { passive: true })
      canvasEl.addEventListener('touchend', onTouchEnd, { passive: true })
      canvasEl.addEventListener('touchcancel', onTouchEnd, { passive: true })

      let characterRoot: any = null
      let skinnedMesh: any = null
      let handBone: any = null
      let runAnim: any = null
      let jumpAnim: any = null
      let idleAnim: any = null
      let crouchRunAnim: any = null
      let currentAnim: any = null
      let posX = 0, posZ = 0, baseY = 0, velY = 0
      let facing = 0
      let grounded = true
      let spacePrev = false
      let armed = false
      let shootCooldown = 0
      const bullets: Array<{ mesh: any; dirX: number; dirY: number; dirZ: number; life: number }> = []
      const SHOOT_INTERVAL = 9 // ~150ms a 60fps, dt ya normalizado
      const BULLET_SPEED = 1.3
      const BULLET_LIFE = 40
      // Dirección de puntería, recalculada cada frame a partir de la cámara
      // (sin aplanar — a diferencia de camForward que mueve al personaje).
      // Así orbitar la cámara hacia arriba/abajo apunta el disparo hacia
      // arriba/abajo, sin necesidad de un control nuevo.
      let aimX = 0, aimY = 0, aimZ = 1

      function shoot() {
        if (!armed || !characterRoot) return
        const bullet = B.MeshBuilder.CreateSphere('bullet', { diameter: 0.09 }, scene)
        bullet.position = new B.Vector3(
          characterRoot.position.x + aimX * 0.7,
          baseY + 1.1 + aimY * 0.7,
          characterRoot.position.z + aimZ * 0.7,
        )
        const bm = new B.StandardMaterial('bulletMat', scene)
        bm.emissiveColor = new B.Color3(0.6, 1, 0.95)
        bm.disableLighting = true
        bullet.material = bm
        bullets.push({ mesh: bullet, dirX: aimX, dirY: aimY, dirZ: aimZ, life: 0 })
      }

      function playAnim(anim: any, loop: boolean, speedRatio = 1) {
        if (currentAnim === anim) return
        currentAnim?.stop()
        currentAnim = anim
        currentAnim?.start(loop, speedRatio)
      }

      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'trickzter.glb', scene)
        .then((res) => {
          if (disposed) return
          characterRoot = res.meshes[0]
          // El loader de glTF deja rotationQuaternion seteado en los nodos
          // importados -- si no está en null, Babylon IGNORA por completo
          // .rotation.y al armar la world matrix (bug clásico de Babylon +
          // glTF). Por eso el giro hacia la dirección de movimiento no
          // se veía: se estaba escribiendo a una propiedad que no pesaba.
          characterRoot.rotationQuaternion = null
          baseY = characterRoot.position.y
          skinnedMesh = res.meshes.find((m: any) => m.skeleton) ?? res.meshes[1]
          handBone = res.skeletons[0]?.bones.find((b: any) => b.name === 'mixamorig:RightHand') ?? null
          // Esqueleto y los 4 clips vienen de Mixamo (mismo rig): Idle en
          // reposo, Run al caminar/correr, Jump al saltar, CrouchRun al
          // correr con el rifle agarrado. La física del arco (posY) la
          // seguimos calculando nosotros — el clip de salto solo aporta
          // la pose mientras dura.
          runAnim = res.animationGroups.find((a: any) => a.name === 'Run') ?? null
          jumpAnim = res.animationGroups.find((a: any) => a.name === 'Jump') ?? null
          idleAnim = res.animationGroups.find((a: any) => a.name === 'Idle') ?? null
          crouchRunAnim = res.animationGroups.find((a: any) => a.name === 'CrouchRun') ?? null
          ;[runAnim, jumpAnim, idleAnim, crouchRunAnim].forEach((a) => a?.stop())
          if (jumpAnim) jumpAnim.loopAnimation = false
          setLoading(false)
        })
        .catch(() => {
          if (disposed) return
          setLoadError(true)
          setLoading(false)
        })

      // Rifle — esperando en el mapa hasta que el personaje lo toque (por
      // cercanía, no por tap: en mobile tocar la pantalla ya corre). Gira y
      // flota mientras está en el piso; al agarrarlo se cuelga del hueso de
      // la mano derecha y pasa a seguir al esqueleto solo.
      // Sobre el eje "adelante" de la cámara por defecto, para que
      // sostener W (o tocar la pantalla) desde el spawn alcance para
      // encontrarlo sin tener que orbitar primero.
      const RIFLE_POS = new B.Vector3(-2, 0, 8)
      const PICKUP_RADIUS = 1.4
      let rifleMesh: any = null // raíz __root__ de Babylon — mover esto mueve toda la geometría hija

      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'rifle.glb', scene)
        .then((res) => {
          if (disposed) return
          rifleMesh = res.meshes[0]
          rifleMesh.position = RIFLE_POS.clone()
          rifleMesh.position.y = 0.3
        })
        .catch(() => { /* el arma es opcional — si falla, el personaje sigue jugable sin ella */ })

      // Gennos (versión enemigo) — malla estática sin esqueleto ni
      // animaciones todavía, parado en otro cuadrante del mapa para
      // encontrarlo explorando. El bounding box nativo mide ~1.15 de
      // alto (no viene a escala 1:1 con Trickster, que ronda 1.8), así
      // que se reescala a mano. Luz de acento roja para distinguirlo del
      // violeta del resto de la escena — "corrupción" en este proyecto
      // es rojo (ver /status), no un tono nuevo inventado acá.
      const GENNOS_POS = new B.Vector3(14, 0, -12)
      let gennosMesh: any = null
      let gennosFacing = 0
      let gennosBobTime = 0
      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'gennos-enemy.glb', scene)
        .then((res) => {
          if (disposed) return
          gennosMesh = res.meshes[0]
          gennosMesh.rotationQuaternion = null
          gennosMesh.position = GENNOS_POS.clone()
          gennosMesh.scaling = new B.Vector3(1.55, 1.55, 1.55)
          const gennosLight = new B.PointLight('gennosLight', GENNOS_POS.add(new B.Vector3(0, 1.4, 0)), scene)
          gennosLight.diffuse = B.Color3.FromHexString('#ff2b2b')
          gennosLight.intensity = 0.9
          gennosLight.range = 6
        })
        .catch(() => { /* enemigo opcional — si falla, el personaje sigue jugable sin él */ })

      const BOUND = 27
      const SPEED = 0.09
      const TURN_LERP = 0.4
      const JUMP_VELOCITY = 0.15
      const GRAVITY = 0.0065
      const GENNOS_SPEED = 0.07 // algo más lento que SPEED (0.09): se lo puede sacar ventaja corriendo
      const GENNOS_STOP_DIST = 1.6
      let rifleTime = 0

      scene.registerBeforeRender(() => {
        // normalizado a ~60fps, con tope: un frame lento (carga pesada,
        // pestaña en segundo plano, dispositivo viejo) no debe traducirse
        // en un salto de posición gigante de un cuadro al otro.
        const dt = Math.min(engine.getDeltaTime() / 16.67, 3)

        // Dirección cruda de la cámara (sin aplanar) para apuntar — se usa
        // tal cual para disparar, así que orbitar la cámara hacia
        // arriba/abajo apunta el disparo hacia arriba/abajo.
        const rawAim = camera.getDirection(B.Vector3.Forward())
        if (rawAim.lengthSquared() > 0.0001) rawAim.normalize()
        aimX = rawAim.x; aimY = rawAim.y; aimZ = rawAim.z

        // Movimiento relativo a cámara: "adelante" es hacia donde mira la
        // cámara (aplanado al piso), no un eje fijo del mundo — así que
        // orbitar la cámara (drag, también con el dedo) redirige hacia
        // dónde corre el personaje.
        const camForward = camera.getDirection(B.Vector3.Forward())
        camForward.y = 0
        if (camForward.lengthSquared() > 0.0001) camForward.normalize()
        const camRight = camera.getDirection(B.Vector3.Right())
        camRight.y = 0
        if (camRight.lengthSquared() > 0.0001) camRight.normalize()

        let inputForward = 0, inputRight = 0
        if (keys['ArrowUp'] || keys['KeyW']) inputForward += 1
        if (keys['ArrowDown'] || keys['KeyS']) inputForward -= 1
        if (keys['ArrowLeft'] || keys['KeyA']) inputRight -= 1
        if (keys['ArrowRight'] || keys['KeyD']) inputRight += 1

        let dx = camForward.x * inputForward + camRight.x * inputRight
        let dz = camForward.z * inputForward + camRight.z * inputRight
        const moving = dx !== 0 || dz !== 0

        if (moving) {
          const len = Math.hypot(dx, dz)
          dx /= len; dz /= len
          posX = Math.max(-BOUND, Math.min(BOUND, posX + dx * SPEED * dt))
          posZ = Math.max(-BOUND, Math.min(BOUND, posZ + dz * SPEED * dt))
          // +PI: el eje "adelante" del rig queda mirando a cámara con
          // rotation.y=0, así que sin este offset el personaje corre
          // de espaldas a su propio movimiento (muestra la cara, no la nuca).
          const target = Math.atan2(dx, dz) + Math.PI
          facing += wrapAngle(target - facing) * TURN_LERP
        }

        // Salto — flanco de subida de Space, solo si está en el piso. La
        // física del arco (posY) la seguimos calculando nosotros; el clip
        // Jump de Mixamo solo aporta la pose mientras dura el arco.
        const spaceDown = !!keys['Space']
        if (spaceDown && !spacePrev && grounded) {
          velY = JUMP_VELOCITY
          grounded = false
        }
        spacePrev = spaceDown

        if (!grounded) {
          velY -= GRAVITY * dt
        }

        // Recolectar el rifle por cercanía — una vez agarrado queda colgado
        // del hueso de la mano para siempre, no hay forma de soltarlo (todavía).
        if (!armed && rifleMesh && characterRoot) {
          const ddx = posX - RIFLE_POS.x
          const ddz = posZ - RIFLE_POS.z
          if (Math.hypot(ddx, ddz) < PICKUP_RADIUS) {
            armed = true
            if (handBone && skinnedMesh) {
              // Offset chico a propósito: el rifle cuelga de un solo hueso
              // (la mano derecha) sin IK en la otra mano, así que durante
              // CrouchRun el brazo se mueve con el ciclo de carrera entero.
              // Un offset grande amplifica ese balanceo (se ve como que el
              // brazo se estira); mantenerlo cerca de la mano lo frena.
              rifleMesh.attachToBone(handBone, skinnedMesh)
              rifleMesh.scaling = new B.Vector3(0.55, 0.55, 0.55)
              rifleMesh.position = new B.Vector3(-0.14, 0.02, 0.05)
              rifleMesh.rotation = new B.Vector3(-Math.PI / 4, 0, -0.3)
            }
          }
        }
        if (rifleMesh && !armed) {
          rifleTime += 0.02 * dt
          rifleMesh.rotation.y += 0.02 * dt
          rifleMesh.position.y = 0.3 + Math.sin(rifleTime) * 0.08
        }

        // Gennos persigue a Trickster — todavía sin esqueleto/animación
        // real (malla estática, ver comentario de arriba), así que el
        // "correr" es la posición moviéndose + un balanceo sinusoidal
        // simple en Y/rotation.z para que no se vea como un fantasma
        // deslizándose. Reemplazar por animación real en cuanto llegue
        // el rig de Mixamo.
        if (gennosMesh && characterRoot) {
          const gdx = posX - gennosMesh.position.x
          const gdz = posZ - gennosMesh.position.z
          const gdist = Math.hypot(gdx, gdz)
          if (gdist > GENNOS_STOP_DIST) {
            const gnx = gdx / gdist, gnz = gdz / gdist
            gennosMesh.position.x += gnx * GENNOS_SPEED * dt
            gennosMesh.position.z += gnz * GENNOS_SPEED * dt
            const gTarget = Math.atan2(gnx, gnz)
            gennosFacing += wrapAngle(gTarget - gennosFacing) * TURN_LERP
            gennosBobTime += 0.3 * dt
            gennosMesh.position.y = Math.abs(Math.sin(gennosBobTime)) * 0.12
            gennosMesh.rotation.z = Math.sin(gennosBobTime * 2) * 0.05
          } else {
            gennosMesh.position.y = 0
            gennosMesh.rotation.z = 0
          }
          gennosMesh.rotation.y = gennosFacing
        }

        // Disparo — automático mientras se mantenga la tecla/botón, con
        // cooldown entre tiros. Los proyectiles son esferas emisivas que
        // viajan en línea recta en la dirección cruda de la cámara (aimX/Y/Z,
        // calculada arriba) y se destruyen por tiempo
        // de vida, no por colisión (todavía no hay nada que impacten).
        shootCooldown -= dt
        if (keys['KeyF'] && armed && shootCooldown <= 0) {
          shoot()
          shootCooldown = SHOOT_INTERVAL
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]
          b.mesh.position.x += b.dirX * BULLET_SPEED * dt
          b.mesh.position.y += b.dirY * BULLET_SPEED * dt
          b.mesh.position.z += b.dirZ * BULLET_SPEED * dt
          b.life += dt
          if (b.life > BULLET_LIFE) {
            b.mesh.dispose()
            bullets.splice(i, 1)
          }
        }

        // Los 4 clips de Mixamo son mutuamente excluyentes. Correr usa
        // CrouchRun en vez de Run apenas el personaje tiene el rifle.
        let desired: any = null
        if (!grounded) desired = jumpAnim
        else if (moving) desired = armed ? crouchRunAnim : runAnim
        else desired = idleAnim
        playAnim(desired, desired !== jumpAnim, desired === jumpAnim ? 1.3 : 1)

        if (characterRoot) {
          characterRoot.position.x = posX
          characterRoot.position.z = posZ
          characterRoot.rotation.y = facing
          if (grounded) {
            characterRoot.position.y = baseY
            characterRoot.rotation.z = 0
          } else {
            characterRoot.position.y += velY * dt
            characterRoot.rotation.z = 0
            if (characterRoot.position.y <= baseY) {
              characterRoot.position.y = baseY
              grounded = true
              velY = 0
            }
          }
        }

        // Cámara sigue al personaje con suavizado.
        const targetPos = new B.Vector3(posX, (characterRoot?.position.y ?? baseY) + 0.9, posZ)
        camera.target.x += (targetPos.x - camera.target.x) * 0.12
        camera.target.y += (targetPos.y - camera.target.y) * 0.12
        camera.target.z += (targetPos.z - camera.target.z) * 0.12
      })

      engine.runRenderLoop(() => scene.render())
      window.addEventListener('resize', () => engine.resize())
    }

    init()
    return () => {
      disposed = true
      if (engine) engine.dispose()
    }
  }, [])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#000' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

      {loading && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: 'Space Mono, monospace', color: VIOLET, fontSize: 12, letterSpacing: 4,
          textShadow: `0 0 10px ${VIOLET}`,
        }}>
          CARGANDO TRICKSTER...
        </div>
      )}

      {loadError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: 'Space Mono, monospace', color: '#ff4444', fontSize: 11, letterSpacing: 2,
          textAlign: 'center', maxWidth: 280,
        }}>
          NO SE PUDO CARGAR EL MODELO. Reintentá recargando la página.
        </div>
      )}

      <a href="/games" style={isTouch ? {
        // top-right en touch: bottom-right ya lo ocupan el botón de salto y el Chat global
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'monospace', color: `${VIOLET}66`,
        fontSize: 10, letterSpacing: 3, textDecoration: 'none',
      } : {
        position: 'absolute', bottom: 20, left: 20,
        fontFamily: 'monospace', color: `${VIOLET}44`,
        fontSize: 10, letterSpacing: 3, textDecoration: 'none',
      }}>← EXIT</a>

      {isTouch && (
        // bottom:100 para despejar el botón de Chat global (bottom:24,right:24).
        // Sin D-pad: tocar cualquier parte de la pantalla ya hace correr
        // (ver el listener de touchstart/touchend sobre el canvas, arriba).
        <>
          <TouchActionButton keysRef={keysRef} code="Space" label="SALTAR" style={{ bottom: 100, right: 20, width: 72, height: 72, borderRadius: '50%' }} />
          <TouchActionButton keysRef={keysRef} code="KeyF" label="FUEGO" style={{ bottom: 100, right: 104, width: 72, height: 72, borderRadius: '50%' }} />
        </>
      )}
    </div>
  )
}
