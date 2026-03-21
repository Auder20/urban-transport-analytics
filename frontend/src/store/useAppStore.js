import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      token: null,
      refreshToken: null,
      
      // UI state
      theme: 'light',
      language: 'en',
      timezone: 'America/Bogota',
      autoRefresh: true,
      sidebarOpen: true,
      selectedRoute: null,
      selectedStation: null,
      filterStatus: 'all',
      filterOccupancy: 'all',
      
      // Map state
      mapCenter: [4.7110, -74.0721], // Bogotá coordinates
      mapZoom: 13,
      
      // Actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
      
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      setSelectedStation: (station) => set({ selectedStation: station }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setFilterOccupancy: (occupancy) => set({ filterOccupancy: occupancy }),
      
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
        refreshToken: state.refreshToken,
        theme: state.theme,
        language: state.language,
        timezone: state.timezone,
        autoRefresh: state.autoRefresh,
        sidebarOpen: state.sidebarOpen,
        selectedRoute: state.selectedRoute,
        selectedStation: state.selectedStation,
        filterStatus: state.filterStatus,
        filterOccupancy: state.filterOccupancy,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
      }),
    }
  )
)

export { useAppStore }
