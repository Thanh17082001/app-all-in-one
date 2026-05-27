<!--
  AppToast — CHỈ hiển thị UI, không chứa logic thêm toast.

  Mount 1 lần ở App.vue (không đặt trong từng view).
  Dữ liệu lấy từ useToast().toasts — cùng state với nơi gọi toast.success()...
-->
<template>
    <div
        aria-live="polite"
        aria-atomic="true"
        class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"
    >
        <TransitionGroup
            tag="div"
            class="flex flex-col gap-2"
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-x-full"
            enter-to-class="opacity-100 translate-x-0"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 translate-x-0"
            leave-to-class="opacity-0 translate-x-full"
        >
            <div
                v-for="toast in toasts"
                :key="toast.id"
                role="alert"
                class="pointer-events-auto flex min-w-[320px] max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
                :class="typeClass[toast.type]"
            >
                <component :is="iconMap[toast.type]" :size="20" class="shrink-0" :class="iconClass[toast.type]" />
                <span class="flex-1 font-medium leading-snug">{{ toast.message }}</span>
                <button
                    type="button"
                    class="shrink-0 text-slate-400 hover:text-slate-600"
                    aria-label="Đóng"
                    @click="remove(toast.id)"
                >
                    <X :size="16" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { useToast, type ToastType } from '@/composables/useToast'

// Đọc danh sách toast + hàm xoá từ composable (không tạo state riêng ở đây)
const { toasts, remove } = useToast()

// Map type → icon và class màu (success=xanh lá, error=đỏ, warning=vàng, info=xanh dương)
const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
} as const

const typeClass: Record<ToastType, string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const iconClass: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
}
</script>
