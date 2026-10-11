'use client'
import { useEffect, useRef, useState } from 'react'
import { TouchActionButton, TouchJoystick, useIsTouchDevice } from '@/components/games/TouchControls'
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
  const joyRef = useRef({ x: 0, y: 0 })
  const reticleRef = useRef<HTMLDivElement>(null)
  const playerHpRef = useRef<HTMLDivElement>(null)
  const isTouch = useIsTouchDevice()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  // Lore antes de entrar — no bloquea la carga del modelo (sigue en el
  // fondo mientras se lee), solo tapa el canvas hasta que el jugador
  // confirma que quiere entrar al campo de prueba.
  const [introDismissed, setIntroDismissed] = useState(false)

  // Fullscreen + orientación horizontal — solo en mobile, y solo puede
  // dispararse desde un gesto directo del usuario (los navegadores lo
  // bloquean si no), por eso vive en el onClick de "ENTRAR" y no en un
  // efecto al montar. El lock de orientación además requiere fullscreen
  // en la mayoría de navegadores Android; iOS Safari no soporta el Screen
  // Orientation API en absoluto, así que ahí esto no hace nada y el juego
  // sigue jugable en vertical (sin fallback forzado: no hay forma de
  // rotar la pantalla por software).
  async function enterFullscreenLandscape() {
    if (!isTouch) return
    try {
      const el = document.documentElement
      if (el.requestFullscreen) await el.requestFullscreen()
      await (screen as any).orientation?.lock?.('landscape')
    } catch {
      // Sin soporte o el usuario lo rechazó — se sigue jugando tal cual esté.
    }
  }

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

      const camera = new B.ArcRotateCamera('cam', -Math.PI / 2.3, Math.PI / 2.5, 5.5, new B.Vector3(0, 1, 0), scene)
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

      // Personaje — input por teclado en desktop, joystick analógico
      // (TouchJoystick, ver JSX) en mobile. El joystick escribe un vector
      // continuo en joyRef, leído más abajo junto con las teclas.
      keysRef.current = {}
      const keys = keysRef.current
      const onKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault() }
      const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      let characterRoot: any = null
      let skinnedMesh: any = null
      let handBone: any = null
      let hipsBone: any = null
      let hipsNode: any = null
      let hipsBaseX: number | null = null, hipsBaseZ: number | null = null
      let runAnim: any = null
      let jumpAnim: any = null
      let idleAnim: any = null
      let kickAnim: any = null
      let magicAnim: any = null
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

      // Ataque de área — segunda animación propia (Mixamo), mismo patrón que
      // la patada: una vez por toque, fuerza la animación mientras dura.
      // A diferencia de la patada (rango corto, un objetivo puntual), esto
      // es un estallido alrededor del personaje con efecto visual propio.
      let magicking = false
      let magicTimer = 0
      let magicKeyPrev = false
      let magicHit = false
      // Standing_2H_Magic_Area_Attack_02.fbx dura 3.25s; a 60fps y con dt
      // normalizado a ~1 por frame, son 195 dt-units. Sin root motion
      // (verificado contra el clip fuente: el hueso de la cadera no se
      // desplaza), así que no hace falta neutralizar nada ahí.
      const MAGIC_DURATION = 195
      const MAGIC_CAST_AT = 130 // momento del estallido dentro del cast — ajustado visualmente
      const MAGIC_RANGE = 4.5
      const MAGIC_DAMAGE = 50

      function spawnMagicRing(cx: number, cy: number, cz: number) {
        const ring = B.MeshBuilder.CreateTorus('magicRing', { diameter: MAGIC_RANGE * 2, thickness: 0.12, tessellation: 40 }, scene)
        ring.position.set(cx, cy + 0.05, cz)
        // CreateTorus ya queda plano sobre el piso (plano XZ) por defecto —
        // el rotation.x = PI/2 que tenía antes lo paraba de canto, por eso
        // se veía vertical en vez de una onda expansiva en el suelo.
        ring.scaling.set(0.05, 0.05, 0.05)
        const mat = new B.StandardMaterial('magicRingMat', scene)
        mat.emissiveColor = B.Color3.FromHexString(VIOLET)
        mat.disableLighting = true
        mat.alpha = 0.95
        ring.material = mat
        const FRAMES = 24
        B.Animation.CreateAndStartAnimation(
          'magicRingScale', ring, 'scaling', 60, FRAMES,
          new B.Vector3(0.05, 0.05, 0.05), new B.Vector3(1, 1, 1), B.Animation.ANIMATIONLOOPMODE_CONSTANT,
        )
        B.Animation.CreateAndStartAnimation(
          'magicRingFade', mat, 'alpha', 60, FRAMES,
          0.95, 0, B.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, () => ring.dispose(),
        )
        const flash = new B.PointLight('magicFlash', new B.Vector3(cx, cy + 1, cz), scene)
        flash.diffuse = B.Color3.FromHexString(VIOLET)
        flash.intensity = 3
        flash.range = MAGIC_RANGE * 1.5
        B.Animation.CreateAndStartAnimation(
          'magicFlashFade', flash, 'intensity', 60, 18,
          3, 0, B.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, () => flash.dispose(),
        )
      }

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

      function damageGennosUnit(g: GennosUnit, amount: number) {
        if (g.defeated) return
        g.hp = Math.max(0, g.hp - amount)
        if (g.hp <= 0) {
          g.defeated = true
          g.respawnTimer = 0
          g.runAnim?.stop()
        }
      }

      function damageGennosInRange(cx: number, cz: number, range: number, amount: number) {
        for (const g of gennosList) {
          if (g.defeated) continue
          const dx = g.mesh.position.x - cx
          const dz = g.mesh.position.z - cz
          if (Math.hypot(dx, dz) <= range) damageGennosUnit(g, amount)
        }
      }

      function playAnim(anim: any, loop: boolean, speedRatio = 1) {
        if (currentAnim === anim) return
        currentAnim?.stop()
        currentAnim = anim
        currentAnim?.start(loop, speedRatio)
      }

      // Colisión contra el SEGMENTO recorrido este frame por un proyectil,
      // no solo su punto final — con dt grande (frame lento/tab en 2do
      // plano) un proyectil puede avanzar más que el radio de impacto en
      // un solo paso y atravesar el objetivo sin que ningún punto
      // muestreado caiga dentro del radio. Compartida entre las balas del
      // poder (contra Gennos y drones) y las de los drones (contra el
      // jugador).
      function sweptHit(
        prevX: number, prevY: number, prevZ: number,
        nextX: number, nextY: number, nextZ: number,
        tx: number, ty: number, tz: number, radius: number,
      ) {
        const segX = nextX - prevX, segY = nextY - prevY, segZ = nextZ - prevZ
        const segLenSq = segX * segX + segY * segY + segZ * segZ
        let t = 0
        if (segLenSq > 1e-8) {
          t = Math.max(0, Math.min(1, ((tx - prevX) * segX + (ty - prevY) * segY + (tz - prevZ) * segZ) / segLenSq))
        }
        const dx = prevX + segX * t - tx
        const dy = prevY + segY * t - ty
        const dz = prevZ + segZ * t - tz
        return Math.sqrt(dx * dx + dy * dy + dz * dz) <= radius
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
          hipsBone = res.skeletons[0]?.bones.find((b: any) => b.name === 'mixamorig:Hips') ?? null
          // El hueso importado de glTF está vinculado a un TransformNode
          // propio (bone.getTransformNode()) — la animación mueve ESE nodo,
          // no bone.position directamente (confirmado: escribir ahí no
          // tenía ningún efecto). Para neutralizar el desplazamiento hay
          // que escribir en el nodo vinculado.
          hipsNode = hipsBone?.getTransformNode?.() ?? null
          // Esqueleto y clips vienen de Mixamo (mismo rig): Idle en reposo,
          // Run al moverse, Jump al saltar. La física del arco (posY) la
          // seguimos calculando nosotros — el clip de salto solo aporta
          // la pose mientras dura.
          runAnim = res.animationGroups.find((a: any) => a.name === 'Run') ?? null
          jumpAnim = res.animationGroups.find((a: any) => a.name === 'Jump') ?? null
          idleAnim = res.animationGroups.find((a: any) => a.name === 'Idle') ?? null
          kickAnim = res.animationGroups.find((a: any) => a.name === 'FlyingKick') ?? null
          magicAnim = res.animationGroups.find((a: any) => a.name === 'MagicAreaAttack') ?? null
          ;[runAnim, jumpAnim, idleAnim, kickAnim, magicAnim].forEach((a) => a?.stop())
          if (jumpAnim) jumpAnim.loopAnimation = false
          if (kickAnim) kickAnim.loopAnimation = false
          if (magicAnim) magicAnim.loopAnimation = false
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
      //
      // Oleadas: empieza habiendo 1 Gennos. Cada vez que una unidad completa
      // su respawn individual (ver más abajo), se suma una unidad nueva a
      // la lista y sube gennosWaveSize — matar uno lleva, de a poco, a 2,
      // después 3, y así. Cada unidad se carga recargando el mismo GLB (en
      // vez de clonar esqueleto+animación a mano, delicado de hacer bien en
      // Babylon) — el navegador ya lo tiene en caché tras la primera carga.
      type GennosUnit = {
        mesh: any; runAnim: any; light: any
        facing: number; hp: number; defeated: boolean; respawnTimer: number
        hpBarBg: any; hpBarFill: any
      }
      const GENNOS_MAX_HP = 100
      const GENNOS_RESPAWN_DELAY = 240 // dt-units, ~4s a 60fps
      const gennosList: GennosUnit[] = []
      let gennosWaveSize = 1

      function randomGennosSpawn() {
        const angle = Math.random() * Math.PI * 2
        const dist = 14 + Math.random() * 8
        return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist }
      }

      function spawnGennosUnit(spawnX: number, spawnZ: number) {
        B.SceneLoader.ImportMeshAsync('', '/models/trickster/', 'gennos-enemy.glb', scene)
          .then((res) => {
            if (disposed) return
            const mesh = res.meshes[0]
            mesh.rotationQuaternion = null
            mesh.position.set(spawnX, 0, spawnZ)
            mesh.scaling = new B.Vector3(1.63, 1.63, 1.63)
            const light = new B.PointLight('gennosLight', new B.Vector3(spawnX, 1.4, spawnZ), scene)
            light.diffuse = B.Color3.FromHexString('#ff2b2b')
            light.intensity = 0.9
            light.range = 6
            // Un solo clip en el archivo (el nombre que le puso Mixamo al
            // exportar) — se reproduce siempre en loop, todavía no hay Idle
            // propio para Gennos.
            const runAnim = res.animationGroups[0] ?? null
            runAnim?.start(true)

            // Barra de vida — billboard (siempre de cara a cámara), dos
            // planos superpuestos: fondo oscuro fijo + relleno rojo que se
            // achica con hp/GENNOS_MAX_HP. No es texto — el pedido anterior
            // de sacar el HUD de texto sigue en pie.
            const hpBarBg = B.MeshBuilder.CreatePlane('hpBarBg', { width: 1.1, height: 0.14 }, scene)
            hpBarBg.billboardMode = B.Mesh.BILLBOARDMODE_ALL
            const hpBgMat = new B.StandardMaterial('hpBgMat', scene)
            hpBgMat.emissiveColor = new B.Color3(0.15, 0.03, 0.03)
            hpBgMat.disableLighting = true
            hpBarBg.material = hpBgMat
            const hpBarFill = B.MeshBuilder.CreatePlane('hpBarFill', { width: 1, height: 0.1 }, scene)
            hpBarFill.billboardMode = B.Mesh.BILLBOARDMODE_ALL
            // Coplanar con hpBarBg (mismo billboard, misma posición): sin un
            // rendering group propio, el z-fighting hace que el fondo gane
            // y el relleno quede invisible. Un grupo posterior lo fuerza
            // siempre encima, sin depender de precisión de depth buffer.
            hpBarFill.renderingGroupId = 1
            const hpFillMat = new B.StandardMaterial('hpFillMat', scene)
            hpFillMat.emissiveColor = new B.Color3(1, 0.15, 0.15)
            hpFillMat.disableLighting = true
            hpBarFill.material = hpFillMat

            gennosList.push({
              mesh, runAnim, light, facing: 0, hp: GENNOS_MAX_HP, defeated: false, respawnTimer: 0,
              hpBarBg, hpBarFill,
            })
          })
          .catch(() => { /* enemigo opcional — si falla, el campo de prueba sigue sin esta unidad */ })
      }

      spawnGennosUnit(14, -12) // posición inicial, igual que la única unidad de antes

      // Drones — enemigos voladores, geometría simple generada (sin asset
      // propio todavía): cuerpo achatado + anillo que gira para dar
      // sensación de vuelo, luz roja de acento (mismo código de color
      // "corrupción" que ya usa Gennos). Vuelan hacia Trickster, se
      // detienen a DRONE_STOP_DIST y disparan proyectiles — el jugador
      // puede destruirlos con cualquiera de sus tres ataques (patada,
      // poder, magia); mueren y reaparecen en otro punto del perímetro
      // tras un delay, mismo patrón que Gennos.
      type Drone = {
        mesh: any; ring: any; light: any
        hp: number; defeated: boolean; defeatedTimer: number; fireTimer: number
      }
      const DRONE_COUNT = 3
      const DRONE_HEIGHT = 2.6
      const DRONE_SPEED = 0.045
      const DRONE_STOP_DIST = 6
      const DRONE_FIRE_INTERVAL = 100 // dt-units, ~1.7s a 60fps
      const DRONE_HP_MAX = 40
      const DRONE_RESPAWN_DELAY = 200 // dt-units, ~3.3s
      const DRONE_PROJECTILE_SPEED = 1.3
      const DRONE_PROJECTILE_DAMAGE = 8
      const DRONE_HIT_RADIUS = 0.9

      function randomDroneSpawn() {
        const angle = Math.random() * Math.PI * 2
        const dist = 14 + Math.random() * 8
        return { x: Math.cos(angle) * dist, z: Math.sin(angle) * dist }
      }

      function createDrone(): Drone {
        const spawn = randomDroneSpawn()
        const mesh = B.MeshBuilder.CreateSphere('drone', { diameterX: 0.5, diameterY: 0.3, diameterZ: 0.5 }, scene)
        mesh.position.set(spawn.x, baseY + DRONE_HEIGHT, spawn.z)
        const mat = new B.StandardMaterial('droneMat', scene)
        mat.emissiveColor = new B.Color3(0.55, 0.05, 0.05)
        mat.disableLighting = true
        mesh.material = mat
        const ring = B.MeshBuilder.CreateTorus('droneRing', { diameter: 0.85, thickness: 0.05, tessellation: 24 }, scene)
        ring.parent = mesh
        ring.rotation.x = Math.PI / 2
        const ringMat = new B.StandardMaterial('droneRingMat', scene)
        ringMat.emissiveColor = new B.Color3(1, 0.15, 0.15)
        ringMat.disableLighting = true
        ring.material = ringMat
        const light = new B.PointLight('droneLight', mesh.position.clone(), scene)
        light.diffuse = new B.Color3(1, 0.2, 0.2)
        light.intensity = 0.5
        light.range = 4
        return { mesh, ring, light, hp: DRONE_HP_MAX, defeated: false, defeatedTimer: 0, fireTimer: Math.random() * DRONE_FIRE_INTERVAL }
      }

      const drones: Drone[] = []
      for (let i = 0; i < DRONE_COUNT; i++) drones.push(createDrone())

      const droneBullets: Array<{ mesh: any; dirX: number; dirY: number; dirZ: number; life: number }> = []
      const DRONE_BULLET_LIFE = 90

      function damageDrone(d: Drone, amount: number) {
        if (d.defeated) return
        d.hp = Math.max(0, d.hp - amount)
        if (d.hp <= 0) {
          d.defeated = true
          d.defeatedTimer = 0
          const flash = new B.PointLight('droneExplosion', d.mesh.position.clone(), scene)
          flash.diffuse = new B.Color3(1, 0.25, 0.1)
          flash.intensity = 4
          flash.range = 5
          B.Animation.CreateAndStartAnimation(
            'droneExplosionFade', flash, 'intensity', 60, 16,
            4, 0, B.Animation.ANIMATIONLOOPMODE_CONSTANT, undefined, () => flash.dispose(),
          )
        }
      }

      function damageDronesInRange(cx: number, cz: number, range: number, amount: number) {
        for (const d of drones) {
          if (d.defeated) continue
          const ddx = d.mesh.position.x - cx
          const ddz = d.mesh.position.z - cz
          if (Math.hypot(ddx, ddz) <= range) damageDrone(d, amount)
        }
      }

      // Vida del jugador — HUD 2D fijo en pantalla (no billboard 3D como
      // Gennos: es el propio jugador, no tiene sentido una barra flotando
      // sobre su cabeza que él mismo no vería). "Derrota" acá es un
      // respawn en el origen con vida llena tras un breve delay, igual de
      // simple que el de Gennos.
      const PLAYER_MAX_HP = 100
      let playerHP = PLAYER_MAX_HP
      let playerDefeated = false
      let playerRespawnTimer = 0
      const PLAYER_RESPAWN_DELAY = 180 // dt-units, ~3s
      const PLAYER_HIT_RADIUS = 1.0

      function damagePlayer(amount: number) {
        if (playerDefeated) return
        playerHP = Math.max(0, playerHP - amount)
        if (playerHP <= 0) {
          playerDefeated = true
          playerRespawnTimer = 0
        }
      }

      // Ítems de recuperación de vida — cristal verde flotante (verde =
      // curación; violeta ya es Trickster/magia y rojo ya es
      // corrupción/Gennos/drones en este proyecto, así que no se reusan
      // esos dos). Aparecen solos cada HEALTH_PICKUP_INTERVAL, hasta un
      // máximo simultáneo, en un punto aleatorio del área jugable; al
      // acercarse el jugador los recoge y recupera vida.
      type HealthPickup = { mesh: any; light: any }
      const healthPickups: HealthPickup[] = []
      const HEALTH_PICKUP_HEAL = 30
      const HEALTH_PICKUP_RADIUS = 1.2
      const HEALTH_PICKUP_INTERVAL = 600 // dt-units, ~10s a 60fps
      const HEALTH_PICKUP_MAX = 2
      let healthPickupTimer = 0

      function spawnHealthPickup() {
        if (healthPickups.length >= HEALTH_PICKUP_MAX) return
        const angle = Math.random() * Math.PI * 2
        const dist = Math.random() * 20
        const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist
        const mesh = B.MeshBuilder.CreateSphere('healthPickup', { diameter: 0.4 }, scene)
        mesh.position.set(x, baseY + 0.8, z)
        const mat = new B.StandardMaterial('healthPickupMat', scene)
        mat.emissiveColor = new B.Color3(0.1, 1, 0.4)
        mat.disableLighting = true
        mesh.material = mat
        const light = new B.PointLight('healthPickupLight', mesh.position.clone(), scene)
        light.diffuse = new B.Color3(0.2, 1, 0.5)
        light.intensity = 0.6
        light.range = 3
        healthPickups.push({ mesh, light })
      }

      spawnHealthPickup() // uno disponible desde el arranque, el resto los trae el timer

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

        // Joystick analógico (mobile) — solo entra en juego si no hay
        // teclado activo ese frame. A diferencia del teclado (siempre
        // velocidad máxima), acá se conserva la magnitud del stick para que
        // empujar poco mueva despacio, como en LoL/COD.
        let analog = false
        if (inputForward === 0 && inputRight === 0) {
          const joy = joyRef.current
          if (Math.hypot(joy.x, joy.y) > 0.12) {
            inputForward = joy.y
            inputRight = joy.x
            analog = true
          }
        }

        // El ataque de área es un cast estático (dos manos en alto) — se
        // cancela el input de movimiento mientras dura, igual que saltar o
        // patear ya están implícitamente atados al estado del personaje.
        if (magicking || playerDefeated) { inputForward = 0; inputRight = 0 }

        let dx = camForward.x * inputForward + camRight.x * inputRight
        let dz = camForward.z * inputForward + camRight.z * inputRight
        const moving = dx !== 0 || dz !== 0

        if (moving) {
          const len = Math.hypot(dx, dz)
          if (!analog || len > 1) { dx /= len; dz /= len }
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
        const kickKeyDown = !playerDefeated && !!keys['KeyE']
        if (kickKeyDown && !kickKeyPrev && !kicking && !magicking && grounded && kickAnim) {
          kicking = true
          kickTimer = 0
          kickHit = false
          playAnim(kickAnim, false, 1)
        }
        kickKeyPrev = kickKeyDown
        if (kicking) {
          kickTimer += dt
          // FlyingKick trae "root motion" baqueado en el hueso de la cadera
          // (Hips) — un salto de ~1.3 unidades hacia adelante dentro del
          // propio clip, que no pasa por posX/posZ (la posición real que
          // controla el resto del juego). Sin neutralizarlo, el personaje
          // se lanza hacia adelante mientras dura la patada y después
          // "teletransporta" de vuelta en el instante en que termina y
          // Idle/Run retoman el hueso en su posición de reposo. Se fija el
          // hueso a su XZ de reposo durante toda la patada — conserva
          // cualquier sutileza en Y (agache/salto propio del clip), solo
          // anula el desplazamiento horizontal.
          if (hipsNode) {
            if (hipsBaseX === null) {
              hipsBaseX = hipsNode.position.x
              hipsBaseZ = hipsNode.position.z
            }
            hipsNode.position.x = hipsBaseX
            hipsNode.position.z = hipsBaseZ
          }
          if (!kickHit && kickTimer >= KICK_HIT_AT) {
            kickHit = true
            damageGennosInRange(posX, posZ, KICK_RANGE, KICK_DAMAGE)
            damageDronesInRange(posX, posZ, KICK_RANGE, KICK_DAMAGE)
          }
          if (kickTimer >= KICK_DURATION) {
            kicking = false
            hipsBaseX = null
            hipsBaseZ = null
          }
        }

        // Ataque de área — flanco de subida de KeyQ (o el botón MAGIA),
        // mismo mecanismo que la patada (una vez por toque, bloqueada
        // hasta terminar). El estallido daña a Gennos si está a MAGIC_RANGE
        // o menos del personaje en el instante del cast, sin importar la
        // dirección — es un área alrededor de Trickster, no un golpe dirigido.
        const magicKeyDown = !playerDefeated && !!keys['KeyQ']
        if (magicKeyDown && !magicKeyPrev && !magicking && !kicking && grounded && magicAnim) {
          magicking = true
          magicTimer = 0
          magicHit = false
          playAnim(magicAnim, false, 1)
        }
        magicKeyPrev = magicKeyDown
        if (magicking) {
          magicTimer += dt
          if (!magicHit && magicTimer >= MAGIC_CAST_AT) {
            magicHit = true
            damageGennosInRange(posX, posZ, MAGIC_RANGE, MAGIC_DAMAGE)
            damageDronesInRange(posX, posZ, MAGIC_RANGE, MAGIC_DAMAGE)
            spawnMagicRing(posX, baseY, posZ)
          }
          if (magicTimer >= MAGIC_DURATION) magicking = false
        }

        // Gennos persigue a Trickster — esqueleto y animación Run reales
        // (ver comentario de arriba), un solo clip en loop constante. Cada
        // unidad de gennosList se procesa igual, individualmente.
        if (characterRoot) {
          for (const g of gennosList) {
            if (g.defeated) {
              // Sin animación de derrota propia: se cae de cara y se hunde
              // un poco, se queda así un rato y reaparece sola en un punto
              // nuevo del perímetro con la vida llena. Al completar el
              // respawn, sube el tamaño de la oleada y se agrega una unidad
              // nueva — así "matar uno" va llevando a 2, después 3 Gennos.
              g.respawnTimer += dt
              g.mesh.rotation.x = Math.min(g.mesh.rotation.x + 0.08 * dt, Math.PI / 2)
              g.mesh.position.y = Math.max(g.mesh.position.y - 0.01 * dt, -0.4)
              if (g.respawnTimer >= GENNOS_RESPAWN_DELAY) {
                g.defeated = false
                g.hp = GENNOS_MAX_HP
                const spawn = randomGennosSpawn()
                g.mesh.position.set(spawn.x, 0, spawn.z)
                g.mesh.rotation.x = 0
                g.facing = 0
                g.runAnim?.start(true)
                g.light.position.set(spawn.x, 1.4, spawn.z)
                gennosWaveSize++
                const extra = randomGennosSpawn()
                spawnGennosUnit(extra.x, extra.z)
              }
            } else {
              const gdx = posX - g.mesh.position.x
              const gdz = posZ - g.mesh.position.z
              const gdist = Math.hypot(gdx, gdz)
              if (gdist > GENNOS_STOP_DIST) {
                const gnx = gdx / gdist, gnz = gdz / gdist
                g.mesh.position.x += gnx * GENNOS_SPEED * dt
                g.mesh.position.z += gnz * GENNOS_SPEED * dt
                const gTarget = Math.atan2(gnx, gnz)
                g.facing += wrapAngle(gTarget - g.facing) * TURN_LERP
              }
              g.mesh.rotation.y = g.facing
              g.light.position.set(g.mesh.position.x, g.mesh.position.y + 1.4, g.mesh.position.z)
            }

            const barY = g.mesh.position.y + 2.3
            g.hpBarBg.position.set(g.mesh.position.x, barY, g.mesh.position.z)
            g.hpBarFill.position.set(g.mesh.position.x, barY, g.mesh.position.z)
            const hpFrac = Math.max(0, g.hp / GENNOS_MAX_HP)
            g.hpBarFill.scaling.x = hpFrac
            g.hpBarFill.position.x -= (1 - hpFrac) * 0.5
            g.hpBarBg.setEnabled(!g.defeated)
            g.hpBarFill.setEnabled(!g.defeated)
          }
        }

        // Drones — vuelan hacia Trickster y se detienen a DRONE_STOP_DIST,
        // desde ahí disparan proyectiles periódicamente. Derrotado: cae,
        // gira y se desvanece; reaparece en otro punto del perímetro tras
        // DRONE_RESPAWN_DELAY, mismo patrón que Gennos.
        for (const d of drones) {
          if (d.defeated) {
            d.defeatedTimer += dt
            d.mesh.position.y -= 0.025 * dt
            d.mesh.rotation.z += 0.12 * dt
            d.mesh.visibility = Math.max(0, 1 - d.defeatedTimer / DRONE_RESPAWN_DELAY)
            d.ring.visibility = d.mesh.visibility
            if (d.defeatedTimer >= DRONE_RESPAWN_DELAY) {
              const spawn = randomDroneSpawn()
              d.mesh.position.set(spawn.x, baseY + DRONE_HEIGHT, spawn.z)
              d.mesh.rotation.z = 0
              d.mesh.visibility = 1
              d.ring.visibility = 1
              d.hp = DRONE_HP_MAX
              d.defeated = false
              d.defeatedTimer = 0
              d.fireTimer = Math.random() * DRONE_FIRE_INTERVAL
            }
            continue
          }
          d.ring.rotation.y += 0.15 * dt
          const ddx = posX - d.mesh.position.x
          const ddz = posZ - d.mesh.position.z
          const ddist = Math.hypot(ddx, ddz)
          if (ddist > DRONE_STOP_DIST) {
            const nx = ddx / ddist, nz = ddz / ddist
            d.mesh.position.x += nx * DRONE_SPEED * dt
            d.mesh.position.z += nz * DRONE_SPEED * dt
          }
          // Leve "bob" vertical para que no se vean clavados en el aire.
          d.mesh.position.y = baseY + DRONE_HEIGHT + Math.sin(performance.now() * 0.002 + d.mesh.position.x) * 0.15
          d.light.position.copyFrom(d.mesh.position)
          d.fireTimer += dt
          if (!playerDefeated && ddist <= DRONE_STOP_DIST * 1.4 && d.fireTimer >= DRONE_FIRE_INTERVAL) {
            d.fireTimer = 0
            const tx = posX, ty = baseY + 1.1, tz = posZ
            const ddx2 = tx - d.mesh.position.x, ddy2 = ty - d.mesh.position.y, ddz2 = tz - d.mesh.position.z
            const len = Math.hypot(ddx2, ddy2, ddz2) || 1
            const db = B.MeshBuilder.CreateSphere('droneBullet', { diameter: 0.14 }, scene)
            db.position.copyFrom(d.mesh.position)
            const dbm = new B.StandardMaterial('droneBulletMat', scene)
            dbm.emissiveColor = new B.Color3(1, 0.2, 0.2)
            dbm.disableLighting = true
            db.material = dbm
            droneBullets.push({ mesh: db, dirX: ddx2 / len, dirY: ddy2 / len, dirZ: ddz2 / len, life: 0 })
          }
        }

        for (let i = droneBullets.length - 1; i >= 0; i--) {
          const b = droneBullets[i]
          const prevX = b.mesh.position.x, prevY = b.mesh.position.y, prevZ = b.mesh.position.z
          const nextX = prevX + b.dirX * DRONE_PROJECTILE_SPEED * dt
          const nextY = prevY + b.dirY * DRONE_PROJECTILE_SPEED * dt
          const nextZ = prevZ + b.dirZ * DRONE_PROJECTILE_SPEED * dt
          b.mesh.position.set(nextX, nextY, nextZ)
          b.life += dt
          let hit = false
          if (!playerDefeated) {
            if (sweptHit(prevX, prevY, prevZ, nextX, nextY, nextZ, posX, baseY + 1.1, posZ, PLAYER_HIT_RADIUS)) {
              hit = true
              damagePlayer(DRONE_PROJECTILE_DAMAGE)
            }
          }
          if (hit || b.life > DRONE_BULLET_LIFE) {
            b.mesh.dispose()
            droneBullets.splice(i, 1)
          }
        }

        // Derrota del jugador — mismo patrón que Gennos: se cae, se queda
        // un rato y reaparece solo, acá en el origen con vida llena.
        if (playerDefeated) {
          playerRespawnTimer += dt
          if (characterRoot) {
            characterRoot.rotation.x = Math.min(characterRoot.rotation.x + 0.06 * dt, Math.PI / 2.2)
          }
          if (playerRespawnTimer >= PLAYER_RESPAWN_DELAY) {
            playerDefeated = false
            playerHP = PLAYER_MAX_HP
            posX = 0
            posZ = 0
            facing = 0
            if (characterRoot) characterRoot.rotation.x = 0
          }
        }

        if (playerHpRef.current) {
          const frac = Math.max(0, playerHP / PLAYER_MAX_HP)
          playerHpRef.current.style.width = `${frac * 100}%`
        }

        // Ítems de vida — timer periódico de spawn, "bob" vertical + giro
        // para que se note que son recolectables (no un obstáculo más), y
        // recolección por cercanía con el jugador.
        healthPickupTimer += dt
        if (healthPickupTimer >= HEALTH_PICKUP_INTERVAL) {
          healthPickupTimer = 0
          spawnHealthPickup()
        }
        for (let i = healthPickups.length - 1; i >= 0; i--) {
          const p = healthPickups[i]
          p.mesh.rotation.y += 0.05 * dt
          p.mesh.position.y = baseY + 0.8 + Math.sin(performance.now() * 0.003 + p.mesh.position.x) * 0.15
          p.light.position.copyFrom(p.mesh.position)
          const pdx = posX - p.mesh.position.x
          const pdz = posZ - p.mesh.position.z
          if (!playerDefeated && Math.hypot(pdx, pdz) <= HEALTH_PICKUP_RADIUS) {
            playerHP = Math.min(PLAYER_MAX_HP, playerHP + HEALTH_PICKUP_HEAL)
            p.mesh.dispose()
            p.light.dispose()
            healthPickups.splice(i, 1)
          }
        }

        // Poder — mantener KeyF (o el botón PODER) carga una bola de energía
        // pegada a la mano derecha, cuyo tamaño crece con `powerCharge`.
        // Al soltar, se dispara un proyectil: más carga = más grande y más
        // rápido. Soltar con muy poca carga (tap accidental) no dispara nada.
        const powerKeyDown = !playerDefeated && !!keys['KeyF']
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

        // Mira — crece y brilla más mientras se carga el poder, directo por
        // ref (sin setState) para no repintar React cuadro a cuadro. El
        // apuntado del poder ya es "hacia donde mira la cámara" (ver
        // aimX/Y/Z arriba), así que el centro de pantalla es la mira real.
        if (reticleRef.current) {
          const t = Math.min(powerCharge / POWER_MAX_CHARGE, 1)
          reticleRef.current.style.transform = `translate(-50%, -50%) scale(${1 + t * 0.7})`
          reticleRef.current.style.opacity = String(0.55 + t * 0.45)
        }

        const BULLET_HIT_RADIUS = 1.3
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]
          const prevX = b.mesh.position.x, prevY = b.mesh.position.y, prevZ = b.mesh.position.z
          const nextX = prevX + b.dirX * b.speed * dt
          const nextY = prevY + b.dirY * b.speed * dt
          const nextZ = prevZ + b.dirZ * b.speed * dt
          b.mesh.position.set(nextX, nextY, nextZ)
          b.life += dt
          let hit = false
          for (const g of gennosList) {
            if (g.defeated) continue
            const gx = g.mesh.position.x, gy = g.mesh.position.y + 1.1, gz = g.mesh.position.z
            if (sweptHit(prevX, prevY, prevZ, nextX, nextY, nextZ, gx, gy, gz, BULLET_HIT_RADIUS)) {
              hit = true
              damageGennosUnit(g, 22)
              break
            }
          }
          if (!hit) {
            for (const d of drones) {
              if (d.defeated) continue
              const dx = d.mesh.position.x, dy = d.mesh.position.y, dz = d.mesh.position.z
              if (sweptHit(prevX, prevY, prevZ, nextX, nextY, nextZ, dx, dy, dz, DRONE_HIT_RADIUS)) {
                hit = true
                damageDrone(d, 22)
                break
              }
            }
          }
          if (hit || b.life > BULLET_LIFE) {
            b.mesh.dispose()
            bullets.splice(i, 1)
          }
        }

        let desired: any = null
        if (magicking) desired = magicAnim
        else if (kicking) desired = kickAnim
        else if (!grounded) desired = jumpAnim
        else if (moving) desired = runAnim
        else desired = idleAnim
        playAnim(desired, desired !== jumpAnim && desired !== kickAnim && desired !== magicAnim, desired === jumpAnim ? 1.3 : 1)

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
      try { (screen as any).orientation?.unlock?.() } catch {}
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
            onClick={() => { enterFullscreenLandscape(); setIntroDismissed(true) }}
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
            E — PATADA VOLADORA · F (MANTENER) — CARGAR PODER<br />
            Q — ATAQUE DE ÁREA
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

      {introDismissed && !loading && !loadError && (
        // Mira central — el poder apunta hacia donde mira la cámara (ver
        // aimX/Y/Z en el loop de Babylon), así que el centro de pantalla es
        // la mira real, no decorativa. El tamaño/brillo lo actualiza el
        // loop directo sobre este nodo (reticleRef), no React state.
        <div
          ref={reticleRef}
          aria-hidden="true"
          style={{
            position: 'absolute', top: '50%', left: '50%', width: 26, height: 26,
            pointerEvents: 'none', zIndex: 10, opacity: 0.55,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, border: `1.5px solid ${VIOLET}`, borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '50%', left: -5, width: 7, height: 1.5, background: VIOLET, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', top: '50%', right: -5, width: 7, height: 1.5, background: VIOLET, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: -5, height: 7, width: 1.5, background: VIOLET, transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', bottom: -5, height: 7, width: 1.5, background: VIOLET, transform: 'translateX(-50%)' }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', width: 3, height: 3, borderRadius: '50%',
            background: VIOLET, boxShadow: `0 0 6px ${VIOLET}`, transform: 'translate(-50%, -50%)',
          }} />
        </div>
      )}

      {introDismissed && !loading && !loadError && (
        // Vida del jugador — HUD 2D fijo arriba a la izquierda, libre en
        // ambos layouts (EXIT va abajo-izquierda en desktop, arriba-derecha
        // en touch). El relleno se actualiza directo por ref (playerHpRef),
        // mismo patrón que la mira — nada de setState por cuadro.
        <div style={{
          position: 'absolute', top: 20, left: 20, width: 120,
          fontFamily: 'Space Mono, monospace', zIndex: 10,
        }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: `${VIOLET}aa`, marginBottom: 4 }}>
            VIDA
          </div>
          <div style={{ width: '100%', height: 8, background: '#2a0808', border: '1px solid #5a1515', borderRadius: 2 }}>
            <div
              ref={playerHpRef}
              style={{ width: '100%', height: '100%', background: '#ff3b3b', transition: 'width 0.15s linear' }}
            />
          </div>
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
        // Movimiento por joystick analógico a la izquierda (ver TouchJoystick);
        // acciones en botones a la derecha, mismo layout que un shooter mobile.
        <>
          <TouchJoystick vecRef={joyRef} style={{ bottom: 36, left: 28 }} />
          <TouchActionButton keysRef={keysRef} code="Space" label="SALTAR" style={{ bottom: 100, right: 20, width: 72, height: 72, borderRadius: '50%' }} />
          <TouchActionButton keysRef={keysRef} code="KeyF" label="PODER" style={{ bottom: 100, right: 104, width: 72, height: 72, borderRadius: '50%' }} />
          <TouchActionButton keysRef={keysRef} code="KeyE" label="PATADA" style={{ bottom: 184, right: 20, width: 72, height: 72, borderRadius: '50%' }} />
          <TouchActionButton keysRef={keysRef} code="KeyQ" label="MAGIA" style={{ bottom: 184, right: 104, width: 72, height: 72, borderRadius: '50%' }} />
        </>
      )}
    </div>
  )
}
