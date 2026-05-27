<script setup lang="ts">
import { formatCurrency } from '@/utils';
import { CheckCircle2, Clock, FileText, Wallet } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const authStore = useAuthStore()

const chartData = {
  labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
  datasets: [
    {
      label: 'Thu nhập',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: '#10B981',
      borderWidth: 2,
      data: [400, 300, 200, 278, 189, 239, 349],
      fill: true,
      tension: 0.4
    },
    {
      label: 'Chi tiêu',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: '#3b82f6',
      borderWidth: 2,
      data: [240, 139, 980, 390, 480, 380, 430],
      fill: true,
      tension: 0.4
    }
  ]
};
const chartOptions = {
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
      displayColors: true,
      cornerRadius: 8
    }
  },
  scales: {
    y: {
      grid: {
        display: true,
        color: '#f1f5f9'
      },
      ticks: {
        font: { size: 11 },
        color: '#94a3b8',
        callback: (val: any) => val + 'k'
      },
      border: { display: false }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: { size: 11 },
        color: '#94a3b8'
      },
      border: { display: false }
    }
  }
};

</script>

<template>
  <div class="space-y-8">
    <!-- header bên phải của layout admin -->
    <header>
      <h1 class="text-lg font-semibold">Chào buổi sáng, {{ authStore.user?.fullname || 'User' }}</h1>
      <p class="text-slate-500 mt-1 text-sm">Đây là những gì đang diễn ra trong ngày hôm nay của bạn.</p>
    </header>
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div class="flex justify-between items-start mb-3">
          <div class="p-2 rounded-lg text-white bg-blue-600">
            <Wallet :size="18" />
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            +12.5%
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng số dư</p>
          <h4 class="text-2xl font-bold mt-1 text-slate-900">{{ formatCurrency(12500000) }}</h4>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div class="flex justify-between items-start mb-3">
          <div class="p-2 rounded-lg text-white bg-emerald-600">
            <CheckCircle2 :size="18" />
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
            75% Hoàn thành
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Công việc</p>
          <h4 class="text-2xl font-bold mt-1 text-slate-900">6 / 8</h4>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div class="flex justify-between items-start mb-3">
          <div class="p-2 rounded-lg text-white bg-indigo-600">
            <Clock :size="18" />
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500">
            Phiên hiện tại
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian tập trung</p>
          <h4 class="text-2xl font-bold mt-1 text-slate-900">45:00</h4>
        </div>
      </div>

      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <div class="flex justify-between items-start mb-3">
          <div class="p-2 rounded-lg text-white bg-slate-600">
            <FileText :size="18" />
          </div>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-400">
            Tuần này
          </span>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Tệp tin mới</p>
          <h4 class="text-2xl font-bold mt-1 text-slate-900">12</h4>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Activity Chart -->
      <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between mb-8">
          <h3 class="font-bold text-slate-800">Biểu đồ chi tiêu & thu nhập</h3>
          <select class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:ring-0 outline-none">
            <option>7 ngày qua</option>
            <option>30 ngày qua</option>
          </select>
        </div>
        
        <div class="h-[300px] w-full">
          <Line :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Upcoming Tasks -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-slate-800">Công việc sắp tới</h3>
          <span class="text-blue-600 text-xs font-bold uppercase">Hôm nay</span>
        </div>
        <div class="space-y-4 flex-1">
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div class="w-5 h-5 rounded border flex items-center justify-center transition-colors bg-blue-600 border-blue-600 text-white">
              <CheckCircle2 :size="12" />
            </div>
            <span class="text-sm font-medium text-slate-400 line-through">Gửi báo cáo tài chính Q3</span>
          </div>
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div class="w-5 h-5 rounded border border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors"></div>
            <span class="text-sm font-medium text-slate-700">Họp nhóm thiết kế UI</span>
          </div>
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div class="w-5 h-5 rounded border border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors"></div>
            <span class="text-sm font-medium text-slate-700">Cập nhật LifeSphere theme</span>
          </div>
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
            <div class="w-5 h-5 rounded border border-slate-300 group-hover:border-blue-400 flex items-center justify-center transition-colors"></div>
            <span class="text-sm font-medium text-slate-700">Chuẩn bị bài thuyết trình</span>
          </div>
        </div>
        <button class="w-full mt-6 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          Xem tất cả
        </button>
      </div>
    </div>
  </div>
</template>