"use client";

import { AuthService } from "@/services/auth.service";
import type {
  RegisterDto,
  ChangePasswordDto,
  User,
  AuthResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { is } from "date-fns/locale";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Simplified profile query with better error handling
  const {
    data: user,
    isLoading: queryLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      try {
        console.log("[Auth] Fetching profile...");
        const result = await AuthService.getProfile();
        console.log("[Auth] Profile success:", result?.employeeCode);
        return result;
      } catch (error: any) {
        console.log("[Auth] Profile fetch failed:", error.message);
        // Don't throw the error, just return null for unauthenticated state
        if (error.status === 401 || error.status === 403) {
          return null;
        }
        throw error;
      }
    },
    enabled: isMounted,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Simple loading logic - be more permissive
  const isLoading = isMounted && queryLoading && !user && !error;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { employeeCode: string; password: string }) => {
      return AuthService.login(data);
    },
    onSuccess: (data: AuthResponse) => {
      queryClient.setQueryData(["auth", "profile"], data.user);
      toast.success("Đăng nhập thành công!");

      const isSuperAdmin = data.user?.role === "SUPERADMIN";

      // Short delay before redirect
      setTimeout(() => {
        const returnUrl = new URLSearchParams(window.location.search).get(
          "returnUrl"
        );
        const targetUrl = isSuperAdmin
          ? "/admin/hierarchy"
          : returnUrl || "/dashboard";
        console.log("[Auth] Redirecting to:", targetUrl);
        router.replace(targetUrl);
      }, 500);
    },
    onError: (error: any) => {
      console.error("[Auth] Login error:", error);
      toast.error(error.message || "Đăng nhập thất bại!");
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await AuthService.logout();
      } catch (error) {
        console.warn("[Auth] Logout API error, continuing...", error);
      }
    },
    onSuccess: () => {
      console.log("[Auth] Logout success, clearing data");
      queryClient.setQueryData(["auth", "profile"], null);
      queryClient.clear();
      toast.success("Đăng xuất thành công!");
      router.replace("/login");
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterDto) => AuthService.register(data),
    onSuccess: (data: AuthResponse) => {
      if (data.user) {
        queryClient.setQueryData(["auth", "profile"], data.user);
        toast.success("Đăng ký thành công!");
        setTimeout(() => router.replace("/dashboard"), 1000);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Đăng ký thất bại!");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordDto) => AuthService.changePassword(data),
    onSuccess: () => toast.success("Đổi mật khẩu thành công!"),
    onError: (error: any) =>
      toast.error(error.message || "Đổi mật khẩu thất bại!"),
  });

  const isAuthenticated = !!user;

  console.log("[Auth] User state:", user);

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    login: async (employeeCode: string, password: string): Promise<void> => {
      await loginMutation.mutateAsync({ employeeCode, password });
    },
    register: async (data: RegisterDto): Promise<void> => {
      await registerMutation.mutateAsync(data);
    },
    logout: async (): Promise<void> => {
      await logoutMutation.mutateAsync();
    },
    changePassword: async (data: ChangePasswordDto): Promise<void> => {
      await changePasswordMutation.mutateAsync(data);
    },
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    isChangePasswordLoading: changePasswordMutation.isPending,
  };
}
