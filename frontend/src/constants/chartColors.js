// Paleta unificada para todos los gráficos de la aplicación.
// Usar siempre estas constantes en lugar de hex hardcodeados.
export const CHART_COLORS = {
  primary:   '#2563eb',  // primary-600
  success:   '#16a34a',  // success-600
  warning:   '#d97706',  // warning-600
  danger:    '#dc2626',  // danger-600
  purple:    '#7c3aed',
  gray:      '#6b7280',
}

// Paleta para series múltiples (comparación de rutas, etc.)
export const SERIES_COLORS = [
  '#2563eb',  // azul
  '#16a34a',  // verde
  '#d97706',  // amarillo
  '#dc2626',  // rojo
  '#7c3aed',  // morado
]

// Colores para estado de demora (semáforo)
export const DELAY_COLORS = {
  good:     '#16a34a',  // ≤5 min
  warning:  '#d97706',  // ≤15 min
  critical: '#dc2626',  // >15 min
}
