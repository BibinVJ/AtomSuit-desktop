import '@testing-library/jest-dom/vitest';

// The renderer reads the API base URL from a define()-injected process.env value; give tests a
// deterministic one so nothing depends on a developer's local .env.
process.env.API_BASE_URL ??= 'http://localhost:3000/api';
