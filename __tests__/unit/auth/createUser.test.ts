import { createUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { validateEmail, validatePassword, validateName } from '@/lib/validation'
import { Prisma } from '@/lib/prisma-client/client'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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

jest.mock('bcryptjs', () => ({
    hash: jest.fn()
}))

jest.mock('@/lib/validation', () => ({
    validateEmail: jest.fn(),
    validatePassword: jest.fn(),
    validateName: jest.fn()
}))

describe('createUser', () => {
    const mockPrismaUserCreate = prisma.user.create as jest.Mock
    const mockHash = hash as jest.Mock
    const mockValidateEmail = validateEmail as jest.Mock
    const mockValidatePassword = validatePassword as jest.Mock
    const mockValidateName = validateName as jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        mockHash.mockResolvedValue('$2b$12$hashedpassword')
        mockValidateEmail.mockReturnValue({ valid: true })
        mockValidatePassword.mockReturnValue({ valid: true })
        mockValidateName.mockReturnValue({ valid: true })
    })

    describe('Happy path', () => {
        it('should return success and create user when valid name/email/password provided', async () => {
            const userData = { id: 'user-1', name: 'Test User', email: 'test@example.com' }
            mockPrismaUserCreate.mockResolvedValue(userData)

            const result = await createUser('Test User', 'test@example.com', 'password123!')

            expect(result).toEqual({ success: true, data: userData })
            expect(mockHash).toHaveBeenCalledWith('password123!', 12)
            expect(mockPrismaUserCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Test User',
                    email: 'test@example.com',
                    password_hash: '$2b$12$hashedpassword'
                }
            })
        })
    })

    describe('Invalid inputs', () => {
        it('should return error when email is invalid', async () => {
            mockValidateEmail.mockReturnValue({ valid: false, error: 'Invalid email' })

            const result = await createUser('Test User', 'invalid', 'password123!')

            expect(result).toEqual({ success: false, error: 'Invalid email' })
            expect(mockPrismaUserCreate).not.toHaveBeenCalled()
        })

        it('should return error when password is too short', async () => {
            mockValidatePassword.mockReturnValue({ valid: false, error: 'Password too short' })

            const result = await createUser('Test User', 'test@example.com', 'short')

            expect(result).toEqual({ success: false, error: 'Password too short' })
        })

        it('should return error when name is too short', async () => {
            mockValidateName.mockReturnValue({ valid: false, error: 'Name too short' })

            const result = await createUser('T', 'test@example.com', 'password123!')

            expect(result).toEqual({ success: false, error: 'Name too short' })
        })
    })

    describe('Database errors', () => {
        it('should return "Email already exists" when Prisma throws P2002', async () => {
            const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
                code: 'P2002',
                clientVersion: '5.0.0',
                meta: { target: ['email'] }
            })
            mockPrismaUserCreate.mockRejectedValue(error)

            const result = await createUser('Test User', 'test@example.com', 'password123!')

            expect(result).toEqual({ success: false, error: 'Email already exists' })
        })

        it('should return generic error when unexpected DB error occurs', async () => {
            mockPrismaUserCreate.mockRejectedValue(new Error('DB down'))

            const result = await createUser('Test User', 'test@example.com', 'password123!')

            expect(result).toEqual({ success: false, error: 'Failed to create account. Please try again.' })
        })
    })
})
