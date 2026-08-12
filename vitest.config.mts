import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
 
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // e2e/ holds Playwright specs (npm run test:e2e) — its *.spec.ts files
    // would otherwise match vitest's default include glob too.
    exclude: ['**/node_modules/**', '**/.git/**', '**/e2e/**'],
  },
})