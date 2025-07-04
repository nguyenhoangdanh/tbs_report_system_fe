"use client";

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectTrigger, SelectValue } from './select'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  showPasswordToggle?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    description, 
    className, 
    type, 
    showPasswordToggle = true,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField && showPassword ? 'text' : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={props.id} 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
              "dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500",
              "dark:focus:ring-green-400 dark:focus:border-green-400",
              "transition-colors duration-200",
              isPasswordField && showPasswordToggle && "pr-10",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
          
          {isPasswordField && showPasswordToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={togglePasswordVisibility}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
              )}
            </button>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

interface SelectFieldProps {
  label: string
  error?: string
  required?: boolean
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
}

export const SelectField = ({
  label,
  error,
  required,
  placeholder,
  value,
  onValueChange,
  disabled,
  children
}: SelectFieldProps) => {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          "h-12",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
