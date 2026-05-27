<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden">
      <div class="px-10 py-12">
        <h1 class="text-3xl font-semibold text-slate-900 mb-2">Welcome back</h1>
        <p class="text-sm text-slate-500 mb-8">Sign in to continue to your account.</p>
        <p v-if="error" class="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{{ error }}</p>
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="username">Username</label>
            <input id="username" type="text" placeholder="you@example.com" v-model="form.username"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2" for="password">Password</label>
            <input id="password" type="password" placeholder="********" v-model="form.password"
              class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
          <div class="flex items-center justify-between text-sm text-slate-600">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400" />
              Remember me
            </label>
            <a href="#" class="font-medium text-slate-700 hover:text-slate-900">Forgot password?</a>
          </div>
          <button type="submit" :disabled="loading"
            class="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>
        <p class="mt-6 text-center text-sm text-slate-600">
          Chưa có tài khoản?
          <RouterLink to="/register" class="font-medium text-slate-900 hover:underline">Đăng ký</RouterLink>
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

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''

  if (!form.username || !form.password) {
    error.value = 'Vui lòng nhập đầy đủ thông tin.'
    return
  }

  loading.value = true
  try {
    await authStore.login(form)
    // Đăng nhập xong thì vào dashboard, router guard sẽ kiểm tra quyền sau
    router.push('/admin/dashboard')
  } catch (err: any) {
    error.value = err?.message ?? 'Đăng nhập thất bại, thử lại.'
  } finally {
    loading.value = false
  }
}
</script>
