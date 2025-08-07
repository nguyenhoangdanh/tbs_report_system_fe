"use client"
import { memo, useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Trash2 } from 'lucide-react'
import { toast } from 'react-toast-kit'
import Image from 'next/image'

interface User {
  firstName?: string
  lastName?: string
  employeeCode?: string
  avatar?: string
  role?: string
  jobPosition?: {
    position?: {
      description?: string
    }
  }
}

interface UserAvatarProps {
  user: User
  onAvatarUpload?: (file: File) => Promise<void>
  onAvatarRemove?: () => Promise<void>
  allowEdit?: boolean
  isUploading?: boolean
  isRemoving?: boolean
}

export const UserAvatar = memo(({ 
  user, 
  onAvatarUpload, 
  onAvatarRemove, 
  allowEdit = true,
  isUploading = false,
  isRemoving = false
}: UserAvatarProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onAvatarUpload) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ file ảnh (JPEG, PNG, WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file using hook
    try {
      await onAvatarUpload(file)
      setPreviewUrl(null) // Clear preview after successful upload
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      setPreviewUrl(null) // Clear preview on error
    } finally {
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!onAvatarRemove) return
    
    try {
      await onAvatarRemove()
    } catch (error: any) {
      console.error('Avatar remove error:', error)
    }
  }

  const handleRemovePreview = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = () => {
    return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
  }

  const currentAvatarUrl = previewUrl || user.avatar
  const hasAvatar = !!currentAvatarUrl && !imageError
  const isProcessing = isUploading || isRemoving

  // Reset image error when URL changes
  useEffect(() => {
    if (currentAvatarUrl) {
      setImageError(false)
    }
  }, [currentAvatarUrl])

  const handleImageError = () => {
    setImageError(true)
    if (previewUrl) {
      setPreviewUrl(null)
    } else {
      console.warn('Avatar image failed to load:', currentAvatarUrl)
    }
  }

  return (
    <div className="flex flex-col items-center text-center mb-6">
      {/* Avatar Display */}
      <div className="relative group mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
          {hasAvatar ? (
            <Image
              src={currentAvatarUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={() => setImageError(false)}
              unoptimized={currentAvatarUrl?.includes('localhost') || imageError} // Use unoptimized for local/fallback
            />
          ) : (
            <span className="text-white text-2xl font-bold">
              {getInitials()}
            </span>
          )}
        </div>

        {/* Upload Overlay */}
        {allowEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        )}

        {/* Remove Preview Button */}
        {previewUrl && !isProcessing && (
          <button
            onClick={handleRemovePreview}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* User Info */}
      <h3 className="font-semibold text-lg text-foreground">
        {user.firstName} {user.lastName}
      </h3>
      <p className="text-muted-foreground text-sm">
        {user.employeeCode}
      </p>
      <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
        user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
        user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      }`}>
        {user.jobPosition?.position?.description}
      </span>

      {/* Upload & Remove Buttons */}
      {allowEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="text-xs"
            >
              <Upload className="w-3 h-3 mr-1" />
              {isUploading ? 'Đang tải...' : hasAvatar ? 'Thay đổi' : 'Thêm ảnh'}
            </Button>
            
            {hasAvatar && !previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isProcessing}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {isRemoving ? 'Đang xóa...' : 'Xóa'}
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP • Tối đa 5MB
          </p>
        </>
      )}
    </div>
  )
})

UserAvatar.displayName = 'UserAvatar'
