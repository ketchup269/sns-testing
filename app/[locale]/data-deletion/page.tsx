import { Link } from '@/i18n/routing'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function DataDeletion() {
  const t = await getTranslations('DataDeletion')

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center py-12 px-4">
      <div className="max-w-2xl w-full bg-card p-8 rounded-2xl shadow-sm border border-card-border">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-muted-text hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        </div>

        <div className="space-y-6 text-muted-text">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">{t('s1.title')}</h2>
            <p>{t('s1.p1')}</p>
            <ol className="list-decimal pl-5 mt-3 space-y-2">
              <li>{t('s1.l1')}</li>
              <li>{t('s1.l2')}</li>
              <li>{t('s1.l3')}</li>
              <li>{t('s1.l4')}</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">{t('s2.title')}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('s2.l1')}</li>
              <li>{t('s2.l2')}</li>
              <li>{t('s2.l3')}</li>
              <li>{t('s2.l4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">{t('s3.title')}</h2>
            <p>{t('s3.p1')}</p>
          </section>
        </div>
      </div>
    </div>
  )
}