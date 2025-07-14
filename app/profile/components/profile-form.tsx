import { memo, useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Building2, Factory } from 'lucide-react'
import { Role, type JobPosition, type Office } from '@/types'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validations/profile'
import { UserInfoSection } from './user-info-section'

interface ProfileFormProps {
  user: any
  jobPositions: JobPosition[]
  offices: Office[]
  loadingData: boolean
  onSubmit: (data: UpdateProfileFormData) => void
  isUpdating: boolean
}

export const ProfileForm = memo(({ 
  user, 
  jobPositions, 
  offices, 
  loadingData, 
  onSubmit, 
  isUpdating 
}: ProfileFormProps) => {
  // Create stable default values
  const defaultValues = useMemo((): UpdateProfileFormData => ({
    employeeCode: user?.employeeCode || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    jobPositionId: user?.jobPosition?.id || '',
    officeId: user?.office?.id || '',
    role: user?.role || 'USER'
  }), [user])

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onChange',
    defaultValues,
  })

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      form.reset(defaultValues)
    }
  }, [user, defaultValues, form])

  const watchedOfficeId = form.watch('officeId')
  
  const filteredJobPositions = useMemo(() => {
    if (!watchedOfficeId) return jobPositions
    return jobPositions.filter(jp => jp.department?.officeId === watchedOfficeId)
  }, [jobPositions, watchedOfficeId])

  const canEditRole = useMemo(() => user?.role === Role.SUPERADMIN, [user?.role])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="employeeCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormField
              label="Mã nhân viên"
              placeholder="CEO001, EMP001..."
              required
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormField
              required
              label="Số điện thoại"
              placeholder="0123456789"
              maxLength={10}
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormField
              label="Họ"
              placeholder="Nhập họ"
              required
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormField
              label="Tên"
              placeholder="Nhập tên"
              required
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <FormField
              label="Email"
              type="email"
              placeholder="your.email@company.com"
              description="Không bắt buộc"
              {...field}
              error={fieldState.error?.message}
            />
          )}
        />

        <div className="space-y-2">
          <Label>Văn phòng <span className="text-red-500">*</span></Label>
          <Controller
            name="officeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Đang tải..." : "Chọn văn phòng"} />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        <div className="flex items-center gap-2">
                          {office.type === 'HEAD_OFFICE'
                            ? <Building2 className="w-4 h-4 text-green-500" />
                            : <Factory className="w-4 h-4 text-red-500" />}
                          {office.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Vị trí công việc <span className="text-red-500">*</span></Label>
        <Controller
          name="jobPositionId"
          control={form.control}
          render={({ field, fieldState }) => (
            <div>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loadingData || !watchedOfficeId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingData ? "Đang tải..." :
                        !watchedOfficeId ? "Chọn văn phòng trước" :
                          "Chọn vị trí công việc"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredJobPositions.map((jobPosition) => (
                    <SelectItem key={jobPosition.id} value={jobPosition.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{jobPosition.jobName}</span>
                        <span className="text-xs text-muted-foreground">
                          {jobPosition.department?.name} - {jobPosition.position?.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {canEditRole && (
        <div className="space-y-2">
          <Label>
            Vai trò
            <span className="text-xs text-muted-foreground ml-2">(Chỉ Superadmin)</span>
          </Label>
          <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Nhân viên</SelectItem>
                  <SelectItem value="ADMIN">Quản lý</SelectItem>
                  <SelectItem value="SUPERADMIN">Tổng giám đốc</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <UserInfoSection user={user} />

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          disabled={isUpdating || !form.formState.isValid}
          className="bg-green-600 hover:bg-green-700"
        >
          {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  )
})

ProfileForm.displayName = 'ProfileForm'
