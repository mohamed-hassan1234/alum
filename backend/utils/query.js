function parseArrayParam(value) {
  if (!value) return [];

  const parts = Array.isArray(value) ? value : [value];
  return parts
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseIntParam(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseBooleanParam(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'y'].includes(v)) return true;
  if (['false', '0', 'no', 'n'].includes(v)) return false;
  return fallback;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  escapeRegex,
  parseArrayParam,
  parseBooleanParam,
  parseIntParam,
};

