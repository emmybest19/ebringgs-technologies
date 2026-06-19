// Default export keeps backwards-compat for existing `import api from '@ebringgs/api'` callsites.
// Also re-export as a named member so callers can do `import { api } from '@ebringgs/api'`.
export { default, default as api } from './api';
export { queryClient } from './queryClient';
