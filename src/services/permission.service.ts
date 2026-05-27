import { supabase } from '@/lib/supabase'
import { throwIfError } from '@/lib/supabase-error'
import { toBaseEntity } from '@/lib/db-mappers'
import type { Role } from '@/types/permission.types'
//role service thôi vì tôi lười đổi tên
export const permissionService = {
    /**
     * Lấy danh sách các vai trò (roles) hiện có
     */
    getRoles: async (): Promise<Role[]> => {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .is('deleted_at', null)

        throwIfError(data, error)

        return (data || []).map(row => ({
            ...toBaseEntity(row),
            name: row.name,
            code: row.name.toLowerCase(),
        })) as Role[]
    }
}