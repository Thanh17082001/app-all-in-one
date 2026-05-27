<script setup lang="ts">
import { ref, computed } from 'vue'
import AppFormModal from '@/components/ui/AppFormModal.vue'
import AppFormField from '@/components/ui/AppFormField.vue'
import AppDropDown from '@/components/ui/AppDropDown.vue'
import { Plus, Trash2, Layers, Image as ImageIcon, Sparkles, Loader2, Upload, Check, X } from 'lucide-vue-next'
import { cn, formatCurrency } from '@/utils'
import { useExpense } from '@/composables/useExpense'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
    open: boolean
    loading?: boolean
    types?: any[]
}>()

const emit = defineEmits<{
    'update:open': [value: boolean]
    'submit': [data: any]
}>()

const { scanReceipt } = useExpense()
const toast = useToast()

const sharedData = ref({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'expense' as 'expense' | 'income'
})

interface BulkItem {
    name: string
    amount: number | null
    type: string | number
    note: string
}

const items = ref<BulkItem[]>([
    { name: '', amount: null, type: '', note: '' }
])

const categoryOptions = computed(() => {
    if (!props.types?.length) return []
    return props.types.map(t => ({ label: t.name, value: t.id }))
})

// Tính tổng tiền tạm tính cho UX
const tempTotal = computed(() => {
    return items.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
})

const addItem = () => {
    items.value.push({ name: '', amount: null, type: '', note: '' })
}

const removeItem = (index: number) => {
    if (items.value.length > 1) {
        items.value.splice(index, 1)
    }
}

const handleSubmit = () => {
    const validItems = items.value.filter(i => i.name && i.amount)
    if (validItems.length === 0) return

    emit('submit', {
        ...sharedData.value,
        items: validItems
    })
}

const isScanning = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const isReviewingAI = ref(false)
const aiPreviewItems = ref<BulkItem[]>([])
const previewUrl = ref<string | null>(null)
const isDragging = ref(false)

const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chỉ tải lên tệp ảnh (jpg, png, webp...).')
        return
    }

    // Tạo URL xem trước ảnh
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(file)

    isScanning.value = true
    try {
        // Truyền props.types (danh sách danh mục) vào hàm quét
        const aiItems = await scanReceipt(file, props.types || [])
        if (aiItems && aiItems.length > 0) {
            // Map từ tên danh mục AI trả về sang ID danh mục trong hệ thống
            aiPreviewItems.value = aiItems.map(i => {
                const foundType = props.types?.find(t =>
                    t.name.toLowerCase() === i.category?.toLowerCase()
                )
                return {
                    name: i.name,
                    amount: i.amount,
                    type: foundType ? foundType.id : '',
                    note: i.note
                }
            })
            isReviewingAI.value = true
            toast.success(`Gemini AI đã tìm thấy ${aiItems.length} mục. Vui lòng kiểm tra lại!`)
        }
    } catch (err) {
        console.log(err)
        toast.error('AI không thể đọc được hóa đơn này. Vui lòng thử lại sau vài phút!!!')
    } finally {
        isScanning.value = false
    }
}

const handleScanAI = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) processFile(file)
    // Reset input để có thể chọn lại cùng 1 file nếu cần
    if (target) target.value = ''
}

const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
}

const handleDragLeave = () => {
    isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false

    const file = e.dataTransfer?.files[0]
    if (file) processFile(file)
}

const confirmAIResults = () => {
    // Lọc bỏ tất cả các dòng hoàn toàn trống trước khi trộn dữ liệu AI vào
    items.value = items.value.filter(item =>
        item.name.trim() !== '' ||
        (item.amount !== null && item.amount !== 0) ||
        item.note.trim() !== ''
    )
    items.value.push(...aiPreviewItems.value)
    cancelAIReview()
}

const cancelAIReview = () => {
    isReviewingAI.value = false
    aiPreviewItems.value = []
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
        previewUrl.value = null
    }
}

const reset = () => {
    items.value = [{ name: '', amount: null, type: '', note: '' }];
    sharedData.value = {
        date: new Date().toISOString().split('T')[0],
        transactionType: 'expense'
    };
    isReviewingAI.value = false;
    aiPreviewItems.value = [];
    previewUrl.value = null;
}
</script>

