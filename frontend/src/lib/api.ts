/**
 * Re-export everything from the shared @finexa/api package.
 * This keeps all existing imports (e.g. `import { AuthAPI } from '@/lib/api'`) working
 * while the actual implementation lives in packages/api/src/index.ts.
 */
export * from '@finexa/api';
