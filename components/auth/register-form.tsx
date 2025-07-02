'use client'

import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { FormField, SelectField } from '@/components/ui/form-field'
import { SelectItem } from '@/components/ui/select'
import { AnimatedButton } from '@/components/ui/animated-button'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { UserService } from '@/services/user.service'
import { toast } from 'react-hot-toast'
import { type Office, type JobPosition, type Department, type UserRole } from '@/types'
import { PasswordField } from '../ui/password-field'
import { useRegister } from '@/hooks/use-auth'

export function RegisterForm() {
  const [offices, setOffices] = useState<Office[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)

  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      employeeCode: '',
      email: '',
      password: 'Abcd@1234',
      confirmPassword: 'Abcd@1234',
      firstName: '',
      lastName: '',
      phone: '',
      officeId: '',
      departmentId: '',
      jobPositionId: '',
      role: 'USER' as UserRole, // Changed to string literal
    }
  })

  const watchedOfficeId = watch('officeId')
  const watchedDepartmentId = watch('departmentId')

  // Memoize filtered data for performance
  const filteredDepartments = useMemo(() => {
    return watchedOfficeId
      ? departments.filter(dept => dept.officeId === watchedOfficeId)
      : []
  }, [departments, watchedOfficeId])

  const filteredJobPositions = useMemo(() => {
    return watchedDepartmentId
      ? jobPositions.filter(jp => jp.departmentId === watchedDepartmentId)
      : []
  }, [jobPositions, watchedDepartmentId])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (watchedOfficeId) {
      const isCurrentDepartmentValid = filteredDepartments.find(d => d.id === watchedDepartmentId)
      if (!isCurrentDepartmentValid) {
        setValue('departmentId', '')
        setValue('jobPositionId', '')
      }
    } else {
      setValue('departmentId', '')
      setValue('jobPositionId', '')
    }
  }, [watchedOfficeId, filteredDepartments, watchedDepartmentId, setValue])

  useEffect(() => {
    if (watchedDepartmentId) {
      const isCurrentJobPositionValid = filteredJobPositions.find(jp => jp.id === watch('jobPositionId'))
      if (!isCurrentJobPositionValid) {
        setValue('jobPositionId', '')
      }
    } else {
      setValue('jobPositionId', '')
    }
  }, [watchedDepartmentId, filteredJobPositions, setValue, watch])

  const loadData = async () => {
    try {
      const [officesData, departmentsData, jobPositionsData] = await Promise.all([
        UserService.getOffices(),
        UserService.getDepartments(),
        UserService.getJobPositions()
      ])
      setOffices(officesData)
      setDepartments(departmentsData)
      setJobPositions(jobPositionsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'USER', label: 'User' },
    { value: 'OFFICE_ADMIN', label: 'Office Admin' },
    { value: 'OFFICE_MANAGER', label: 'Office Manager' }
  ]

  const onSubmit = async (data: RegisterFormData) => {
    try {
      console.log('Submitting registration data:', data)
      await registerMutation.mutateAsync({
        employeeCode: data.employeeCode,
        email: data.email || undefined,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        jobPositionId: data.jobPositionId,
        officeId: data.officeId,
        role: data.role as UserRole, // Explicit cast to UserRole
      })
      // Redirect được handle trong useRegister hook
    } catch (error) {
      // Error is handled by the useRegister hook
      console.error('Registration failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 min-h-[300px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <FormField
              id="employeeCode"
              label="Mã nhân viên"
              placeholder="EMP001"
              required
              {...register('employeeCode')}
              error={errors.employeeCode?.message}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
          >
            <FormField
              id="firstName"
              label="Họ"
              required
              {...register('firstName')}
              error={errors.firstName?.message}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.21 }}
          >
            <SelectField
              label="Văn phòng"
              required
              placeholder="Chọn văn phòng"
              value={watch('officeId')}
              onValueChange={(value) => setValue('officeId', value)}
              error={errors.officeId?.message}
            >
              {offices.map((office) => (
                <SelectItem key={office.id} value={office.id}>
                  <div className="flex items-center gap-2">
                    <span>{office.type === 'HEAD_OFFICE' ? '🏢' : '🏭'}</span>
                    {office.name}
                  </div>
                </SelectItem>
              ))}
            </SelectField>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24 }}
          >
            <SelectField
              label="Vai trò"
              required
              placeholder="Chọn vai trò"
              value={watch('role')}
              onValueChange={(value) => setValue('role', value as UserRole)}
              error={errors.role?.message}
            >
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectField>
          </motion.div>
        </div>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >

            <FormField
              id="phone"
              label="Số điện thoại"
              placeholder="0123456789"
              maxLength={10}
              {...register('phone')}
              error={errors.phone?.message}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
          >
            <FormField
              id="lastName"
              label="Tên"
              required
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.21 }}
          >
            <SelectField
              label="Phòng ban"
              required
              placeholder={!watchedOfficeId ? "Vui lòng chọn văn phòng trước" : "Chọn phòng ban"}
              value={watch('departmentId')}
              onValueChange={(value) => setValue('departmentId', value)}
              disabled={!watchedOfficeId}
              error={errors.departmentId?.message}
            >
              {filteredDepartments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectField>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.24 }}
          >
            <SelectField
              label="Vị trí công việc"
              required
              placeholder={!watchedDepartmentId ? "Vui lòng chọn phòng ban trước" : "Chọn vị trí công việc"}
              value={watch('jobPositionId')}
              onValueChange={(value) => setValue('jobPositionId', value)}
              disabled={!watchedDepartmentId}
              error={errors.jobPositionId?.message}
            >
              {filteredJobPositions.map((jobPosition) => (
                <SelectItem key={jobPosition.id} value={jobPosition.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{jobPosition.jobName}</span>
                    <span className="text-xs text-muted-foreground">
                      {jobPosition.position?.name} - {jobPosition.code}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectField>
          </motion.div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PasswordField
            id="password"
            label="Mật khẩu"
            required
            {...register('password')}
            error={errors.password?.message}
          />
          <PasswordField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            required
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <AnimatedButton
          type="submit"
          variant="gradient"
          className="w-full h-12 text-lg font-semibold"
          loading={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </AnimatedButton>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Tài khoản mặc định: <span className="font-semibold">USER</span> / <span className="font-semibold">Abcd@1234</span>
        </div>
      </motion.div>
    </form>
  )
}
