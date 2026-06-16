import PermissionsDisclosure from '@/components/PermissionsDisclosure'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: { locale: string } }) {
    const t = await getTranslations('Account')
    return {
        title: `${t('permissionsTitle')} - Gravia`
    }
}

export default async function PermissionsPage() {
    const t = await getTranslations('Account')
    return (
        <main className="min-h-screen bg-background py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-text hover:text-foreground transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
                <PermissionsDisclosure />
            </div>
        </main>
    )
}
