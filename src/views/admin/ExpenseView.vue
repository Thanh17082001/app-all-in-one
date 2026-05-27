<script setup lang="ts">
// CHART để hiển thị nằm ở dòng code này: <Doughnut :data="doughnutData" :options="doughnutOptions" />
// Phần JS cấu hình dữ liệu cho chart: biến doughnutData & doughnutOptions
// Component hiển thị cụ thể ở template bên dưới (dòng <Doughnut .../>)

// --- Bên dưới là script logic liên quan Chart.js Doughnut ---
import { ref, onMounted, computed, reactive, watch } from 'vue';
import {
    Plus,
    Settings2,
    Tags,
    Search,
    Filter,
    Check,
    Pencil,
    Trash2,
    ChevronLeft,
    X,
    ChevronRight,
    ChevronDown
} from 'lucide-vue-next';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'vue-chartjs'; // CHART COMPONENT
import { formatCurrency, cn } from '@/utils';
import AddExpenseModal, { type ExpenseFormData } from '@/components/forms/AddExpenseModal.vue';
import BulkAddExpenseModal from '@/components/forms/BulkAddExpenseModal.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppDropDown from '@/components/ui/AppDropDown.vue';
import ExpenseOverview from '@/components/expenses/ExpenseOverview.vue';
import ExpenseTransactionList from '@/components/expenses/ExpenseTransactionList.vue';
import { useExpenseType } from '@/composables/useExpenseType';
import { useExpense } from '@/composables/useExpense';
import { useFinancialJar } from '@/composables/useFinancialJar';
import { expenseTypeService } from '@/services/expense-type.service';
import { usePermission } from '@/composables/usePermission';
import { useToast } from '@/composables/useToast';

ChartJS.register(ArcElement, Tooltip, Legend);
const bubuMessage = computed(() => {
    const ratio = totalExpense.value / (totalIncome.value || 1);
    return ratio > 0.7 ? 'Chi tiêu quá tay rồi nè!!!!' : 'Tiết kiệm giỏi quá nà~';
});
const duduMessage = computed(() => {
    const ratio = totalIncome.value / (totalIncome.value || 1);
    return ratio <= 0.7 ? 'Biết lỗi ời mà!!!' : 'Quá Đẳng cấp !!!';
});

const toast = useToast();
const {
    items: expenseTypes,
    fetchAll: fetchExpenseTypes,
    params: typeParams,
    pagination: typePagination,
    create: createType,
    update: updateType,
    remove: removeType,
} = useExpenseType();

const {
    items: expenses,
    analyticsItems,
    fetchAll: fetchExpenses,
    fetchAnalytics,
    params: expenseParams,
    paginationResult: expensePagination,
    create: createExpense,
    createBulk: createBulkExpense,
    update: updateExpense,
    loading: expensesLoading
} = useExpense();

const { jars, fetchJars } = useFinancialJar();

const { currentUser, isAdmin, can, fetchInitialData: fetchPerms, users: allUsers, fetchAllUsers } = usePermission();

// Lưu trữ toàn bộ danh mục để hiển thị trên Chart và Dropdown (không phân trang)
const allExpenseTypes = ref<any[]>([]);
const fetchAllTypesForAnalytics = async () => {
    try {
        const res = await expenseTypeService.getAll({ page: 1, limit: 1000 }); // Lấy tối đa 1000 mục
        allExpenseTypes.value = res.items;
    } catch (error) {
        console.error('Lỗi tải danh mục cho biểu đồ:', error);
    }
};

// UI State cho bộ lọc nâng cao
const showAdvancedFilters = ref(false);

// Biến cục bộ để lọc theo ngày (tránh lỗi TS trên expenseParams)
const filterDate = ref('');
const now = new Date();
const filterMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

// Gán limit mặc định cho danh sách giao dịch
expenseParams.limit = 5;

// Khởi tạo giá trị mặc định cho các bộ lọc dropdown (Dùng any để bypass lỗi TS string vs number)
(expenseParams as any).transaction_type = 'all';
(expenseParams as any).type_id = 'all';
(expenseParams as any).userIdFilter = 'all';
(expenseParams as any).transaction_month = filterMonth.value;

