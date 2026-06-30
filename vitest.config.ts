import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'lib/utils.ts',
        'lib/validar-comprovante.ts',
        'app/api/encomendas/route.ts',
        'app/api/pagamentos/**/*.ts',
        'app/api/produtos/**/*.ts',
      ],
      reporter: ['text', 'json', 'html'],
      thresholds: { branches: 65, functions: 80, lines: 80, statements: 80 },
    },
  },
  resolve: {
    alias: { '@': path.resolve('.') },
  },
})
