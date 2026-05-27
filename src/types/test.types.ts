/**
 * Types cho module Test
 * Định nghĩa shape của dữ liệu trao đổi giữa FE và BE
 */
import type { OwnedEntity, PaginationParams } from '@/types'

// Shape của 1 bản ghi Test trả về từ BE
export interface Test extends OwnedEntity {
    name: string
    profiles?: {
        username: string
    }
}

// Payload khi tạo mới
export interface CreateTestPayload {
    name: string
}

// Payload khi cập nhật (tất cả optional vì có thể update 1 phần)
export interface UpdateTestPayload {
    name?: string
}

// Query params khi gọi GET /test (phân trang + sort)
export interface TestQueryParams extends PaginationParams {
    // Thêm filter riêng của Test ở đây nếu cần
    // name?: string
}