<template>
    <Listbox v-model="selected" by="value" :disabled="disabled" class="relative block" v-slot="{ open }">
        <div ref="containerRef" class="relative">
            <ListboxButton
                class="block w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-stone-900 shadow-sm backdrop-blur-sm transition placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-100 text-left"
                :class="[
                    error ? 'border-[var(--color-error-ring)] focus:border-[var(--color-error-ring)] focus:ring-[var(--color-error)]/10'
                        : 'border-[var(--color-surface-border)] hover:border-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/10'
                ]">
                <span :class="{ 'text-slate-400': !selected }">
                    {{ selected?.label ?? placeholder }}
                </span>
                <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronDown :size="16" class="text-slate-400" />
                </span>
            </ListboxButton>

            <Transition leave-active-class="duration-100 ease-in" leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95" @before-enter="updatePosition">
                <ListboxOptions :class="cn('absolute z-[1000] max-h-60 w-full min-w-[220px] overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl focus:outline-none',
                    openUpward ? 'bottom-full mb-2' : 'top-full mt-1')">
                    <ListboxOption v-for="option in options" :key="option.value" :value="option"
                        v-slot="{ active, selected: isSelected }">
                        <li :class="[
                            'relative cursor-pointer select-none px-4 py-2.5 text-sm',
                            active ? 'bg-blue-50 text-blue-700' : 'text-slate-700',
                            isSelected && 'bg-blue-50 font-medium text-blue-700',
                        ]">
                            <span>{{ option.label }}</span>
                            <span v-if="isSelected"
                                class="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                <Check :size="16" />
                            </span>
                        </li>
                    </ListboxOption>

                    <p v-if="!options.length" class="px-4 py-3 text-sm text-slate-400">
                        Không có dữ liệu
                    </p>
                </ListboxOptions>
            </Transition>
        </div>
    </Listbox>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/utils'

export interface SelectOption {
    label: string
    value: string | number
}

const props = withDefaults(
    defineProps<{
        options: SelectOption[]
        modelValue?: string | number
        placeholder?: string
        disabled?: boolean
        error?: string
    }>(),
    {
        placeholder: '-- Chọn --',
        disabled: false,
        error: '',
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: string | number]
}>()

const selected = computed({
    get: () => props.options.find((o) => o.value === props.modelValue),
    set: (option) => {
        if (option) {
            emit('update:modelValue', option.value)
        }
    },
})

const containerRef = ref<HTMLElement | null>(null)
const openUpward = ref(false)

const updatePosition = () => {
    if (!containerRef.value) return
    const rect = containerRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropdownHeight = 280 // Ước tính chiều cao tối đa của menu
    // Nếu phía dưới không đủ chỗ và phía trên rộng hơn, thì bật lên trên
    openUpward.value = spaceBelow < dropdownHeight && rect.top > spaceBelow
}
</script>