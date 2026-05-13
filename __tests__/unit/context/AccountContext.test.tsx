import { render, screen, act } from '@testing-library/react'
import { AccountProvider, useAccount } from '@/app/components/AccountContext'
import React from 'react'

const TestComponent = () => {
    const { selectedAccountId, setSelectedAccountId, activeAccount } = useAccount()
    return (
        <div>
            <span data-testid="selected-id">{selectedAccountId}</span>
            <span data-testid="active-username">{activeAccount?.username}</span>
            <button onClick={() => setSelectedAccountId('acc-2')}>Change</button>
        </div>
    )
}

describe('AccountContext', () => {
    const mockAccounts = [
        { id: 'acc-1', username: 'user1', pageId: 'p1' },
        { id: 'acc-2', username: 'user2', pageId: 'p2' },
    ]

    it('should throw an error when useAccount is used outside of an AccountProvider', () => {
        // Prevent React from logging the error to console during this test
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => render(<TestComponent />)).toThrow('useAccount must be used within an AccountProvider')
        consoleError.mockRestore()
    })

    it('should provide initial account data and allow updating the selected account', () => {
        render(
            <AccountProvider accounts={mockAccounts}>
                <TestComponent />
            </AccountProvider>
        )

        expect(screen.getByTestId('selected-id').textContent).toBe('acc-1')
        expect(screen.getByTestId('active-username').textContent).toBe('user1')

        act(() => {
            screen.getByText('Change').click()
        })

        expect(screen.getByTestId('selected-id').textContent).toBe('acc-2')
        expect(screen.getByTestId('active-username').textContent).toBe('user2')
    })

    it('should automatically switch to the first available account if the current selection becomes invalid', () => {
        const { rerender } = render(
            <AccountProvider accounts={mockAccounts}>
                <TestComponent />
            </AccountProvider>
        )

        const newAccounts = [{ id: 'acc-3', username: 'user3', pageId: 'p3' }]
        rerender(
            <AccountProvider accounts={newAccounts}>
                <TestComponent />
            </AccountProvider>
        )

        expect(screen.getByTestId('selected-id').textContent).toBe('acc-3')
    })
})
