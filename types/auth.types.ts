export interface LoginDto {
  employeeCode: string
  password: string
  rememberMe?: boolean // ✅ Add rememberMe field
}