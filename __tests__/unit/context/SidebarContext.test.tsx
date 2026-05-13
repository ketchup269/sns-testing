import { render, screen, act } from '@testing-library/react'
import { SidebarProvider, useSidebar } from '@/app/components/SidebarContext'
import React from 'react'

const TestComponent = () => {
    const { isOpen, toggleSidebar, closeSidebar } = useSidebar()
    return (
        <div>
            <span data-testid="is-open">{isOpen ? 'true' : 'false'}</span>
            <button data-testid="btn-toggle" onClick={toggleSidebar}>Toggle</button>
            <button data-testid="btn-close" onClick={closeSidebar}>Close</button>
        </div>
    )
}

describe('SidebarContext', () => {
    it('should throw an error when useSidebar is used outside of a SidebarProvider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => render(<TestComponent />)).toThrow('useSidebar must be used within a SidebarProvider')
        consoleError.mockRestore()
    })

    it('should manage the open/closed state correctly through toggle and close actions', () => {
        render(
            <SidebarProvider>
                <TestComponent />
            </SidebarProvider>
        )

        // Initial state
        expect(screen.getByTestId('is-open').textContent).toBe('false')

        // Toggle to true
        act(() => {
            screen.getByTestId('btn-toggle').click()
        })
        expect(screen.getByTestId('is-open').textContent).toBe('true')

        // Toggle back to false
        act(() => {
            screen.getByTestId('btn-toggle').click()
        })
        expect(screen.getByTestId('is-open').textContent).toBe('false')

        // Explicitly close
        act(() => {
            screen.getByTestId('btn-toggle').click()
        })
        expect(screen.getByTestId('is-open').textContent).toBe('true')
        act(() => {
            screen.getByTestId('btn-close').click()
        })
        expect(screen.getByTestId('is-open').textContent).toBe('false')
    })
})
