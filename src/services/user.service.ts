import { supabase } from '@/lib/supabase'
import { throwIfError } from '@/lib/supabase-error'
import type { PaginatedResponse, PaginationParams } from '@/types'
import { BaseService } from './base.service'

// Khởi tạo base service cho bảng profiles (users)
// profiles dùng UUID làm ID nên Generic T là any hoặc interface User cụ thể
// Tắt softDelete vì bảng profiles không có cột deleted_at
const base = new BaseService<any>('profiles', (row) => row, { softDelete: false })

export const userService = {
    /**
     * Lấy danh sách người dùng kèm phân trang
     */
    getAll: async (params: PaginationParams & { search?: string }): Promise<PaginatedResponse<any>> => {
        return base.getPaginated(
            {
                ...params,
                searchColumns: ['username', 'email', 'fullname'] // Định nghĩa các cột cho phép search
            },
            '*, roles(id, name)'
        )
    },

    /** Lấy chi tiết user kèm role */
    getById: (userId: string) => {
        return base.getById(userId, '*, roles(id, name)')
    },

    /**
     * Cập nhật thông tin người dùng
     */
    update: async (userId: string, payload: any) => {
        const { data, error } = await (supabase as any)
            .from('profiles')
            .update(payload)
            .eq('id', userId)
            .select()
            .single()

        return throwIfError(data, error, 'Cập nhật thông tin thất bại')
    }
}