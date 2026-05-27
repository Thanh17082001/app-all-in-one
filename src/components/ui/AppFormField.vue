<!--
  AppFormField — ô input/select/textarea dùng chung
  Hỗ trợ: type text/email/password, select, textarea
-->
<template>
    <div>
        <label v-if="label" :for="inputId" class="mb-2 block text-sm font-medium text-[var(--color-text-base)]">
            {{ label }}
            <span v-if="required" class="font-semibold text-[var(--color-primary)]" aria-hidden="true">*</span>
        </label>

        <div class="relative">
            <!-- Custom Slot (cho phép bọc AppDropDown hoặc các component khác) -->
            <slot v-if="$slots.default"></slot>

            <!-- Textarea -->
            <textarea v-else-if="type === 'textarea'" :id="inputId" :value="modelValue" :placeholder="placeholder"
                :disabled="disabled" :required="required" :rows="rows"
                class="block w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-stone-900 shadow-sm backdrop-blur-sm transition placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-100 resize-none"
                :class="inputClass" @input="onInput" @blur="emit('blur')" />

            <!-- Select arrow icon -->
            <div v-if="type === 'select'" class="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <ChevronDown :size="16" class="text-stone-400" />
            </div>

            <!-- Date Picker -->
            <input v-else-if="type === 'date'" :id="inputId" type="date" :value="modelValue" :placeholder="placeholder"
                :disabled="disabled" :required="required" :autocomplete="autocomplete"
                class="block w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-stone-900 shadow-sm backdrop-blur-sm transition placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-100"
                :class="inputClass" @input="onInput" @blur="emit('blur')" />

            <!-- Text / Currency Input -->
            <input v-else-if="type === 'text' || type === 'number'" :id="inputId" :type="isCurrency ? 'text' : type"
                :value="isCurrency ? formatCurrency(modelValue) : modelValue" :placeholder="placeholder"
                :required="required" :autocomplete="autocomplete"
                class="block w-full rounded-2xl border bg-white/90 px-4 py-3 text-sm text-stone-900 shadow-sm backdrop-blur-sm transition placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-stone-100"
                :class="[inputClass, isCurrency ? 'pr-10' : '']" @input="onInput" @blur="emit('blur')" />

            <!-- Currency Suffix -->
            <div v-if="isCurrency"
                class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                đ
            </div>

        </div>

        <p v-if="error" class="mt-2 text-xs font-medium text-[var(--color-error)]">{{ error }}</p>
        <p v-else-if="hint" class="mt-2 text-xs text-[var(--color-text-muted)]">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

// Option type cho select
export interface FieldOption {
    label: string
    value: string | number
}

const props = withDefaults(
    defineProps<{
        label?: string
        modelValue?: string
        type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'date'
        placeholder?: string
        hint?: string
        error?: string
        required?: boolean
        disabled?: boolean
        isCurrency?: boolean
        autocomplete?: string
        rows?: number          // textarea
        options?: FieldOption[] // select
    }>(),
    {
        modelValue: '',
        type: 'text',
        placeholder: '',
        required: false,
        disabled: false,
        isCurrency: false,
        rows: 3,
        options: () => [],
    },
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
    blur: []
}>()

const inputId = useId()

const inputClass = computed(() =>
    props.error
        ? 'border-[var(--color-error-ring)] focus:border-[var(--color-error-ring)] focus:ring-[var(--color-error)]/10'
        : 'border-[var(--color-surface-border)] hover:border-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/10',
)

function formatCurrency(val: string | number | undefined) {
    if (val === undefined || val === null || val === '') return ''
    const stringValue = String(val).replace(/\D/g, '')
    return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function onInput(event: Event) {
    const target = event.target as HTMLInputElement
    let val = target.value

    if (props.isCurrency) {
        const rawValue = val.replace(/\D/g, '')
        target.value = formatCurrency(rawValue)
        emit('update:modelValue', rawValue)
    } else {
        emit('update:modelValue', val)
    }
}
</script>