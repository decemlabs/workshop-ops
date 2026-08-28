import type { ReactNode } from 'react'

import { ValsContext } from './context'
import { useAppModel } from './useAppModel'
import { useVals } from './useVals'

export function AppModelProvider({ children }: { children: ReactNode }) {
  const model = useAppModel()
  const vals = useVals(model)

  return <ValsContext.Provider value={vals}>{children}</ValsContext.Provider>
}
