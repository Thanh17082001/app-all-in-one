export interface LoginPayload {
    username: string
    password: string
}

export interface RegisterPayload {
    email: string
    username: string
    password: string
}


export interface AuthUser {
    id: string
    username: string
    email: string
    role: 'admin' | 'user',
    fullname: string
}

export interface PaginationParams {
    page: number
    limit: number
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC',
    search?: string,
}

export interface paginationResult {
    totalItems: number;
    page: number;
    limit: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface BaseEntity {
    id: number
    uuid: string
    createdAt: string
    updatedAt: string
    deletedAt?: string | null
}

/** 
 * Interface cho các dữ liệu có tính sở hữu (Ownership)
 * Dùng để phân biệt dữ liệu của ai thêm vào
 */
export interface OwnedEntity extends BaseEntity {
    userId: string
}

export interface PaginatedResponse<T> {
    items: T[]
    pagination: paginationResult
}



export interface ApiResponse<T> {
    success: boolean
    statusCode: number
    message: string
    data: T
    timestamp: string
}
export type TabType = 'dashboard' | 'tests' | 'users' | 'expenses' | 'notes' | 'tasks' | 'calendar' | 'files' | 'habits' | 'goals';