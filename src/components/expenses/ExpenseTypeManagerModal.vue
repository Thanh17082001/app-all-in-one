<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next';
import AppModal from '@/components/ui/AppModal.vue';
import AppDropDown from '@/components/ui/AppDropDown.vue';
import { cn } from '@/utils';
import { usePermission } from '@/composables/usePermission';

const props = defineProps<{
    open: boolean;
    items: any[];
    params: any;
    pagination: any;
    isAdmin: boolean;
    userFilterOptions: any[];
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    'fetch': [];
    'create': [payload: any];
    'update': [id: number, payload: any];
    'remove': [id: number];
    'change-page': [dir: number];
}>();

const { currentUser } = usePermission();
const newTypeForm = reactive({ name: '', description: '' });
const isSubmitting = ref(false);
const editingType = ref<any>(null);

const handleSubmit = async () => {
    if (!newTypeForm.name.trim()) return;
    isSubmitting.value = true;
    try {
        if (editingType.value) {
            emit('update', editingType.value.id, { name: newTypeForm.name, description: newTypeForm.description });
            editingType.value = null;
        } else {
            emit('create', { ...newTypeForm });
        }
        newTypeForm.name = '';
        newTypeForm.description = '';
    } finally {
        isSubmitting.value = false;
    }
};

const startEdit = (type: any) => {
    editingType.value = type;
    newTypeForm.name = type.name;
    newTypeForm.description = type.description || '';
};

const cancelEdit = () => {
    editingType.value = null;
    newTypeForm.name = '';
    newTypeForm.description = '';
};
</script>

<template>
    <AppModal :open="open" @update:open="emit('update:open', $event)"
        :title="editingType ? 'Chỉnh sửa danh mục' : 'Quản lý danh mục'" size="3xl">
        <div class="space-y-6">
            <div class="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4">
                <div class="flex items-center justify-between">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {{ editingType ? 'Chế độ chỉnh sửa' : 'Tạo danh mục mới' }}
                    </p>
                    <button v-if="editingType" @click="cancelEdit"
                        class="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase">Hủy bỏ</button>
                </div>
                <div class="grid grid-cols-1 gap-4 text-white">
                    <input v-model="newTypeForm.name" placeholder="Tên danh mục..."
                        class="bg-gray-900 border border-white/5 rounded-xl px-4 py-2" />
                    <input v-model="newTypeForm.description" placeholder="Mô tả..."
                        class="bg-gray-900 border border-white/5 rounded-xl px-4 py-2" />
                </div>
                <button @click="handleSubmit"
                    class="w-full bg-blue-600 text-white py-2 rounded-xl font-bold hover:bg-blue-500">
                    {{ editingType ? 'Cập nhật' : 'Thêm mới' }}
                </button>
            </div>
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách hiện tại</h4>
                    <div v-if="isAdmin" class="w-48">
                        <AppDropDown v-model="params.userIdFilter" :options="userFilterOptions"
                            @update:model-value="emit('fetch')" />
                    </div>
                </div>
                <div class="space-y-2">
                    <div v-for="type in items" :key="type.id"
                        class="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10">
                        <div>
                            <p class="text-sm font-bold text-white">{{ type.name }}</p>
                            <span
                                :class="cn('text-[9px] px-1 py-0.5 rounded uppercase font-bold', !type.userId ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400')">
                                {{ !type.userId ? 'Hệ thống' : 'Cá nhân' }}
                            </span>
                        </div>
                        <div v-if="type.userId === currentUser?.id || (!type.userId && isAdmin)"
                            class="flex gap-2 opacity-0 group-hover:opacity-100">
                            <button @click="startEdit(type)" class="p-1 text-slate-400 hover:text-blue-400">
                                <Pencil :size="14" />
                            </button>
                            <button @click="emit('remove', type.id)" class="p-1 text-slate-400 hover:text-red-400">
                                <Trash2 :size="14" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <button @click="emit('update:open', false)"
                class="w-full py-2 text-slate-400 hover:text-white">Đóng</button>
        </template>
    </AppModal>
</template>