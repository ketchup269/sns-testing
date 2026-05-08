'use client'

import React from 'react'
import { FolderKanban, Plus, Edit2, Trash2, X, AlertCircle, Target, MessageCircle, Calendar, ShieldAlert, Sparkles, Hash } from 'lucide-react'
import { useProjects, type Project } from './hooks/useProjects'

interface ProjectsClientProps {
    initialProjects: Project[]
}

const PURPOSE_OPTIONS = [
    { value: '', label: '選択してください' },
    { value: 'awareness', label: '認知度向上' },
    { value: 'engagement', label: 'エンゲージメント' },
    { value: 'sales', label: '販売' },
    { value: 'leads', label: 'リード獲得' },
]

const TONE_STYLE_OPTIONS = [
    { value: '', label: '選択してください' },
    { value: 'casual', label: 'カジュアル' },
    { value: 'professional', label: 'プロフェッショナル' },
    { value: 'witty', label: 'ウィットに富んだ' },
    { value: 'bold', label: '大胆' },
    { value: 'inspirational', label: 'インスピレーショナル' },
]

const FREQUENCY_OPTIONS = [
    { value: '', label: '選択してください' },
    { value: 'daily', label: '毎日' },
    { value: 'weekly', label: '毎週' },
    { value: 'custom', label: 'カスタム' },
]

const TONE_RESTRICTIONS_OPTIONS = [
    { value: '', label: '制限なし' },
    { value: 'no-slang', label: 'スラング禁止' },
    { value: 'formal-only', label: 'フォーマルのみ' },
    { value: 'no-emojis', label: '絵文字禁止' },
    { value: 'minimalist', label: 'ミニマリスト' },
]

