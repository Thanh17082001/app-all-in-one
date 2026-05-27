import { supabase } from '@/lib/supabase'
import { throwIfError } from '@/lib/supabase-error'
import { toDbSortColumn } from '@/lib/db-mappers'
import type { PaginatedResponse, PaginationParams } from '@/types'

export class BaseService<T> {
    protected tableName: string
    protected mapper: (row: any) => T
    protected options: { softDelete: boolean }

    constructor(
        tableName: string,
        mapper: (row: any) => T,
        options = { softDelete: true }
    ) {
        this.tableName = tableName
        this.mapper = mapper
        this.options = options
    }

    /**
     * Query danh sách có phân trang và sắp xếp
     */
    async getPaginated(
        params: PaginationParams & { search?: string; searchColumns?: string[] },
        selectQuery = '*',
        customModifier?: (query: any) => any
    ): Promise<PaginatedResponse<T>> {
        const page = params.page ?? 1
        const limit = params.limit ?? 10
        const from = (page - 1) * limit
        const to = from + limit - 1
        const sortColumn = toDbSortColumn(params.sortBy)
        const ascending = params.sortOrder === 'ASC'

        let query = (supabase as any)
            .from(this.tableName)
            .select(selectQuery, { count: 'exact' });

        if (this.options.softDelete) {
            query = query.is('deleted_at', null);
        }

        // Áp dụng bộ lọc tùy chỉnh (nếu có) trước khi thực hiện search/sort
        if (customModifier) {
            query = customModifier(query);
        }

        // Thêm logic search nếu có
        if (params.search && params.searchColumns?.length) {
            const filter = params.searchColumns
                .map(col => `${col}.ilike.%${params.search}%`)
                .join(',')
            query = query.or(filter)
        }

        const { data, error, count } = await query
            .order(sortColumn, { ascending })
            .range(from, to)

        throwIfError(data, error)

        const totalItems = count ?? 0
        const totalPages = Math.max(1, Math.ceil(totalItems / limit))

        return {
            items: (data ?? []).map(this.mapper),
            pagination: {
                totalItems,
                page,
                limit,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        }
    }

    async getById(id: number | string, selectQuery = '*'): Promise<T> {
        let query = (supabase as any)
            .from(this.tableName)
            .select(selectQuery);

        if (this.options.softDelete) {
            query = query.is('deleted_at', null);
        }

        const { data, error } = await query
            .eq('id', id)
            .single()

        return this.mapper(throwIfError(data, error))
    }

    async deleteSoft(id: number | string): Promise<void> {
        const { error } = await (supabase as any)
            .from(this.tableName)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
        throwIfError({}, error)
    }
}