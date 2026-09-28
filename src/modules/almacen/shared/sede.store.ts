import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AlmacenSedeState {
  sedeId: number | null;
  setSedeId: (id: number | null) => void;
}

export const useAlmacenSedeStore = create<AlmacenSedeState>()(
  persist(
    (set) => ({
      sedeId: null,
      setSedeId: (id) => set({ sedeId: id }),
    }),
    {
      name: 'vitelab-almacen-sede',
    }
  )
);
