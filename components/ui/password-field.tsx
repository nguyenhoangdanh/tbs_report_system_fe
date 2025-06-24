import { useState } from 'react'
import { FormField } from './form-field'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordFieldProps {
    id: string
    label: string
    required?: boolean
    placeholder?: string
    error?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    [key: string]: any
}

export function PasswordField({
    id,
    label,
    required,
    placeholder,
    error,
    value,
    onChange,
    onBlur,
    ...rest
}: PasswordFieldProps) {
    const [show, setShow] = useState(false)
    return (
        <div className="relative">
            <FormField
                id={id}
                type={show ? 'text' : 'password'}
                label={label}
                required={required}
                placeholder={placeholder}
                error={error}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                {...rest}
            />
            <button
                type="button"
                tabIndex={-1}
                className={`absolute right-3 -translate-y-1/2 bg-transparent p-0 m-0 text-muted-foreground hover:text-foreground
            ${error ? 'top-1/2' : 'top-[70%]'}
                `}
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ lineHeight: 0 }}
            >
                {show ? (
                    <EyeOff className="w-5 h-5" />
                ) : (
                    <Eye className="w-5 h-5" />
                )}
            </button>
        </div>
    )
}
