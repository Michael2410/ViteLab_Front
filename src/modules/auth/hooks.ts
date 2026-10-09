import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, TenantSummary } from './types';

interface AuthState {
  user: User | null;
  activeTenant: TenantSummary | null;
  availableTenants: TenantSummary[];
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string, activeTenant?: TenantSummary) => void;
  setActiveTenant: (tenant: TenantSummary) => void;
  setAvailableTenants: (tenants: TenantSummary[]) => void;
  clearAuth: () => void;
  updateUser: (user: User) => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeTenant: null,
      availableTenants: [],
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken, activeTenant) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const resolvedTenant = activeTenant || user.activeTenant || null;
        set({
          user,
          accessToken,
          refreshToken,
          activeTenant: resolvedTenant,
          isAuthenticated: true,
        });
      },

      setActiveTenant: (tenant) => {
        set({ activeTenant: tenant });
      },

      setAvailableTenants: (tenants) => {
        set({ availableTenants: tenants });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          activeTenant: null,
          availableTenants: [],
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (user) => {
        set((state) => ({
          user,
          activeTenant: user.activeTenant || state.activeTenant,
        }));
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permisos?.includes(permission) ?? false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        activeTenant: state.activeTenant,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
