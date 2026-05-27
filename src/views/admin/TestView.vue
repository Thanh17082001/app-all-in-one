<template>
    <div class="space-y-6">

        <!-- Header -->
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-800">Test Management</h1>
            <button v-if="can('create', 'tests')" @click="openCreateModal"
                class="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition">
                + Thêm mới
            </button>
        </div>

        <!-- Error -->
        <div v-if="error" class="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">
            {{ error }}
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl shadow">
            <table class="w-full text-sm">
                <thead class="text-gray-600 uppercase text-xs bg-gray-50 border-b">
                    <tr>
                        <th class="px-6 py-4 text-left w-16">STT</th>
                        <th class="px-6 py-4 text-left">Mã số</th>
                        <th class="px-6 py-4 text-left">Tên</th>
                        <th v-if="isAdmin" class="px-6 py-4 text-left">Người tạo</th>
                        <th class="px-6 py-4 text-left">Ngày Tạo</th>
                        <th class="px-6 py-4 text-right">Hành Động</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-if="loading">
                        <td :colspan="isAdmin ? 6 : 5" class="px-6 py-8 text-center text-gray-400">Đang tải...</td>
                    </tr>
                    <tr v-else-if="!items.length">
                        <td :colspan="isAdmin ? 6 : 5" class="px-6 py-8 text-center text-gray-400">Không có dữ liệu</td>
                    </tr>
                    <tr v-for="(item, index) in items" :key="item.id" class="hover:bg-gray-50 transition">
                        <td class="px-6 py-4 text-gray-500 font-medium">{{ (params.page! - 1) * params.limit! + index +
                            1 }}</td>
                        <td class="px-6 py-4 text-gray-500 text-[10px] font-mono">{{ item.uuid }}</td>
                        <td class="px-6 py-4 font-medium text-gray-800">{{ item.name }}</td>
                        <td v-if="isAdmin" class="px-6 py-4 text-gray-500">
                            <span class="px-2 py-1 bg-gray-100 rounded-md text-xs">
                                {{ item.profiles?.username || 'N/A' }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-gray-500">{{ formatDate(item.createdAt) }}</td>
                        <td class="px-6 py-4 text-right space-x-3">
                            <button v-if="can('update', 'tests', item.userId)" @click="openEditModal(item)"
                                class="text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50 transition border border-blue-400 p-2 rounded">
                                <Pencil :size="16" />
                            </button>
                            <button v-if="can('delete', 'tests', item.userId)" @click="openDeleteConfirm(item.id)"
                                class="text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition border border-red-400 p-2 rounded">
                                <Delete :size="16" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Pagination -->
            <div class="px-6 py-1 border-t flex items-center justify-between text-sm text-gray-500">
                <div class="flex items-center gap-1 justify-between">
                    <span class="w-20">Hiển thị:</span>
                    <!-- v-model: nhận value từ component AppDropDown và gán vào selectedSort sau đó watch selectedSort để gọi api
                     :options: truyền params cho component AppDropDown
                    placeholder: hiển thị text placeholder -->
                    <AppDropDown class="w-50" v-model="selectedSort" :options="sortOptions"
                        placeholder="Chọn kiểu sắp xếp" />
                    <AppDropDown class="w-20" v-model="selectedLimit" :options="limitOptions"
                        placeholder="Số dòng / trang" />
                    <span class="w-50">Tổng số Items: {{ total }}</span>
                </div>


                <div class="flex gap-1">
                    <button :disabled="params.page === 1" @click="changePage(-1)"
                        class="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        Trước
                    </button>
                    <span class="px-2 py-1 block">{{ params.page }}</span>
                    <span class="text-lg ">...</span>
                    <span class="px-2 py-1">{{ pagination.totalPages }}</span>
                    <button :disabled="params.page! * params.limit! >= total" @click="changePage(1)"
                        class="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40">
                        Sau
                    </button>
                </div>
            </div>
        </div>

        <!-- Form create/edit — TestFormModal mở rộng AppFormModal -->
        <TestFormModal v-model:open="showModal" v-model="form" :is-editing="isEditing" :loading="submitting"
            @submit="handleSubmit">
        </TestFormModal>

        <AppModal v-model:open="deleteModalOpen" variant="confirm" title="Xác nhận xoá"
            message="Bạn có chắc muốn xoá mục này? Hành động này không thể hoàn tác." confirm-text="Xoá"
            :loading="deleting" loading-text="Đang xoá..." @confirm="confirmDelete" />

    </div>
</template>

<script setup lang="ts">
/**
 * TestView
 * Giao diện quản lý CRUD module Test
 * - Hiển thị danh sách có phân trang
 * - Tạo mới / Chỉnh sửa qua modal
 * - Xoá có confirm
 * Mọi logic gọi API đều delegate xuống useTest composable
 */
import { onMounted, reactive, ref, watch } from 'vue'
import { useTest } from '@/composables/useTest'
import { usePermission } from '@/composables/usePermission'
import type { Test } from '@/types/test.types'
import { Delete, Pencil } from 'lucide-vue-next'
import AppDropDown from '@/components/ui/AppDropDown.vue'
import AppModal from '@/components/ui/AppModal.vue'
import TestFormModal from '@/components/forms/TestFormModal.vue'
import { useToast } from '@/composables/useToast'

const { items, total, loading, error, params, pagination, fetchAll, create, update, remove } = useTest()
const { isAdmin, can, fetchInitialData: fetchPerms } = usePermission()

// Gọi toast từ view — không cần import AppToast, chỉ cần useToast()
// toast.success() | toast.error() | toast.warning() | toast.info()
const toast = useToast()

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '' })

