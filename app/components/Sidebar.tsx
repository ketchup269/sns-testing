'use client'

import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    PlusCircle,
    Calendar,
    BarChart3,
    ListChecks,
    Instagram,
    Settings,
    LogOut,
    ChevronRight,
    X,
    FolderKanban,
    Bot
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'

const navigation = [
    { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
    { key: 'create', href: '/create', icon: PlusCircle },
    { key: 'projects', href: '/projects', icon: FolderKanban },
    { key: 'calendar', href: '/calendar', icon: Calendar },
    { key: 'analytics', href: '/analytics', icon: BarChart3 },
    { key: 'workflow', href: '/workflow', icon: ListChecks },
    { key: 'account', href: '/account', icon: Instagram },
    { key: 'automation', href: '/automation', icon: Bot },
    { key: 'settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

import { useSidebar } from './SidebarContext'

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname()
    const { isOpen, closeSidebar } = useSidebar()
    const t = useTranslations('Sidebar')
    
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'JD'

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}
            
            <aside 
                className={`fixed lg:relative inset-y-0 left-0 z-50 bg-card border-r border-card-border flex flex-col h-full overflow-y-auto transform transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 ${isOpen ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-20'}`}
            >
                {/* Close Button / Mobile Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-card-border lg:hidden">
                    <span className="font-bold text-foreground tracking-tight text-lg">{t('menu')}</span>
                    <button 
                        onClick={closeSidebar}
                        className="p-2 -mr-2 text-muted-text/80 hover:text-gray-600 hover:bg-surface/80 dark:hover:bg-surface/50 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-x-hidden">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-out active:scale-[0.98] group relative ${isActive
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-foreground dark:text-white'
                                : 'text-[#1E1B4B]/60 dark:text-white/60 hover:bg-surface/80 dark:hover:bg-surface/50 dark:hover:bg-white/5 hover:text-[#1E1B4B] dark:hover:text-white'
                                } ${!isOpen ? 'lg:justify-center' : ''}`}
                            title={!isOpen ? t(item.key) : undefined}
                        >
                            <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[#7C3AED] dark:text-purple-400' : 'text-[#1E1B4B]/40 dark:text-white/40 group-hover:text-[#1E1B4B]/70 dark:group-hover:text-white/70'
                                }`} />
                            
                            <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100 flex-1' : 'lg:hidden opacity-0 w-0'}`}>
                                {t(item.key)}
                            </span>
                            
                            {isActive && isOpen && <div className="w-1.5 h-1.5 rounded-full shrink-0 ml-auto" style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}} />}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section: Profile/Logout */}
            <div className={`p-4 border-t border-card-border ${!isOpen ? 'lg:p-2' : ''}`}>
                <div className={`flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4 text-[10px] text-muted-text/60 transition-all duration-200 ${isOpen ? 'opacity-100' : 'lg:hidden opacity-0 h-0 overflow-hidden mb-0'}`}>
                    <Link href="/terms" className="hover:text-foreground transition-colors">{t('terms')}</Link>
                    <span>&bull;</span>
                    <Link href="/privacy" className="hover:text-foreground transition-colors">{t('privacy')}</Link>
                    <span>&bull;</span>
                    <Link href="/data-deletion" className="hover:text-foreground transition-colors">{t('dataDeletion')}</Link>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium text-muted-text hover:bg-red-50 hover:text-red-700 transition-all duration-200 ease-out active:scale-[0.98] group ${!isOpen ? 'lg:px-0 lg:py-3' : ''}`}
                    title={!isOpen ? t('logout') : undefined}
                >
                    <LogOut className="w-5 h-5 shrink-0 text-muted-text/80 group-hover:text-red-500 transition-colors" />
                    <span className={`ml-3 whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'lg:hidden opacity-0 w-0'}`}>
                        {t('logout')}
                    </span>
                </button>

                <div className={`mt-4 bg-surface dark:bg-transparent rounded-xl border border-card-border dark:border-white/10 cursor-pointer hover:bg-white dark:hover:bg-white/5 transition-all duration-200 ease-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-white/20 active:scale-[0.98] group ${isOpen ? 'p-3' : 'lg:p-1.5 p-3'}`} title={!isOpen ? user?.name || 'User' : undefined}>
                    <div className={`flex items-center ${!isOpen ? 'lg:justify-center' : 'gap-3'}`}>
                        <div className={`rounded-full flex items-center justify-center text-white font-bold shadow-sm overflow-hidden group-hover:shadow-md transition-shadow shrink-0 ${isOpen ? 'w-10 h-10' : 'lg:w-8 lg:h-8 w-10 h-10 text-xs'}`} style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                            {user?.image ? (
                                <Image src={user.image} alt="User avatar" width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className={`flex-1 min-w-0 transition-all duration-200 flex flex-col justify-center ${isOpen ? 'opacity-100' : 'lg:hidden opacity-0 w-0'}`}>
                            <p className="text-sm font-semibold text-foreground dark:text-white truncate tracking-tight">{user?.name || 'User'}</p>
                            <p className="text-[10px] sm:text-xs font-medium text-[#1E1B4B]/50 dark:text-white/50 truncate">{user?.email}</p>
                        </div>
                        {isOpen && <ChevronRight className="w-4 h-4 text-muted-text/80 group-hover:text-gray-600 transition-colors shrink-0" />}
                    </div>
                </div>
            </div>
        </aside>
    </>
    )
}
