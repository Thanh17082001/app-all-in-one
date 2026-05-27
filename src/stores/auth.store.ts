import { defineStore } from 'pinia'
import { authService } from '@/services/auth.service'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types'
import { SupabaseServiceError } from '@/lib/supabase-error'
import router from '@/router'
import { useToast } from '@/composables/useToast'

function mapProfileToUser(profile: {
    id: string
    username: string
    fullname: string | null
    email: string
    roles: { name: string } | { name: string }[] | null,
}): AuthUser {
    const roleRecord = Array.isArray(profile.roles)
        ? profile.roles[0]
        : profile.roles
    const roleName = (roleRecord?.name || 'user').toLowerCase().trim()

    return {
        id: profile.id,
        username: profile.username,
        fullname: profile.fullname || profile.username,
        email: profile.email,
        role: (roleName === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
    }
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        initialized: false,
        user: null as AuthUser | null,
        sessionReady: false,
    }),

    getters: {
        isLoggedIn: state => state.sessionReady && !!state.user,
        isAdmin: state => state.user?.role === 'admin',
    },

    actions: {
        async init() {
            if (this.initialized) return

            // authService.getSession() sẽ tự động kiểm tra Local Storage. 
            // Nếu thấy có token hợp lệ, nó sẽ trả về session mà không cần bắt user nhập lại pass.
            const { data } = await authService.getSession()
            if (data.session?.user) {
                await this.loadUser(data.session.user.id).catch(() => {
                    useToast().error('Không thể tải thông tin tài khoản')
                })
            }

            authService.onAuthStateChange(async (_event, session) => {
                if (session?.user) {
                    await this.loadUser(session.user.id).catch(() => {
                        useToast().error('Không thể tải thông tin tài khoản')
                    })
                } else {
                    this.user = null
                    this.sessionReady = false
                }
            })

            this.initialized = true
        },

        async loadUser(userId: string) {
            try {
                const profile = await authService.fetchProfile(userId) as {
                    id: string
                    username: string
                    fullname: string | null
                    email: string
                    roles: { name: string } | { name: string }[] | null
                }
                this.user = mapProfileToUser({
                    id: profile.id,
                    username: profile.username,
                    fullname: profile.fullname || null,
                    email: profile.email,
                    roles: profile.roles,
                })
                this.sessionReady = true
            } catch {
                this.user = null
                this.sessionReady = false
                throw new Error('Không thể tải thông tin hồ sơ người dùng.')
            }
        },

        async login(payload: LoginPayload) {
            const { session } = await authService.login(payload)
            if (!session?.user) {
                throw new Error('Đăng nhập thất bại')
            }
            await this.loadUser(session.user.id)
        },

        /**
         * @returns 'session' — đăng nhập ngay; 'email_confirm' — cần xác nhận email
         */
        async register(payload: RegisterPayload): Promise<'session' | 'email_confirm'> {
            const { session, user } = await authService.register(payload)

            if (session?.user) {
                await this.loadUser(session.user.id)
                return 'session'
            }

            if (user && !session) {
                return 'email_confirm'
            }

            throw new Error('Đăng ký thất bại')
        },

        async logout() {
            await authService.logout()
            this.user = null
            this.sessionReady = false
            router.push('/login')
        },

        handleServiceError(err: unknown) {
            if (err instanceof SupabaseServiceError && err.status === 403) {
                useToast().error('Bạn không có quyền thực hiện thao tác này')
                router.push('/403')
            }
            throw err
        },
    },
})