// Options cho bộ lọc
const categoryOptions = computed(() => [
    { label: 'Tất cả danh mục', value: 'all' },
    ...allExpenseTypes.value.map(t => ({ label: t.name, value: t.id }))
]);

const transactionTypeOptions = [
    { label: 'Tất cả loại', value: 'all' },
    { label: 'Thu nhập', value: 'income' },
    { label: 'Chi tiêu', value: 'expense' }
];

// Logic kiểm tra các bộ lọc nâng cao có đang được áp dụng hay không (trừ search)
const hasActiveFilters = computed(() => {
    return !!filterDate.value ||
        !!filterMonth.value ||
        (expenseParams.transaction_type && (expenseParams.transaction_type as any) !== 'all') ||
        (expenseParams.type_id && (expenseParams.type_id as any) !== 'all') ||
        (expenseParams.userIdFilter && (expenseParams.userIdFilter as any) !== 'all');
});

const changePage = (dir: number) => {
    expenseParams.page = (expenseParams.page ?? 1) + dir;
    fetchExpenses();
};

// Watcher tập trung: Theo dõi mọi thay đổi của bộ lọc để gọi API
let searchTimer: ReturnType<typeof setTimeout> | undefined;
watch(
    [() => expenseParams.search, filterDate, filterMonth, () => expenseParams.transaction_type, () => expenseParams.type_id, () => expenseParams.userIdFilter],
    ([newSearch], [oldSearch]) => {
        // Luôn đưa về trang 1 khi thay đổi bất kỳ bộ lọc nào
        expenseParams.page = 1;

        // Đồng bộ local filterDate vào params để useExpense có thể lấy dữ liệu
        (expenseParams as any).transaction_date = filterDate.value || undefined;
        (expenseParams as any).transaction_month = filterMonth.value || undefined;

        // Nếu là thay đổi text search thì dùng debounce, nếu là filter khác thì fetch ngay
        if (searchTimer) clearTimeout(searchTimer);
        if (newSearch !== oldSearch) {
            searchTimer = setTimeout(() => fetchExpenses(), 500);
            setTimeout(() => fetchAnalytics(), 500);
        } else {
            fetchExpenses();
            fetchAnalytics();
        }
    }
);

const showExpenseModal = ref(false);
const showBulkModal = ref(false);
const isEditingExpense = ref(false);
const selectedExpenseId = ref<number | null>(null);
const expenseSubmitting = ref(false);

const openAddModal = () => {
    isEditingExpense.value = false;
    selectedExpenseId.value = null;
    expenseForm.value = {
        name: '',
        type: '',
        jarId: '',
        amount: null,
        date: new Date().toISOString().split('T')[0],
        note: '',
        transactionType: 'expense'
    };
    showExpenseModal.value = true;
};

const handleSelectTransaction = (tx: any) => {
    const original = expenses.value.find(ex => ex.id === tx.id);
    if (!original) return;

    isEditingExpense.value = true;
    selectedExpenseId.value = original.id;
    expenseForm.value = {
        name: original.title,
        type: original.type_id || '',
        jarId: original.jar_id || '',
        amount: original.amount,
        date: new Date(original.transaction_date).toISOString().split('T')[0],
        note: original.note || '',
        transactionType: original.transaction_type as 'expense' | 'income'
    };
    showExpenseModal.value = true;
};

// Quản lý Loại chi phí
const showTypeManager = ref(false);
const isAddingType = ref(false);
const editingType = ref<any>(null);
const isEditingTypeMode = ref(false);
const newTypeForm = reactive({
    name: '',
    description: ''
});

const userFilterOptions = ref<any[]>([]);

const openEditTypeModal = (type: any) => {
    isEditingTypeMode.value = true;
    editingType.value = type;
    newTypeForm.name = type.name;
    newTypeForm.description = type.description || '';
};

const cancelEditType = () => {
    isEditingTypeMode.value = false;
    editingType.value = null;
    newTypeForm.name = '';
    newTypeForm.description = '';
};

