import { ref, reactive } from 'vue'
import { expenseService } from '@/services/expense.service'
import type { Expense, CreateExpensePayload, UpdateExpensePayload, ExpenseQueryParams } from '@/types/expense.types'
import type { PaginationParams, paginationResult } from '@/types'

export function useExpense() {
    const items = ref<Expense[]>([])
    const analyticsItems = ref<Expense[]>([])
    const total = ref(0)
    const loading = ref(false)
    const error = ref<string | null>(null)

    const params = reactive<ExpenseQueryParams>({
        page: 1,
        limit: 10,
        sortOrder: 'DESC',
        sortBy: 'transaction_date',

    })



    const paginationResult = reactive<paginationResult>({
        totalItems: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    })

    const pagination = ref<PaginationParams>({
        page: 1,
        limit: 10,
        sortBy: 'transaction_date',
        sortOrder: 'DESC',
    })


    const fetchAll = async () => {
        loading.value = true
        error.value = null
        try {
            // Tạo bản sao params để xử lý các giá trị mặc định trước khi gửi API
            const queryParams = { ...params } as any;

            // Dọn dẹp các giá trị 'all' để không gửi lên server lọc nhầm chuỗi
            if (queryParams.transaction_type === 'all') delete queryParams.transaction_type;
            if (queryParams.type_id === 'all' || queryParams.type_id === 0) delete queryParams.type_id;
            if (queryParams.userIdFilter === 'all') delete queryParams.userIdFilter;

            // Cấu hình các cột cần tìm kiếm cho BaseService
            if (queryParams.search) queryParams.searchColumns = ['title', 'note'];
            console.log(queryParams, 'gửi lên');
            const res = await expenseService.getAll(queryParams)
            items.value = res.items
            total.value = res.pagination.totalItems
            pagination.value = { ...res.pagination }
            Object.assign(paginationResult, res.pagination)
        } catch (err: any) {
            error.value = err.message
        } finally {
            loading.value = false
        }
    }

    const fetchAnalytics = async () => {
        try {
            // Lấy dữ liệu không phân trang (limit lớn) để làm biểu đồ
            const queryParams = { ...params, limit: 1000, page: 1 } as any;

            // Dọn dẹp tương tự fetchAll
            if (queryParams.transaction_type === 'all') delete queryParams.transaction_type;
            if (queryParams.type_id === 'all' || queryParams.type_id === 0) delete queryParams.type_id;
            if (queryParams.userIdFilter === 'all') delete queryParams.userIdFilter;

            // Lưu ý: transaction_date được gán từ filterDate trong View
            if (queryParams.search) queryParams.searchColumns = ['title', 'note'];

            const res = await expenseService.getAll(queryParams);
            analyticsItems.value = res.items;
        } catch (err: any) {
            console.error('Lỗi tải dữ liệu biểu đồ:', err);
        }
    }

    const create = async (payload: CreateExpensePayload) => {
        const newItem = await expenseService.create(payload)
        await Promise.all([fetchAll(), fetchAnalytics()]) // Refresh cả danh sách và biểu đồ
        return newItem
    }

    const createBulk = async (payloads: CreateExpensePayload[]) => {
        loading.value = true
        try {
            await expenseService.createBulk(payloads)
            await Promise.all([fetchAll(), fetchAnalytics()])
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    const scanReceipt = async (file: File, categories: any[]) => {
        loading.value = true
        try {
            return await expenseService.scanReceipt(file, categories)
        } catch (err: any) {
            error.value = err.message
            throw err
        } finally {
            loading.value = false
        }
    }

    const update = async (id: number, payload: UpdateExpensePayload) => {
        const updated = await expenseService.update(id, payload)
        await Promise.all([fetchAll(), fetchAnalytics()])
        return updated
    }

    const remove = async (id: number) => {
        await expenseService.delete(id)
        await Promise.all([fetchAll(), fetchAnalytics()])
    }

    return {
        items, analyticsItems, total, loading, error, params, pagination, paginationResult, fetchAll, fetchAnalytics, create, createBulk, scanReceipt, update, remove
    }
}