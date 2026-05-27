<template>
    <div class="space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
            <div class="relative">
                <input v-model="params.search" type="text" placeholder="Tìm theo tên hoặc email..."
                    class="pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm w-72 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                <span class="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-gray-300 text-black-500 uppercase text-xs font-semibold">
                    <tr>
                        <th class="px-6 py-4 text-left">STT</th>
                        <th class="px-6 py-4 text-left">Họ và Tên</th>
                        <th class="px-6 py-4 text-left">Email</th>
                        <th class="px-6 py-4 text-left">Vai trò hiện tại</th>
                        <th class="px-6 py-4 text-left">Quyền hạn tóm tắt</th>
                        <th class="px-6 py-4 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-if="loadingUsers">
                        <td colspan="6" class="px-6 py-8 text-center text-gray-400">Đang tải danh sách người dùng...
                        </td>
                    </tr>
                    <tr v-else-if="users.length === 0">
                        <td colspan="6" class="px-6 py-8 text-center text-gray-400">Không tìm thấy tài khoản nào phù hợp
                        </td>
                    </tr>
                    <tr v-for="(user, index) in users" :key="user.id" class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-900">{{ (params.page - 1) * params.limit + index + 1 }}
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="font-medium text-gray-900">{{ user.fullname }}</div>
                        </td>
                        <td class="px-6 py-4 text-gray-900">{{ user.email }}</td>
                        <td class="px-6 py-4">
                            <span :class="[
                                'px-2 py-1 rounded-full text-xs font-medium',
                                user.roles?.name?.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                            ]">
                                {{ user.roles?.name || 'Chưa gán' }}
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-xs text-gray-500 leading-relaxed">
                                <template v-if="user.roles?.name?.toLowerCase() === 'admin'">
                                    • Toàn quyền hệ thống <br /> • Quản lý tài khoản & vai trò
                                </template>
                                <template v-else>
                                    • Quản lý dữ liệu cá nhân (Ownership)
                                </template>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button @click="openEditModal(user)"
                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-400 p-2 rounded"
                                :disabled="user.id === currentUser?.id">
                                <Pencil :size="18" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div
            class="bg-white px-6 py-4 border-t flex items-center justify-between text-sm text-gray-500 rounded-b-2xl shadow">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <span>Sắp xếp:</span>
                    <AppDropDown class="w-40" v-model="selectedSort" :options="sortOptions" />
                </div>
                <div class="flex items-center gap-2">
                    <span>Dòng:</span>
                    <AppDropDown class="w-20" v-model="selectedLimit" :options="limitOptions" />
                </div>
                <span>Tổng số: {{ pagination.totalItems }}</span>
            </div>

            <div class="flex gap-2">
                <button :disabled="params.page === 1" @click="changePage(-1)"
                    class="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    Trước
                </button>
                <div class="flex items-center px-4 font-medium text-gray-900">
                    Trang {{ params.page }} / {{ pagination.totalPages }}
                </div>
                <button :disabled="params.page >= pagination.totalPages" @click="changePage(1)"
                    class="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-40 transition-colors">
                    Sau
                </button>
            </div>
        </div>

        <!-- Modal chỉnh sửa thông tin user -->
        <AppFormModal v-model:open="showEditModal" title="Chỉnh sửa thành viên" :loading="submitting"
            @submit="handleUpdateUser">
            <div class="space-y-4">
                <AppFormField label="Họ và Tên" :model-value="editForm.fullname" required
                    @update:model-value="editForm.fullname = $event" />
                <AppFormField label="Username" :model-value="editForm.username" required
                    @update:model-value="editForm.username = $event" />
                <AppFormField label="Email" :model-value="editForm.email" required type="email"
                    @update:model-value="editForm.email = $event" />
                <div class="space-y-2">
                    <label class="text-sm font-medium text-slate-700">Vai trò</label>
                    <select v-model="editForm.role_id"
                        class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300">
                        <option v-for="role in roles" :key="role.id" :value="role.id">
                            {{ role.name }}
                        </option>
                    </select>
                </div>
            </div>
        </AppFormModal>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, reactive } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useToast } from '@/composables/useToast'
import AppDropDown from '@/components/ui/AppDropDown.vue'
import { Pencil } from 'lucide-vue-next'
import AppFormModal from '@/components/ui/AppFormModal.vue'
import AppFormField from '@/components/ui/AppFormField.vue'

const {
    users,
    roles,
    loadingUsers,
    params,
    pagination,
    fetchInitialData,
    fetchAllUsers,
    fetchRoles,
    updateUser,
    currentUser
} = usePermission()

const toast = useToast()

// Options cho dropdown
const selectedSort = ref(params.sortOrder)
const selectedLimit = ref(params.limit)

const sortOptions = [
    { label: 'Mới nhất', value: 'DESC' },
    { label: 'Cũ nhất', value: 'ASC' },
]

const limitOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
]

// Watchers để tự động gọi API khi thay đổi filter
watch(selectedSort, (val) => {
    params.sortOrder = val as 'ASC' | 'DESC'
    params.page = 1
    fetchAllUsers()
})
watch(selectedLimit, (val) => {
    params.limit = Number(val)
    params.page = 1
    fetchAllUsers()
})
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(() => params.search, () => {
    params.page = 1
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => fetchAllUsers(), 500)
})

onMounted(async () => {
    try {
        await Promise.all([fetchInitialData(), fetchAllUsers(), fetchRoles()])
    } catch (err) {
        toast.error('Lỗi: Không thể tải danh sách người dùng')
    }
})

// Modal state
const showEditModal = ref(false)
const submitting = ref(false)
const editForm = reactive({
    id: '',
    fullname: '',
    username: '',
    email: '',
    role_id: 0
})

const openEditModal = (user: any) => {
    editForm.id = user.id
    editForm.fullname = user.fullname || ''
    editForm.username = user.username || ''
    editForm.email = user.email || ''
    editForm.role_id = user.role_id
    showEditModal.value = true
}

const handleUpdateUser = async () => {
    submitting.value = true
    try {
        const { id, ...payload } = editForm
        await updateUser(id, payload)
        showEditModal.value = false
    } catch (err) {
        // Lỗi đã được xử lý bởi composable/toast
    } finally {
        submitting.value = false
    }
}

const changePage = (dir: number) => {
    params.page += dir
    fetchAllUsers()
}
</script>