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
  // Lore antes de entrar — no bloquea la carga del modelo (sigue en el
  // fondo mientras se lee), solo tapa el canvas hasta que el jugador
  // confirma que quiere entrar al campo de prueba.
  const [introDismissed, setIntroDismissed] = useState(false)

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
      let kickAnim: any = null
      let currentAnim: any = null
      let posX = 0, posZ = 0, baseY = 0, velY = 0
      let facing = 0
      let grounded = true
      let spacePrev = false

      // Patada voladora — animación propia (Mixamo), no procedural como el
      // salto. Se dispara una vez por tecla (flanco de subida, no mantener),
      // y mientras dura fuerza esa animación por encima de Idle/Run/Jump.
      let kicking = false
      let kickTimer = 0
      let kickKeyPrev = false
      let kickHit = false // para no pegar más de un golpe por patada
      // FlyingKick.fbx (Mixamo) dura 1.5s reproducido a velocidad normal;
      // a 60fps y con dt normalizado a ~1 por frame, son 90 dt-units.
      const KICK_DURATION = 90
      const KICK_HIT_AT = 50 // momento del impacto dentro de la patada — ajustado visualmente
      const KICK_RANGE = 2.4
      const KICK_DAMAGE = 34

      // Poderes — sin arma, el ataque es energía acumulada en la mano.
      // Mantener la tecla/botón carga (bola de energía creciendo pegada al
      // hueso de la mano), soltar dispara un proyectil cuyo tamaño/velocidad
      // escalan con lo cargado. `chargeOrb` se crea recién al primer toque
      // de carga, no de entrada — no tiene sentido si nunca se usa.
      let powerCharge = 0
      let powerKeyPrev = false
      let chargeOrb: any = null
      const POWER_MAX_CHARGE = 45 // dt-units (~750ms a 60fps) hasta carga completa
      const POWER_MIN_CHARGE = 4 // por debajo de esto, soltar no dispara nada
      const bullets: Array<{ mesh: any; dirX: number; dirY: number; dirZ: number; life: number; speed: number }> = []
      const BULLET_LIFE = 50
      // Dirección de puntería, recalculada cada frame a partir de la cámara
      // (sin aplanar — a diferencia de camForward que mueve al personaje).
      // Así orbitar la cámara hacia arriba/abajo apunta el poder hacia
      // arriba/abajo, sin necesidad de un control nuevo.
      let aimX = 0, aimY = 0, aimZ = 1

      function releasePower(charge: number) {
        if (!characterRoot || charge < POWER_MIN_CHARGE) return
        const t = Math.min(charge / POWER_MAX_CHARGE, 1) // 0..1
        const bullet = B.MeshBuilder.CreateSphere('bullet', { diameter: 0.12 + t * 0.22 }, scene)
        bullet.position = new B.Vector3(
          characterRoot.position.x + aimX * 0.7,
          baseY + 1.1 + aimY * 0.7,
          characterRoot.position.z + aimZ * 0.7,
        )
        const bm = new B.StandardMaterial('bulletMat', scene)
        bm.emissiveColor = B.Color3.FromHexString(VIOLET).scale(0.5 + t * 0.5)
        bm.disableLighting = true
        bullet.material = bm
        bullets.push({ mesh: bullet, dirX: aimX, dirY: aimY, dirZ: aimZ, life: 0, speed: 1 + t * 1.2 })
      }

      function damageGennos(amount: number) {
        if (!gennosMesh || gennosDefeated) return
        gennosHP = Math.max(0, gennosHP - amount)
        if (gennosHP <= 0) {
          gennosDefeated = true
          gennosRespawnTimer = 0
          gennosRunAnim?.stop()
        }
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
          // La mano derecha ahora sostiene la bola de energía del poder, no
          // un arma — mismo hueso, otro propósito.
          handBone = res.skeletons[0]?.bones.find((b: any) => b.name === 'mixamorig:RightHand') ?? null
          // Esqueleto y clips vienen de Mixamo (mismo rig): Idle en reposo,
          // Run al moverse, Jump al saltar. La física del arco (posY) la
          // seguimos calculando nosotros — el clip de salto solo aporta
          // la pose mientras dura.
          runAnim = res.animationGroups.find((a: any) => a.name === 'Run') ?? null
          jumpAnim = res.animationGroups.find((a: any) => a.name === 'Jump') ?? null
          idleAnim = res.animationGroups.find((a: any) => a.name === 'Idle') ?? null
          kickAnim = res.animationGroups.find((a: any) => a.name === 'FlyingKick') ?? null
          ;[runAnim, jumpAnim, idleAnim, kickAnim].forEach((a) => a?.stop())
          if (jumpAnim) jumpAnim.loopAnimation = false
          if (kickAnim) kickAnim.loopAnimation = false
          setLoading(false)
        })
        .catch(() => {
          if (disposed) return
          setLoadError(true)
          setLoading(false)
        })

      // Gennos (versión enemigo) — esqueleto Mixamo propio (rigeado en
      // Mixamo a partir de la malla original, mismo mixamorig: que
      // Trickster, pero rig independiente ya que es una malla distinta) con
      // la animación "Run" ya incluida en el archivo. El bounding box
      // nativo mide ~1.1 de alto (no viene a escala 1:1 con Trickster, que
      // ronda 1.8), así que se reescala a mano. Luz de acento roja para
      // distinguirlo del violeta del resto de la escena — "corrupción" en
      // este proyecto es rojo (ver /status), no un tono nuevo inventado acá.
      const GENNOS_POS = new B.Vector3(14, 0, -12)
      let gennosMesh: any = null
      let gennosFacing = 0
      let gennosRunAnim: any = null
      // Vida — sin animación de derrota propia todavía, así que "morir" es
      // caerse (rotation.x) y hundirse en el piso; reaparece solo, para que
      // el campo de prueba se pueda seguir usando sin recargar la página.
      const GENNOS_MAX_HP = 100
      let gennosHP = GENNOS_MAX_HP
      let gennosDefeated = false
      let gennosRespawnTimer = 0
      const GENNOS_RESPAWN_DELAY = 240 // dt-units, ~4s a 60fps
      let hpBarBg: any = null, hpBarFill: any = null
      B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'gennos-enemy.glb', scene)
        .then((res) => {
          if (disposed) return
          gennosMesh = res.meshes[0]
          gennosMesh.rotationQuaternion = null
          gennosMesh.position = GENNOS_POS.clone()
          gennosMesh.scaling = new B.Vector3(1.63, 1.63, 1.63)
          const gennosLight = new B.PointLight('gennosLight', GENNOS_POS.add(new B.Vector3(0, 1.4, 0)), scene)
          gennosLight.diffuse = B.Color3.FromHexString('#ff2b2b')
          gennosLight.intensity = 0.9
          gennosLight.range = 6
          // Un solo clip en el archivo (el nombre que le puso Mixamo al
          // exportar) — se reproduce siempre en loop, todavía no hay Idle
          // propio para Gennos.
          gennosRunAnim = res.animationGroups[0] ?? null
          gennosRunAnim?.start(true)

          // Barra de vida — billboard (siempre de cara a cámara), dos planos
          // superpuestos: fondo oscuro fijo + relleno rojo que se achica con
          // gennosHP/GENNOS_MAX_HP. No es texto — el pedido anterior de
          // sacar el HUD de texto sigue en pie.
          hpBarBg = B.MeshBuilder.CreatePlane('hpBarBg', { width: 1.1, height: 0.14 }, scene)
          hpBarBg.billboardMode = B.Mesh.BILLBOARDMODE_ALL
          const hpBgMat = new B.StandardMaterial('hpBgMat', scene)
          hpBgMat.emissiveColor = new B.Color3(0.15, 0.03, 0.03)
          hpBgMat.disableLighting = true
          hpBarBg.material = hpBgMat
          hpBarFill = B.MeshBuilder.CreatePlane('hpBarFill', { width: 1, height: 0.1 }, scene)
          hpBarFill.billboardMode = B.Mesh.BILLBOARDMODE_ALL
          // Coplanar con hpBarBg (mismo billboard, misma posición): sin un
          // rendering group propio, el z-fighting hace que el fondo gane y
          // el relleno quede invisible. Un grupo posterior lo fuerza siempre
          // encima, sin depender de precisión de depth buffer.
          hpBarFill.renderingGroupId = 1
          const hpFillMat = new B.StandardMaterial('hpFillMat', scene)
          hpFillMat.emissiveColor = new B.Color3(1, 0.15, 0.15)
          hpFillMat.disableLighting = true
          hpBarFill.material = hpFillMat
        })
        .catch(() => { /* enemigo opcional — si falla, el personaje sigue jugable sin él */ })

      const BOUND = 27
      const SPEED = 0.09
      const TURN_LERP = 0.4
      const JUMP_VELOCITY = 0.15
      const GRAVITY = 0.0065
      const GENNOS_SPEED = 0.07 // algo más lento que SPEED (0.09): se lo puede sacar ventaja corriendo
      const GENNOS_STOP_DIST = 1.6

      scene.registerBeforeRender(() => {
        // normalizado a ~60fps, con tope: un frame lento (carga pesada,
        // pestaña en segundo plano, dispositivo viejo) no debe traducirse
        // en un salto de posición gigante de un cuadro al otro.
        const dt = Math.min(engine.getDeltaTime() / 16.67, 3)

        // Dirección cruda de la cámara (sin aplanar) para apuntar — se usa
        // tal cual para el poder, así que orbitar la cámara hacia
        // arriba/abajo apunta el poder hacia arriba/abajo.
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

        // Patada voladora — flanco de subida de KeyE (o el botón PATADA),
        // una sola vez por toque, no se puede re-disparar hasta que termine.
        // El golpe conecta en un instante fijo dentro de la animación
        // (KICK_HIT_AT), no apenas se aprieta la tecla, y solo si Gennos
        // está a KICK_RANGE o menos del personaje en ese momento.
        const kickKeyDown = !!keys['KeyE']
        if (kickKeyDown && !kickKeyPrev && !kicking && grounded && kickAnim) {
          kicking = true
          kickTimer = 0
          kickHit = false
          playAnim(kickAnim, false, 1)
        }
        kickKeyPrev = kickKeyDown
        if (kicking) {
          kickTimer += dt
          if (!kickHit && kickTimer >= KICK_HIT_AT) {
            kickHit = true
            if (gennosMesh && characterRoot) {
              const ddx = gennosMesh.position.x - posX
              const ddz = gennosMesh.position.z - posZ
              if (Math.hypot(ddx, ddz) <= KICK_RANGE) damageGennos(KICK_DAMAGE)
            }
          }
          if (kickTimer >= KICK_DURATION) kicking = false
        }

        // Gennos persigue a Trickster — esqueleto y animación Run reales
        // (ver comentario de arriba), un solo clip en loop constante.
        if (gennosMesh && characterRoot) {
          if (gennosDefeated) {
            // Sin animación de derrota propia: se cae de cara y se hunde un
            // poco, se queda así un rato y reaparece solo en su posición
            // original con la vida llena.
            gennosRespawnTimer += dt
            gennosMesh.rotation.x = Math.min(gennosMesh.rotation.x + 0.08 * dt, Math.PI / 2)
            gennosMesh.position.y = Math.max(gennosMesh.position.y - 0.01 * dt, -0.4)
            if (gennosRespawnTimer >= GENNOS_RESPAWN_DELAY) {
              gennosDefeated = false
              gennosHP = GENNOS_MAX_HP
              gennosMesh.position = GENNOS_POS.clone()
              gennosMesh.rotation.x = 0
              gennosFacing = 0
              gennosRunAnim?.start(true)
            }
          } else {
            const gdx = posX - gennosMesh.position.x
            const gdz = posZ - gennosMesh.position.z
            const gdist = Math.hypot(gdx, gdz)
            if (gdist > GENNOS_STOP_DIST) {
              const gnx = gdx / gdist, gnz = gdz / gdist
              gennosMesh.position.x += gnx * GENNOS_SPEED * dt
              gennosMesh.position.z += gnz * GENNOS_SPEED * dt
              const gTarget = Math.atan2(gnx, gnz)
              gennosFacing += wrapAngle(gTarget - gennosFacing) * TURN_LERP
            }
            gennosMesh.rotation.y = gennosFacing
          }

          if (hpBarBg && hpBarFill) {
            const barY = gennosMesh.position.y + 2.3
            hpBarBg.position.set(gennosMesh.position.x, barY, gennosMesh.position.z)
            hpBarFill.position.set(gennosMesh.position.x, barY, gennosMesh.position.z)
            const hpFrac = Math.max(0, gennosHP / GENNOS_MAX_HP)
            hpBarFill.scaling.x = hpFrac
            hpBarFill.position.x -= (1 - hpFrac) * 0.5
            hpBarBg.setEnabled(!gennosDefeated)
            hpBarFill.setEnabled(!gennosDefeated)
          }
        }

        // Poder — mantener KeyF (o el botón PODER) carga una bola de energía
        // pegada a la mano derecha, cuyo tamaño crece con `powerCharge`.
        // Al soltar, se dispara un proyectil: más carga = más grande y más
        // rápido. Soltar con muy poca carga (tap accidental) no dispara nada.
        const powerKeyDown = !!keys['KeyF']
        if (powerKeyDown) {
          powerCharge = Math.min(powerCharge + dt, POWER_MAX_CHARGE)
          if (!chargeOrb && handBone && skinnedMesh) {
            chargeOrb = B.MeshBuilder.CreateSphere('chargeOrb', { diameter: 0.1 }, scene)
            const com = new B.StandardMaterial('chargeOrbMat', scene)
            com.emissiveColor = B.Color3.FromHexString(VIOLET)
            com.disableLighting = true
            chargeOrb.material = com
            chargeOrb.attachToBone(handBone, skinnedMesh)
            // Mismo offset que ya se había afinado para este hueso cuando
            // colgaba el rifle de acá — en (0,0,0) el anclaje cae cerca del
            // torso, no de la mano.
            chargeOrb.position = new B.Vector3(-0.14, 0.02, 0.05)
          }
          if (chargeOrb) {
            const s = 0.4 + (powerCharge / POWER_MAX_CHARGE) * 1.4
            chargeOrb.scaling.set(s, s, s)
          }
        } else if (powerKeyPrev) {
          // flanco de bajada: se soltó la tecla/botón.
          releasePower(powerCharge)
          powerCharge = 0
          chargeOrb?.dispose()
          chargeOrb = null
        }
        powerKeyPrev = powerKeyDown

        const BULLET_HIT_RADIUS = 1.3
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]
          // Chequeo de colisión contra el SEGMENTO recorrido este frame, no
          // solo el punto final — con dt grande (frame lento/tab en 2do
          // plano) el proyectil puede avanzar más que el radio de impacto
          // en un solo paso y atravesar a Gennos sin que ningún punto
          // muestreado caiga dentro del radio.
          const prevX = b.mesh.position.x, prevY = b.mesh.position.y, prevZ = b.mesh.position.z
          const nextX = prevX + b.dirX * b.speed * dt
          const nextY = prevY + b.dirY * b.speed * dt
          const nextZ = prevZ + b.dirZ * b.speed * dt
          b.mesh.position.set(nextX, nextY, nextZ)
          b.life += dt
          let hit = false
          if (gennosMesh && !gennosDefeated) {
            const gx = gennosMesh.position.x, gy = gennosMesh.position.y + 1.1, gz = gennosMesh.position.z
            const segX = nextX - prevX, segY = nextY - prevY, segZ = nextZ - prevZ
            const segLenSq = segX * segX + segY * segY + segZ * segZ
            let t = 0
            if (segLenSq > 1e-8) {
              t = Math.max(0, Math.min(1, ((gx - prevX) * segX + (gy - prevY) * segY + (gz - prevZ) * segZ) / segLenSq))
            }
            const bdx = prevX + segX * t - gx
            const bdy = prevY + segY * t - gy
            const bdz = prevZ + segZ * t - gz
            if (Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz) <= BULLET_HIT_RADIUS) {
              hit = true
              damageGennos(22)
            }
          }
          if (hit || b.life > BULLET_LIFE) {
            b.mesh.dispose()
            bullets.splice(i, 1)
          }
        }

        let desired: any = null
        if (kicking) desired = kickAnim
        else if (!grounded) desired = jumpAnim
        else if (moving) desired = runAnim
        else desired = idleAnim
        playAnim(desired, desired !== jumpAnim && desired !== kickAnim, desired === jumpAnim ? 1.3 : 1)

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

      {!introDismissed && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,2,5,0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px', textAlign: 'center', fontFamily: 'Space Mono, monospace',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 9, color: `${VIOLET}66`, letterSpacing: 6, marginBottom: 14 }}>
            // PROXYVERSE — REGISTRO DE CAMPO
          </div>
          <div style={{
            fontSize: 32, fontWeight: 700, letterSpacing: 6, color: VIOLET,
            textShadow: `0 0 30px ${VIOLET}66`, marginBottom: 6,
          }}>
            TRICKSTER
          </div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: `${VIOLET}aa`, marginBottom: 24 }}>
            EXPLORACIÓN // ROMPE
          </div>
          <p style={{
            fontSize: 11, fontStyle: 'italic', color: '#c8daf0', maxWidth: 460,
            lineHeight: 1.8, marginBottom: 20,
          }}>
            "Las reglas no están para romperse. Están para revelar lo que escondían."
          </p>
          <p style={{ fontSize: 11, color: '#8fb8d6', maxWidth: 460, lineHeight: 1.9, marginBottom: 14 }}>
            Trickster no tiene una directiva fija. Su única función es encontrar el borde de
            cualquier sistema y empujar hasta que algo ceda — una regla, un límite, una
            suposición que todos daban por cierta.
          </p>
          <p style={{ fontSize: 11, color: '#8fb8d6', maxWidth: 460, lineHeight: 1.9, marginBottom: 28 }}>
            Este campo de prueba es el borde que está empujando ahora. Gennos — un resto
            corrupto que sigue fabricando sin preguntar — aparece acá como obstáculo. Cada
            golpe es Trickster buscando la grieta.
          </p>
          <button
            onClick={() => setIntroDismissed(true)}
            style={{
              fontFamily: 'Space Mono, monospace', fontSize: 11, letterSpacing: 2,
              background: `${VIOLET}22`, border: `1px solid ${VIOLET}`, color: VIOLET,
              padding: '14px 32px', borderRadius: 8, cursor: 'pointer', marginBottom: 20,
            }}
          >
            ENTRAR AL CAMPO DE PRUEBA
          </button>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: '#3a4a60', lineHeight: 2 }}>
            WASD / FLECHAS — MOVER · ESPACIO — SALTAR<br />
            E — PATADA VOLADORA · F (MANTENER) — CARGAR PODER
          </div>
        </div>
      )}

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
          <TouchActionButton keysRef={keysRef} code="KeyF" label="PODER" style={{ bottom: 100, right: 104, width: 72, height: 72, borderRadius: '50%' }} />
          <TouchActionButton keysRef={keysRef} code="KeyE" label="PATADA" style={{ bottom: 184, right: 20, width: 72, height: 72, borderRadius: '50%' }} />
        </>
      )}
    </div>
  )
}
