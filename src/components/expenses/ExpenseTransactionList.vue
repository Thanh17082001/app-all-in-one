<script setup lang="ts">
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-vue-next';
import { cn, formatCurrency } from '@/utils';

defineProps<{
    transactions: any[];
}>();

const emit = defineEmits<{
    (e: 'select', tx: any): void;
}>();
</script>

<template>
    <div
        class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-800 flex-1 min-h-0 flex flex-col">
        <div class="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <h3 class="font-bold">Giao dịch gần đây</h3>
        </div>
        <div class="divide-y divide-slate-100 overflow-auto flex-1 min-h-0">
            <div v-for="tx in transactions" :key="tx.id" @click="emit('select', tx)"
                class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-all-scroll group">
                <div :class="cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                )">
                    <component :is="tx.type === 'income' ? TrendingUp : TrendingDown" :size="20" />
                </div>
                <div class="flex-1">
                    <h4 class="text-sm font-semibold text-slate-800">{{ tx.title }}</h4>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{{ tx.category
                            }}</span>
                        <span class="text-[10px] text-slate-300">•</span>
                        <span class="text-[10px] font-medium bold text-slate-400">{{ tx.date }}</span>
                    </div>
                </div>
                <div class="text-right">
                    <p :class="cn('font-bold text-sm', tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900')">
                        {{ tx.type === 'income' ? '+' : '' }}{{ formatCurrency(tx.amount) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>