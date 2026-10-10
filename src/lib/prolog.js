// A small but real Prolog interpreter: facts, rules, unification, backtracking, lists,
// arithmetic (is, comparisons), negation as failure (\+), if-then-else, findall/3, between/3, write/nl.
// Not supported: cut (!), assert/retract, strings, modules, exceptions. It is NOT SWI-Prolog.
const END = { k: 'end' }

// ---------- terms ----------
const atom = (n) => ({ k: 'a', n })
const num = (v) => ({ k: 'n', v })
const cmp = (f, a) => ({ k: 'c', f, a })
const NIL = atom('[]')
const mkList = (items, tail = NIL) => items.reduceRight((t, x) => cmp('.', [x, t]), tail)

// ---------- tokenizer ----------
function tokenize(src) {
  const toks = []
  let i = 0
  const n = src.length
  const sym = '+-*/\\^<>=~:.?@#&$'
  while (i < n) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    if (c === '%') { while (i < n && src[i] !== '\n') i++; continue }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue }
    if (/[0-9]/.test(c)) {
      let j = i
      while (j < n && /[0-9]/.test(src[j])) j++
      if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { j++; while (j < n && /[0-9]/.test(src[j])) j++ }
      toks.push({ k: 'num', v: Number(src.slice(i, j)) }); i = j; continue
    }
    if (/[a-z]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; toks.push({ k: 'atom', v: src.slice(i, j) }); i = j; continue }
    if (/[A-Z_]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++; toks.push({ k: 'var', v: src.slice(i, j) }); i = j; continue }
    if (c === "'") {
      let j = i + 1, s = ''
      while (j < n && !(src[j] === "'" && src[j + 1] !== "'")) { if (src[j] === "'" && src[j + 1] === "'") { s += "'"; j += 2 } else s += src[j++] }
      toks.push({ k: 'qatom', v: s }); i = j + 1; continue
    }
    if ('()[]|,!;'.includes(c)) { toks.push({ k: 'p', v: c, sp: i > 0 && /\s/.test(src[i - 1]) }); i++; continue }
    if (sym.includes(c)) {
      let j = i
      while (j < n && sym.includes(src[j])) j++
      const s = src.slice(i, j)
      if (s === '.' && (j >= n || /[\s%]/.test(src[j]))) toks.push({ k: 'end' })
      else if (s.endsWith('.') && s.length > 1 && (j >= n || /[\s%]/.test(src[j]))) { toks.push({ k: 'sym', v: s.slice(0, -1) }); toks.push({ k: 'end' }) }
      else toks.push({ k: 'sym', v: s })
      i = j; continue
    }
    throw new Error(`Unexpected character '${c}'`)
  }
  return toks
}

// ---------- parser ----------
const INFIX = { ':-': [1200, 'xfx'], ';': [1100, 'xfy'], '->': [1050, 'xfy'], ',': [1000, 'xfy'], '=': [700, 'xfx'], '\\=': [700, 'xfx'], '==': [700, 'xfx'], '\\==': [700, 'xfx'], '<': [700, 'xfx'], '>': [700, 'xfx'], '=<': [700, 'xfx'], '>=': [700, 'xfx'], '=:=': [700, 'xfx'], '=\\=': [700, 'xfx'], is: [700, 'xfx'], '+': [500, 'yfx'], '-': [500, 'yfx'], '*': [400, 'yfx'], '/': [400, 'yfx'], '//': [400, 'yfx'], mod: [400, 'yfx'] }
const PREFIX = { '\\+': [900, 'fy'], '-': [200, 'fy'] }

