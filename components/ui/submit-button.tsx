import { Button } from './button'
import { Loader } from 'lucide-react'
import React from 'react'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean
    text?: string
    icon?: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
    className?: string
    fontSize?: string
    disabled?: boolean
}

export function SubmitButton({
    loading = false,
    text = 'Submit',
    icon,
    size = 'md',
    className = '',
    disabled,
    fontSize = '0.875rem', // Default to 14px
    ...props
}: SubmitButtonProps) {
    let sizeClass = ''
    if (size === 'sm') sizeClass = 'h-9 px-3 text-sm'
    else if (size === 'lg') sizeClass = 'h-12 px-6 text-lg'
    else sizeClass = 'h-10 px-4 text-md'

    return (
        <Button
            type="submit"
            disabled={loading || disabled}
            className={`flex items-center justify-center gap-2 font-semibold ${sizeClass} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <Loader className="animate-spin w-10 h-10" />
                    <span style={{ opacity: loading ? 0.5 : 1, fontSize }}>
                        {typeof loading === 'string' ? loading : 'Đang xử lý...'}
                    </span>
                </>
            ) : (
                <>
                    {icon && <span className="mr-1">{icon}</span>}
                    <span style={{ opacity: loading ? 0.5 : 1, fontSize }}>{text}</span>
                </>
            )}
        </Button>
    )
}
