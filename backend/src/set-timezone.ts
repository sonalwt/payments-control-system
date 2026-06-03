// Imported first (before any other module) so the process clock is pinned to
// Dubai time for all server-side local-time operations and logs. Stored
// instants remain UTC (timestamptz); this only affects local rendering.
process.env.TZ = process.env.TZ ?? 'Asia/Dubai';
