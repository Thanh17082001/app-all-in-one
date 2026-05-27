<!--
  TestFormModal — form riêng cho module Test (mở rộng AppFormModal)

  Mỗi module CRUD nên có 1 file tương tự: bọc AppFormModal + các AppFormField của module đó.
  View (TestView) chỉ quản lý state mở/đóng và gọi API khi @submit.
-->
<template>
    <AppFormModal
        :open="open"
        :title="isEditing ? 'Cập nhật test' : 'Thêm mới test'"
        :description="isEditing ? 'Cập nhật thông tin test.' : 'Nhập tên test mới.'"
        :loading="loading"
        @update:open="emit('update:open', $event)"
        @close="emit('close')"
        @submit="emit('submit')"
        size="md"
    >
        <!-- Đổi icon tại đây, import từ lucide-vue-next -->
        <template #icon>
            <Form :size="20" />
        </template>
       <div class="flex justify-between">
            <AppFormField
            class="w-full"
                label="Tên"
                :model-value="modelValue.name"
                placeholder="Nhập tên..."
                required
                @update:model-value="updateName"
            />

       </div>
    </AppFormModal>
</template>

<script setup lang="ts">
import AppFormModal from '@/components/ui/AppFormModal.vue'
import AppFormField from '@/components/ui/AppFormField.vue'
import { Form } from 'lucide-vue-next';

export interface TestFormData {
    name: string
}

const props = defineProps<{
    open: boolean
    modelValue: TestFormData
    isEditing: boolean
    loading?: boolean
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'update:modelValue': [value: TestFormData]
    close: []
    submit: []
}>()

function updateName(name: string) {
    emit('update:modelValue', { ...props.modelValue, name })
}
</script>
