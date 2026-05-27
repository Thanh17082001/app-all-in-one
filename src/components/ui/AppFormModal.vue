<!--
  AppFormModal — form modal dùng chung (base)
  Tone 2026: warm stone + periwinkle accent, glass mềm, aurora nhẹ

  View chỉ cần: mở modal, truyền title/loading, @submit gọi API.
-->
<template>
    <Teleport to="body">
        <TransitionRoot as="template" :show="open">
            <Dialog class="relative z-50" @close="handleClose">
                <TransitionChild as="template" enter="ease-out duration-300" enter-from="opacity-0"
                    enter-to="opacity-100" leave="ease-in duration-200" leave-from="opacity-100" leave-to="opacity-0">
                    <div class="fixed inset-0 bg-[var(--color-text-base)]/35 backdrop-blur-xl" />
                </TransitionChild>

                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
                        <TransitionChild as="template" enter="ease-out duration-300"
                            enter-from="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-[0.97]"
                            enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200"
                            leave-from="opacity-100 translate-y-0 sm:scale-100"
                            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-[0.97]">
                            <DialogPanel
                                class="relative w-[95%] transform overflow-visible rounded-[1.75rem] border border-[var(--color-surface-border)]/70 bg-[var(--color-surface)]/95 text-left shadow-2xl shadow-indigo-950/8 ring-1 ring-white/60 backdrop-blur-xl transition-all"
                           
                                :class="[maxWidthClass, panelClass]">
                                <!-- Aurora glow — xu hướng mesh gradient 2026 -->
                                <div
                                    class="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-[var(--color-primary-light)]/15 blur-3xl" />
                                <div
                                    class="pointer-events-none absolute -bottom-12 -left-10 size-32 rounded-full bg-[var(--color-secondary-light)]/10 blur-3xl" />

                                <div
                                    <div class="relative mx-auto w-[95%] h-1 bg-gradient-to-r from-[var(--color-primary-light)] via-[var(--color-secondary-light)] to-[var(--color-secondary)]" />
                              

                                <div
                                    class="relative flex items-start gap-4 px-6 pb-1 pt-5 border-b-2 border-[var(--color-surface-border)] ">
                                    <div
                                        class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-primary)]/25">
                                        <slot name="icon">
                                            <PenLine :size="20" stroke-width="2" /> <!-- default fallback -->
                                        </slot>
                                    </div>
                                    <div class="min-w-0 flex-1 pt-0.5 ">
                                        <DialogTitle :id="titleId"
                                            class="text-xl font-semibold tracking-tight text-[var(--color-text-base)]">
                                            <slot name="title">{{ title }}</slot>
                                        </DialogTitle>
                                        <div class="my-2 "></div>
                                        <p v-if="description || $slots.description"
                                            class="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                                            <slot name="description">{{ description }}</slot>
                                        </p>
                                    </div>

                                    <button type="button"
                                        class="rounded-full p-2 text-stone-400 transition hover:bg-stone-200/60 hover:text-stone-700 disabled:opacity-50"
                                        :disabled="loading" aria-label="Đóng" @click="handleClose">
                                        <X :size="18" />
                                    </button>
                                </div>


                                <form @submit.prevent="emit('submit')">
                                    <div class="relative space-y-5 px-6 py-5">
                                        <slot />
                                    </div>

                                    <div
                                        class="relative flex flex-col-reverse gap-2 border-t border-[var(--color-surface-border)]/70 bg-[var(--color-surface-muted)]/50 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
                                        <button type="button"
                                            class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-surface-border)] bg-white/80 px-5 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-base)] disabled:opacity-50"
                                            :disabled="loading" @click="handleClose">
                                            {{ cancelText }}
                                        </button>

                                        <button type="submit"
                                            class="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--color-primary)]/20 transition hover:from-[var(--color-primary-light)] hover:to-[var(--color-secondary-light)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                                            :disabled="loading">
                                            <Loader2 v-if="loading" :size="16" class="animate-spin" />
                                            {{ loading ? loadingText : submitText }}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
    </Teleport>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Loader2, PenLine, X } from 'lucide-vue-next'

export type AppFormModalSize = 'sm' | 'md' | 'lg' | '2xl' | '3xl' |'5xl' | 'full'

const props = withDefaults(
    defineProps<{
        open: boolean
        title?: string
        description?: string
        submitText?: string
        cancelText?: string
        loading?: boolean
        loadingText?: string
        size?: AppFormModalSize,
        panelClass?: string
    }>(),
    {
        title: '',
        description: '',
        submitText: 'Lưu',
        cancelText: 'Huỷ',
        loading: false,
        loadingText: 'Đang lưu...',
        size: 'md',
    },
)

const emit = defineEmits<{
    'update:open': [value: boolean]
    close: []
    submit: []
}>()

const titleId = useId()

const maxWidthClass = computed(() => {
    const map: Record<AppFormModalSize, string> = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        '2xl': 'max-w-2xl', // 672px
        '3xl': 'max-w-3xl', // 896px
        '5xl': 'max-w-5xl', // 1024px
        full: 'max-w-full mx-4', // full width
    }
    return map[props.size]
})

function handleClose() {
    if (props.loading) return
    emit('update:open', false)
    emit('close')
}
</script>
