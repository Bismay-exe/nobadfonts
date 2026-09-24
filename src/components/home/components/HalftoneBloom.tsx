// Halftone Bloom — Originkit

"use client"

import * as React from "react"
import { useEffect, useRef } from "react"

const MAX_DPR = 2
const NAME = "HalftoneBloom"

const LAYERS = 86
const GAIN = 0.48

const TURN = 0.32
const SWELL = 1.1
const REST = 0.42

const CAP = 0.55

const VERT_SRC = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(P[gl_VertexID], 0.0, 1.0); }
`

const FIELD_SRC = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uSize;
uniform float uAngle;
out vec4 o;

const float TAU = 6.28318530718;
const float LAYERS = ${LAYERS.toFixed(1)};
const float GAIN = ${GAIN.toFixed(3)};
const vec2 CENTRE = vec2(-0.25, 0.56);
const float TILT = 1.4;
const float ZOOM = 1.05;
const float THETA = 2.13;
const float SHEAR = 0.965;
const float SHRINK = 0.957;
const vec2 WARP_FREQ = vec2(0.45, 2.5);
const vec2 WARP_AMP = vec2(0.13, 0.028);
const vec2 ASPECT = vec2(2.2, 0.18);
const float OFFSET = 0.37;
const float GLOW = 0.0021;
const float SOFT = 0.0019;
const float FALLOFF = 0.37;
const float PHASE = 23.0;
const float CYCLE = 0.16;
const float HUE_TRAVEL = 2.0;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

void main() {
  vec2 R = uRes;
  vec2 pos = (gl_FragCoord.xy - 0.5 * R) / R.y;

  pos = rot(uAngle) * pos / uSize;
  float t = uTime * 0.49 + PHASE;
  float breath = (-sin(uTime * 0.735) + sin(uTime * 0.49 + 1.0)) * 0.25 + 0.5;
  vec2 u = rot(TILT) * ((pos - CENTRE) * (ZOOM - breath * 0.085));
  mat2 fold = mat2(cos(THETA), sin(THETA), -SHEAR, cos(THETA));

  vec3 col = vec3(0.0);
  for (float i = 1.0; i <= LAYERS; i += 1.0) {
    u.x -= sin(u.y * WARP_FREQ.x + t + i * 0.007) * WARP_AMP.x;
    u.y -= sin(u.x * WARP_FREQ.y - t + i * 0.02) * WARP_AMP.y;
    u = fold * u * SHRINK;
    vec2 q = (u - vec2(OFFSET + breath * 0.1, 0.0)) * ASPECT;
    float g = GLOW / (dot(q, q) + SOFT) * (0.25 + breath * 0.4);
    float r = length(u);
    float k = sin(i * CYCLE + t * 1.2 + r * HUE_TRAVEL) * 0.5 + 0.5;
    col += g * mix(uC1, uC2, k) * (0.62 + 0.5 * k) * exp2(-r * FALLOFF);
  }
  vec3 x = max(col * GAIN, 0.0);
  col = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(0.85, 0.92, 0.98));
  col *= 1.0 - smoothstep(0.5, 1.6, length(pos)) * 0.07;
  o = vec4(col, 1.0);
}
`

