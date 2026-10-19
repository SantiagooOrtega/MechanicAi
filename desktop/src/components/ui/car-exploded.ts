/**
 * Carro en vista lateral dibujado a mano en canvas. `t` va de 0 a 1:
 * 0 = armado, 0.5 = despiece completo, 1 = armado otra vez.
 */

const RED = '#ef4444'
const RED_L = '#f87171'
const RED_D = '#b91c1c'
const RED_DD = '#7f1d1d'
const WHITE = '#f5f5f5'
const STEEL = '#a1a1aa'
const STEEL_D = '#52525b'
const DARK = '#18181b'
const GLASS = 'rgba(245,245,245,0.14)'

function wheel(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = DARK
  ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = STEEL_D; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = STEEL
  ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = STEEL_D; ctx.lineWidth = 9; ctx.lineCap = 'round'
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11)
    ctx.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34)
    ctx.stroke()
  }
  ctx.fillStyle = DARK
  ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = RED
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill()
}

export function drawExplodedCar(ctx: CanvasRenderingContext2D, t: number, w: number, h: number) {
  const e = Math.sin(Math.PI * Math.min(1, Math.max(0, t)))
  const k = e * e * (3 - 2 * e) // easing del despiece
  const S = w / 1000
  const H = h / S

  ctx.save()
  ctx.scale(S, S)

  // Cuadrícula tipo plano técnico
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1
  for (let x = 0; x <= 1000; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y <= H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1000, y); ctx.stroke() }
  const glow = ctx.createRadialGradient(500, H * 0.55, 20, 500, H * 0.55, 520)
  glow.addColorStop(0, `rgba(239,68,68,${0.16 + 0.1 * k})`); glow.addColorStop(1, 'rgba(239,68,68,0)')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, 1000, H)

  ctx.translate(0, (H - 563) / 2 - 24)

  const part = (dx: number, dy: number, rot: number, cx: number, cy: number, grow: number, draw: () => void) => {
    ctx.save()
    ctx.translate(cx + dx * k, cy + dy * k)
    ctx.rotate(rot * k)
    if (grow) ctx.scale(1 + grow * k, 1 + grow * k)
    ctx.translate(-cx, -cy)
    draw()
    ctx.restore()
  }

  // Sombra en el suelo
  ctx.fillStyle = `rgba(0,0,0,${0.5 - 0.22 * k})`
  ctx.beginPath(); ctx.ellipse(510, 438, 410 + 30 * k, 15, 0, 0, Math.PI * 2); ctx.fill()

  // Chasis y escape
  part(0, 36, 0, 500, 378, 0, () => {
    ctx.fillStyle = STEEL_D; ctx.fillRect(150, 372, 700, 12)
    ctx.fillStyle = STEEL; for (const x of [250, 500, 700]) ctx.fillRect(x, 368, 14, 20)
  })
  part(-100, 66, -0.05, 230, 390, 0, () => {
    ctx.fillStyle = STEEL; ctx.beginPath(); ctx.roundRect(130, 385, 220, 10, 5); ctx.fill()
    ctx.fillStyle = STEEL_D; ctx.beginPath(); ctx.ellipse(300, 390, 36, 13, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = STEEL; ctx.lineWidth = 2; ctx.stroke()
  })

  // Ruedas (detrás de la carrocería, se ven por los pasos de rueda)
  part(-72, 64, -Math.PI * 3, 270, 370, 0, () => wheel(ctx, 270, 370))
  part(72, 64, Math.PI * 3, 740, 370, 0, () => wheel(ctx, 740, 370))

  // Motor: armado queda oculto bajo el capó; al despiezar sube y crece para verse
  part(14, -158, 0, 755, 285, 1.1, () => {
    ctx.fillStyle = STEEL_D; ctx.beginPath(); ctx.roundRect(700, 276, 110, 20, 4); ctx.fill()
    ctx.strokeStyle = STEEL; ctx.lineWidth = 1.6; ctx.stroke()
    ctx.fillStyle = RED_DD; ctx.fillRect(706, 272, 98, 6)
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = STEEL; ctx.fillRect(710 + i * 24, 266, 14, 8)
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(717 + i * 24, 288, 5, 0, Math.PI * 2); ctx.fill()
    }
  })

  // Carrocería inferior con pasos de rueda
  const body = ctx.createLinearGradient(0, 282, 0, 372)
  body.addColorStop(0, RED_L); body.addColorStop(0.35, RED); body.addColorStop(1, RED_D)
  part(0, 12, 0, 510, 330, 0, () => {
    ctx.beginPath()
    ctx.moveTo(145, 282); ctx.lineTo(878, 282)
    ctx.quadraticCurveTo(892, 296, 892, 316); ctx.lineTo(892, 356)
    ctx.quadraticCurveTo(892, 372, 876, 372); ctx.lineTo(820, 372)
    ctx.arc(740, 372, 80, 0, Math.PI, true); ctx.lineTo(350, 372)
    ctx.arc(270, 372, 80, 0, Math.PI, true); ctx.lineTo(142, 372)
    ctx.quadraticCurveTo(130, 372, 130, 360); ctx.lineTo(130, 296)
    ctx.quadraticCurveTo(130, 282, 145, 282); ctx.closePath()
    ctx.fillStyle = body; ctx.fill()
    ctx.strokeStyle = RED_DD; ctx.lineWidth = 3; ctx.stroke()
  })

  // Interior: asiento y volante, visibles a través del cristal
  part(0, -22, 0, 430, 262, 0, () => {
    ctx.fillStyle = DARK
    ctx.beginPath(); ctx.roundRect(404, 222, 36, 62, 8); ctx.fill()
    ctx.beginPath(); ctx.roundRect(396, 272, 70, 15, 6); ctx.fill()
    ctx.strokeStyle = STEEL_D; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(404, 222, 36, 62, 8); ctx.stroke()
  })
  part(24, -34, 0.2, 560, 248, 0, () => {
    ctx.strokeStyle = DARK; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(560, 248, 7, 22, 0.35, 0, Math.PI * 2); ctx.stroke()
  })

  // Cabina de cristal
  part(0, -62, 0, 460, 245, 0, () => {
    ctx.beginPath()
    ctx.moveTo(298, 282); ctx.lineTo(358, 210); ctx.lineTo(522, 200); ctx.lineTo(624, 282); ctx.closePath()
    ctx.fillStyle = GLASS; ctx.fill()
    ctx.strokeStyle = 'rgba(245,245,245,0.55)'; ctx.lineWidth = 3; ctx.stroke()
    ctx.strokeStyle = RED_DD; ctx.lineWidth = 6
    ctx.beginPath(); ctx.moveTo(444, 203); ctx.lineTo(444, 282); ctx.stroke()
  })

  // Techo
  part(0, -118, 0, 442, 196, 0, () => {
    ctx.beginPath()
    ctx.moveTo(352, 212); ctx.lineTo(362, 197); ctx.lineTo(520, 188); ctx.lineTo(531, 203); ctx.closePath()
    ctx.fillStyle = RED_D; ctx.fill(); ctx.strokeStyle = RED_DD; ctx.lineWidth = 3; ctx.stroke()
  })

  // Capó y maletero
  part(90, -96, 0.12, 750, 280, 0, () => {
    ctx.beginPath()
    ctx.moveTo(604, 270); ctx.lineTo(868, 276); ctx.quadraticCurveTo(892, 280, 892, 300); ctx.lineTo(892, 304); ctx.lineTo(604, 286); ctx.closePath()
    ctx.fillStyle = RED; ctx.fill(); ctx.strokeStyle = RED_DD; ctx.lineWidth = 3; ctx.stroke()
    ctx.strokeStyle = RED_DD; ctx.lineWidth = 2
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(690 + i * 18, 274); ctx.lineTo(704 + i * 18, 284); ctx.stroke() }
  })
  part(-90, -74, -0.1, 215, 280, 0, () => {
    ctx.beginPath()
    ctx.moveTo(130, 280); ctx.quadraticCurveTo(130, 272, 150, 270); ctx.lineTo(300, 270); ctx.lineTo(300, 286); ctx.lineTo(130, 292); ctx.closePath()
    ctx.fillStyle = RED; ctx.fill(); ctx.strokeStyle = RED_DD; ctx.lineWidth = 3; ctx.stroke()
  })

  // Puerta: sale hacia el espectador al despiezar
  part(0, -4, -0.05, 506, 326, 0.3, () => {
    ctx.beginPath(); ctx.roundRect(372, 294, 268, 66, 12)
    ctx.fillStyle = '#e24a4a'; ctx.fill(); ctx.strokeStyle = RED_DD; ctx.lineWidth = 3; ctx.stroke()
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.roundRect(560, 308, 42, 8, 4); ctx.fill()
  })

  // Faros
  part(78, -12, 0, 886, 318, 0, () => {
    ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.ellipse(886, 318, 7, 14, 0, 0, Math.PI * 2); ctx.fill()
  })
  part(-78, -6, 0, 131, 314, 0, () => {
    ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.roundRect(126, 300, 10, 28, 3); ctx.fill()
  })

  ctx.restore()
}
