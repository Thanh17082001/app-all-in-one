<!--
  ExpenseFormModal — form riêng cho module Expense (mở rộng AppFormModal)

  Mỗi module CRUD nên có 1 file tương tự: bọc AppFormModal + các AppFormField của module đó.
  View chỉ quản lý state mở/đóng và gọi API khi @submit.
-->
<template>
    <AppFormModal :open="open" :title="isEditing ? 'Cập nhật khoản Thu Chi' : 'Thêm mới khoản Thu Chi'"
        :description="isEditing ? 'Nhập thông tin chi tiết về giao dịch của bạn.' : 'Nhập thông tin chi tiết về giao dịch của bạn.'"
        :loading="loading" size="2xl" @update:open="emit('update:open', $event)" @close="emit('close')"
        @submit="emit('submit')" panel-class="min-w-[700px] min-h-[400px]">
        <template #icon>
            <DollarSign :size="20" />
        </template>

        <!-- Type Toggle -->
        <div class="mb-6 flex bg-slate-100 p-1 rounded-xl">
            <button type="button" @click="updateTransactionType('expense')" :class="cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                modelValue.transactionType === 'expense' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )">
                Chi tiêu
            </button>
            <button type="button" @click="updateTransactionType('income')" :class="cn(
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all',
                modelValue.transactionType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )">
                Thu nhập
            </button>
        </div>

        <div class="grid grid-cols-2 gap-4 relative z-20">
            <AppFormField type="text"
                :label="modelValue.transactionType === 'expense' ? 'Tên khoản chi' : 'Tên giao dịch'"
                :model-value="modelValue.name" placeholder="Nhập tên ..." required @update:model-value="updateName" />
            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-[var(--color-text-base)]">Chọn loại khoản chi <span
                            class="font-semibold text-[var(--color-primary)]" aria-hidden="true">*</span></label>
                    <button type="button" @click="emit('manage-types')"
                        class="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tight">
                        + Quản lý loại
                    </button>
                </div>
                <AppDropDown :model-value="modelValue.type" :options="dynamicTypeOptions"
                    placeholder="Chọn loại khoản chi..." @update:model-value="updateType" />
            </div>
        </div>
        <div class="grid grid-cols-2 gap-4 relative z-10">
            <AppFormField label="Số tiền" is-currency
                :model-value="modelValue.amount !== null ? String(modelValue.amount) : ''" placeholder="Nhập số tiền..."
                required @update:model-value="val => updateAmount(val === '' ? null : Number(val))" />
            <div>
                <label class="mb-2 block text-sm font-medium text-[var(--color-text-base)]">Ngày chi <span
                        class="font-semibold text-[var(--color-primary)]" aria-hidden="true">*</span></label>
                <AppFormField type="date" :model-value="modelValue.date" placeholder="Chọn ngày chi..." required
                    @update:model-value="updateDate" />
            </div>
        </div>
        <div class="mt-6">
            <AppFormField label="Ghi chú" type="textarea" :model-value="modelValue.note"
                placeholder="Thêm ghi chú (không bắt buộc)..." @update:model-value="updateNote" />
        </div>
    </AppFormModal>
</template>

<script setup lang="ts">
import AppFormModal from '@/components/ui/AppFormModal.vue'
import AppFormField, { type FieldOption } from '@/components/ui/AppFormField.vue'
import AppDropDown from '@/components/ui/AppDropDown.vue'
import { DollarSign } from 'lucide-vue-next'
import { computed } from 'vue'
import { cn } from '@/utils'

export interface ExpenseFormData {
    name: string
    type: string | number
    amount: number | null
    date: string
    note?: string
    transactionType: 'expense' | 'income'
}

const props = defineProps<{
    open: boolean
    modelValue: ExpenseFormData
    isEditing: boolean
    types?: any[]
    loading?: boolean
}>()

/** Tự động chuyển đổi danh sách từ DB sang định dạng dropdown */
const dynamicTypeOptions = computed<FieldOption[]>(() => {
    if (!props.types?.length) return []
    return props.types.map(t => ({ label: t.name, value: t.id }))
})

const emit = defineEmits<{
    'update:open': [value: boolean]
    'update:modelValue': [value: ExpenseFormData]
    close: []
    submit: []
    'manage-types': []
}>()

function updateName(name: string) {
    emit('update:modelValue', { ...props.modelValue, name })
}
function updateAmount(amount: number | null) {
    emit('update:modelValue', { ...props.modelValue, amount })
}
function updateDate(date: string) {
    emit('update:modelValue', { ...props.modelValue, date })
}
function updateNote(note: string) {
    emit('update:modelValue', { ...props.modelValue, note })
}
function updateTransactionType(transactionType: 'expense' | 'income') {
    emit('update:modelValue', { ...props.modelValue, transactionType })
}
function updateType(type: string | number) {
    emit('update:modelValue', { ...props.modelValue, type })
}
</script>