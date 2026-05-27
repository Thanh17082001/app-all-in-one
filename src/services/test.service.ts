import { supabase } from '@/lib/supabase'
import { BaseService } from './base.service'
import { toOwnedEntity } from '@/lib/db-mappers'
import { throwIfError } from '@/lib/supabase-error'
import { SupabaseServiceError } from '@/lib/supabase-error'
import type {
    CreateTestPayload,
    Test,
    TestQueryParams,
    UpdateTestPayload,
} from '@/types/test.types'
import type { PaginatedResponse } from '@/types'

const mapTest = (row: any): Test => ({
    ...toOwnedEntity(row),
    name: row.name,
    // PostgREST có thể trả về một mảng hoặc object tùy theo cấu hình quan hệ
    // Chúng ta đảm bảo lấy đúng object đầu tiên nếu nó trả về mảng
    profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
})

// Khởi tạo base service cho bảng tests
const base = new BaseService<Test>('tests', mapTest)

export const testService = {
    // Bây giờ getAll chỉ là một dòng gọi hàm từ base
    getAll: async (
        params?: TestQueryParams
    ): Promise<PaginatedResponse<Test>> => {
        return base.getPaginated(params ?? { page: 1, limit: 10 }, '*, profiles!tests_user_id_fkey(username)')
    },

    getById: async (id: number): Promise<Test> => {
        return base.getById(id, '*, profiles!tests_user_id_fkey(username)')
    },

    create: async (payload: CreateTestPayload): Promise<Test> => {
        // Lấy User ID từ session hiện tại
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new SupabaseServiceError('Người dùng chưa đăng nhập hoặc không tìm thấy ID người dùng.');
        }

        const { data, error } = await supabase
            .from('tests')
            .insert({ name: payload.name, user_id: user.id })
            .select()
            .single()
        const row = throwIfError(data, error)
        return mapTest(row)
    },

    update: async (id: number, payload: UpdateTestPayload): Promise<Test> => {
        const { data, error } = await supabase
            .from('tests')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        const row = throwIfError(data, error)
        return mapTest(row)
    },

    delete: (id: number) => base.deleteSoft(id),
}
