import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from '../components/ErrorBoundary.jsx'

// Component that throws an error for testing
const ThrowErrorComponent = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  let originalError
  let originalLogError

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    originalError = console.error
    originalLogError = console.log
    console.error = vi.fn()
    console.log = vi.fn()
  })

  afterEach(() => {
    // Restore console methods
    console.error = originalError
    console.log = originalLogError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('catches and displays error when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument()
  })

  it('displays generic error message when error has no message', () => {
    // Component that throws error without message
    const ThrowErrorNoMessage = () => {
      throw new Error()
    }

    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('resets error state when back button is clicked', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should show error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Mock window.location
    const originalLocation = window.location
    delete window.location
    window.location = { href: '' }

    // Click the back button
    const backButton = screen.getByRole('button', { name: /back to dashboard/i })
    fireEvent.click(backButton)

    // Should redirect to dashboard
    expect(window.location.href).toBe('/dashboard')

    // Restore original location
    window.location = originalLocation
  })

  it('logs error to console when caught', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught:',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('renders error UI with correct styling', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const errorContainer = screen.getByText('Something went wrong').closest('.min-h-screen')
    expect(errorContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')

    const card = screen.getByText('Something went wrong').closest('.card')
    expect(card).toHaveClass('p-8', 'max-w-md', 'w-full', 'text-center')
  })

  it('handles error boundary reset correctly', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    // Initially no error
    expect(screen.getByText('No error')).toBeInTheDocument()

    // Rerender with error
    rerender(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // Should show error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
