import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      token: null,
      
      // UI state
      sidebarOpen: true,
      selectedRoute: null,
      selectedStation: null,
      
      // Map state
      mapCenter: [4.7110, -74.0721], // Bogotá coordinates
      mapZoom: 13,
      
      // Actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      setSelectedStation: (station) => set({ selectedStation: station }),
      
      setMapCenter: (center) => set({ mapCenter: center }),
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      
      // Computed
      isAuthenticated: () => {
        const { token } = get()
        return !!token
      },
      
      // Reset state
      reset: () => set({
        user: null,
        token: null,
        sidebarOpen: true,
        selectedRoute: null,
        selectedStation: null,
        mapCenter: [4.7110, -74.0721],
        mapZoom: 13,
      }),
    }),
    {
      name: 'uta-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        sidebarOpen: state.sidebarOpen,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
      }),
    }
  )
)

export { useAppStore }
