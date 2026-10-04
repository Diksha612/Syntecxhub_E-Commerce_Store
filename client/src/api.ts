import axios from 'axios'; import { create } from 'zustand';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use(c => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
type S = { user: any; set: (u: any, t?: string) => void; dark: boolean; toggle: () => void };
export const useStore = create<S>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  set: (u, t) => { if (u) { localStorage.setItem('user', JSON.stringify(u)); t && localStorage.setItem('token', t); } else { localStorage.clear(); } set({ user: u }); },
  dark: false, toggle: () => { const d = !get().dark; document.documentElement.classList.toggle('dark', d); set({ dark: d }); },
}));
export const err = (e: any) => e?.response?.data?.message || 'Something went wrong';
