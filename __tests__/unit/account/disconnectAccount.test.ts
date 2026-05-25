import { disconnectAccount } from '@/app/[locale]/(dashboard)/account/actions'
import { requireAuth } from '@/lib/auth.utils'
import { AccountService } from '@/lib/services/account.service'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/auth.utils')
jest.mock('@/lib/services/account.service')
jest.mock('next/cache')

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockAccountService = AccountService as jest.Mocked<typeof AccountService>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>

describe('disconnectAccount', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Happy path', () => {
        it('should return success when authenticated and valid accountId provided', async () => {
            mockRequireAuth.mockResolvedValue('user-1')
            mockAccountService.disconnectAccount.mockResolvedValue()

            const result = await disconnectAccount('account-1')

            expect(result).toEqual({ success: true })
            expect(mockAccountService.disconnectAccount).toHaveBeenCalledWith('user-1', 'account-1')
            expect(mockRevalidatePath).toHaveBeenCalledWith('/account')
            expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard')
        })
    })

    describe('Error paths', () => {
        it('should return "Unauthorized" when requireAuth fails with isAuthError', async () => {
            mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))

            const result = await disconnectAccount('account-1')

            expect(result).toEqual({ error: 'Unauthorized' })
            expect(mockAccountService.disconnectAccount).not.toHaveBeenCalled()
        })

        it('should return error when accountId is missing', async () => {
            mockRequireAuth.mockResolvedValue('user-1')

            const result = await disconnectAccount('')

            expect(result).toEqual({ error: 'Account ID is required' })
            expect(mockAccountService.disconnectAccount).not.toHaveBeenCalled()
        })

        it('should return error message when service throws', async () => {
            mockRequireAuth.mockResolvedValue('user-1')
            mockAccountService.disconnectAccount.mockRejectedValue(new Error('DB error'))

            const result = await disconnectAccount('account-1')

            expect(result).toEqual({ error: 'DB error' })
        })

        it('should return generic error when service throws without message', async () => {
            mockRequireAuth.mockResolvedValue('user-1')
            mockAccountService.disconnectAccount.mockRejectedValue(new Error())

            const result = await disconnectAccount('account-1')

            expect(result).toEqual({ error: 'An unexpected error occurred' })
        })
    })
})
