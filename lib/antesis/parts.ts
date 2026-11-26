// ANTESIS — las piezas que no son dientes: núcleo, pétalos y coronas.
//
// La regla que hace que nada choque: una pieza que gira alrededor de su eje barre un
// sólido de revolución. A una distancia ρ del centro, la pieza de un engranaje ocupa,
// a lo largo de una vuelta, un casquete de semiángulo Φ(ρ) alrededor de su eje. Dos
// vecinos A y B cuyos ejes forman un ángulo Σ no se tocan nunca si, a toda distancia,
// ΦA(ρ) + ΦB(ρ) < Σ (y dos de la misma clase si Φ < Σ/2). El ancho alrededor del eje es
// libre: un pétalo puede ser ancho y torcido sin barrer más.
//
// Así que el espacio se reparte por capas: cerca de la esfera, los pétalos (clase P)
// se abren casi hasta el vecino mientras la otra clase (C) sube como un tallo fino;
// más afuera, los pétalos se cierran hacia su eje y los tallos abren su corona. Cada
// forma se genera en coordenadas normalizadas (ψ = φ / Φ) y por eso cabe por
// construcción; después se comprueba igual, midiendo el barrido real.

import { mulberry32, range, int, pick, type Rng } from '../specimens/rng'
import type { GearGeom, Fit } from './gear'
import type { Arrangement } from './layout'
import { makeBox, region, nets, type NetMesh } from './nets'

export type Ball = { x: number; y: number; z: number; r: number }
export type Role = 'petalo' | 'corona'

// Semiángulo ocupado por el bloque engranaje + buje + plato a distancia ρ.
export function blockAngle(g: GearGeom, rho: number, plateT: number): number {
  let a = 0
  if (rho >= g.zIn) {
    const hiZ = Math.acos(Math.min(1, g.zIn / rho)), loZ = Math.acos(Math.min(1, g.zOut / rho))
    const top = Math.min(g.tip, hiZ)
    if (loZ <= top) a = Math.max(a, top)
  }
  if (rho >= g.zSb) {
    const r = Math.min(g.rS, Math.sqrt(Math.max(0, rho * rho - g.zSb * g.zSb)))
    if (rho * rho <= g.zIn * g.zIn + g.rS * g.rS + 1e-9) a = Math.max(a, Math.asin(Math.min(1, r / rho)))
  }
  const zp = g.zOut + plateT
  if (rho >= g.zOut && rho * rho <= zp * zp + g.plate * g.plate) {
    const r = Math.min(g.plate, Math.sqrt(Math.max(0, rho * rho - g.zOut * g.zOut)))
    a = Math.max(a, Math.asin(Math.min(1, r / rho)))
  }
  return a
}

export type DecoParams = {
  seed: number
  reach: number      // ρ máximo / Aout
  petals: number     // cantidad de pétalos
  swirl: number      // torsión de los pétalos (rad a lo largo)
  width: number      // ancho relativo
  cup: number        // cuánto se ahuecan
  tipStyle: 'punta' | 'bifida' | 'redonda'
  split: number      // dónde se cierran los pétalos y abre la corona (0..1)
  crown: number      // brazos de la corona
  curl: number       // gancho de los brazos (rad)
  bulb: number       // radio de la gota en la punta (mm)
  strands: number    // hebras del tallo
  twist: number      // vueltas del tallo
  style: 'cuerno' | 'lamina' | 'lengua' // forma de los pétalos
  inner: boolean     // segunda vuelta de pétalos, más corta
  hornW: number      // medio ancho de la base (mm)
  hornR: number      // radio de la base (mm)
  tip: number        // cuánto se cierra la punta hacia el eje (0..1)
}