const handleSubmitType = async () => {
    if (!newTypeForm.name) return;
    isAddingType.value = true;
    try {
        if (isEditingTypeMode.value && editingType.value) {
            await updateType(editingType.value.id, { ...newTypeForm });
            toast.success('Cập nhật danh mục thành công');
        } else {
            await handleCreateType({ ...newTypeForm });
            toast.success('Thêm danh mục mới thành công');
        }
        cancelEditType();
        await fetchAllTypesForAnalytics(); // Cập nhật lại Chart sau khi thay đổi
    } finally {
        isAddingType.value = false;
    }
};

const handleDeleteType = async (id: number) => {
    await removeType(id);
    toast.success('Đã xóa danh mục');
    await fetchAllTypesForAnalytics(); // Cập nhật lại Chart sau khi xóa
};

const showAllCategories = ref(false);

// Chỉ hiển thị 5 danh mục đầu tiên nếu không ở chế độ "Xem thêm"
const categoryCount = 5;
const displayedCategories = computed(() => {
    if (showAllCategories.value) return categoriesData.value;
    return categoriesData.value.slice(0, categoryCount);
});

onMounted(async () => {
    const tasks = [
        fetchPerms(),
        fetchExpenseTypes(),
        fetchAllTypesForAnalytics(),
        fetchExpenses(),
        fetchAnalytics()
        fetchAnalytics(),
        fetchJars()
    ];
    if (isAdmin.value) {
        tasks.push(fetchAllUsers());
    }
    await Promise.all(tasks);

    if (isAdmin.value) {
        userFilterOptions.value = [
            { label: 'Tất cả người dùng', value: 'all' },
            { label: 'Chỉ hệ thống', value: 'system' },
            ...allUsers.value.map(u => ({ label: u.fullname || u.username, value: u.id }))
        ];
    }
});

const expenseForm = ref<ExpenseFormData>({
    name: '',
    type: '',
    amount: null,
    date: new Date().toISOString().split('T')[0],
    note: '',
    transactionType: 'expense'
});

// Bảng màu cố định cho các loại chi phí
const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#64748B'];

const categoriesData = computed(() => {
    // Sử dụng allExpenseTypes thay vì expenseTypes để lấy FULL danh mục
    return allExpenseTypes.value.map((type, index) => ({
        name: type.name,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        value: analyticsItems.value
            .filter((ex: any) => Number(ex.type_id) === Number(type.id) && ex.transaction_type === 'expense')
            .reduce((sum: number, ex: any) => sum + ex.amount, 0)
    }));
});

// Tính tổng giá trị để làm mốc tính % cho progress bar
const totalCategoriesValue = computed(() => categoriesData.value.reduce((acc, cur) => acc + cur.value, 0));

