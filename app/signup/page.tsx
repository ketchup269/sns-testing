'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createUser } from '@/app/actions/auth'
import { checkPasswordStrength, isPasswordStrong, type PasswordStrength } from '@/lib/validation'
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

function SignUpForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
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

    const inputCls = "w-full px-4 py-3.5 bg-surface border border-card-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all font-medium text-foreground placeholder:text-gray-400"
    const Requirement = ({ met, text }: { met: boolean; text: string }) => (
        <div className={`flex items-center gap-1.5 text-xs font-bold ${met ? 'text-green-600' : 'text-muted-text/80'}`}>
            {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />} {text}
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-medium">{error}</div>}
            <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-bold text-foreground">フルネーム</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="山田 太郎" />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-bold text-foreground">メールアドレス</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-foreground">パスワード</label>
                <input id="password" type="password" value={password} onChange={e => handlePasswordChange(e.target.value)} required className={inputCls} placeholder="••••••••" />
                <div className="pt-2 grid grid-cols-2 gap-2">
                    <Requirement met={passwordStrength.hasMinLength} text="8文字以上" />
                    <Requirement met={passwordStrength.hasUppercase} text="大文字を含む" />
                    <Requirement met={passwordStrength.hasNumber} text="数字を含む" />
                    <Requirement met={passwordStrength.hasSpecialChar} text="記号を含む" />
                </div>
            </div>
            <div className="space-y-1.5 pt-2">
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-foreground">パスワードの確認</label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
                className="w-full text-white py-4 px-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                style={{background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)'}}>
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" />アカウント作成中...</> : '無料で登録する'}
            </button>
        </form>
    )
}

export default function SignUp() {
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
            <div className="max-w-md w-full bg-card rounded-[2rem] border border-card-border p-8 shadow-2xl shadow-purple-500/10 my-12">
                <div className="flex flex-col items-center text-center mb-8">
                    <Image src="/images/gravia_mark.png" alt="Gravia" width={56} height={56} className="mb-3" />
                    <Image src="/images/gravia_text.png" alt="Gravia" width={100} height={30} className="object-contain mb-4" />
                    <h1 className="text-2xl font-black text-foreground tracking-tight">アカウント作成</h1>
                </div>
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{color:'#7C3AED'}} /></div>}>
                    <SignUpForm />
                </Suspense>
                <div className="mt-8 pt-6 border-t border-card-border text-center">
                    <p className="text-sm font-medium text-[#1E1B4B]/50">
                        すでにアカウントをお持ちですか？{' '}
                        <Link href="/signin" className="font-bold text-[#7C3AED] hover:opacity-80 transition-opacity">サインイン</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
