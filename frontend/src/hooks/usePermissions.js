import { useAppStore } from '@/store/useAppStore'

export function usePermissions() {
  const { user } = useAppStore()
  const role = user?.role || 'viewer'
  
  return {
    isAdmin: role === 'admin',
    isOperator: role === 'admin' || role === 'operator',
    isAnalyst: role === 'admin' || role === 'analyst',
    canEdit: ['admin', 'operator'].includes(role),
    canViewAnalytics: ['admin', 'analyst', 'operator'].includes(role),
    canManageUsers: role === 'admin',
    role
  }
}
