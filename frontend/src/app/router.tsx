import { createBrowserRouter, Navigate } from 'react-router'

import { Layout } from '@/components/Layout'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { TasksPage } from '@/pages/TasksPage'
import { WorkersPage } from '@/pages/WorkersPage'
import { WorkshopsPage } from '@/pages/WorkshopsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: 'workshops', Component: WorkshopsPage },
      { path: 'workers', Component: WorkersPage },
      { path: 'tasks', Component: TasksPage },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
