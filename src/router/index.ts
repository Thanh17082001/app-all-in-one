import { useAuthStore } from '@/stores/auth.store';
import { createRouter, createWebHistory, type Router } from 'vue-router';

const router: Router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/login',
            component: () => import('@/views/auth/LoginView.vue'),
            meta: { guestOnly: true }
        },
        {
            path: '/register',
            component: () => import('@/views/auth/RegisterView.vue'),
            meta: { guestOnly: true }
        },
        {
            path: '/admin',
            component: () => import('@/layouts/AdminLayout.vue'),
            meta: { requiresAuth: true }, // Cho phép tất cả User đã đăng nhập vào Layout Admin
            children: [
                { path: '', redirect: '/admin/dashboard' },
                { path: 'dashboard', component: () => import('@/views/admin/DashboardView.vue') },
                {
                    path: 'users',
                    component: () => import('@/views/admin/UserManagementView.vue'),
                    meta: { role: 'admin' } // Chỉ riêng trang Quản lý tài khoản mới yêu cầu quyền Admin
                },
                // { path: 'tests', component: () => import('@/views/admin/TestView.vue') },
                { path: 'expenses', component: () => import('@/views/admin/ExpenseView.vue') },
            ]
        },
        { path: '/403', component: () => import('@/views/errors/ForbiddenView.vue') },
        { path: '/:pathMatch(.*)*', component: () => import('@/views/errors/NotFoundView.vue') },
    ]
})

router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    if (!authStore.initialized) {
        await authStore.init()
    }

    const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
    const requiresAdmin = to.matched.some(r => r.meta.role === 'admin')
    const guestOnly = to.matched.some(r => r.meta.guestOnly)

    if (guestOnly && authStore.isLoggedIn) {
        return next('/admin/dashboard')
    }

    if (requiresAuth && !authStore.isLoggedIn) {
        return next('/login')
    }

    if (requiresAdmin && authStore.isLoggedIn && !authStore.isAdmin) {
        return next('/403')
    }

    next()
})

export default router;