export function decoParams(seed: number, reach = 1.7): DecoParams {
  const r: Rng = mulberry32(seed * 7919 + 13)
  return {
    seed, reach,
    petals: int(r, 3, 7),
    swirl: (r() < 0.5 ? -1 : 1) * range(r, 0.15, 1.25),
    width: range(r, 0.55, 1.15),
    cup: range(r, 0, 0.45),
    tipStyle: pick(r, ['punta', 'bifida', 'redonda'] as const),
    split: range(r, 0.38, 0.58),
    crown: int(r, 3, 6),
    curl: (r() < 0.5 ? -1 : 1) * range(r, 0.2, 1.6),
    bulb: range(r, 1.1, 2.2),
    strands: int(r, 2, 4),
    twist: range(r, 0.3, 1.4),
    style: pick(r, ['cuerno', 'cuerno', 'lamina', 'lengua'] as const),
    inner: r() < 0.6,
    hornW: range(r, 2.2, 5),
    hornR: range(r, 1.3, 2.1),
    tip: range(r, 0.3, 0.75),
  }
}

export type Envelopes = {
  rho0: number; drho: number
  EP: Float32Array; EC: Float32Array
  rhoS: number; rhoX: number; tau: number; rhoTop: number
  stalkR: number; tipP: number
  sweep: number; tilt: number; pivot: number // holgura (mm) = sweep + 2·tilt·(ρ − pivot)
}

const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

