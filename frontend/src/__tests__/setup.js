import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
})

// Mock Leaflet to avoid canvas rendering issues in tests
vi.mock('leaflet', () => ({
  map: vi.fn(() => ({
    setView: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
    remove: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    remove: vi.fn(),
    bindPopup: vi.fn(),
    openPopup: vi.fn(),
    closePopup: vi.fn(),
  })),
  icon: vi.fn(),
  circle: vi.fn(() => ({
    addTo: vi.fn(),
    remove: vi.fn(),
    bindPopup: vi.fn(),
  })),
  polyline: vi.fn(() => ({
    addTo: vi.fn(),
    remove: vi.fn(),
    setStyle: vi.fn(),
  })),
}))

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  Circle: () => <div data-testid="circle" />,
  Polyline: () => <div data-testid="polyline" />,
  useMap: () => ({
    setView: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
  useMapEvents: () => null,
}))

// Mock Socket.IO
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  })),
}))

// Mock Chart.js (used by Recharts)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}))

// Global test setup
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