// Map dữ liệu từ useExpense sang format của ExpenseTransactionList
const transactions = computed(() => {
    return expenses.value.map((ex: any) => ({
        id: ex.id,
        title: ex.title,
        amount: ex.amount,
        category: ex.expense_types?.name || 'Chưa phân loại',
        date: new Date(ex.transaction_date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        type: ex.transaction_type
    }));
});

// Tính toán số liệu tổng quan
const totalIncome = computed(() =>
    analyticsItems.value.filter((e: any) => e.transaction_type === 'income').reduce((sum: number, e: any) => sum + e.amount, 0)
);
const totalExpense = computed(() =>
    analyticsItems.value.filter((e: any) => e.transaction_type === 'expense').reduce((sum: number, e: any) => sum + e.amount, 0)
);

const handleExpenseSubmit = async () => {
    if (!expenseForm.value.name || !expenseForm.value.amount) return;

    expenseSubmitting.value = true;
    try {
        const payload = {
            title: expenseForm.value.name,
            amount: Number(expenseForm.value.amount),
            transaction_type: expenseForm.value.transactionType,
            transaction_date: expenseForm.value.date,
            type_id: expenseForm.value.type ? Number(expenseForm.value.type) : null,
            jar_id: expenseForm.value.jarId ? Number(expenseForm.value.jarId) : null,
            note: expenseForm.value.note
        };

        if (isEditingExpense.value && selectedExpenseId.value) {
            await updateExpense(selectedExpenseId.value, payload);
            toast.success('Đã cập nhật giao dịch');
        } else {
            await createExpense(payload);
            toast.success('Đã thêm giao dịch mới');
        }

        fetchJars(); // Cập nhật lại số dư hũ
        fetchExpenseTypes();
        showExpenseModal.value = false;

        // Reset form
        expenseForm.value = {
            name: '',
            type: '',
            amount: null,
            date: new Date().toISOString().split('T')[0],
            note: '',
            transactionType: 'expense'
        };
        selectedExpenseId.value = null;
    } catch {
        toast.error(isEditingExpense.value ? 'Không thể cập nhật' : 'Không thể thêm giao dịch');
    } finally {
        expenseSubmitting.value = false;
    }
};

const handleBulkSubmit = async (data: any) => {
    expenseSubmitting.value = true;
    try {
        const payloads = data.items.map((item: any) => ({
            title: item.name,
            amount: Number(item.amount),
            transaction_type: data.transactionType,
            transaction_date: data.date,
            type_id: item.type ? Number(item.type) : null,
            jar_id: data.jarId ? Number(data.jarId) : null,
            note: item.note
        }));

        await createBulkExpense(payloads);
        fetchJars();
        toast.success(`Đã thêm ${payloads.length} giao dịch thành công`);
        showBulkModal.value = false;
        await fetchExpenseTypes();
    } catch {
        toast.error('Không thể thêm hàng loạt giao dịch');
    } finally {
        expenseSubmitting.value = false;
    }
};

const handleCreateType = async (payload: any) => {
    const userId = isAdmin.value ? null : currentUser.value?.id;
    await createType({ ...payload, userId });
};

const changeTypePage = (dir: number) => {
    typeParams.page += dir;
    fetchExpenseTypes();
};

// ------------ CHART DATA & OPTIONS ----------------
const doughnutData = computed(() => ({
    labels: categoriesData.value.map(c => c.name),
    datasets: [
        {
            backgroundColor: categoriesData.value.map(c => c.color),
            data: categoriesData.value.map(c => c.value),
            borderWidth: 0,
            cutout: '75%'
        }
    ]
}));

const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: '#fff',
            titleColor: '#1e293b',
            bodyColor: '#64748b',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
        }
    }
};
</script>