const FINISH_SRC = `#version 300 es
precision highp float;
uniform sampler2D uField;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBg;
uniform float uPaper;
uniform vec2 uMouse;
uniform float uOn;
uniform float uReach;
uniform float uCell;
uniform float uPR;
out vec4 o;

const float PI = 3.14159265359;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
const float TURN = ${TURN.toFixed(4)};
const float SWELL = ${SWELL.toFixed(4)};
const float REST = ${REST.toFixed(4)};
const float CAP = ${CAP.toFixed(4)};

float ign(vec2 p, float f) { p += 5.588238 * mod(f, 64.0); return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y)); }

vec3 scene(vec2 uv) { return max(texture(uField, clamp(uv, 0.0, 1.0)).rgb, 0.0); }

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;

  mat2 turn = mat2(cos(TURN), -sin(TURN), sin(TURN), cos(TURN));
  vec2 rp = turn * frag;
  vec2 c = (floor(rp / uCell) + 0.5) * uCell;
  vec2 src = transpose(turn) * c;
  vec3 soft = scene(uv);
  vec3 ink = scene(src / uRes);
  float lvl = clamp(dot(ink, LUMA), 0.0, 1.0);
  float radius = uCell * sqrt(pow(lvl, 0.9) / PI);
  float presence = smoothstep(0.03, 0.16, lvl) * REST;

  if (uOn > 0.0) {
    vec2 d = (src - uMouse) / uReach;
    float w = uOn * exp(-dot(d, d));
    if (w > 1e-4) {
      radius *= 1.0 + SWELL * w;
      presence = mix(presence, 1.0, min(w, 1.0));
    }
  }
  radius = min(radius, uCell * CAP);
  float aa = 0.7 * uPR;
  float dm = 1.0 - smoothstep(radius - aa, radius + aa, length(rp - c));
  vec3 dots = ink * min(0.8 / max(lvl, 1e-3), 2.2) * dm;
  vec3 L = mix(soft, dots, presence);

  vec3 dark = uBg + L * (1.0 - uBg);
  float strength = clamp(max(L.r, max(L.g, L.b)), 0.0, 1.0);
  vec3 paper = uBg * (1.0 - strength) + L * 0.96;
  vec3 col = mix(dark, paper, uPaper);
  col += (ign(frag, floor(uTime * 24.0)) - 0.5) / 255.0;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

type RGB = [number, number, number]

const colorCache = new Map<string, RGB | null>()

function parseColor(input: string | undefined): RGB | null {
    if (!input) return null
    const key = String(input)
    if (colorCache.has(key)) return colorCache.get(key) ?? null
    let s = key.trim()
    const v = s.match(/^var\(\s*--[^,]+,\s*(.+)\)$/)
    if (v) s = v[1].trim()
    let out: RGB | null = null
    if (s.charAt(0) === "#") {
        let h = s.slice(1)
        if (h.length === 3 || h.length === 4) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
        if (h.length >= 6) {
            const r = parseInt(h.slice(0, 2), 16)
            const g = parseInt(h.slice(2, 4), 16)
            const b = parseInt(h.slice(4, 6), 16)
            if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) out = [r / 255, g / 255, b / 255]
        }
    } else {
        const m = s.match(/^(rgba?|hsla?)\(([^)]*)\)/i)
        if (m) {
            const parts = m[2].split(/[\s,/]+/).filter(Boolean)
            const f = (i: number) => parseFloat(parts[i])
            if (parts.length >= 3 && [0, 1, 2].every((i) => Number.isFinite(f(i)))) {
                if (m[1].toLowerCase().startsWith("rgb")) {
                    const ch = (i: number) => (parts[i].endsWith("%") ? f(i) / 100 : f(i) / 255)
                    out = [ch(0), ch(1), ch(2)]
                } else {
                    const hh = (((f(0) % 360) + 360) % 360) / 360
                    const ss = f(1) / 100
                    const ll = f(2) / 100
                    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
                    const p = 2 * ll - q
                    const hue = (t: number) => {
                        t = t < 0 ? t + 1 : t > 1 ? t - 1 : t
                        if (t < 1 / 6) return p + (q - p) * 6 * t
                        if (t < 1 / 2) return q
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                        return p
                    }
                    out = [hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)]
                }
                out = out.map((c) => Math.min(1, Math.max(0, c))) as RGB
            }
        }
    }
    colorCache.set(key, out)
    return out
}

function color(input: string | undefined, fallback: string): RGB {
    return parseColor(input) ?? (parseColor(fallback) as RGB)
}

function num(v: unknown, fb: number): number {
    return typeof v === "number" && isFinite(v) ? v : fb
}

function clampN(v: number, lo: number, hi: number): number {
    return v < lo ? lo : v > hi ? hi : v
}

function link(gl: WebGL2RenderingContext, frag: string, label: string): WebGLProgram | null {
    const shader = (type: number, src: string) => {
        const sh = gl.createShader(type)
        if (!sh) return null
        gl.shaderSource(sh, src)
        gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error(`${NAME} ${label} shader:`, gl.getShaderInfoLog(sh))
            gl.deleteShader(sh)
            return null
        }
        return sh
    }
    const vs = shader(gl.VERTEX_SHADER, VERT_SRC)
    const fs = shader(gl.FRAGMENT_SHADER, frag)
    if (!vs || !fs) return null
    const prog = gl.createProgram()
    if (!prog) return null
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(`${NAME} ${label} link:`, gl.getProgramInfoLog(prog))
        gl.deleteProgram(prog)
        return null
    }
    return prog
}

function locations(gl: WebGL2RenderingContext, prog: WebGLProgram, names: string[]) {
    const out: Record<string, WebGLUniformLocation | null> = {}
    for (const n of names) out[n] = gl.getUniformLocation(prog, n)
    return out
}

function fieldTarget(gl: WebGL2RenderingContext) {
    const fbo = gl.createFramebuffer()
    let tex: WebGLTexture | null = null
    let w = 0
    let h = 0
    let half = !!gl.getExtension("EXT_color_buffer_float")
    return {
        fbo,
        texture: () => tex,
        width: () => w,
        height: () => h,
        resize(nw: number, nh: number) {
            if (nw === w && nh === h && tex) return
            for (let attempt = 0; attempt < 2; attempt++) {
                if (tex) gl.deleteTexture(tex)
                tex = gl.createTexture()
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
                gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, nw, nh, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null)
                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
                const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
                if (ok || !half) break
                half = false
            }
            w = nw
            h = nh
        },
        dispose() {
            if (tex) gl.deleteTexture(tex)
            gl.deleteFramebuffer(fbo)
        },
    }
}

function trackPointer(root: HTMLElement) {
    const p = { tx: 0, ty: 0, inside: false, seen: false }
    const read = (e: PointerEvent) => {
        const r = root.getBoundingClientRect()
        const sx = root.offsetWidth / (r.width || 1)
        const sy = root.offsetHeight / (r.height || 1)
        p.tx = (e.clientX - r.left) * sx
        p.ty = (e.clientY - r.top) * sy
        p.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        p.seen = true
    }
    const out = (e: PointerEvent) => {
        if (!e.relatedTarget) p.inside = false
    }
    window.addEventListener("pointermove", read, { passive: true })
    window.addEventListener("pointerdown", read, { passive: true })
    document.addEventListener("pointerout", out)
    return {
        p,
        dispose() {
            window.removeEventListener("pointermove", read)
            window.removeEventListener("pointerdown", read)
            document.removeEventListener("pointerout", out)
        },
    }
}

const DEFAULTS = {
    background: "#00000000",
    color1: "#000AFF",
    color2: "#8F91FF",
}

interface HalftoneBloomProps {
    style?: React.CSSProperties
    background?: string
    color1?: string
    color2?: string
    speed?: number
    size?: number
    angle?: number
    dotSize?: number
    hover?: number
    reach?: number
    width?: number
    height?: number
}

function __OriginkitBase_HalftoneBloom(props: HalftoneBloomProps) {
    const {
        style,
        background = DEFAULTS.background,
        color1 = DEFAULTS.color1,
        color2 = DEFAULTS.color2,
        speed = 50,
        size = 200,
        angle = 180,
        dotSize = 6,
        hover = 200,
        reach = 429,
        width,
        height,
    } = props

    const rootRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const vRef = useRef({ background, color1, color2, speed: 1, size: 1, angle: 0, dot: 6, hover: 1, reach: 200 })
    vRef.current = {
        background,
        color1,
        color2,

        speed: clampN(num(speed, 50), 0, 100) / 50,
        size: clampN(num(size, 100), 50, 200) / 100,

        angle: (clampN(num(angle, 0), -180, 180) * Math.PI) / 180,
        dot: clampN(num(dotSize, 6), 3, 24),
        hover: clampN(num(hover, 100), 0, 200) / 100,
        reach: clampN(num(reach, 200), 10, 800),
    }

    useEffect(() => {
        const canvas = canvasRef.current
        const root = rootRef.current
        if (!canvas || !root) return
        const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false })
        if (!gl) {
            console.error(`${NAME}: WebGL2 unavailable`)
            return
        }
        const field = link(gl, FIELD_SRC, "field")
        const finish = link(gl, FINISH_SRC, "finish")
        if (!field || !finish) return
        const uf = locations(gl, field, ["uRes", "uTime", "uC1", "uC2", "uSize", "uAngle"])
        const un = locations(gl, finish, ["uField", "uRes", "uTime", "uBg", "uPaper", "uMouse", "uOn", "uReach", "uCell", "uPR"])
        const vao = gl.createVertexArray()
        gl.bindVertexArray(vao)
        const target = fieldTarget(gl)
        const pointer = trackPointer(root)
        const ptr = pointer.p

        let mx = 0
        let my = 0
        let on = 0
        let raf = 0
        let last = -1
        let clock = 0

        const render = (now: number) => {
            raf = requestAnimationFrame(render)
            const dt = last < 0 ? 0 : clampN((now - last) / 1000, 0, 0.05)
            last = now
            const v = vRef.current
            clock = (clock + dt * v.speed) % 3600

            const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
            const cw = canvas.clientWidth || 1200
            const ch = canvas.clientHeight || 800
            const bw = Math.max(1, Math.round(cw * dpr))
            const bh = Math.max(1, Math.round(ch * dpr))
            if (canvas.width !== bw || canvas.height !== bh) {
                canvas.width = bw
                canvas.height = bh
            }
            target.resize(Math.max(1, Math.round(bw / 2)), Math.max(1, Math.round(bh / 2)))

            const present = ptr.inside ? 1 : 0
            if (present && on < 0.02) {
                mx = ptr.tx
                my = ptr.ty
            }
            on += (present - on) * (1 - Math.exp(-dt * 5))
            const k = 1 - Math.exp(-dt * 16)
            mx += (ptr.tx - mx) * k
            my += (ptr.ty - my) * k

            const c1 = color(v.color1, DEFAULTS.color1)
            const c2 = color(v.color2, DEFAULTS.color2)
            const bg = color(v.background, DEFAULTS.background)
            const bgLum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]

            gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
            gl.viewport(0, 0, target.width(), target.height())
            gl.useProgram(field)
            gl.uniform2f(uf.uRes, target.width(), target.height())
            gl.uniform1f(uf.uTime, clock)
            gl.uniform3f(uf.uC1, c1[0], c1[1], c1[2])
            gl.uniform3f(uf.uC2, c2[0], c2[1], c2[2])
            gl.uniform1f(uf.uSize, v.size)
            gl.uniform1f(uf.uAngle, v.angle)
            gl.drawArrays(gl.TRIANGLES, 0, 3)

            const pr = bw / cw
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, bw, bh)
            gl.useProgram(finish)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, target.texture())
            gl.uniform1i(un.uField, 0)
            gl.uniform2f(un.uRes, bw, bh)
            gl.uniform1f(un.uTime, clock)
            gl.uniform3f(un.uBg, bg[0], bg[1], bg[2])
            gl.uniform1f(un.uPaper, clampN((bgLum - 0.35) / 0.3, 0, 1))
            gl.uniform2f(un.uMouse, mx * pr, (ch - my) * pr)
            gl.uniform1f(un.uOn, on * v.hover)
            gl.uniform1f(un.uReach, v.reach * pr)
            gl.uniform1f(un.uCell, v.dot * pr)
            gl.uniform1f(un.uPR, pr)
            gl.drawArrays(gl.TRIANGLES, 0, 3)
        }

        raf = requestAnimationFrame(render)
        return () => {
            cancelAnimationFrame(raf)
            pointer.dispose()
            target.dispose()
            gl.deleteVertexArray(vao)
            gl.deleteProgram(field)
            gl.deleteProgram(finish)
        }
    }, [])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                minWidth: 1200,
                minHeight: 800,
                width: typeof width === "number" && width > 0 ? width : "100%",
                height: typeof height === "number" && height > 0 ? height : "100%",
                ...style,
            }}
        >
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        </div>
    )
}

const __originkitPresetProps = {
    "background": "transparent",
    "color1": "#000AFF",
    "color2": "#8F91FF",
    "speed": 45,
    "angle": 0,
    "dotSize": 3,
    "reach": 397
};

export default function HalftoneBloom(props: Record<string, unknown>) {
    return <__OriginkitBase_HalftoneBloom {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}