import { createContext, useContext } from 'react'

import type { Vals } from './useVals'

export const ValsContext = createContext<Vals | null>(null)

/** Значения разметки — аналог vals в шаблоне прототипа. */
export function useV(): Vals {
  const vals = useContext(ValsContext)
  if (!vals) throw new Error('useV вызван вне AppModelProvider')
  return vals
}