<template>
    <AppFormModal :open="open" title="Thêm giao dịch hàng loạt"
        description="Nhập nhiều giao dịch cùng một lúc với chung ngày và loại hình." :loading="loading" size="5xl"
        @update:open="emit('update:open', $event)" @submit="handleSubmit" @close="reset">
        <template #icon>
            <Layers :size="20" />
        </template>

        <!-- Phần chung -->
        <div class="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl mb-6 border border-slate-100 relative z-20">
            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Ngày giao dịch chung</label>
                <AppFormField type="date" v-model="sharedData.date" required />
            </div>
            <div class="space-y-2">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Loại hình</label>
                <div class="flex bg-white p-1 rounded-xl border border-slate-200">
                    <button type="button" @click="sharedData.transactionType = 'expense'" :class="cn(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        sharedData.transactionType === 'expense' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                    )">Chi tiêu</button>
                    <button type="button" @click="sharedData.transactionType = 'income'" :class="cn(
                        'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                        sharedData.transactionType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                    )">Thu nhập</button>
                </div>
            </div>
        </div>

        <!-- Khu vực Upload AI -->
        <div class="mb-6" v-if="!isReviewingAI">
            <div @click="fileInput?.click()" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop"
                :class="cn(
                    'relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group overflow-hidden',
                    isDragging ? 'border-blue-500 bg-blue-100/50 scale-[1.01] shadow-lg shadow-blue-100/50' : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300'
                )">
                <div v-if="isScanning"
                    class="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 class="animate-spin text-blue-600 mb-2" :size="32" />
                    <span class="text-sm font-bold text-blue-700 animate-pulse">Gemini AI đang phân tích ảnh...</span>
                </div>

                <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleScanAI" />

                <div :class="cn(
                    'w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-600 transition-transform duration-300',
                    isDragging ? 'scale-125' : 'group-hover:scale-110'
                )">
                    <Sparkles v-if="!isScanning" :size="24" />
                </div>

                <div class="text-center">
                    <p class="text-sm font-bold text-slate-700">
                        {{ isDragging ? 'Thả ảnh vào đây để quét' : 'Tải lên ảnh hóa đơn (Viết tay hoặc Đánh máy)' }}
                    </p>
                    <p class="text-xs text-slate-500 mt-1">
                        Gemini AI sẽ tự động đọc danh sách và điền vào form cho bạn
                    </p>
                </div>

                <div
                    class="flex items-center gap-2 mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                    <Upload :size="12" />
                    <span>Chọn ảnh ngay</span>
                </div>
            </div>
        </div>

        <!-- Khu vực Xem trước kết quả AI (Chỉ hiện khi AI trả về dữ liệu) -->
        <div v-if="isReviewingAI"
            class="mb-8 p-6 bg-blue-50/50 border-2 border-blue-200 rounded-3xl animate-in fade-in zoom-in duration-300">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <Sparkles class="text-blue-600" :size="20" />
                    <h4 class="font-bold text-blue-900">Kết quả trích xuất từ Gemini AI</h4>
                </div>
                <button @click="cancelAIReview" class="text-slate-400 hover:text-red-500 transition-colors">
                    <X :size="20" />
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Ảnh hóa đơn -->
                <div
                    class="aspect-[4/3] md:aspect-auto md:h-[300px] rounded-2xl overflow-hidden border border-blue-100 bg-white shadow-inner">
                    <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-contain" />
                </div>

                <!-- Danh sách AI tìm được -->
                <div class="flex flex-col">
                    <div class="flex-1 space-y-2 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                        <div v-for="(item, idx) in aiPreviewItems" :key="idx"
                            class="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm group">
                            <div class="min-w-0 flex-1">
                                <p class="text-sm font-bold text-slate-800 truncate">{{ item.name }}</p>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span v-if="item.type"
                                        class="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold uppercase tracking-tighter">
                                        {{types?.find(t => t.id === item.type)?.name || 'N/A'}}
                                    </span>
                                    <p class="text-[10px] text-slate-500 truncate italic">
                                        {{ item.note || 'Không có ghi chú' }}
                                    </p>
                                </div>
                            </div>
                            <div class="text-right ml-4">
                                <p class="text-sm font-black text-blue-600">{{ formatCurrency(item.amount || 0) }}</p>
                            </div>
                        </div>
                    </div>

                    <button @click="confirmAIResults"
                        class="w-full mt-4 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                        <Check :size="18" />
                        <span>Xác nhận và thêm vào danh sách</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Danh sách items -->
        <div class="space-y-3 overflow-y-auto pr-2 custom-scrollbar relative z-10 pb-40"
            :class="{ 'max-h-[400px]': items.length > 2 }">
            <div class="flex items-center justify-between mb-4 px-1">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh sách giao dịch</label>
                <span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Tổng: {{
                    formatCurrency(tempTotal)
                    }}</span>
            </div>
            <div v-for="(item, index) in items" :key="index"
                class="group flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 transition-all relative"
                :style="{ zIndex: items.length - index }">
                <div
                    class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 mt-1 shrink-0">
                    {{ index + 1 }}
                </div>

                <div class="grid grid-cols-12 gap-3 flex-1">
                    <div class="col-span-4">
                        <AppFormField v-model="item.name" placeholder="Tên giao dịch..." />
                    </div>
                    <div class="col-span-3">
                        <AppFormField :model-value="item.amount !== null ? String(item.amount) : ''"
                            @update:model-value="val => item.amount = (val === '' ? null : Number(val))" type="number"
                            is-currency placeholder="Số tiền..." />
                    </div>
                    <div class="col-span-3">
                        <AppDropDown v-model="item.type" :options="categoryOptions" placeholder="Danh mục..." />
                    </div>

                    <div class="col-span-2">
                        <AppFormField v-model="item.note" placeholder="Ghi chú..." />
                    </div>
                </div>

                <button @click="removeItem(index)" class="mt-2 text-slate-300 hover:text-red-500 transition-colors"
                    :disabled="items.length === 1">
                    <Trash2 :size="18" />
                </button>
            </div>
        </div>

        <button type="button" @click="addItem"
            class="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
            <Plus :size="18" />
            <span>Thêm dòng giao dịch</span>
        </button>
    </AppFormModal>
</template>