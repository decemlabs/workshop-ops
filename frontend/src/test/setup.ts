import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// С globals: false авто-очистки у Testing Library нет — снимаем разметку сами.
afterEach(cleanup)
