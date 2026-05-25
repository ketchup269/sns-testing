import { updateAiUsageOption } from '@/app/[locale]/(dashboard)/settings/actions'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth.utils'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/auth.utils')
jest.mock('next/cache')
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { update: jest.fn() },
        post: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
        schedule: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(),
                    updateMany: jest.fn(), count: jest.fn() },
        connectedAccount: { findUnique: jest.fn(), findMany: jest.fn(),
                            count: jest.fn() },
        project: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(),
                   update: jest.fn(), delete: jest.fn() },
        projectImage: { findUnique: jest.fn(), findMany: jest.fn(),
                        createMany: jest.fn(), delete: jest.fn(),
                        deleteMany: jest.fn() },
    }
}))

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>
const mockPrismaUserUpdate = prisma.user.update as jest.Mock

describe('updateAiUsageOption', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const options = ['No AI', 'Slight AI Use', 'Normal AI Use', 'Strong AI Use']

    test.each(options)('should save correctly when option is "%s"', async (option) => {
        mockRequireAuth.mockResolvedValue('user-1')
        mockPrismaUserUpdate.mockResolvedValue({ id: 'user-1', aiUsageOption: option })

        const result = await updateAiUsageOption(option)

        expect(result).toEqual({ success: true })
        expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { aiUsageOption: option }
        })
        expect(mockRevalidatePath).toHaveBeenCalledWith('/settings')
    })

    it('should return "Not authenticated" when unauthenticated', async () => {
        mockRequireAuth.mockRejectedValue(Object.assign(new Error('Unauthorized'), { isAuthError: true }))

        const result = await updateAiUsageOption('No AI')

        expect(result).toEqual({ error: 'Not authenticated' })
        expect(mockPrismaUserUpdate).not.toHaveBeenCalled()
    })

    it('should return error when DB update fails', async () => {
        mockRequireAuth.mockResolvedValue('user-1')
        mockPrismaUserUpdate.mockRejectedValue(new Error('DB error'))

        const result = await updateAiUsageOption('No AI')

        expect(result).toEqual({ error: 'Failed to update AI setting' })
    })
})