function parseClauses(src) {
  const toks = tokenize(src)
  let p = 0
  const peek = () => toks[p] || END
  const next = () => toks[p++] || END
  const opName = (t) => (t.k === 'sym' || t.k === 'atom' ? t.v : t.k === 'p' && (t.v === ',' || t.v === ';') ? t.v : null)
  const clauses = []
  let vars

  function expr(max) {
    let { term, prec } = primary(max)
    for (;;) {
      const t = peek()
      const name = opName(t)
      const op = name && INFIX[name]
      if (!op || op[0] > max) break
      const leftMax = op[1] === 'yfx' ? op[0] : op[0] - 1
      if (prec > leftMax) break
      next()
      const right = expr(op[1] === 'xfy' ? op[0] : op[0] - 1).term
      term = cmp(name, [term, right])
      prec = op[0]
    }
    return { term, prec }
  }
  function args() {
    const out = []
    for (;;) {
      out.push(expr(999).term)
      const t = next()
      if (t.k === 'p' && t.v === ',') continue
      if (t.k === 'p' && t.v === ')') return out
      throw new Error('Expected , or ) in arguments')
    }
  }
  function primary(max) {
    const t = next()
    if (t.k === 'num') return { term: num(t.v), prec: 0 }
    if (t.k === 'var') {
      if (t.v === '_') return { term: { k: 'v', n: '_', id: 'anon' + p }, prec: 0 }
      if (!vars[t.v]) vars[t.v] = { k: 'v', n: t.v, id: t.v }
      return { term: vars[t.v], prec: 0 }
    }
    if (t.k === 'p' && t.v === '!') return { term: atom('!'), prec: 0 }
    if (t.k === 'p' && t.v === '(') {
      const e = expr(1200).term
      const c = next()
      if (!(c.k === 'p' && c.v === ')')) throw new Error('Expected )')
      return { term: e, prec: 0 }
    }
    if (t.k === 'p' && t.v === '[') {
      if (peek().k === 'p' && peek().v === ']') { next(); return { term: NIL, prec: 0 } }
      const items = []
      let tail = NIL
      for (;;) {
        items.push(expr(999).term)
        const s = next()
        if (s.k === 'p' && s.v === ',') continue
        if (s.k === 'p' && s.v === '|') { tail = expr(999).term; const e = next(); if (!(e.k === 'p' && e.v === ']')) throw new Error('Expected ]'); break }
        if (s.k === 'p' && s.v === ']') break
        throw new Error('Expected , | or ] in list')
      }
      return { term: mkList(items, tail), prec: 0 }
    }
    if (t.k === 'atom' || t.k === 'qatom' || t.k === 'sym') {
      const name = t.v
      if (peek().k === 'p' && peek().v === '(' && !peek().sp) {
        next()
        return { term: cmp(name, args()), prec: 0 }
      }
      if (t.k !== 'qatom') {
        if (name === '-' && peek().k === 'num') return { term: num(-next().v), prec: 0 }
        const pre = PREFIX[name]
        if (pre && pre[0] <= max) {
          const nt = peek()
          const startsTerm = nt.k !== 'end' && !(nt.k === 'p' && ')]|,;'.includes(nt.v)) && !(opName(nt) && INFIX[opName(nt)] && !PREFIX[opName(nt)])
          if (startsTerm) {
            const operand = expr(pre[1] === 'fy' ? pre[0] : pre[0] - 1).term
            return { term: cmp(name, [operand]), prec: pre[0] }
          }
        }
      }
      return { term: atom(name), prec: 0 }
    }
    throw new Error('Unexpected token in term')
  }

  while (peek().k !== 'end' || p < toks.length) {
    if (p >= toks.length) break
    vars = {}
    const t = expr(1200).term
    const e = next()
    if (e.k !== 'end') throw new Error('Expected "." at end of clause')
    clauses.push(t)
  }
  return clauses
}

// ---------- unification ----------
const isVar = (t) => t.k === 'v'
function walk(t, s) {
  while (isVar(t) && s.has(t.id)) t = s.get(t.id)
  return t
}
function resolve(t, s) {
  t = walk(t, s)
  return t.k === 'c' ? cmp(t.f, t.a.map((x) => resolve(x, s))) : t
}
function unify(a, b, s) {
  a = walk(a, s)
  b = walk(b, s)
  if (isVar(a)) { if (isVar(b) && a.id === b.id) return s; const m = new Map(s); m.set(a.id, b); return m }
  if (isVar(b)) { const m = new Map(s); m.set(b.id, a); return m }
  if (a.k !== b.k) return null
  if (a.k === 'a') return a.n === b.n ? s : null
  if (a.k === 'n') return a.v === b.v ? s : null
  if (a.f !== b.f || a.a.length !== b.a.length) return null
  for (let i = 0; i < a.a.length; i++) { s = unify(a.a[i], b.a[i], s); if (!s) return null }
  return s
}
const same = (a, b, s) => {
  a = walk(a, s); b = walk(b, s)
  if (a.k !== b.k) return false
  if (a.k === 'v') return a.id === b.id
  if (a.k === 'a') return a.n === b.n
  if (a.k === 'n') return a.v === b.v
  return a.f === b.f && a.a.length === b.a.length && a.a.every((x, i) => same(x, b.a[i], s))
}

