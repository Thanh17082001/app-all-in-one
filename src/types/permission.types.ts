import type { BaseEntity, PaginationParams } from '@/types'

export interface Role extends BaseEntity {
    name: string
    code: string
}

export interface RoleQueryParams extends PaginationParams {
    // filter theo name nếu cần
}
