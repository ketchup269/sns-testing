import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// ─── Environment variables ─────────────────────────────────────────────────
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.FACEBOOK_APP_ID = 'test-fb-app-id'
process.env.FACEBOOK_APP_SECRET = 'test-fb-app-secret'
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// ─── Web API polyfills (needed for next/server in jsdom) ──────────────────
// jsdom does not ship with the Fetch Web API. We add a minimal implementation
// that satisfies what next/server and our test code expects.

class MockHeaders extends Map<string, string> {
  constructor(init?: Record<string, string> | [string, string][]) {
    super()
    if (init) {
      const entries = Array.isArray(init) ? init : Object.entries(init)
      entries.forEach(([k, v]) => this.set(k.toLowerCase(), v))
    }
  }
  // @ts-expect-error - Map.get returns undefined, but Headers.get expects string | null
  get(name: string): string | null { return super.get(name.toLowerCase()) ?? null }
  set(name: string, value: string) { return super.set(name.toLowerCase(), value) }
  has(name: string) { return super.has(name.toLowerCase()) }
  append(name: string, value: string) { return super.set(name.toLowerCase(), value) }
}

class MockRequest {
  readonly url: string
  readonly method: string
  readonly headers: MockHeaders
  private _body: string | null

  constructor(url: string, init?: RequestInit) {
    this.url = url
    this.method = (init?.method ?? 'GET').toUpperCase()
    this.headers = new MockHeaders(init?.headers as Record<string, string>)
    this._body = (init?.body as string) ?? null
  }

  async json() {
    return JSON.parse(this._body ?? '{}')
  }

  async text() {
    return this._body ?? ''
  }
}

class MockResponse {
  readonly status: number
  readonly headers: MockHeaders
  private _body: string

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.status = init?.status ?? 200
    this.headers = new MockHeaders(init?.headers as Record<string, string>)
    this._body = typeof body === 'string' ? body : ''
  }

  async json() {
    return JSON.parse(this._body)
  }

  async text() {
    return this._body
  }

  get ok() {
    return this.status >= 200 && this.status < 300
  }
}

// Attach to global so both test code and next/server can reference them
;(global as any).Request = MockRequest
;(global as any).Response = MockResponse
;(global as any).Headers = MockHeaders
;(global as any).fetch = jest.fn()

// ─── Mock next/server ─────────────────────────────────────────────────────
// next/server imports the Web API Request at module initialization time.
// We intercept the module and supply our own NextResponse implementation.
jest.mock('next/server', () => {
  function MockNextResponse(this: any, body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body
    this.init = init
    this.status = init?.status ?? 200
  }
  MockNextResponse.json = (data: unknown, init?: { status?: number; headers?: Record<string, string> }) => {
    const status = init?.status ?? 200
    return {
      status,
      headers: new Map(Object.entries(init?.headers ?? {})),
      json: async () => data,
      ok: status >= 200 && status < 300,
    }
  }
  MockNextResponse.redirect = (url: string, status = 302) => {
    return {
      status,
      headers: new Map([['Location', url]]),
      json: async () => null,
    }
  }
  MockNextResponse.next = () => {
    return { status: 200, json: async () => null }
  }

  return {
    NextResponse: MockNextResponse,
  }
})

// ─── Mock next/navigation ─────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
}))

// ─── Mock next-auth/react ─────────────────────────────────────────────────
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
  signIn: jest.fn(),
  useSession: jest.fn(() => ({
    data: { user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: { children: unknown }) => children,
}))

// ─── Mock @/auth ──────────────────────────────────────────────────────────
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  handlers: { GET: jest.fn(), POST: jest.fn() },
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
