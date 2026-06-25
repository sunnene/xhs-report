<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note } from '@/types'

const props = defineProps<{
  notes: Note[]
}>()

const weeklyTarget = ref<number>(1000)
const monthlyTarget = ref<number>(4000)
const yearlyTarget = ref<number>(50000)
const showWeekly = ref(true)

function getWeeklyData(notes: Note[]) {
  const weeks: Record<string, number> = {}
  notes.forEach(note => {
    const date = note.date || '2026-06-10'
    const weekStart = getWeekStart(date)
    const interaction = note.like + note.comment + note.collect + note.share
    weeks[weekStart] = (weeks[weekStart] || 0) + interaction
  })
  return Object.entries(weeks).map(([week, value]) => ({
    week,
    actual: value,
    target: weeklyTarget.value,
    percentage: Math.round((value / weeklyTarget.value) * 100)
  }))
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
}

function getMonthlyData(weeklyData: { week: string; actual: number }[]) {
  const months: Record<string, number> = {}
  weeklyData.forEach(item => {
    const month = item.week.substring(0, 7)
    months[month] = (months[month] || 0) + item.actual
  })
  return Object.entries(months).map(([month, value]) => ({
    month,
    actual: value,
    target: monthlyTarget.value,
    percentage: Math.round((value / monthlyTarget.value) * 100)
  }))
}

function getYearlyData(monthlyData: { month: string; actual: number }[]) {
  const total = monthlyData.reduce((sum, item) => sum + item.actual, 0)
  return {
    actual: total,
    target: yearlyTarget.value,
    percentage: Math.round((total / yearlyTarget.value) * 100)
  }
}

const weeklyStats = computed(() => getWeeklyData(props.notes))
const monthlyStats = computed(() => getMonthlyData(weeklyStats.value))
const yearlyStats = computed(() => getYearlyData(monthlyStats.value))

const totalInteraction = computed(() => weeklyStats.value.reduce((sum, item) => sum + item.actual, 0))

function toggleWeekly() {
  showWeekly.value = !showWeekly.value
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <span class="text-xl">📊</span>
        <h3 class="text-lg font-semibold text-gray-800">互动量目标拆解</h3>
      </div>
      <div class="text-right">
        <div class="text-sm text-gray-500">累计互动量</div>
        <div class="text-xl font-bold text-blue-600">{{ totalInteraction.toLocaleString() }}</div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">周目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="weeklyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span class="text-gray-600">次互动</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">月目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="monthlyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span class="text-gray-600">次互动</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">年目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="yearlyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span class="text-gray-600">次互动</span>
        </div>
      </div>
    </div>
    
    <div class="space-y-6">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-700">📅 周维度拆解</h4>
          <button 
            @click="toggleWeekly"
            class="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
          >
            <span>{{ showWeekly ? '▼ 收起' : '▶ 展开' }}</span>
            <span class="text-gray-400">{{ weeklyStats.length }} 周数据</span>
          </button>
        </div>
        
        <div v-if="showWeekly" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div 
            v-for="item in weeklyStats" 
            :key="item.week"
            class="bg-gray-50 rounded-lg p-4"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-sm font-medium text-gray-700">{{ item.week }} 周</span>
              <div :class="['text-lg font-bold', item.percentage >= 100 ? 'text-green-500' : 'text-orange-500']">
                {{ item.percentage }}%
              </div>
            </div>
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-600">实际</span>
              <span class="font-semibold text-gray-800">{{ item.actual.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-600">目标</span>
              <span class="text-gray-500">{{ item.target.toLocaleString() }}</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden" :style="{ minWidth: `${Math.max(item.percentage, 100)}%` }">
              <div 
                :class="['h-full transition-all duration-500', item.percentage >= 100 ? 'bg-green-500' : 'bg-orange-500']"
                :style="{ width: `${item.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
        
        <div v-else class="bg-gray-50 rounded-lg p-4 text-center">
          <span class="text-gray-500">点击展开查看 {{ weeklyStats.length }} 周数据</span>
        </div>
      </div>
      
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-700">📆 月维度拆解</h4>
          <span class="text-sm text-gray-500">共 {{ monthlyStats.length }} 月</span>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="flex-1">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-600">月份</span>
                <span class="text-gray-600">达成率</span>
              </div>
              <div class="space-y-3">
                <div v-for="item in monthlyStats" :key="item.month" class="relative">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">{{ item.month }}</span>
                    <span :class="['text-sm font-semibold', item.percentage >= 100 ? 'text-green-600' : 'text-orange-600']">
                      {{ item.percentage }}%
                    </span>
                  </div>
                  <div class="h-4 bg-gray-200 rounded-full overflow-hidden" :style="{ minWidth: `${Math.max(item.percentage, 100)}%` }">
                    <div 
                      :class="['h-full transition-all duration-500 flex items-center justify-end pr-2', item.percentage >= 100 ? 'bg-green-500' : 'bg-orange-500']"
                      :style="{ width: `${Math.max(item.percentage, 5)}%` }"
                    >
                      <span v-if="item.percentage >= 20" class="text-xs text-white font-medium">
                        {{ item.actual.toLocaleString() }}
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>目标: {{ item.target.toLocaleString() }}</span>
                    <span>实际: {{ item.actual.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-700">📈 年维度拆解</h4>
        </div>
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div class="text-sm opacity-80">年度实际互动量</div>
              <div class="text-2xl font-bold">{{ yearlyStats.actual.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-sm opacity-80">年度目标互动量</div>
              <div class="text-2xl font-bold">{{ yearlyStats.target.toLocaleString() }}</div>
            </div>
            <div>
              <div class="text-sm opacity-80">年度达成率</div>
              <div class="text-2xl font-bold">{{ yearlyStats.percentage }}%</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-3 bg-white/30 rounded-full overflow-hidden" :style="{ minWidth: `${Math.max(yearlyStats.percentage, 100)}%` }">
              <div 
                class="h-full bg-white transition-all duration-500"
                :style="{ width: `${yearlyStats.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
