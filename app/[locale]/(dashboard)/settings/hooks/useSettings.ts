import { useState } from 'react'
import { updateAiUsageOption } from '../actions'

export function useSettings(initialAiOption: string) {
    const [selectedAiOption, setSelectedAiOption] = useState(initialAiOption || 'Normal AI Use')
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSaveAiOption = async () => {
        setIsSaving(true)
        setMessage('')
        setError('')
        const res = await updateAiUsageOption(selectedAiOption)
        setIsSaving(false)
        if (res.success) {
            setMessage('設定を保存しました。')
            setError('')
            setTimeout(() => setMessage(''), 3000)
        } else {
            setError('設定の保存に失敗しました。もう一度お試しください。')
            setMessage('')
        }
    }

    return {
        selectedAiOption,
        setSelectedAiOption,
        isSaving,
        message,
        error,
        handleSaveAiOption
    }
}
