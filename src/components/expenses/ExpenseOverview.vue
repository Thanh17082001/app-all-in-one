<script setup lang="ts">
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-vue-next';
import { formatCurrency } from '@/utils';

defineProps<{
    income: number;
    expense: number;
}>();
</script>

<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-3">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md hover:border-emerald-100 transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingUp :size="24" />
                </div>
                <span class="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Tổng thu nhập</span>
            </div>
            <h2 class="text-4xl font-extrabold tracking-tight text-slate-900">{{ formatCurrency(income) }}</h2>
            <div class="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <span class="bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><ArrowUpRight :size="12" /><span>8.2%</span></span>
                <span class="text-slate-400 font-normal">So với tháng trước</span>
            </div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md hover:border-blue-100 transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <TrendingDown :size="24" />
                </div>
                <span class="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Tổng chi tiêu</span>
            </div>
            <h2 class="text-4xl font-extrabold tracking-tight text-slate-900">{{ formatCurrency(expense) }}</h2>
            <div class="mt-6 flex items-center gap-2 text-blue-600 font-bold text-xs">
                <span class="bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1"><ArrowDownRight :size="12" /><span>3.5%</span></span>
                <span class="text-slate-400 font-normal">So với tháng trước</span>
            </div>
        </div>
    </div>
</template>