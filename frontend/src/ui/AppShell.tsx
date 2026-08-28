import { s } from '@/design/style'
import { useV } from '@/model/context'

import { ErrorBanner } from './Banners'
import { ConfirmModal } from './ConfirmModal'
import { FormModal } from './FormModal'
import { LoadingOverlay } from './LoadingOverlay'
import { LoginOverlay } from './LoginOverlay'
import { ShopsView } from './ShopsView'
import { ShopView } from './ShopView'
import { Sidebar } from './Sidebar'
import { TasksView } from './TasksView'
import { TopBar } from './TopBar'
import { UndoToast } from './UndoToast'
import { WorkerView } from './WorkerView'
import { WorkersView } from './WorkersView'

/** Корневой контейнер: тема, touch-режим и порядок блоков интерфейса. */
export function AppShell() {
  const v = useV()

  return (
    <div data-theme={v.theme} data-touch={v.touch} style={s('background:var(--bg);color:var(--ink);min-width:760px;min-height:100vh;position:relative')}>
      <LoginOverlay />

      <TopBar />

      <div style={s('display:grid;grid-template-columns:210px 1fr;min-height:calc(100vh - 44px)')}>
        <Sidebar />

        <div style={s('padding:0 0 40px;position:relative')}>
          <ErrorBanner />
          <LoadingOverlay />

          <ShopsView />
          <ShopView />
          <WorkerView />
          <WorkersView />
          <TasksView />
        </div>
      </div>

      <UndoToast />
      <FormModal />
      <ConfirmModal />
    </div>
  )
}
