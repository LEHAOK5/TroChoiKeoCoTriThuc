export const API_URL =
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:4000'
    : (import.meta.env.VITE_API_URL || 'http://localhost:4000');

export const BOOTH_LABEL = import.meta.env.VITE_BOOTH_LABEL || 'Trạm 1: Thử Thách Trí Tuệ';
