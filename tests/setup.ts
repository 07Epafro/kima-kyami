import { beforeAll, afterAll, afterEach } from 'vitest'

process.env.IBAN_LOJA = 'AO06000000000012345678901'
process.env.ADMIN_EMAIL = 'admin@kimakyami.com'
process.env.RESEND_API_KEY = 're_test_key'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-vitest'
process.env.NEXT_PUBLIC_URL = 'https://kimakyami.com'

// MSW server is set up per test file that needs it
export {}
