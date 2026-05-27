import { supabase } from '@/lib/supabase'
import type { LoginPayload, RegisterPayload } from '@/types'
import { userService } from './user.service'

async function resolveLoginEmail(username: string): Promise<string> {
    if (username.includes('@')) {
        return username
    }

    const { data, error } = await supabase.rpc('get_login_email', {
        p_username: username,
    })

    if (error || !data) {
        throw new Error('Sai tên đăng nhập hoặc mật khẩu')
    }

    return data
}

export const authService = {
    login: async (payload: LoginPayload) => {
        const email = await resolveLoginEmail(payload.username.trim())

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: payload.password,
        })

        if (error) {
            throw new Error(
                error.message === 'Invalid login credentials'
                    ? 'Sai tên đăng nhập hoặc mật khẩu'
                    : error.message
            )
        }

        return data
    },

    register: async ({ email, username, password }: RegisterPayload) => {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { username: username.trim() },
            },
        })

        if (error) {
            const msg = error.message.toLowerCase()
            if (msg.includes('already registered') || msg.includes('already been registered')) {
                throw new Error('Email đã được đăng ký')
            }
            if (msg.includes('password')) {
                throw new Error('Mật khẩu không đủ mạnh (tối thiểu 6 ký tự)')
            }
            throw new Error(error.message)
        }

        return data
    },

    logout: () => supabase.auth.signOut(),

    getSession: () => supabase.auth.getSession(),

    onAuthStateChange: (
        callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
    ) => supabase.auth.onAuthStateChange(callback),

    /** Lấy profile qua userService (đã kế thừa BaseService) */
    fetchProfile: (userId: string) => userService.getById(userId)
}
