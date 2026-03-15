import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { clsx } from 'clsx'

export function KPICard({ 
  title, 
  value, 
  unit = '', 
  delta, 
  deltaLabel = 'vs last period',
  color = 'primary',
  isLoading = false 
}) {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const isNeutral = delta === 0
  
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500',
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      icon: 'text-success-500',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-500',
    },
    danger: {
      bg: 'bg-danger-50',
      text: 'text-danger-600',
      icon: 'text-danger-500',
    },
  }

  const selectedColor = colorClasses[color] || colorClasses.primary

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    )
  }

  return (
    <div className={clsx('card p-6', selectedColor.bg)}>
      <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-gray-800">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-gray-400 text-sm mb-1">{unit}</span>
        )}
      </div>
      
      {delta !== undefined && (
        <div className={clsx(
          'flex items-center gap-1 text-sm',
          isPositive ? 'text-success-600' : isNegative ? 'text-danger-600' : 'text-gray-500'
        )}>
          {isPositive ? (
            <TrendingUp size={14} className="text-success-500" />
          ) : isNegative ? (
            <TrendingDown size={14} className="text-danger-500" />
          ) : (
            <Minus size={14} className="text-gray-400" />
          )}
          <span>
            {Math.abs(delta)}% {deltaLabel}
          </span>
        </div>
      )}
    </div>
  )
}

export function KPICardSimple({ 
  title, 
  value, 
  unit = '', 
  icon: Icon,
  color = 'primary',
  isLoading = false 
}) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      text: 'text-primary-600',
      icon: 'text-primary-500',
      iconBg: 'bg-primary-100',
    },
    success: {
      bg: 'bg-success-50',
      text: 'text-success-600',
      icon: 'text-success-500',
      iconBg: 'bg-success-100',
    },
    warning: {
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      icon: 'text-warning-500',
      iconBg: 'bg-warning-100',
    },
    danger: {
      bg: 'bg-danger-50',
      text: 'text-danger-600',
      icon: 'text-danger-500',
      iconBg: 'bg-danger-100',
    },
  }

  const selectedColor = colorClasses[color] || colorClasses.primary

  if (isLoading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className={clsx('card p-6', selectedColor.bg)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {Icon && (
          <div className={clsx('p-2 rounded-lg', selectedColor.iconBg)}>
            <Icon size={20} className={selectedColor.icon} />
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2">
        <span className={clsx('text-3xl font-bold', selectedColor.text)}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-gray-400 text-sm mb-1">{unit}</span>
        )}
      </div>
    </div>
  )
}
