'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/routing'
import Image from 'next/image'
import { createUser } from '@/app/actions/auth'
import { checkPasswordStrength, isPasswordStrong, type PasswordStrength } from '@/lib/validation'
import { Loader2, ArrowLeft, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    )
}

function MetaIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
    )
}

function SignUpForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showEmailForm, setShowEmailForm] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ hasMinLength: false, hasLowercase: false, hasUppercase: false, hasNumber: false, hasSpecialChar: false })

    const handlePasswordChange = (v: string) => { setPassword(v); setPasswordStrength(checkPasswordStrength(v)) }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('')
        if (name.trim().length < 2) { setError('名前は2文字以上である必要があります。'); return }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('有効なメールアドレスを入力してください。'); return }
        if (!isPasswordStrong(passwordStrength)) { setError('パスワードの要件をすべて満たしてください。'); return }
        if (password !== confirmPassword) { setError('パスワードが一致しません。'); return }
        setLoading(true)
        try {
            const result = await createUser(name, email, password)
            if (!result.success) { setError(result.error || 'アカウントの作成に失敗しました。'); return }
            router.push('/signin?message=アカウントが正常に作成されました。サインインしてください。')
        } catch (err) { console.error(err); setError('エラーが発生しました。') }
        finally { setLoading(false) }
    }

    const inputCls = "w-full px-4 py-3 sm:py-3.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
    const Requirement = ({ met, text }: { met: boolean; text: string }) => (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${met ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />} {text}
        </div>
    )

    return (
        <div className="w-full space-y-4">
            {/* Social Buttons */}
            <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 sm:py-4 rounded-2xl font-bold text-sm
                    bg-white dark:bg-white/10 border-2 border-slate-200 dark:border-white/15
                    text-slate-700 dark:text-white
                    hover:bg-slate-50 dark:hover:bg-white/15 hover:border-slate-300 dark:hover:border-white/25
                    hover:shadow-lg hover:-translate-y-0.5
                    active:scale-[0.98] transition-all duration-200"
            >
                <GoogleIcon />
                Googleで登録
            </button>

            <button
                onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 sm:py-4 rounded-2xl font-bold text-sm
                    bg-[#1877F2] dark:bg-[#1877F2]/90 border-2 border-[#1877F2] dark:border-[#1877F2]/70
                    text-white
                    hover:bg-[#166FE5] dark:hover:bg-[#1877F2] hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5
                    active:scale-[0.98] transition-all duration-200"
            >
                <MetaIcon />
                Metaで登録
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">または</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
            </div>

            {/* Email toggle */}
            <button
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm
                    bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10
                    text-slate-600 dark:text-slate-300
                    hover:bg-slate-200 dark:hover:bg-white/10
                    active:scale-[0.98] transition-all duration-200"
            >
                メールアドレスで登録
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showEmailForm ? 'rotate-180' : ''}`} />
            </button>

            {/* Email Form (collapsible) */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showEmailForm ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-2xl text-sm font-medium">{error}</div>}
                    <div className="space-y-1.5">
                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 dark:text-slate-300">フルネーム</label>
                        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="山田 太郎" />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300">メールアドレス</label>
                        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="you@example.com" />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">パスワード</label>
                        <input id="password" type="password" value={password} onChange={e => handlePasswordChange(e.target.value)} required className={inputCls} placeholder="••••••••" />
                        <div className="pt-2 grid grid-cols-2 gap-2">
                            <Requirement met={passwordStrength.hasMinLength} text="8文字以上" />
                            <Requirement met={passwordStrength.hasUppercase} text="大文字を含む" />
                            <Requirement met={passwordStrength.hasNumber} text="数字を含む" />
                            <Requirement met={passwordStrength.hasSpecialChar} text="記号を含む" />
                        </div>
                    </div>
                    <div className="space-y-1.5 pt-1">
                        <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 dark:text-slate-300">パスワードの確認</label>
                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full text-white py-3.5 sm:py-4 px-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 text-sm"
                        style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" />アカウント作成中...</> : '無料で登録する'}
                    </button>
                </form>
            </div>

            <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed pt-1">
                続けることで、<Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">利用規約</Link>と
                <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">プライバシーポリシー</Link>に同意したことになります。
            </p>
        </div>
    )
}

export default function SignUp() {
    const router = useRouter()
    const { status } = useSession()
    useEffect(() => { if (status === 'authenticated') router.replace('/dashboard') }, [status, router])

    if (status === 'loading' || status === 'authenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a12]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#7C3AED' }} />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a12] p-4 sm:p-6 font-sans relative overflow-hidden selection:bg-purple-100 dark:selection:bg-purple-900/40 transition-colors duration-300">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200/20 dark:bg-orange-900/10 rounded-full blur-3xl"></div>
            </div>

            <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors z-10">
                <ArrowLeft className="w-4 h-4" /> ホームに戻る
            </Link>

            <div className="w-full max-w-[420px] bg-white dark:bg-white/[0.03] rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl shadow-purple-500/5 dark:shadow-purple-500/5 relative z-10 my-8 sm:my-12">
                <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                    <Image src="/images/gravia_mark.png" alt="Gravia" width={48} height={48} className="mb-3 sm:w-14 sm:h-12.5" />
                    <Image src="/images/gravia_text.png" alt="Gravia" width={100} height={30} className="object-contain mb-3 sm:mb-4" />
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">アカウント作成</h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">ソーシャルアカウントで簡単に登録</p>
                </div>

                <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#7C3AED' }} /></div>}>
                    <SignUpForm />
                </Suspense>

                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200 dark:border-white/10 text-center">
                    <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500">
                        すでにアカウントをお持ちですか？{' '}
                        <Link href="/signin" className="font-bold text-[#7C3AED] hover:opacity-80 transition-opacity">サインイン</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
