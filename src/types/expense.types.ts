import type { OwnedEntity, PaginationParams } from './index'

export type TransactionType = 'expense' | 'income' |'all'

export interface Expense extends OwnedEntity {
    title: string
    amount: number
    note: string | null
    transaction_date: string
    transaction_type: TransactionType
    type_id: number | null
    // Dữ liệu quan hệ (nếu có join với expense_types hoặc profiles)
    expense_types?: {
        name: string
    }
    profiles?: {
        username: string
    }
}

export interface CreateExpensePayload {
    title: string
    amount: number
    transaction_type: TransactionType
    transaction_date?: string
    type_id?: number | null
    note?: string
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>

export interface ExpenseQueryParams extends PaginationParams {
    transaction_type?: TransactionType
    type_id?: number
    userIdFilter?: string | 'all' | 'system'
}

// --- Types cho Danh mục chi phí (ExpenseType) ---
export interface ExpenseType extends OwnedEntity {
    name: string
    description: string | null
}

export interface CreateExpenseTypePayload {
    name: string
    description?: string
}

export interface ExpenseTypeQueryParams extends PaginationParams {
    search?: string
    userIdFilter?: string | 'all' | 'system'
}