const CTA_OPTIONS = [
    { value: 'Send a DM', label: 'DM送信' },
    { value: 'Link to Profile', label: 'プロフィールリンク' },
    { value: 'Leave a Comment', label: 'コメントする' },
    { value: 'Share', label: 'シェアする' },
]

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
    const {
        projects, isModalOpen, editingProject, isSaving, error,
        name, setName, description, setDescription,
        objective, setObjective,
        ageRange, setAgeRange,
        gender, setGender,
        location, setLocation,
        profession, setProfession,
        toneStyle, setToneStyle,
        writingStyleNotes, setWritingStyleNotes,
        exampleCaptions, setExampleCaptions,
        postingFrequency, setPostingFrequency,
        preferredTimeSlots, setPreferredTimeSlots,
        campaignDuration, setCampaignDuration,
        preferredCtaTypes, setPreferredCtaTypes,
        wordsToAvoid, setWordsToAvoid,
        toneRestrictions, setToneRestrictions,
        customPromptNotes, setCustomPromptNotes,
        campaignSpecificInstructions, setCampaignSpecificInstructions,
        hashtags, setHashtags,
        openModal, closeModal, viewingProject, openViewModal, closeViewModal, handleSave, handleDelete
    } = useProjects(initialProjects)

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-600 flex items-center justify-center shadow-lg shadow-gray-900/20">
                            <FolderKanban className="w-6 h-6 text-white" />
                        </div>
                        プロジェクト
                    </h1>
                    <p className="text-gray-500 mt-2">コンテンツ作成用のプロジェクト設定を管理します。</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 max-w-max"
                >
                    <Plus className="w-5 h-5" />
                    新規プロジェクト
                </button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-white border text-center py-20 border-gray-200 rounded-2xl shadow-sm">
                    <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold mb-2">プロジェクトがありません</p>
                    <p className="text-gray-400 text-sm">上のボタンをクリックして最初のプロジェクトを作成してください。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(proj => (
                        <div key={proj.id} onClick={() => openViewModal(proj)} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer hover:border-indigo-200">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-xl font-bold text-gray-900 truncate pr-10">{proj.name}</h2>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] mb-3">
                                {proj.description || '説明がありません'}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {proj.objective && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">
                                        {PURPOSE_OPTIONS.find(o => o.value === proj.objective)?.label || proj.objective}
                                    </span>
                                )}
                                {proj.toneStyle && (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md">
                                        {TONE_STYLE_OPTIONS.find(o => o.value === proj.toneStyle)?.label || proj.toneStyle}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <form onSubmit={handleSave} className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-gray-900" />
                                {editingProject ? 'プロジェクトを編集' : '新規プロジェクト'}
                            </h2>
                            <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                        </div>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center justify-center gap-2 shrink-0">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin space-y-8">
                            
                            {/* SECTION 1: Basic Information */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <FolderKanban className="w-4 h-4" />
                                    <span>基本情報</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">プロジェクト名 <span className="text-red-500">*</span></label>
                                        <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="プロジェクト名" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">目的</label>
                                        <select value={objective} onChange={e=>setObjective(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all text-sm">
                                            {PURPOSE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">プロジェクト説明 <span className="text-red-500">*</span></label>
                                        <textarea required value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-h-[80px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="プロジェクトの説明" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            デフォルトハッシュタグ <span className="text-red-500">*</span>
                                        </label>
                                        <input required type="text" value={hashtags} onChange={e=>setHashtags(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="#tag1 #tag2" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Target Audience */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <Target className="w-4 h-4" />
                                    <span>ターゲット層</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">年齢層 <span className="text-red-500">*</span></label>
                                        <input required type="text" value={ageRange} onChange={e=>setAgeRange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="例: 18-24" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">性別 <span className="text-gray-400 text-[10px] font-normal ml-1">任意</span></label>
                                        <input type="text" value={gender} onChange={e=>setGender(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="性別" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">地域 <span className="text-gray-400 text-[10px] font-normal ml-1">任意</span></label>
                                        <input type="text" value={location} onChange={e=>setLocation(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="地域" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">職業 <span className="text-gray-400 text-[10px] font-normal ml-1">任意</span></label>
                                        <input type="text" value={profession} onChange={e=>setProfession(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="職業" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Brand Tone & Manner */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>ブランドボイス＆トーン</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">トーン＆スタイル</label>
                                        <select value={toneStyle} onChange={e=>setToneStyle(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all text-sm">
                                            {TONE_STYLE_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">執筆スタイル <span className="text-gray-400 text-[10px] font-normal ml-1">任意</span></label>
                                        <input type="text" value={writingStyleNotes} onChange={e=>setWritingStyleNotes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="執筆スタイル" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">参考キャプション (2–3サンプル) <span className="text-gray-400 text-[10px] font-normal ml-1">任意</span></label>
                                        <textarea value={exampleCaptions} onChange={e=>setExampleCaptions(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-h-[100px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="参考キャプション" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: Posting Plan */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>投稿プラン <span className="text-gray-400 text-[10px] font-normal ml-2">すべて任意</span></span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">投稿頻度</label>
                                        <select value={postingFrequency} onChange={e=>setPostingFrequency(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all text-sm">
                                            {FREQUENCY_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">推奨投稿時間</label>
                                        <input type="text" value={preferredTimeSlots} onChange={e=>setPreferredTimeSlots(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="例: 19:00-21:00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">キャンペーン期間</label>
                                        <input type="text" value={campaignDuration} onChange={e=>setCampaignDuration(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="キャンペーン期間" />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: CTAs and Restrictions */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>CTAと制限事項</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">推奨CTA</label>
                                        <div className="flex flex-wrap gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                            {CTA_OPTIONS.map(opt => (
                                                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={preferredCtaTypes.includes(opt.value)}
                                                        onChange={e => {
                                                            const current = preferredCtaTypes ? preferredCtaTypes.split(',').map(v=>v.trim()).filter(v=>v) : []
                                                            if (e.target.checked) {
                                                                setPreferredCtaTypes([...current, opt.value].join(', '))
                                                            } else {
                                                                setPreferredCtaTypes(current.filter(v => v !== opt.value).join(', '))
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/20" 
                                                    />
                                                    <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">NGワード</label>
                                        <input type="text" value={wordsToAvoid} onChange={e=>setWordsToAvoid(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="NGワード" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">トーンの制限事項</label>
                                        <select value={toneRestrictions} onChange={e=>setToneRestrictions(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all text-sm">
                                            {TONE_RESTRICTIONS_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 6: Additional Instructions */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-900 font-bold border-b border-gray-100 pb-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>追加の指示</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">カスタムプロンプトの指示</label>
                                        <textarea value={customPromptNotes} onChange={e=>setCustomPromptNotes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-h-[80px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="カスタムプロンプトの指示" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">キャンペーン固有の指示</label>
                                        <textarea value={campaignSpecificInstructions} onChange={e=>setCampaignSpecificInstructions(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-h-[80px] focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" placeholder="キャンペーン固有の指示" />
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-gray-100 shrink-0">
                            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">キャンセル</button>
                            <button type="submit" disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-95">
                                {isSaving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {viewingProject && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                                <FolderKanban className="w-6 h-6 text-indigo-600" />
                                {viewingProject.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { closeViewModal(); openModal(viewingProject); }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"><Edit2 className="w-4 h-4" /></button>
                                <button type="button" onClick={(e) => { closeViewModal(); handleDelete(viewingProject.id, e); }} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"><Trash2 className="w-4 h-4" /></button>
                                <div className="w-px h-6 bg-gray-200 mx-1" />
                                <button type="button" onClick={closeViewModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin space-y-6">
                            {viewingProject.description && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">プロジェクト説明</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">{viewingProject.description}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {viewingProject.objective && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">目的</h3>
                                        <p className="text-sm font-semibold text-gray-900">{PURPOSE_OPTIONS.find(o => o.value === viewingProject.objective)?.label || viewingProject.objective}</p>
                                    </div>
                                )}
                                {viewingProject.toneStyle && (
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">トーン＆スタイル</h3>
                                        <p className="text-sm font-semibold text-gray-900">{TONE_STYLE_OPTIONS.find(o => o.value === viewingProject.toneStyle)?.label || viewingProject.toneStyle}</p>
                                    </div>
                                )}
                            </div>

                            {viewingProject.defaultHashtags && viewingProject.defaultHashtags.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">デフォルトハッシュタグ</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingProject.defaultHashtags.map((tag, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(viewingProject.ageRange || viewingProject.gender || viewingProject.location || viewingProject.profession) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">ターゲット層</h3>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        {viewingProject.ageRange && <div><span className="text-xs text-gray-500 block mb-0.5">年齢層</span><span className="text-sm font-semibold text-gray-900">{viewingProject.ageRange}</span></div>}
                                        {viewingProject.gender && <div><span className="text-xs text-gray-500 block mb-0.5">性別</span><span className="text-sm font-semibold text-gray-900">{viewingProject.gender}</span></div>}
                                        {viewingProject.location && <div><span className="text-xs text-gray-500 block mb-0.5">地域</span><span className="text-sm font-semibold text-gray-900">{viewingProject.location}</span></div>}
                                        {viewingProject.profession && <div><span className="text-xs text-gray-500 block mb-0.5">職業</span><span className="text-sm font-semibold text-gray-900">{viewingProject.profession}</span></div>}
                                    </div>
                                </div>
                            )}

                            {(viewingProject.writingStyleNotes || viewingProject.exampleCaptions) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">ブランドボイス</h3>
                                    <div className="space-y-3 mt-3">
                                        {viewingProject.writingStyleNotes && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">執筆スタイル</span>
                                                <p className="text-sm font-semibold text-gray-900">{viewingProject.writingStyleNotes}</p>
                                            </div>
                                        )}
                                        {viewingProject.exampleCaptions && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">参考キャプション</span>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">{viewingProject.exampleCaptions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(viewingProject.postingFrequency || viewingProject.preferredTimeSlots || viewingProject.campaignDuration) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">投稿プラン</h3>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        {viewingProject.postingFrequency && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">投稿頻度</span>
                                                <span className="text-sm font-semibold text-gray-900">{FREQUENCY_OPTIONS.find(o => o.value === viewingProject.postingFrequency)?.label || viewingProject.postingFrequency}</span>
                                            </div>
                                        )}
                                        {viewingProject.preferredTimeSlots && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">推奨投稿時間</span>
                                                <span className="text-sm font-semibold text-gray-900">{viewingProject.preferredTimeSlots}</span>
                                            </div>
                                        )}
                                        {viewingProject.campaignDuration && (
                                            <div className="col-span-2">
                                                <span className="text-xs text-gray-500 block mb-0.5">キャンペーン期間</span>
                                                <span className="text-sm font-semibold text-gray-900">{viewingProject.campaignDuration}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(viewingProject.preferredCtaTypes || viewingProject.wordsToAvoid || viewingProject.toneRestrictions) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">CTAと制限事項</h3>
                                    <div className="space-y-3 mt-3">
                                        {viewingProject.preferredCtaTypes && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">推奨CTA</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {viewingProject.preferredCtaTypes.split(',').map(c => c.trim()).filter(Boolean).map((c, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {viewingProject.wordsToAvoid && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">NGワード</span>
                                                <p className="text-sm font-semibold text-red-700">{viewingProject.wordsToAvoid}</p>
                                            </div>
                                        )}
                                        {viewingProject.toneRestrictions && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">トーン制限</span>
                                                <p className="text-sm font-semibold text-gray-900">{TONE_RESTRICTIONS_OPTIONS.find(o => o.value === viewingProject.toneRestrictions)?.label || viewingProject.toneRestrictions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {(viewingProject.customPromptNotes || viewingProject.campaignSpecificInstructions) && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">追加の指示</h3>
                                    <div className="space-y-3 mt-3">
                                        {viewingProject.customPromptNotes && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">カスタムプロンプト指示</span>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">{viewingProject.customPromptNotes}</p>
                                            </div>
                                        )}
                                        {viewingProject.campaignSpecificInstructions && (
                                            <div>
                                                <span className="text-xs text-gray-500 block mb-0.5">キャンペーン固有の指示</span>
                                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">{viewingProject.campaignSpecificInstructions}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
