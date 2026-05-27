<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden">
      <div class="px-10 py-12">
        <h1 class="text-3xl font-semibold text-slate-900 mb-2">Đăng ký</h1>
        <p class="text-sm text-slate-500 mb-8">Tạo tài khoản mới (mặc định role: user).</p>

        <p v-if="success" class="mb-4 text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
          {{ success }}
        </p>
        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {{ error }}
        </p>

        <form class="space-y-5" @submit.prevent="handleRegister">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="username">Username</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              required
              autocomplete="username"
              placeholder="admin"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="********"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="confirm">Xác nhận mật khẩu</label>
            <input
              id="confirm"
              v-model="confirmPassword"
              type="password"
              required
              autocomplete="new-password"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600">
          Đã có tài khoản?
          <RouterLink to="/login" class="font-medium text-slate-900 hover:underline">Đăng nhập</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ email: '', username: '', password: '' })
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  if (form.password !== confirmPassword.value) {
    error.value = 'Mật khẩu xác nhận không khớp.'
    return
  }

  if (form.password.length < 6) {
    error.value = 'Mật khẩu tối thiểu 6 ký tự.'
    return
  }

  loading.value = true
  try {
    const result = await authStore.register(form)

    if (result === 'email_confirm') {
      success.value =
        'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.'
      return
    }

    if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      success.value =
        'Đăng ký thành công. Tài khoản user chưa có quyền admin — dùng SQL gán role nếu cần.'
      setTimeout(() => router.push('/login'), 2500)
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Đăng ký thất bại.'
  } finally {
    loading.value = false
  }
}
</script>