// P = clase con pétalos, C = clase con corona.
export function envelopes(arr: Arrangement, P: GearGeom, C: GearGeom, sigPP: number, sigCC: number, fit: Fit, d: DecoParams, plateT: number, stalkR: number): Envelopes {
  const Aout = P.Aout, rhoTop = d.reach * Aout, drho = 0.1
  const n = Math.ceil(rhoTop / drho) + 2
  const EP = new Float32Array(n), EC = new Float32Array(n)
  const tilt = Math.tan((fit.tiltDeg * Math.PI) / 180), pivot = Math.min(P.zSb, C.zSb)
  const S = arr.sigma
  const M = (rho: number) => Math.asin(Math.min(1, (fit.sweep + 2 * tilt * Math.max(0, rho - pivot)) / rho))
  const rhoS = Math.max(P.zOut, C.zOut) + plateT
  const rhoX = rhoS + d.split * (rhoTop - rhoS), tau = 0.24 * (rhoTop - rhoS)
  const tipP = Math.max(0.12, S - sigCC / 2 - M(rhoTop) / 2)
  for (let k = 0; k < n; k++) {
    const rho = k * drho
    // bajo la cara exterior del engranaje la envolvente también vale (la restringen los
    // vecinos, no el propio engranaje): la ventana radial de cada bola la lee
    if (rho < 1 || rho > rhoTop) continue
    const m = M(rho), sigmaC = Math.asin(Math.min(1, stalkR / Math.max(rho, stalkR)))
    const capP = Math.min((sigPP - m) / 2, S - m - sigmaC)
    const capC = Math.min((sigCC - m) / 2, S - m - tipP)
    const w = smooth(rhoX - tau / 2, rhoX + tau / 2, rho)
    const dP = (1 - w) * capP + w * tipP, dC = (1 - w) * sigmaC + w * capC
    const gP = blockAngle(P, rho, plateT), gC = blockAngle(C, rho, plateT)
    EP[k] = Math.max(0, Math.min(dP, S - m - gC, sigPP - m - gP))
    EC[k] = Math.max(0, Math.min(dC, S - m - gP, sigCC - m - gC))
  }
  return { rho0: 0, drho, EP, EC, rhoS, rhoX, tau, rhoTop, stalkR, tipP, sweep: fit.sweep, tilt, pivot }
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function envAt(E: Float32Array, drho: number, rho: number) {
  const x = rho / drho, i = Math.floor(x)
  if (i < 0 || i + 1 >= E.length) return 0
  return lerp(E[i], E[i + 1], x - i)
}
// el menor valor de la envolvente en [ρ−r, ρ+r]: una bola de radio r tiene que caber entera
function envMin(E: Float32Array, drho: number, rho: number, r: number) {
  let m = Infinity
  for (let q = rho - r; q <= rho + r + 1e-9; q += drho) m = Math.min(m, envAt(E, drho, q))
  return m
}

// Bola en coordenadas (ρ, ψ, θ): φ = ψ · (lo que deja la envolvente para su radio).
// La envolvente ya deja la holgura en ángulo; en la dirección radial se toma el mínimo
// en una ventana de ±(radio + holgura): donde termina un engranaje vecino la envolvente
// salta, y una bola apenas más afuera quedaría pegada a su borde.
function clearMm(env: Envelopes, rho: number) { return env.sweep + 2 * env.tilt * Math.max(0, rho - env.pivot) }
function place(env: Envelopes, E: Float32Array, drho: number, rho: number, psi: number, theta: number, r: number, h: number): Ball | null {
  const room = envMin(E, drho, rho, r + h + clearMm(env, rho)) - Math.asin(Math.min(1, (r + h) / rho))
  if (room <= 0) return null
  const phi = Math.max(0, Math.min(1, psi)) * room
  const s = Math.sin(phi)
  return { x: rho * s * Math.cos(theta), y: rho * s * Math.sin(theta), z: rho * Math.cos(phi), r }
}

// ---------------------------------------------------------------------------------
// Pétalos: salen del borde del plato, se abren casi hasta el vecino, se tuercen
// alrededor del eje y en la mitad de afuera se curvan hacia arriba (ahí la envolvente
// deja lugar a las coronas). Tres formas: cuerno (grueso y angosto, se afina), lámina
// (ancha y delgada) y lengua (entre las dos). Opcionalmente una vuelta interior más
// corta y alternada, y estambres en el centro.
export function petalBalls(g: GearGeom, env: Envelopes, d: DecoParams, thick: number, h: number, plateT: number): Ball[] {
  const out: Ball[] = [], E = env.EP, dr = env.drho, rMin = thick / 2
  const zp = g.zOut + plateT
  const shape = d.style === 'cuerno' ? { w: d.hornW, rb: d.hornR, taper: 0.8 } : d.style === 'lengua' ? { w: d.hornW * 1.8, rb: Math.max(rMin, d.hornR * 0.7), taper: 0.55 } : { w: d.hornW * 2.8, rb: rMin + 0.15, taper: 0.35 }
  const ring = (count: number, th00: number, rimFrac: number, lenFrac: number, psiPeak: number, psiTip: number, scale: number) => {
    const rhoStart = Math.hypot(zp - 0.4, g.plate * rimFrac)
    const rhoEnd = rhoStart + (env.rhoTop - 1.5 - rhoStart) * lenFrac
    const L = rhoEnd - rhoStart
    if (L <= 2) return
    const phiStart = Math.atan2(g.plate * rimFrac, zp - 0.4)
    for (let p = 0; p < count; p++) {
      const th0 = th00 + (2 * Math.PI * p) / count
      let s = 0
      while (s <= 1) {
        const rho = rhoStart + L * s
        const rr = Math.max(rMin, lerp(shape.rb, rMin, Math.pow(s, shape.taper)) * scale)
        const room0 = envAt(E, dr, rho)
        const spine = place(env, E, dr, rho, 0.5, 0, rr, h)
        if (room0 <= 0 || !spine) break
        {
          const psiStart = Math.min(1, phiStart / Math.max(1e-3, room0))
          const psiC = lerp(psiStart, psiPeak, smooth(0, 0.3, s)) - (psiPeak - psiTip) * smooth(0.42, 1, s)
          const flare = 1 + 0.6 * (1 - smooth(0, 0.18, s))
          let halfW = shape.w * scale * flare * Math.pow(1 - s, d.style === 'lamina' ? 0.35 : 0.75)
          if (d.style === 'lamina') halfW *= Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * s)), 0.5)
          halfW = Math.max(0, halfW - rr * 0.5)
          const th = th0 + d.swirl * Math.pow(s, 1.4)
          const spU = rr * 0.6, nu = Math.max(0, Math.ceil((2 * halfW) / spU))
          for (let j = 0; j <= nu; j++) {
            const u = nu ? -1 + (2 * j) / nu : 0
            const psi = psiC - d.cup * u * u * 0.3
            const phiApprox = Math.max(0.05, psi * room0)
            const ang = th + (u * halfW) / Math.max(1, rho * Math.sin(phiApprox))
            const b = place(env, E, dr, rho, psi, ang, rr, h)
            if (b) out.push(b)
          }
        }
        s += (rr * 0.5) / L
      }
    }
  }
  ring(d.petals + (d.style === 'cuerno' ? 1 : 0), 0, 0.86, 1, 0.97, 0.97 - d.tip * 0.9, 1)
  if (d.inner) ring(d.petals, Math.PI / d.petals, 0.55, 0.55, 0.7, 0.3, 0.72)
  // estambres: hebras finas desde el centro del plato, con una gota en la punta
  const nSt = 3 + (d.seed % 4), rSt = Math.max(0.6, thick * 0.42), ring0 = Math.min(g.plate * 0.28, 3)
  const fits = (x: number, y: number, z: number, r: number) => Math.atan2(Math.hypot(x, y) + r + h, z) < envMin(E, dr, Math.hypot(x, y, z), r + h + clearMm(env, z))
  for (let q = 0; q < nSt; q++) {
    const a = (2 * Math.PI * q) / nSt + 0.4, len = 4 + 3 * (((q * 7919 + d.seed) % 11) / 10)
    const stem: Ball[] = []
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const rr = ring0 * (0.5 + 0.7 * t), z = zp + 0.2 + len * t
      stem.push({ x: rr * Math.cos(a + 0.6 * t), y: rr * Math.sin(a + 0.6 * t), z, r: rSt })
    }
    const last = stem[stem.length - 1], tip = { ...last, r: rSt * 1.9 }
    if ([...stem, tip].every((b) => fits(b.x, b.y, b.z, b.r))) out.push(...stem, tip)
  }
  return out
}

