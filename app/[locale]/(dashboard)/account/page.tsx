import { requirePageAuth } from '@/lib/auth.utils'
import { prisma } from '@/lib/prisma'
import AccountClient from './AccountClient'

export const dynamic = 'force-dynamic'

export default async function AccountPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams
    const session = await requirePageAuth();
    const userId = session.user.id

    const error = searchParams?.error as string | undefined
    const success = searchParams?.success as string | undefined

    const connectedAccounts = await prisma.connectedAccount.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
    })

    return <AccountClient connectedAccounts={connectedAccounts} error={error} success={success} />
}
