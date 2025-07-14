import { memo } from 'react'

interface User {
  jobPosition?: {
    department?: {
      name?: string
    }
    position?: {
      description?: string
    }
  }
  office?: {
    type?: string
  }
  createdAt: string
}

interface UserInfoSectionProps {
  user: User
}

export const UserInfoSection = memo(({ user }: UserInfoSectionProps) => (
  <div className="bg-muted/50 p-4 rounded-lg">
    <h4 className="font-medium text-sm mb-2">Thông tin bổ sung:</h4>
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>• <span className="font-medium">Phòng ban:</span> {user.jobPosition?.department?.name}</p>
      <p>• <span className="font-medium">Chức vụ:</span> {user.jobPosition?.position?.description}</p>
      <p>• <span className="font-medium">Loại văn phòng:</span> {
        user.office?.type === 'HEAD_OFFICE'
          ? 'Văn phòng điều hành tổ hợp'
          : 'Văn phòng nhà máy'
      }</p>
      <p>• <span className="font-medium">Ngày tạo:</span> {new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
    </div>
  </div>
))

UserInfoSection.displayName = 'UserInfoSection'
