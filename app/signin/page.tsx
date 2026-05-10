'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { validateEmail } from '@/lib/validation'
import { Loader2, ArrowLeft } from 'lucide-react'

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const message = searchParams.get('message')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const emailValidation = validateEmail(email)
        if (!emailValidation.valid) { setError(emailValidation.error || '有効なメールアドレスを入力してください。'); return }
        setLoading(true)
        try {
            const result = await signIn('credentials', { email, password, redirect: false })
            if (result?.error) setError('メールアドレスまたはパスワードが正しくありません。')
            else window.location.replace('/dashboard')
        } catch { setError('エラーが発生しました。もう一度お試しください。') }
        finally { setLoading(false) }
    }

    const inputCls = "w-full px-4 py-3.5 bg-surface border border-card-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all font-medium text-foreground placeholder:text-gray-400"

    return (
        <div className="w-full">
            {message && <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-bold text-foreground">メールアドレス</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="you@example.com" />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-bold text-foreground">パスワード</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading}
                    className="w-full text-white py-4 px-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                    style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" />サインイン中...</> : 'サインイン'}
                </button>
            </form>
        </div>
    )
}

export default function SignIn() {
    const router = useRouter()
    const { status } = useSession()
    useEffect(() => { if (status === 'authenticated') router.replace('/dashboard') }, [status, router])

    if (status === 'loading' || status === 'authenticated') {
        return <div className="min-h-screen flex items-center justify-center bg-card"><Loader2 className="w-8 h-8 animate-spin" style={{color:'#7C3AED'}} /></div>
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-card p-4 font-sans relative overflow-hidden selection:bg-purple-100">
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-[#1E1B4B]/60 hover:text-[#1E1B4B] transition-colors">
                <ArrowLeft className="w-4 h-4" /> ホームに戻る
            </Link>
            <div className="max-w-md w-full bg-card rounded-[2rem] border border-card-border p-8 shadow-2xl shadow-purple-500/10">
                <div className="flex flex-col items-center text-center mb-8">
                    <Image src="/images/gravia_mark.png" alt="Gravia" width={56} height={56} className="mb-3" />
                    <Image src="/images/gravia_text.png" alt="Gravia" width={100} height={30} className="object-contain mb-4" />
                    <h1 className="text-2xl font-black text-foreground tracking-tight">お帰りなさい</h1>
                </div>
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{color:'#7C3AED'}} /></div>}>
                    <SignInForm />
                </Suspense>
                <div className="mt-8 pt-6 border-t border-card-border text-center">
                    <p className="text-sm font-medium text-[#1E1B4B]/50">
                        アカウントをお持ちではありませんか？{' '}
                        <Link href="/signup" className="font-bold text-[#7C3AED] hover:opacity-80 transition-opacity">無料で登録</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
