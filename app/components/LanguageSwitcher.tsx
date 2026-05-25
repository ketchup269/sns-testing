'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { useTransition } from 'react'

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const switchLocale = (newLocale: string) => {
        if (locale === newLocale || isPending) return;
        startTransition(() => {
            router.replace(pathname, { locale: newLocale })
        })
    }

    return (
        <div className="flex items-center bg-surface border border-card-border rounded-xl p-1 shrink-0">
            <button
                onClick={() => switchLocale('ja')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 ease-out ${
                    locale === 'ja'
                        ? 'bg-card shadow-sm text-foreground border border-card-border/50'
                        : 'text-muted-text hover:text-foreground border border-transparent'
                }`}
            >
                JP
            </button>
            <button
                onClick={() => switchLocale('en')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-200 ease-out ${
                    locale === 'en'
                        ? 'bg-card shadow-sm text-foreground border border-card-border/50'
                        : 'text-muted-text hover:text-foreground border border-transparent'
                }`}
            >
                EN
            </button>
        </div>
    )
}
