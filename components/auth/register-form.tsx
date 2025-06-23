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
import { useAuth } from '@/components/providers/auth-provider'
import { toast } from 'react-hot-toast'
import type { Office, JobPosition, Department } from '@/types'

export function RegisterForm() {
  const [offices, setOffices] = useState<Office[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  
  const { register: registerUser, isRegisterLoading } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
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

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        employeeCode: data.employeeCode,
        email: data.email || undefined,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        cardId: data.cardId || undefined,
        jobPositionId: data.jobPositionId,
        officeId: data.officeId,
      })
    } catch (error) {
      // Error is handled by the auth provider
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-green-600/30 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <FormField
            id="email"
            type="email"
            label="Email"
            placeholder="your.email@company.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <FormField
            id="lastName"
            label="Tên"
            required
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <FormField
          id="cardId"
          label="Căn cước công dân"
          placeholder="012345678901"
          maxLength={12}
          {...register('cardId')}
          error={errors.cardId?.message}
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FormField
            id="password"
            type="password"
            label="Mật khẩu"
            required
            {...register('password')}
            error={errors.password?.message}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <FormField
            id="confirmPassword"
            type="password"
            label="Xác nhận mật khẩu"
            required
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
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
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <AnimatedButton
          type="submit"
          variant="gradient"
          className="w-full h-12 text-lg font-semibold"
          loading={isRegisterLoading}
        >
          {isRegisterLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </AnimatedButton>
      </motion.div>
    </form>
  )
}
