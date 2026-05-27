/**
 * useToast — composable quản lý toast toàn app
 *
 * Luồng hoạt động:
 * 1. View/composable gọi toast.success('...') → thêm vào mảng toasts bên dưới
 * 2. AppToast.vue (mount ở App.vue) đọc cùng mảng toasts → hiển thị UI góc phải
 * 3. Sau duration ms (mặc định 3000) hoặc bấm nút X → remove() xoá khỏi mảng
 *
 * Lưu ý: toasts khai báo NGOÀI hàm useToast() → state dùng chung mọi nơi,
 * không tạo state mới mỗi lần gọi useToast().
 */
import { ref } from 'vue'

/** 4 loại toast — mỗi loại có màu + icon riêng ở AppToast.vue */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
    id: number
    message: string
    type: ToastType
}

// State global — mọi component gọi useToast() đều thao tác cùng mảng này
const toasts = ref<Toast[]>([])
let nextId = 0
// Lưu timer để huỷ khi user bấm đóng sớm, tránh toast bị remove 2 lần
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function remove(id: number) {
    const timer = timers.get(id)
    if (timer) {
        clearTimeout(timer)
        timers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
    /** Thêm toast mới. duration = 0 → không tự ẩn (chỉ đóng bằng nút X) */
    const show = (message: string, type: ToastType = 'info', duration = 3000) => {
        const id = nextId++
        toasts.value.push({ id, message, type })

        if (duration > 0) {
            const timer = setTimeout(() => remove(id), duration)
            timers.set(id, timer)
        }
    }

    // Helper tiện dùng — gọi 1 trong 4 hàm này thay vì show() trực tiếp
    const success = (message: string, duration?: number) => show(message, 'success', duration)
    const error = (message: string, duration?: number) => show(message, 'error', duration)
    const warning = (message: string, duration?: number) => show(message, 'warning', duration)
    const info = (message: string, duration?: number) => show(message, 'info', duration)

    // toasts + remove: dùng trong AppToast.vue | success/error/...: dùng trong các view
    return { toasts, show, remove, success, error, warning, info }
}
