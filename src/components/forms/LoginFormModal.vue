<!--
  LoginFormModal — MẪU form đăng nhập (username + password)

  Cách dùng trong view (copy khi cần):

  <LoginFormModal
      v-model:open="showLogin"
      v-model="loginForm"
      :loading="loggingIn"
      @submit="handleLogin"
  />

  <script setup>
  import { reactive, ref } from 'vue'
  import LoginFormModal, { type LoginFormData } from '@/components/forms/LoginFormModal.vue'

  const showLogin = ref(false)
  const loggingIn = ref(false)
  const loginForm = reactive<LoginFormData>({ username: '', password: '' })

  async function handleLogin() {
      loggingIn.value = true
      try {
          // await authService.login(loginForm)
          showLogin.value = false
      } finally {
          loggingIn.value = false
      }
  }
  </script>
-->
<template>
    <AppFormModal
        :open="open"
        title="Đăng nhập"
        submit-text="Đăng nhập"
        cancel-text="Huỷ"
        loading-text="Đang đăng nhập..."
        :loading="loading"
        @update:open="emit('update:open', $event)"
        @close="emit('close')"
        @submit="emit('submit')"
    >
        <AppFormField
            label="Username"
            :model-value="modelValue.username"
            placeholder="you@example.com"
            required
            autocomplete="username"
            @update:model-value="syncField('username', $event)"
        />

        <AppFormField
            label="Password"
            type="password"
            :model-value="modelValue.password"
            placeholder="********"
            required
            autocomplete="current-password"
            @update:model-value="syncField('password', $event)"
        />
    </AppFormModal>
</template>

<script setup lang="ts">
import AppFormModal from '@/components/ui/AppFormModal.vue'
import AppFormField from '@/components/ui/AppFormField.vue'

export interface LoginFormData {
    username: string
    password: string
}

const props = defineProps<{
    open: boolean
    modelValue: LoginFormData
    loading?: boolean
}>()

// "update:..." KHÔNG phải chức năng Sửa/Cập nhật CRUD — là tên event của v-model trong Vue:
//   v-model:open        ↔ emit('update:open')
//   v-model="loginForm" ↔ emit('update:modelValue')
const emit = defineEmits<{
    'update:open': [value: boolean]
    'update:modelValue': [value: LoginFormData]
    close: []
    submit: []
}>()

/** Gửi giá trị field lên parent khi user gõ — không gọi API */
function syncField<K extends keyof LoginFormData>(key: K, value: LoginFormData[K]) {
    emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>
