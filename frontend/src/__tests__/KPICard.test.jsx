import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KPICard } from '../components/Dashboard/KPICard.jsx'

describe('KPICard Component', () => {
  it('renders title and value correctly', () => {
    render(
      <KPICard 
        title="Total Buses"
        value={150}
        unit="buses"
      />
    )

    expect(screen.getByText('Total Buses')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('buses')).toBeInTheDocument()
  })

  it('displays positive delta with trending up icon', () => {
    render(
      <KPICard 
        title="Active Routes"
        value={25}
        delta={5}
        deltaLabel="vs last week"
      />
    )

    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('vs last week')).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

  it('displays negative delta with trending down icon', () => {
    render(
      <KPICard 
        title="Delays"
        value={12}
        delta={-3}
        deltaLabel="vs yesterday"
      />
    )

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('vs yesterday')).toBeInTheDocument()
    expect(screen.getByText('-3')).toBeInTheDocument()
  })

  it('displays neutral delta with minus icon', () => {
    render(
      <KPICard 
        title="Efficiency"
        value={85}
        delta={0}
        deltaLabel="vs last month"
      />
    )

    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('applies correct color classes', () => {
    render(
      <KPICard 
        title="Warning Metric"
        value={75}
        color="warning"
      />
    )

    const card = screen.getByText('Warning Metric').closest('.card')
    expect(card).toHaveClass('bg-warning-50')
  })

  it('shows loading state correctly', () => {
    render(
      <KPICard 
        title="Loading Metric"
        isLoading={true}
      />
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('handles missing delta label gracefully', () => {
    render(
      <KPICard 
        title="Simple Metric"
        value={100}
        delta={10}
      />
    )

    expect(screen.getByText('vs last period')).toBeInTheDocument() // Default label
  })

  it('renders without unit', () => {
    render(
      <KPICard 
        title="Percentage"
        value={95}
      />
    )

    expect(screen.getByText('95')).toBeInTheDocument()
    // Should not display any unit
  })
})