const deleteModalOpen = ref(false)
const deleting = ref(false)
const deletingId = ref<number | null>(null)

onMounted(async () => {
    await fetchPerms() // Load user profile & permissions mapping
    await fetchAll()
})

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

// Mở modal tạo mới
const openCreateModal = () => {
    isEditing.value = false
    editingId.value = null
    form.name = ''
    showModal.value = true
}

// Mở modal edit — điền sẵn dữ liệu vào form
const openEditModal = (item: Test) => {
    isEditing.value = true
    editingId.value = item.id
    form.name = item.name
    showModal.value = true
}

const closeModal = () => {
    showModal.value = false
}

watch(selectedSort, (val) => {
    params.sortOrder = val as 'ASC' | 'DESC'
    params.page = 1
    fetchAll()
})
watch(selectedLimit, (val) => {
    params.limit = Number(val)
    params.page = 1
    fetchAll()
})

// Submit: phân biệt create vs update theo isEditing
const handleSubmit = async () => {
    if (!form.name.trim()) return
    submitting.value = true
    try {
        if (isEditing.value && editingId.value) {
            await update(editingId.value, { name: form.name })
        } else {
            await create({ name: form.name })
        }
        closeModal()
        // Thông báo thành công sau khi API trả về OK
        toast.success(isEditing.value ? 'Cập nhật thành công' : 'Thêm mới thành công')
    } catch {
        // Thông báo lỗi khi API throw (mạng, 4xx, 5xx...)
        toast.error('Lưu thất bại')
    } finally {
        submitting.value = false
    }
}

const openDeleteConfirm = (id: number) => {
    deletingId.value = id
    deleteModalOpen.value = true
}

const confirmDelete = async () => {
    if (!deletingId.value) return
    deleting.value = true
    try {
        await remove(deletingId.value)
        deleteModalOpen.value = false
        toast.success('Xoá thành công') // confirm xong + API OK → toast, không dùng modal success
    } catch {
        toast.error('Xoá thất bại')
    } finally {
        deleting.value = false
        deletingId.value = null
    }
}

const changePage = (dir: number) => {
    params.page = (params.page ?? 1) + dir
    fetchAll()
}

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
</script>