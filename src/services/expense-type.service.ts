import { supabase } from '@/lib/supabase'
import { BaseService } from './base.service'
import { throwIfError } from '@/lib/supabase-error'
import { toBaseEntity } from '@/lib/db-mappers'
import type { ExpenseType, CreateExpenseTypePayload, ExpenseTypeQueryParams } from '@/types/expense.types'
import type { PaginatedResponse } from '@/types'
import type { Database } from '@/types/database.types'

type ExpenseTypeUpdate = Database['public']['Tables']['expense_types']['Update']

const mapExpenseType = (row: any): ExpenseType => ({
    ...toBaseEntity(row),
    name: row.name,
    description: row.description,
    userId: row.user_id
})

const base = new BaseService<ExpenseType>('expense_types', mapExpenseType)

export const expenseTypeService = {
    /**
     * Lấy danh sách: (user_id IS NULL) OR (user_id = current_user)
     */
    getAll: async (params: ExpenseTypeQueryParams): Promise<PaginatedResponse<ExpenseType>> => {
        const { data: { user } } = await supabase.auth.getUser()

        return base.getPaginated(
            {
                ...params,
                searchColumns: ['name', 'description']
            },
            '*',
            (query) => {
                // Nếu Admin chọn "Tất cả", không áp dụng filter user_id
                if (params.userIdFilter === 'all') {
                    return query;
                }

                // Nếu Admin chọn "Hệ thống", chỉ lấy user_id IS NULL
                if (params.userIdFilter === 'system') {
                    return query.is('user_id', null);
                }

                // Mặc định hoặc khi Admin chọn 1 user cụ thể:
                // Lấy (Hệ thống) OR (ID của user đó)
                const targetId = params.userIdFilter || user?.id;
                const filter = targetId
                    ? `user_id.is.null,user_id.eq.${targetId}`
                    : `user_id.is.null`;

                return query.or(filter);
            }
        )
    },

    create: async (payload: CreateExpenseTypePayload & { userId?: string | null }) => {
        const insertData = {
            name: payload.name,
            description: payload.description ?? null,
            user_id: payload.userId ?? null,
        }
        const { data, error } = await supabase.from('expense_types').insert(insertData).select().single()
        return mapExpenseType(throwIfError(data, error))
    },

    update: async (id: number, payload: Partial<CreateExpenseTypePayload>) => {
        const updatePayload: ExpenseTypeUpdate = {}
        if (payload.name !== undefined) updatePayload.name = payload.name
        if (payload.description !== undefined) updatePayload.description = payload.description ?? null

        const { data, error } = await supabase.from('expense_types').update(updatePayload).eq('id', id).select().single()
        return mapExpenseType(throwIfError(data, error))
    },
    delete: (id: number) => base.deleteSoft(id)
}