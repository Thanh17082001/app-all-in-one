import { ref, reactive } from 'vue'
import { expenseTypeService } from '@/services/expense-type.service'
import type { ExpenseType, ExpenseTypeQueryParams, CreateExpenseTypePayload } from '@/types/expense.types'
import { useToast } from './useToast'

export function useExpenseType() {
    const items = ref<ExpenseType[]>([])
    const loading = ref(false)
    const total = ref(0)
    const toast = useToast()

    const params = reactive<ExpenseTypeQueryParams>({
        page: 1,
        limit: 5,
        search: ''
    })

    const pagination = ref({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 5
    })

    const fetchAll = async () => {
        loading.value = true
        try {
            items.value = []
            const res = await expenseTypeService.getAll(params)
            items.value = res.items
            pagination.value = res.pagination
            total.value = res.pagination.totalItems
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Lỗi tải danh sách loại chi phí')
        } finally {
            loading.value = false
        }
    }

    const create = async (payload: CreateExpenseTypePayload & { userId?: string | null }) => {
        try {
            await expenseTypeService.create(payload)
            toast.success('Thêm loại chi phí thành công')
            await fetchAll()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Thêm loại chi phí thất bại')
            throw err
        }
    }

    const update = async (id: number, payload: Partial<CreateExpenseTypePayload>) => {
        try {
            await expenseTypeService.update(id, payload)
            toast.success('Cập nhật loại chi phí thành công')
            await fetchAll()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Cập nhật loại chi phí thất bại')
            throw err
        }
    }

    const remove = async (id: number) => {
        try {
            await expenseTypeService.delete(id)
            toast.success('Đã xóa loại chi phí')
            await fetchAll()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Xóa loại chi phí thất bại')
            throw err
        }
    }

    return {
        items,
        loading,
        fetchAll,
        params,
        pagination,
        create,
        update,
        remove
    }
}