<template>
    <div class="min-h-screen bg-[#f8fafc] flex flex-col gap-6 p-4 md:p-6 lg:p-8">
        <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">Quản lý chi tiêu</h1>
                    <span
                        class="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Dashboard</span>
                </div>
                <p class="text-slate-500 text-sm font-medium">
                    Chào mừng trở lại! Bạn có <span class="text-slate-900 font-bold">{{ expensePagination.totalItems ||
                        0 }}
                        giao
                        dịch</span> trong tháng này.
                </p>
            </div>
            <div class="flex items-center gap-3">
                <button @click="showTypeManager = true"
                    class="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95">
                    <Tags :size="18" class="text-slate-400" />
                    <span>Quản lý loại</span>
                </button>
                <button @click="showBulkModal = true"
                    class="flex items-center gap-2 bg-blue-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-900 transition-all active:scale-95">
                    <Layers :size="18" />
                    <span>Thêm nhiều</span>
                </button>
                <!-- <button @click="openAddModal"
                    class="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95">
                    <Plus :size="18" />
                    <span>Thêm giao dịch</span>
                </button> -->
            </div>
        </header>

        <!-- Overview Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <ExpenseOverview :income="totalIncome" :expense="totalExpense" />

                <!-- 6 Financial Jars Status -->
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div v-for="jar in jars" :key="jar.id" 
                        class="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-2 h-2 rounded-full" :style="{ backgroundColor: jar.color }"></div>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ jar.name }}</span>
                        </div>
                        <p class="text-xs font-bold text-slate-800 mb-1 truncate" :title="jar.display_name">{{ jar.display_name }}</p>
                        <div class="flex items-end justify-between">
                            <span class="text-sm font-black text-blue-600">{{ formatCurrency(jar.balance) }}</span>
                            <span class="text-[9px] font-bold text-slate-400">{{ (jar.percentage * 100).toFixed(0) }}%</span>
                        </div>
                        <!-- Mini progress bar -->
                        <div class="w-full h-1 bg-slate-50 rounded-full mt-2 overflow-hidden">
                            <div class="h-full rounded-full opacity-50" :style="{ backgroundColor: jar.color, width: '100%' }"></div>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Filters Bar -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <!-- Search Input -->
                        <div class="relative flex-1">
                            <Search :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" v-model="expenseParams.search"
                                placeholder="Tìm kiếm giao dịch theo tên..."
                                class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
                        </div>

                        <!-- Filter Toggle Button -->
                        <button @click="showAdvancedFilters = !showAdvancedFilters" :class="cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm',
                            showAdvancedFilters
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        )">
                            <Filter :size="18" />
                            <span>Bộ lọc</span>
                            <div v-if="hasActiveFilters" class="w-2 h-2 rounded-full bg-blue-500"></div>
                        </button>

                        <button v-if="expenseParams.search || hasActiveFilters"
                            @click="expenseParams.search = ''; filterDate = ''; (expenseParams as any).transaction_type = 'all'; (expenseParams as any).type_id = 'all'"
                            class="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Xóa tất cả bộ lọc">
                            <X :size="18" />
                        </button>
                    </div>

                    <!-- Advanced Filters Panel -->
                    <div v-if="showAdvancedFilters"
                        class="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Khoảng
                                thời gian (Ngày)</label>
                            <input type="date" v-model="filterDate"
                                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                        <div class="space-y-1.5">
                            <label
                                class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tháng</label>
                            <input type="month" v-model="filterMonth"
                                class="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Loại giao
                                dịch</label>
                            <AppDropDown v-model="expenseParams.transaction_type" :options="transactionTypeOptions"
                                class="w-full" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Danh
                                mục</label>
                            <AppDropDown v-model="expenseParams.type_id" :options="categoryOptions" class="w-full" />
                        </div>
                        <div v-if="isAdmin" class="space-y-1.5">
                            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Người
                                dùng</label>
                            <AppDropDown v-model="expenseParams.userIdFilter" :options="userFilterOptions"
                                class="w-full" />
                        </div>
                    </div>
                </div>

                <ExpenseTransactionList :transactions="transactions" @select="handleSelectTransaction" />

                <!-- Điều khiển phân trang -->
                <div
                    class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
                    <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Trang {{ expenseParams.page }} / {{ expensePagination.totalPages || 1 }}
                    </span>
                    <div class="flex items-center gap-2">
                        <button @click="changePage(-1)" :disabled="expenseParams.page <= 1"
                            class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft :size="16" />
                        </button>
                        <button @click="changePage(1)"
                            :disabled="!expensePagination.hasNextPage || expenseParams.page >= expensePagination.totalPages"
                            class="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronRight :size="16" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Categories Analysis (fills available height) -->
            <div class="space-y-8 flex flex-col min-h-0 h-full">
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="font-bold text-slate-800 text-base">Phân bổ chi tiêu</h3>
                        <button @click="showTypeManager = true"
                            class="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                            <Settings2 :size="16" />
                        </button>
                    </div>
                    <div class="h-[200px] w-full mb-8 relative">

                        <!-- Nhân vật Bubu chỉ tay dễ thương -->
                        <div
                            class="absolute -bottom-4 -left-10 w-32 h-32 pointer-events-none drop-shadow-xl animate-float">
                            <!-- Bong bóng thoại của Bubu -->
                            <div
                                class="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[130px] bg-white p-2 rounded-2xl border border-blue-100 shadow-sm text-[10px] font-bold text-blue-600 leading-tight">
                                {{ bubuMessage }}
                                <!-- Mũi tên của bong bóng -->
                                <div
                                    class="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-blue-100 rotate-45">
                                </div>
                            </div>
                            <img src="/bubu-removebg-preview.png" alt="Bubu" class="w-full h-full object-contain" />
                        </div>

                        <!-- Đây là CHART HIỂN THỊ DỮ LIỆU PHÂN BỔ CHI TIÊU -->
                        <div v-if="totalCategoriesValue > 0" class="h-full w-full">
                            <Doughnut :data="doughnutData" :options="doughnutOptions"
                                :key="JSON.stringify(doughnutData.datasets[0].data)" />
                        </div>
                        <div v-else
                            class="h-full w-full flex items-center justify-center border-4 border-dashed border-slate-50 rounded-full text-slate-300 text-[10px] font-bold uppercase tracking-widest text-center px-4">
                            Chưa có dữ liệu chi tiêu
                        </div>

                        <!-- Nhân vật dudu xin lỗi dễ thương -->
                        <div
                            class="absolute -bottom-4 -right-10 w-32 h-32 pointer-events-none drop-shadow-xl animate-float">
                            <!-- Bong bóng thoại của Bubu -->
                            <div
                                class="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[100px] bg-white p-2 rounded-2xl border border-blue-100 shadow-sm text-[10px] font-bold text-blue-600 leading-tight">
                                {{ duduMessage }}
                                <!-- Mũi tên của bong bóng -->
                                <div
                                    class="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-blue-100 rotate-45">
                                </div>
                            </div>
                            <img src="/dudu-removebg-preview.png" alt="Bubu" class="w-full h-full object-contain" />
                        </div>


                    </div>
                    <div class="space-y-4">
                        <div v-for="cat in displayedCategories" :key="cat.name" class="group flex items-center gap-4">
                            <div class="w-2 h-10 rounded-full" :style="{ backgroundColor: cat.color }" />
                            <div class="flex-1">
                                <div class="flex justify-between items-center mb-1">
                                    <span
                                        class="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{{
                                            cat.name }}</span>
                                    <span class="text-sm font-bold text-slate-900">{{ formatCurrency(cat.value)
                                        }}</span>
                                </div>
                                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80"
                                        :style="{ backgroundColor: cat.color, width: `${(cat.value / (totalCategoriesValue || 1)) * 100}%` }" />
                                </div>
                            </div>
                        </div>

                        <!-- Toggle Button -->
                        <div v-if="categoriesData.length > categoryCount" class="pt-4 border-t border-slate-50 mt-2">
                            <button @click="showAllCategories = !showAllCategories"
                                class="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                <span>{{ showAllCategories ? 'Thu gọn' : `Xem thêm ${categoriesData.length -
                                    categoryCount} danh mục` }}</span>
                                <ChevronDown :size="14"
                                    :class="cn('transition-transform duration-300', showAllCategories && 'rotate-180')" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    class="bg-gradient-to-br from-slate-900 to-blue-900 p-6 rounded-3xl shadow-xl text-white flex-shrink-0 relative overflow-hidden group border border-white/10">
                    <div
                        class="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-700">
                    </div>
                    <h3 class="text-[10px] font-black mb-3 uppercase tracking-[0.25em] text-blue-400/80">Smart Insights
                    </h3>
                    <p class="text-sm leading-relaxed font-medium relative z-10 text-slate-200">
                        Bạn đã tiết kiệm được <span
                            class="text-white font-bold decoration-blue-400/50 underline underline-offset-4 decoration-2">2.500.000đ</span>
                        so với ngân sách dự kiến.
                    </p>
                    <div
                        class="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-white/5 w-fit px-2 py-1 rounded-lg border border-white/5">
                        <Check :size="10" /> <span>Hành động tích cực</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AddExpenseModal v-model:open="showExpenseModal" v-model="expenseForm" :is-editing="isEditingExpense"
        :types="allExpenseTypes" :loading="expenseSubmitting" @submit="handleExpenseSubmit"
        @close="showExpenseModal = false" @manage-types="showTypeManager = true" />

    <BulkAddExpenseModal v-model:open="showBulkModal" :types="allExpenseTypes" :loading="expenseSubmitting"
        @submit="handleBulkSubmit" />

    <!-- Modal Quản lý Loại chi phí (CRUD) -->
    <AppModal v-model:open="showTypeManager" :title="editingType ? 'Chỉnh sửa danh mục' : 'Quản lý danh mục'"
        size="3xl">
        <div class="space-y-6">
            <!-- Form thêm/sửa -->
            <div v-if="can('create', 'expense_types') || isEditingTypeMode"
                class="bg-slate-900 p-6 rounded-2xl border border-slate-700/50 space-y-4 shadow-inner">
                <div class="flex items-center justify-between">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {{ isEditingTypeMode ? 'Chế độ chỉnh sửa' : 'Tạo danh mục mới' }}
                    </p>
                    <button v-if="isEditingTypeMode" @click="cancelEditType"
                        class="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase">
                        Hủy bỏ
                    </button>
                </div>

                <div class="grid grid-cols-1 gap-4">
                    <div class="space-y-1">
                        <label class="text-[11px] font-medium text-slate-400 ml-1">Tên danh mục</label>
                        <input v-model="newTypeForm.name" placeholder="Vd: Ăn uống, Du lịch..."
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl text-sm px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500" />
                    </div>
                    <div class="space-y-1">
                        <label class="text-[11px] font-medium text-slate-400 ml-1">Mô tả (không bắt buộc)</label>
                        <input v-model="newTypeForm.description" placeholder="Ghi chú ngắn về loại này..."
                            class="w-full bg-slate-800 border border-slate-700 rounded-xl text-sm px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500" />
                    </div>
                </div>

                <button @click="handleSubmitType" :disabled="!newTypeForm.name || isAddingType"
                    class="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40">
                    <Check v-if="!isAddingType" :size="18" />
                    <span v-else
                        class="block w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
                    {{ isEditingTypeMode ? 'Cập nhật thay đổi' : 'Thêm danh mục' }}
                </button>
            </div>

            <!-- Danh sách hiện tại -->
            <div class="space-y-3">
                <div class="flex items-center justify-between ml-1">
                    <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh sách hiện tại</h4>
                    <!-- Bộ lọc người dùng dành cho Admin -->
                    <div v-if="isAdmin" class="w-48">
                        <AppDropDown v-model="typeParams.userIdFilter" :options="userFilterOptions"
                            @update:model-value="fetchExpenseTypes" />
                    </div>
                </div>
                <div class="space-y-2">
                    <div v-for="type in expenseTypes" :key="type.id"
                        class="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all group">
                        <div class="min-w-0 flex-1 mr-4">
                            <div class="flex items-center gap-2 mb-0.5">
                                <p class="text-sm font-bold text-white truncate">{{ type.name }}</p>
                                <span :class="cn(
                                    'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter',
                                    !type.userId ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                )">
                                    {{ !type.userId ? 'Hệ thống' : 'Cá nhân' }}
                                </span>
                            </div>
                            <p v-if="type.description" class="text-[11px] text-slate-400 truncate font-medium">{{
                                type.description }}</p>
                        </div>

                        <div v-if="can('update', 'expense_types', type.userId) || can('delete', 'expense_types', type.userId)"
                            class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button v-if="can('update', 'expense_types', type.userId)" @click="openEditTypeModal(type)"
                                class="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                                <Pencil :size="14" />
                            </button>
                            <button v-if="can('delete', 'expense_types', type.userId)"
                                @click="handleDeleteType(type.id)"
                                class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                <Trash2 :size="14" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Pagination cho Loại chi phí -->
                <div class="flex items-center justify-between pt-6 border-t border-white/5">
                    <span class="text-[10px] text-slate-500 font-bold uppercase">Tổng: {{ typePagination.totalItems }}
                        danh mục</span>
                    <div class="flex items-center gap-2">
                        <button :disabled="typeParams.page === 1" @click="changeTypePage(-1)"
                            class="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all">
                            <ChevronLeft :size="16" />
                        </button>
                        <span class="text-xs font-bold text-white px-2">
                            {{ typeParams.page }} / {{ typePagination.totalPages || 1 }}
                        </span>
                        <button :disabled="typeParams.page >= (typePagination.totalPages ?? 0)"
                            @click="changeTypePage(1)"
                            class="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-all">
                            <ChevronRight :size="16" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <button @click="showTypeManager = false"
                class="w-full py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                Đóng
            </button>
        </template>
    </AppModal>
</template>

<style scoped>
@keyframes float {

    0%,
    100% {
        transform: translateY(0) rotate(0);
    }

    50% {
        transform: translateY(-8px) rotate(5deg);
    }
}

.animate-float {
    animation: float 3s ease-in-out infinite;
}
</style>
