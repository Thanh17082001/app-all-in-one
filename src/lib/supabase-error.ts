import type { PostgrestError } from '@supabase/supabase-js'

export class SupabaseServiceError extends Error {
    code?: string
    status?: number

    constructor(message: string, code?: string, status?: number) {
        super(message)
        this.name = 'SupabaseServiceError'
        this.code = code
        this.status = status
    }
}

export function throwIfError<T>(
    data: T | null,
    error: PostgrestError | null,
    fallback = 'Yêu cầu thất bại'
): T {
    if (error) {
        if (error.code === '42501' || error.message?.includes('permission')) {
            throw new SupabaseServiceError(
                'Bạn không có quyền thực hiện thao tác này',
                error.code,
                403
            )
        }
        throw new SupabaseServiceError(error.message || fallback, error.code)
    }
    if (data === null) {
        throw new SupabaseServiceError(fallback)
    }
    return data
}
