import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProjectsClient from './ProjectsClient'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
    const session = await requirePageAuth();
    const userId = session.user.id

    const projects = await prisma.project.findMany({
        where: { userId: userId },
        orderBy: { updatedAt: 'desc' }
    })

    return <ProjectsClient initialProjects={projects as any} />
}
