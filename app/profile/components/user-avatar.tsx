import { memo } from 'react'

interface User {
  firstName?: string
  lastName?: string
  employeeCode?: string
  role?: string
  jobPosition?: {
    position?: {
      description?: string
    }
  }
}

interface UserAvatarProps {
  user: User
}

export const UserAvatar = memo(({ user }: UserAvatarProps) => (
  <div className="flex flex-col items-center text-center mb-6">
    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
      <span className="text-white text-2xl font-bold">
        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
      </span>
    </div>
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
  </div>
))

UserAvatar.displayName = 'UserAvatar'