// Corona: un tallo de hebras torcidas que sube por el eje y se abre en brazos con gotas.
export function crownBalls(g: GearGeom, env: Envelopes, d: DecoParams, thick: number, h: number, plateT: number): Ball[] {
  const out: Ball[] = [], E = env.EC, dr = env.drho
  const zp = g.zOut + plateT, rt = Math.max(thick * 0.62, 0.9), rh = Math.max(0, env.stalkR - rt - 0.35)
  const zTop = env.rhoX - env.tau * 0.15
  // tallo
  const nStr = d.strands
  for (let q = 0; q < nStr; q++) {
    const ph = (2 * Math.PI * q) / nStr
    for (let z = zp - 0.4; z <= zTop; z += rt * 0.45) {
      const a = ph + 2 * Math.PI * d.twist * ((z - zp) / Math.max(1, zTop - zp))
      out.push({ x: rh * Math.cos(a), y: rh * Math.sin(a), z, r: rt })
    }
  }
  // brazos
  const rhoA = zTop - 1, rhoB = env.rhoTop - d.bulb - 0.6, L = rhoB - rhoA
  if (L > 2) {
    for (let a = 0; a < d.crown; a++) {
      const th0 = (2 * Math.PI * a) / d.crown + 0.3
      const r0 = Math.max(rt * 1.25, 1.4)
      let lastB: Ball | null = null
      for (let s = 0; s <= 1.0001; s += 0.006) {
        const rr = lerp(r0, Math.max(0.85, thick * 0.55), s)
        const rho = rhoA + L * s
        const psi = lerp(0.12, 0.95, smooth(0, 0.55, s)) - 0.22 * smooth(0.75, 1, s)
        const th = th0 + d.curl * s * s
        const b = place(env, E, dr, rho, psi, th, rr, h)
        if (!b) break
        out.push(b); lastB = b
      }
      if (lastB) {
        // gota en la punta: del radio que quepa
        for (let rb = d.bulb; rb >= lastB.r; rb -= 0.2) {
          const rho = Math.hypot(lastB.x, lastB.y, lastB.z), phi = Math.acos(lastB.z / rho), th = Math.atan2(lastB.y, lastB.x)
          const room = envMin(E, dr, rho, rb + h + clearMm(env, rho)) - Math.asin(Math.min(1, (rb + h) / rho))
          if (phi <= room) { out.push({ ...lastB, r: rb }); break }
          void th
        }
      }
    }
  }
  // gota central sobre el tallo
  const top = place(env, E, dr, zTop + 1.2, 0, 0, Math.min(2.6, env.stalkR), h)
  if (top) out.push({ ...top, x: 0, y: 0 })
  return out
}

