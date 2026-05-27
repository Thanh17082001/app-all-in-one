<template>
  <TransitionRoot as="template" :show="open">
    <Dialog class="relative z-50" @close="handleClose">
      <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0" enter-to="opacity-100"
        leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/50 transition-opacity" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <TransitionChild as="template" enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
            <DialogPanel
              class="relative w-full transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all sm:my-8"
              :class="sizeClass">
              <div class="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="sm:flex sm:items-start">
                  <div v-if="variant && !($slots.default)"
                    class="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10"
                    :class="iconWrapperClass">
                    <component :is="icon" class="size-6" :class="iconClass" aria-hidden="true" />
                  </div>
                  <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <DialogTitle as="h3" class="text-base font-semibold text-white">
                      {{ title }}
                    </DialogTitle>
                    <div v-if="message" class="mt-2">
                      <p class="text-sm text-gray-400">{{ message }}</p>
                    </div>
                    <!-- Thêm slot để hiển thị nội dung CRUD từ bên ngoài truyền vào -->
                    <div class="mt-4 text-left">
                      <slot />
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-700/25 px-4 py-3 sm:flex sm:px-6">
                <!-- Thêm slot footer để có thể thay thế nút Xác nhận/Hủy bằng nút Đóng -->
                <slot name="footer">
                  <div class="w-full sm:flex sm:flex-row-reverse"
                    :class="variant === 'success' ? 'sm:justify-end' : ''">
                    <button type="button"
                      class="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
                      :class="[confirmButtonClass, variant === 'confirm' && 'sm:ml-3']" :disabled="loading"
                      @click="handleConfirm">
                      {{ loading ? loadingText : confirmLabel }}
                    </button>
                    <button v-if="variant === 'confirm'" type="button"
                      class="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 disabled:opacity-50 sm:mt-0 sm:w-auto"
                      :disabled="loading" @click="handleCancel">
                      {{ cancelText }}
                    </button>
                  </div>
                </slot>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

export type AppModalVariant = 'confirm' | 'success'

const props = withDefaults(
  defineProps<{
    open: boolean
    variant?: AppModalVariant // loại của modal 
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
    loadingText?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  }>(),
  {
    variant: 'confirm',
    cancelText: 'Huỷ',
    loading: false,
    loadingText: 'Đang xử lý...',
    size: 'lg'
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
  confirm: []
  cancel: []
}>()

const icon = computed(() =>
  props.variant === 'success' ? CheckCircleIcon : ExclamationTriangleIcon,
)

const iconWrapperClass = computed(() =>
  props.variant === 'success' ? 'bg-green-500/10' : 'bg-red-500/10',
)

const iconClass = computed(() =>
  props.variant === 'success' ? 'text-green-400' : 'text-red-400',
)

const confirmButtonClass = computed(() =>
  props.variant === 'success'
    ? 'bg-green-600 hover:bg-green-500'
    : 'bg-red-500 hover:bg-red-400',
)

const sizeClass = computed(() => {
  const maps = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    '3xl': 'sm:max-w-3xl',
    '4xl': 'sm:max-w-4xl',
  }
  return maps[props.size] || maps.lg
})

const confirmLabel = computed(() => {
  if (props.confirmText) return props.confirmText
  return props.variant === 'success' ? 'Đóng' : 'Xác nhận'
})

function setOpen(value: boolean) {
  emit('update:open', value)
  if (!value) emit('close')
}

function handleClose() {
  if (props.loading) return
  setOpen(false)
}

function handleCancel() {
  emit('cancel')
  setOpen(false)
}

function handleConfirm() {
  emit('confirm')
  if (props.variant === 'success') {
    setOpen(false)
  }
}
</script>
