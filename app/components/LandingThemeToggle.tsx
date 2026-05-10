'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeContext'

export function LandingThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="relative w-14 h-7 rounded-full transition-all duration-300 active:scale-95 flex items-center px-1"
            style={{
                background: theme === 'dark'
                    ? 'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'
                    : '#ffffffff',
            }}
        >
            <div
                className={`w-5 h-5 rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-7 bg-card' : 'translate-x-0 bg-card'
                }`}
            >
                {theme === 'light'
                    ? <Sun className="w-3 h-3 text-amber-500" />
                    : <Moon className="w-3 h-3 text-purple-600" />
                }
            </div>
        </button>
    )
}
