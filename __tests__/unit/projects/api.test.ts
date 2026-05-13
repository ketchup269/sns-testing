import { POST, GET } from '@/app/api/projects/route'
import { PUT, DELETE } from '@/app/api/projects/[id]/route'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth.utils'

jest.mock('@/lib/prisma', () => ({
    prisma: {
        project: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() }
    }
}))

jest.mock('@/lib/auth.utils')

const mockRequireAuth = requireAuth as jest.Mock
const mockPrismaProjectFindMany = prisma.project.findMany as jest.Mock
const mockPrismaProjectCreate = prisma.project.create as jest.Mock
const mockPrismaProjectUpdate = prisma.project.update as jest.Mock
const mockPrismaProjectDelete = prisma.project.delete as jest.Mock

describe('Projects API', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRequireAuth.mockResolvedValue('user-1')
    })

    describe('GET /api/projects', () => {
        it('should return 200 and projects for the authenticated user', async () => {
            const mockProjects = [{ id: 'p1', name: 'Proj 1', userId: 'user-1' }]
            mockPrismaProjectFindMany.mockResolvedValue(mockProjects)

            const res = await GET()
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json).toEqual(mockProjects)
            expect(mockPrismaProjectFindMany).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                orderBy: { updatedAt: 'desc' }
            })
        })

        it('should return 401 when unauthenticated', async () => {
            mockRequireAuth.mockRejectedValue({ isAuthError: true })
            const res = await GET()
            expect(res.status).toBe(401)
        })
    })

    describe('POST /api/projects', () => {
        it('should return 200 and create project when valid name provided', async () => {
            const body = { name: 'New Project', description: 'Desc', defaultHashtags: ['#test'] }
            const req = new Request('http://localhost/api/projects', { 
                method: 'POST', 
                body: JSON.stringify(body) 
            })
            mockPrismaProjectCreate.mockResolvedValue({ id: 'p2', ...body, userId: 'user-1' })

            const res = await POST(req)
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.name).toBe('New Project')
            expect(mockPrismaProjectCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({ 
                    userId: 'user-1', 
                    name: 'New Project',
                    defaultHashtags: ['#test']
                })
            })
        })

        it('should return 400 when name is missing', async () => {
            const req = new Request('http://localhost/api/projects', { 
                method: 'POST', 
                body: JSON.stringify({ description: 'No Name' }) 
            })
            const res = await POST(req)
            expect(res.status).toBe(400)
            const json = await res.json()
            expect(json.error).toBe('Name is required')
        })
    })

    describe('PUT /api/projects/[id]', () => {
        it('should return 200 and update project when valid id and owner', async () => {
            const body = { name: 'Updated Proj' }
            const req = new Request('http://localhost/api/projects/p1', { 
                method: 'PUT', 
                body: JSON.stringify(body) 
            })
            mockPrismaProjectUpdate.mockResolvedValue({ id: 'p1', name: 'Updated Proj', userId: 'user-1' })

            const res = await PUT(req, { params: Promise.resolve({ id: 'p1' }) })
            const json = await res.json()

            expect(res.status).toBe(200)
            expect(json.name).toBe('Updated Proj')
            expect(mockPrismaProjectUpdate).toHaveBeenCalledWith({
                where: { id: 'p1', userId: 'user-1' },
                data: expect.objectContaining({ name: 'Updated Proj' })
            })
        })

        it('should return 400 when updating with empty name', async () => {
            const req = new Request('http://localhost/api/projects/p1', { 
                method: 'PUT', 
                body: JSON.stringify({ name: '' }) 
            })
            const res = await PUT(req, { params: Promise.resolve({ id: 'p1' }) })
            expect(res.status).toBe(400)
        })
    })

    describe('DELETE /api/projects/[id]', () => {
        it('should return 204 on successful deletion', async () => {
            const req = new Request('http://localhost/api/projects/p1', { method: 'DELETE' })
            mockPrismaProjectDelete.mockResolvedValue({ id: 'p1' })

            const res = await DELETE(req, { params: Promise.resolve({ id: 'p1' }) })
            expect(res.status).toBe(204)
            expect(mockPrismaProjectDelete).toHaveBeenCalledWith({
                where: { id: 'p1', userId: 'user-1' }
            })
        })

        it('should return 500 when deletion fails in DB (e.g. not owner or not found)', async () => {
            mockPrismaProjectDelete.mockRejectedValue(new Error('P2025 Record not found'))
            const req = new Request('http://localhost/api/projects/p1', { method: 'DELETE' })
            
            const res = await DELETE(req, { params: Promise.resolve({ id: 'p1' }) })
            expect(res.status).toBe(500)
        })
    })
})