// ---------------------------------------------------------------------------------
// Campo de distancia de una decoración (en el marco del engranaje) → malla.
const smin = (a: number, b: number, k: number) => { const t = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - (t * t * k) / 4 }

export function decoMesh(g: GearGeom, balls: Ball[], plateT: number, fit: Fit, h: number): NetMesh {
  let R = g.plate + 1, zMax = g.zOut + plateT + 1
  for (const b of balls) { R = Math.max(R, Math.hypot(b.x, b.y) + b.r + 1); zMax = Math.max(zMax, b.z + b.r + 1) }
  const zMin = g.zK + 0.2 - 2 * h
  const box = makeBox([-R, -R, zMin], [R, R, zMax], h, 3 * h)
  for (const b of balls) {
    const pad = b.r + 2 * h
    region(box, [b.x - pad, b.y - pad, b.z - pad], [b.x + pad, b.y + pad, b.z + pad], (cur, x, y, z) => {
      const v = Math.hypot(x - b.x, y - b.y, z - b.z) - b.r
      return v < cur ? v : cur
    })
  }
  // plato (unido a los pétalos con un filete) y encaje hexagonal
  const k = 0.9, z0 = g.zOut, z1 = g.zOut + plateT
  region(box, [-g.plate - k, -g.plate - k, z0 - k], [g.plate + k, g.plate + k, z1 + k], (cur, x, y, z) => smin(cur, Math.max(Math.hypot(x, y) - g.plate, z0 - z, z - z1), k))
  const s = g.sH - fit.hex, zb = g.zK + 0.2
  region(box, [-s * 1.2, -s * 1.2, zb - h], [s * 1.2, s * 1.2, z0 + h], (cur, x, y, z) => {
    let hx = -Infinity
    for (let q = 0; q < 6; q++) { const a = (Math.PI / 3) * q + Math.PI / 6; hx = Math.max(hx, x * Math.cos(a) + y * Math.sin(a) - s) }
    return Math.min(cur, Math.max(hx, zb - z, z - (z0 + 0.5)))
  })
  return nets(box)
}

// Núcleo: la intersección de una esfera con un semiespacio por eje (cada engranaje apoya
// en su cara plana), con un agujero por pasador. Como todo punto del núcleo cumple
// z ≤ zb en el marco de cada engranaje y todo engranaje vive en z > zb, no pueden tocarse.
export function coreMesh(arr: Arrangement, A: GearGeom, B: GearGeom, holeR: number, L1: number, h: number): NetMesh {
  const axes = [...arr.A.map((a) => ({ a, zb: A.zb })), ...arr.B.map((a) => ({ a, zb: B.zb }))]
  const Rc = Math.sqrt(Math.max(A.zb, B.zb) ** 2 + (Math.max(A.rS, B.rS) + 2.2) ** 2)
  const box = makeBox([-Rc - 1, -Rc - 1, -Rc - 1], [Rc + 1, Rc + 1, Rc + 1], h, 1)
  region(box, [-Rc - 1, -Rc - 1, -Rc - 1], [Rc + 1, Rc + 1, Rc + 1], (_c, x, y, z) => {
    let v = Math.hypot(x, y, z) - Rc
    for (const { a, zb } of axes) { const d = x * a[0] + y * a[1] + z * a[2] - zb; if (d > v) v = d }
    return v
  })
  for (const { a, zb } of axes) {
    // agujero: cilindro a lo largo del eje, desde zb − L1 − 0,4 hasta afuera
    const lo = zb - L1 - 0.4, c = [a[0] * (zb - L1 / 2), a[1] * (zb - L1 / 2), a[2] * (zb - L1 / 2)], pad = L1 / 2 + holeR + 2
    region(box, [c[0] - pad, c[1] - pad, c[2] - pad], [c[0] + pad, c[1] + pad, c[2] + pad], (cur, x, y, z) => {
      const t = x * a[0] + y * a[1] + z * a[2], rx = x - a[0] * t, ry = y - a[1] * t, rz = z - a[2] * t
      const hole = Math.max(Math.hypot(rx, ry, rz) - holeR, lo - t)
      return Math.max(cur, -hole)
    })
  }
  return nets(box)
}

export function rngFor(seed: number) { return mulberry32(seed) }
