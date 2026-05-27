<template>
    <div class="flex h-screen bg-gray-100">
        <!-- Sidebar bên trái của layout admin-->
        <aside :style="{ width: isSidebarOpen ? '260px' : '80px' }"
            class="bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 pl-3">
            <div class="p-6 flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    L
                </div>
                <span v-if="isSidebarOpen"
                    class="font-bold text-xl tracking-tight text-slate-800 transition-opacity duration-300">
                    LifeSphere
                </span>
            </div>

            <nav class="flex-1 px-0 space-y-1">
                <button v-for="item in filteredNavItems" :key="item.id" @click="navigateTo(item.id as TabType)" :class="cn(
                    'w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 group text-slate-600',
                    activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'hover:bg-slate-50 hover:text-slate-900'
                )">
                    <component :is="item.icon" :size="20"
                        :class="cn(activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')" />
                    <span v-if="isSidebarOpen">{{ item.label }}</span>
                </button>
            </nav>

            <div class="py-6 pr-3 mt-auto border-t border-slate-100">
                <div class="bg-slate-200 rounded-lg p-3 text-xs text-slate-500">
                    <div class="flex justify-between mb-1 uppercase font-bold text-[10px]">
                        <span>Dung lượng</span>
                        <span>65%</span>
                    </div>
                    <div class="w-full bg-slate-200 h-1.5 rounded-full">
                        <div class="bg-blue-600 h-1.5 rounded-full" style="width: 65%"></div>
                    </div>
                    <p v-if="isSidebarOpen" class="mt-2">6.5 GB / 10 GB sử dụng</p>
                </div>
            </div>
        </aside>

        <!-- main content -->
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <!-- Top Header -->
            <header
                class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 z-10 text-slate-800">
                <h1 class="text-lg font-semibold">Chào buổi sáng, {{ authStore.user?.fullname || 'User' }}</h1>
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
                        <input type="text" placeholder="Tìm kiếm nhanh..."
                            class="bg-slate-100 border-none rounded-full px-4 pl-10 py-1.5 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <button class="p-2 rounded-full text-slate-500 hover:bg-slate-100 relative">
                        <Bell :size="20" />
                        <span class="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white" />
                    </button>

                    <!-- User Dropdown Menu -->
                    <div class="relative">
                        <button @click="isUserMenuOpen = !isUserMenuOpen"
                            class="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-all overflow-hidden focus:outline-none">
                            <User :size="20" class="text-slate-600" />
                        </button>

                        <div v-if="isUserMenuOpen"
                            class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                            <button @click="goToProfile"
                                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                <Settings :size="16" />
                                <span>Thông tin cá nhân</span>
                            </button>
                            <div class="h-px bg-slate-100 my-1"></div>
                            <button @click="handleLogout"
                                class="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut :size="16" />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <!-- Main Content -->
            <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div class="max-w w-full">
                    <router-view v-slot="{ Component, route }">
                        <Transition name="fade" mode="out-in">
                            <component :is="Component" :key="route.path" />
                        </Transition>
                    </router-view>
                </div>
            </div>
            <!-- nhan vao day de hien thi noi dung cua tung tab -->
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import type { TabType } from '@/types';
import {
    LayoutDashboard,
    Wallet,
    FileText,
    Bell,
    Search,
    User,
    Settings,
    LogOut,
} from 'lucide-vue-next';
import { cn } from '@/utils';

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const isSidebarOpen = ref(true);
const isUserMenuOpen = ref(false);

const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: User, adminOnly: true },
    { id: 'expenses', label: 'Chi tiêu', icon: Wallet },
];

const filteredNavItems = computed(() => {
    return navItems.filter(item => !item.adminOnly || authStore.isAdmin)
})

const activeTab = computed(() => {
    const segment = route.path.split('/').pop()
    return (segment || 'dashboard') as TabType
})

const navigateTo = (id: TabType) => {
    router.push(`/admin/${id}`)
}

const goToProfile = () => {
    isUserMenuOpen.value = false
    toast.info('Tính năng đang phát triển')
}

const handleLogout = async () => {
    isUserMenuOpen.value = false
    await authStore.logout()
}
</script>