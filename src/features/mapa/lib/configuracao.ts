export const API_FAMILIAS = import.meta.env.VITE_FAMILIAS_API_URL?.trim() || '';
export const API_MAPA = import.meta.env.VITE_RF03_API_URL?.trim() || '';
export const DEMONSTRACAO = !API_FAMILIAS && !API_MAPA;
export const BASE_MAPA = import.meta.env.BASE_URL.replace(/\/$/, '');
