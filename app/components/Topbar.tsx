'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { ChevronDown, Instagram, Menu, Sun, Moon } from 'lucide-react'
import { useAccount } from './AccountContext'
import { useSidebar } from './SidebarContext'
import { useTheme } from './ThemeContext'
import { LanguageSwitcher } from './LanguageSwitcher'

interface TopbarProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function Topbar({ user }: TopbarProps) {
    const { accounts, selectedAccountId, setSelectedAccountId, activeAccount } = useAccount()
    const { toggleSidebar } = useSidebar()
    const { theme, toggleTheme } = useTheme()
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : user?.email?.substring(0, 2).toUpperCase() || 'JD'

    return (
        <header className="h-16 bg-card border-b border-card-border flex items-center justify-between px-6 sticky top-0 z-30 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
            {/* Left: Mobile Menu & Logo */}
            <div className="flex items-center gap-3 md:gap-5 flex-1">
                <button 
                    onClick={toggleSidebar}
                    aria-label="Toggle Menu"
                    className="p-2 -ml-2 rounded-lg text-muted-text hover:bg-surface dark:hover:bg-surface/80 transition-all duration-200 ease-out active:scale-95"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <Link href="/dashboard" className="flex items-center gap-2 group transition-transform duration-200 ease-out active:scale-[0.98] mr-2">
                    <Image src="/images/gravia_mark.png" alt="Gravia" width={32} height={32} className="rounded-lg" />
                    <Image src="/images/gravia_text.png" alt="Gravia" width={80} height={24} className="hidden sm:block object-contain dark-invert" />
                </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 lg:gap-6">
                <LanguageSwitcher />

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="relative w-14 h-7 rounded-full transition-all duration-300 active:scale-95 flex items-center px-1"
                    style={{background: theme === 'dark' ? 'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)' : '#e2e8f0'}}
                >
                    <div className={`w-5 h-5 rounded-full bg-card shadow-md flex items-center justify-center transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
                        {theme === 'light' ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-purple-600" />}
                    </div>
                </button>

                {/* Account Selector */}
                {accounts.length > 0 && (
                    <div className="relative">
                        <button 
                            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                            className="flex items-center gap-2.5 px-3 py-1.5 bg-surface border border-card-border rounded-xl hover:bg-surface dark:hover:bg-surface/80 transition-all duration-200 ease-out active:scale-95 group"
                        >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center p-0.5 shadow-sm" style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                                <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                                    <Instagram className="w-3.5 h-3.5 text-foreground" />
                                </div>
                            </div>
                            <span className="text-sm font-semibold text-foreground hidden sm:inline">
                                @{activeAccount?.username || activeAccount?.pageId || 'no_account'}
                            </span>
                            <ChevronDown className="w-4 h-4 text-muted-text/80 group-hover:text-gray-600 transition-colors" />
                        </button>
                        
                        {isAccountMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsAccountMenuOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-card border border-card-border rounded-xl shadow-lg z-20 py-2 top-full">
                                    <div className="px-3 py-2 text-xs font-semibold text-muted-text/80 uppercase tracking-wider">
                                        アカウント切り替え
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                onClick={() => {
                                                    setSelectedAccountId(acc.id)
                                                    setIsAccountMenuOpen(false)
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-surface/80 dark:hover:bg-surface/50 transition-colors ${selectedAccountId === acc.id ? 'bg-purple-50/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium' : 'text-foreground'}`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center border border-card-border shrink-0">
                                                    <Instagram className="w-3.5 h-3.5 text-muted-text" />
                                                </div>
                                                <span className="truncate">@{acc.username || acc.pageId}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Profile Toggle (Mobile/Mini) */}
                <button className="flex items-center justify-center w-9 h-9 rounded-xl border border-card-border bg-surface hover:bg-surface dark:hover:bg-surface/80 transition-all duration-200 ease-out active:scale-95 sm:hidden">
                    <div className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-xs font-bold" style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                        {initials}
                    </div>
                </button>
            </div>
        </header>
    )
}
