import { ref, computed, reactive } from 'vue'
import { userService } from '@/services/user.service'
import { permissionService } from '@/services/permission.service'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import type { Role } from '@/types/permission.types'

const roles = ref<Role[]>([])
const users = ref<any[]>([])
const loadingInitial = ref(false)
const loadingUsers = ref(false)

const params = reactive({
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
    search: ''
})

const pagination = ref({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
})

export function usePermission() {
    const authStore = useAuthStore()
    const toast = useToast()

    const currentUser = computed(() => authStore.user)
    const isAdmin = computed(() => authStore.isAdmin)
    const isUser = computed(() => authStore.user?.role === 'user')
    const isModerator = computed(() => false)

    const fetchInitialData = async () => {
        if (authStore.initialized) return
        loadingInitial.value = true
        try {
            await authStore.init()
        } finally {
            loadingInitial.value = false
        }
    }

    const fetchRoles = async () => {
        try {
            roles.value = await permissionService.getRoles()
        } catch {
            toast.error('Không thể tải danh sách vai trò')
        }
    }

    const fetchAllUsers = async () => {
        loadingUsers.value = true
        try {
            const res = await userService.getAll(params)
            users.value = res.items
            pagination.value = res.pagination
        } catch {
            toast.error('Lỗi tải danh sách người dùng')
        } finally {
            loadingUsers.value = false
        }
    }

    const updateUser = async (userId: string, payload: any) => {
        await userService.update(userId, payload)
        toast.success('Cập nhật người dùng thành công')
        await fetchAllUsers()
    }

    const can = (_action: string, subject: string, ownerId?: string) => {
        if (!authStore.user) return false
        if (isAdmin.value) return true

        if (isUser.value) {
            if (subject === 'tests') {
                if (ownerId && authStore.user.id !== ownerId) return false
                return true
            }
            return false
        }

        return false
    }

    return {
        loadingInitial,
        loadingUsers,
        fetchInitialData,
        fetchRoles,
        fetchAllUsers,
        updateUser,
        can,
        isAdmin,
        params,
        pagination,
        isUser,
        isModerator,
        currentUser,
        roles,
        users
    }
}
