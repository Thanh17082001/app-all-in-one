/**
 * useTest Composable
 * Xử lý state và business logic của module Test
 */
import { ref, reactive } from 'vue'
import { testService } from '@/services/test.service'
import type { Test, CreateTestPayload, UpdateTestPayload, TestQueryParams } from '@/types/test.types'
import { SupabaseServiceError } from '@/lib/supabase-error'
import router from '@/router'

export function useTest() {
    const items = ref<Test[]>([])
    const total = ref(0)
    const pagination = ref({
        currentPage: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    })

    const loading = ref(false)
    const error = ref('')

    const params = reactive<TestQueryParams>({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
    })

    const fetchAll = async () => {
        loading.value = true
        error.value = ''
        try {
            const res = await testService.getAll(params)
            items.value = res.items
            total.value = res.pagination.totalItems
            pagination.value = res.pagination
        } catch (err: unknown) {
            if (err instanceof SupabaseServiceError && err.status === 403) {
                router.push('/403')
                return
            }
            error.value =
                err instanceof Error ? err.message : 'Lỗi tải dữ liệu'
        } finally {
            loading.value = false
        }
    }

    const create = async (payload: CreateTestPayload) => {
        await testService.create(payload)
        await fetchAll()
    }

    const update = async (id: number, payload: UpdateTestPayload) => {
        await testService.update(id, payload)
        await fetchAll()
    }

    const remove = async (id: number) => {
        await testService.delete(id)
        await fetchAll()
    }

    return {
        items,
        total,
        loading,
        error,
        params,
        pagination,
        fetchAll,
        create,
        update,
        remove,
    }
}
