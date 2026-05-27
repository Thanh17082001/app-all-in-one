import type { BaseEntity, OwnedEntity } from '@/types'

type RowWithTimestamps = {
    id: number
    uuid: string
    created_at: string
    updated_at: string
    deleted_at?: string | null
}

export function toBaseEntity(row: RowWithTimestamps): BaseEntity {
    return {
        id: row.id,
        uuid: row.uuid,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at ?? null,
    }
}

/** Chuyển đổi dữ liệu DB sang OwnedEntity (có userId) */
export function toOwnedEntity(row: any): OwnedEntity {
    return {
        ...toBaseEntity(row),
        userId: row.user_id,
    }
}



/** Map FE sort field → Postgres column */
export function toDbSortColumn(sortBy?: string): string {
    const map: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
    return map[sortBy ?? ''] ?? 'created_at'
}