// ---------- printing ----------
const BINOPS = new Set(['+', '-', '*', '/', '//', 'mod', 'is', '=', '<', '>', '=<', '>=', '=:=', '=\\='])
export function show(t) {
  if (t.k === 'n') return String(Number.isInteger(t.v) ? t.v : +t.v.toFixed(4))
  if (t.k === 'a') return t.n
  if (t.k === 'v') return '_' + (t.n === '_' ? 'G' : t.n)
  if (t.f === '.') {
    const items = []
    let x = t
    while (x.k === 'c' && x.f === '.') { items.push(show(x.a[0])); x = x.a[1] }
    return '[' + items.join(', ') + (x.k === 'a' && x.n === '[]' ? '' : ' | ' + show(x)) + ']'
  }
  if (t.a.length === 2 && BINOPS.has(t.f)) return `${show(t.a[0])} ${t.f} ${show(t.a[1])}`
  return `${t.f}(${t.a.map(show).join(', ')})`
}

// ---------- engine ----------
const LIMIT = 60000
const PRELUDE = `
member(X, [X|_]).
member(X, [_|T]) :- member(X, T).
append([], L, L).
append([H|T], L, [H|R]) :- append(T, L, R).
length([], 0).
length([_|T], N) :- length(T, M), N is M + 1.
reverse(L, R) :- rev_(L, [], R).
rev_([], A, A).
rev_([H|T], A, R) :- rev_(T, [H|A], R).
last([X], X).
last([_|T], X) :- last(T, X).
min_list([X], X).
min_list([H|T], M) :- min_list(T, M0), M is min(H, M0).
max_list([X], X).
max_list([H|T], M) :- max_list(T, M0), M is max(H, M0).
sum_list([], 0).
sum_list([H|T], S) :- sum_list(T, R), S is R + H.
forall(C, A) :- \\+ (C, \\+ A).
`

let renameId = 0
function rename(t, map) {
  if (t.k === 'v') {
    if (!map.has(t.id)) map.set(t.id, { k: 'v', n: t.n, id: `${t.id}#${++renameId}` })
    return map.get(t.id)
  }
  return t.k === 'c' ? cmp(t.f, t.a.map((x) => rename(x, map))) : t
}

function evalArith(t, s) {
  t = walk(t, s)
  if (t.k === 'n') return t.v
  if (t.k === 'v') throw new Error('Arguments are not sufficiently instantiated')
  if (t.k === 'a') throw new Error(`Type error: ${t.n} is not a number`)
  const [x, y] = t.a.map((z) => evalArith(z, s))
  switch (t.f) {
    case '+': return t.a.length === 1 ? x : x + y
    case '-': return t.a.length === 1 ? -x : x - y
    case '*': return x * y
    case '/': return x / y
    case '//': return Math.trunc(x / y)
    case 'mod': return ((x % y) + y) % y
    case 'min': return Math.min(x, y)
    case 'max': return Math.max(x, y)
    case 'abs': return Math.abs(x)
    default: throw new Error(`Unknown arithmetic function ${t.f}/${t.a.length}`)
  }
}

