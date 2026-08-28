/**
 * Хелперы инлайновых стилей дизайна.
 *
 * cssToObj, kebabToCamel, importantify, stripComments и scanUnquotedUrl перенесены
 * дословно из рантайма Claude Design — тем же кодом он разбирает атрибуты
 * style="…" в самом прототипе. Свой парсер писать нельзя: любое отличие
 * в разборе даст расхождение с эталоном.
 */

import type { CSSProperties } from 'react'

function kebabToCamel(s: string): string {
  return s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

/** Пропускает url(...) без кавычек, чтобы ; и /* внутри не ломали разбор. */
function scanUnquotedUrl(css: string, i: number): number {
  if (
    (css[i] !== 'u' && css[i] !== 'U') ||
    css.slice(i, i + 4).toLowerCase() !== 'url(' ||
    /[a-z0-9_-]/i.test(css[i - 1] ?? '')
  ) {
    return -1
  }
  let j = i + 4
  while (j < css.length && /\s/.test(css[j])) j++
  if (css[j] === '"' || css[j] === "'") return -1
  while (j < css.length && css[j] !== ')') {
    if (css[j] === '\\') j++
    j++
  }
  return j < css.length ? j + 1 : css.length
}

function stripComments(css: string): string {
  let out = ''
  let quote = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (quote) {
      if (c === '\\') {
        out += c + (css[i + 1] ?? '')
        i++
        continue
      }
      if (c === quote) quote = ''
      out += c
    } else if (c === "'" || c === '"') {
      quote = c
      out += c
    } else if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 1
      out += ' '
    } else {
      const end = scanUnquotedUrl(css, i)
      if (end === -1) out += c
      else {
        out += css.slice(i, end)
        i = end - 1
      }
    }
  }
  return out
}

/** Добавляет !important каждому объявлению: правило класса иначе не перебьёт инлайновый стиль. */
function importantify(css: string): string {
  css = stripComments(css)
  const decls: string[] = []
  let start = 0
  let depth = 0
  let quote = ''
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = ''
    } else if (c === "'" || c === '"') quote = c
    else if (c === '(') depth++
    else if (c === ')') depth = Math.max(0, depth - 1)
    else if (c === ';' && depth === 0) {
      decls.push(css.slice(start, i))
      start = i + 1
    } else {
      const end = scanUnquotedUrl(css, i)
      if (end !== -1) i = end - 1
    }
  }
  decls.push(css.slice(start))
  return decls
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => (/!\s*important$/i.test(d) ? d : d + ' !important'))
    .join(';')
}

function cssToObj(css: string): CSSProperties {
  const o: Record<string, string> = {}
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':')
    if (i < 0) continue
    const prop = decl.slice(0, i).trim()
    o[prop.startsWith('--') ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim()
  }
  return o as CSSProperties
}

const styleCache = new Map<string, CSSProperties>()

/** Инлайновый стиль строкой — ровно так, как он записан в прототипе. */
export function s(css: string): CSSProperties {
  const hit = styleCache.get(css)
  if (hit) return hit

  const obj = cssToObj(css)
  styleCache.set(css, obj)
  return obj
}

/**
 * Псевдоклассы (style-hover, style-active) — как createPseudoSheet в рантайме:
 * один <style> в head, свой класс scp<N> на каждое уникальное правило.
 */
const pseudoCache = new Map<string, string>()
let sheetEl: HTMLStyleElement | null = null
let pseudoSeq = 0

function pseudoClass(pseudo: string, css: string): string {
  const key = pseudo + '|' + css
  const hit = pseudoCache.get(key)
  if (hit) return hit

  if (!sheetEl) {
    sheetEl = document.createElement('style')
    document.head.appendChild(sheetEl)
  }

  const cls = 'scp' + (pseudoSeq++).toString(36)
  sheetEl.sheet!.insertRule(
    '.' + cls + ':' + pseudo + '{' + importantify(css) + '}',
    sheetEl.sheet!.cssRules.length,
  )
  pseudoCache.set(key, cls)
  return cls
}

interface Pseudo {
  hover?: string
  active?: string
}

/** Стиль вместе с style-hover / style-active: {...dc('…', { hover: '…' })}. */
export function dc(css: string, pseudo: Pseudo): { style: CSSProperties; className: string } {
  const classes: string[] = []
  if (pseudo.hover) classes.push(pseudoClass('hover', pseudo.hover))
  if (pseudo.active) classes.push(pseudoClass('active', pseudo.active))

  return { style: s(css), className: classes.join(' ') }
}