export class Prolog {
  constructor() {
    this.db = {}
    this.consult(PRELUDE)
    this.user = new Set()
  }
  consult(src) {
    for (const c of parseClauses(src)) {
      const head = c.k === 'c' && c.f === ':-' && c.a.length === 2 ? c.a[0] : c
      const body = c.k === 'c' && c.f === ':-' && c.a.length === 2 ? c.a[1] : atom('true')
      const key = head.k === 'a' ? `${head.n}/0` : `${head.f}/${head.a.length}`
      ;(this.db[key] ||= []).push({ head, body })
    }
  }
  *run(goals, s, depth, ctx) {
    if (++ctx.steps > LIMIT) throw new Error('Inference limit exceeded (possible infinite recursion)')
    if (depth > 3000) throw new Error('Recursion too deep')
    if (!goals.length) { yield s; return }
    const [g0, ...rest] = goals
    const g = walk(g0, s)
    if (g.k === 'v') throw new Error('Arguments are not sufficiently instantiated')
    if (g.k === 'n') throw new Error('Type error: callable expected')
    const name = g.k === 'a' ? g.n : g.f
    const ar = g.k === 'a' ? 0 : g.a.length
    const A = g.k === 'c' ? g.a : []
    switch (`${name}/${ar}`) {
      case 'true/0': yield* this.run(rest, s, depth, ctx); return
      case 'fail/0': case 'false/0': return
      case '!/0': throw new Error('Cut (!) is not supported by this interpreter')
      case ',/2': yield* this.run([A[0], A[1], ...rest], s, depth, ctx); return
      case ';/2': {
        const l = walk(A[0], s)
        if (l.k === 'c' && l.f === '->' && l.a.length === 2) {
          let hit = false
          for (const s1 of this.run([l.a[0]], s, depth + 1, ctx)) { hit = true; yield* this.run([l.a[1], ...rest], s1, depth + 1, ctx); break }
          if (!hit) yield* this.run([A[1], ...rest], s, depth + 1, ctx)
        } else {
          yield* this.run([A[0], ...rest], s, depth + 1, ctx)
          yield* this.run([A[1], ...rest], s, depth + 1, ctx)
        }
        return
      }
      case '->/2': {
        for (const s1 of this.run([A[0]], s, depth + 1, ctx)) { yield* this.run([A[1], ...rest], s1, depth + 1, ctx); break }
        return
      }
      case '\\+/1': {
        let any = false
        for (const _ of this.run([A[0]], s, depth + 1, ctx)) { any = true; break } // eslint-disable-line no-unused-vars
        if (!any) yield* this.run(rest, s, depth, ctx)
        return
      }
      case '=/2': { const s1 = unify(A[0], A[1], s); if (s1) yield* this.run(rest, s1, depth, ctx); return }
      case '\\=/2': { if (!unify(A[0], A[1], s)) yield* this.run(rest, s, depth, ctx); return }
      case '==/2': if (same(A[0], A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '\\==/2': if (!same(A[0], A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case 'is/2': { const s1 = unify(A[0], num(evalArith(A[1], s)), s); if (s1) yield* this.run(rest, s1, depth, ctx); return }
      case '</2': if (evalArith(A[0], s) < evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '>/2': if (evalArith(A[0], s) > evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '=</2': if (evalArith(A[0], s) <= evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '>=/2': if (evalArith(A[0], s) >= evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '=:=/2': if (evalArith(A[0], s) === evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case '=\\=/2': if (evalArith(A[0], s) !== evalArith(A[1], s)) yield* this.run(rest, s, depth, ctx); return
      case 'write/1': ctx.out.push(show(resolve(A[0], s))); yield* this.run(rest, s, depth, ctx); return
      case 'nl/0': ctx.out.push('\n'); yield* this.run(rest, s, depth, ctx); return
      case 'between/3': {
        const lo = evalArith(A[0], s)
        const hi = evalArith(A[1], s)
        const x = walk(A[2], s)
        if (x.k === 'n') { if (x.v >= lo && x.v <= hi) yield* this.run(rest, s, depth, ctx); return }
        for (let i = lo; i <= hi; i++) yield* this.run(rest, unify(A[2], num(i), s), depth, ctx)
        return
      }
      case 'findall/3': {
        const found = []
        for (const s1 of this.run([A[1]], s, depth + 1, ctx)) found.push(resolve(A[0], s1))
        const s2 = unify(A[2], mkList(found), s)
        if (s2) yield* this.run(rest, s2, depth, ctx)
        return
      }
      default: {
        const clauses = this.db[`${name}/${ar}`]
        if (!clauses) throw new Error(`Unknown procedure ${name}/${ar}`)
        for (const c of clauses) {
          const map = new Map()
          const h = rename(c.head, map)
          const s1 = unify(g, h, s)
          if (!s1) continue
          yield* this.run([rename(c.body, map), ...rest], s1, depth + 1, ctx)
        }
      }
    }
  }

  // Run a query such as "path(entrance, clothing, P)." and return up to `max` solutions.
  query(text, max = 10) {
    const ctx = { steps: 0, out: [] }
    try {
      const src = text.trim().endsWith('.') ? text.trim() : text.trim() + '.'
      const [goal] = parseClauses(src)
      const names = []
      const seen = new Set()
      const collect = (t) => { if (t.k === 'v') { if (!seen.has(t.id) && !t.id.startsWith('anon') && t.n !== '_') { seen.add(t.id); names.push(t) } } else if (t.k === 'c') t.a.forEach(collect) }
      collect(goal)
      const solutions = []
      for (const s of this.run([goal], new Map(), 0, ctx)) {
        solutions.push(Object.fromEntries(names.map((v) => [v.n, show(resolve(v, s))])))
        if (solutions.length >= max) break
      }
      return { ok: true, vars: names.map((v) => v.n), solutions, output: ctx.out.join(''), steps: ctx.steps, truncated: solutions.length >= max }
    } catch (e) {
      return { ok: false, error: e.message, vars: [], solutions: [], output: ctx.out.join(''), steps: ctx.steps }
    }
  }
}

export function loadProgram(src) {
  const p = new Prolog()
  p.consult(src)
  return p
}
