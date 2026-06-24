<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note } from '@/types'

const props = defineProps<{
  notes: Note[]
}>()

const weeklyTarget = ref<number>(100)
const monthlyTarget = ref<number>(400)
const yearlyTarget = ref<number>(5000)
const additionalFollowers = ref<number>(0)
const currentFollowers = ref<number>(0)
const initialFollowers = ref<number>(0)
const showWeekly = ref(true)

function getWeeklyData(notes: Note[]) {
  const weeks: Record<string, number> = {}
  notes.forEach(note => {
    const date = note.date || '2026-06-10'
    const weekStart = getWeekStart(date)
    weeks[weekStart] = (weeks[weekStart] || 0) + (note.followers || 0)
  })
  return Object.entries(weeks).map(([week, value]) => ({
    week,
    actual: value,
    target: weeklyTarget.value,
    percentage: Math.min(Math.round((value / weeklyTarget.value) * 100), 100)
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
    percentage: Math.min(Math.round((value / monthlyTarget.value) * 100), 100)
  }))
}

function getYearlyData(monthlyData: { month: string; actual: number }[]) {
  const totalFromTable = monthlyData.reduce((sum, item) => sum + item.actual, 0)
  const total = totalFromTable + additionalFollowers.value
  return {
    actual: totalFromTable,
    additional: additionalFollowers.value,
    total: total,
    target: yearlyTarget.value,
    percentage: Math.min(Math.round((total / yearlyTarget.value) * 100), 100)
  }
}

const weeklyStats = computed(() => getWeeklyData(props.notes))
const monthlyStats = computed(() => getMonthlyData(weeklyStats.value))
const yearlyStats = computed(() => getYearlyData(monthlyStats.value))
const totalFollowers = computed(() => weeklyStats.value.reduce((sum, item) => sum + item.actual, 0))

const chartData = computed(() => {
  const sortedMonths = [...monthlyStats.value].sort((a, b) => a.month.localeCompare(b.month))
  return sortedMonths.map(item => ({
    month: item.month.split('-')[1] + '月',
    value: item.actual,
    target: item.target
  }))
})

const maxValue = computed(() => {
  const values = monthlyStats.value.map(item => item.actual)
  const max = Math.max(...values, monthlyTarget.value, 1)
  return Math.ceil(max * 1.2)
})

const linePath = computed(() => {
  if (monthlyStats.value.length === 0) return ''
  const points = monthlyStats.value.map((item, index) => {
    const x = index * (700 / (monthlyStats.value.length - 1 || 1))
    const y = 160 - (item.actual / maxValue.value) * 160
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  return points.join(' ')
})

const areaPath = computed(() => {
  if (monthlyStats.value.length === 0) return ''
  const points = monthlyStats.value.map((item, index) => {
    const x = index * (700 / (monthlyStats.value.length - 1 || 1))
    const y = 160 - (item.actual / maxValue.value) * 160
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  const lastX = (monthlyStats.value.length - 1) * (700 / (monthlyStats.value.length - 1 || 1))
  return `${points.join(' ')} L ${lastX} 160 L 0 160 Z`
})

function toggleWeekly() {
  showWeekly.value = !showWeekly.value
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <span class="text-xl">📈</span>
        <h3 class="text-lg font-semibold text-gray-800">涨粉目标拆解</h3>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-center">
          <div class="text-sm text-gray-500">当前粉丝数</div>
          <div class="flex items-center gap-1">
            <input 
              v-model.number="currentFollowers"
              type="number"
              class="w-28 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            <span class="text-sm text-gray-500">人</span>
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm text-gray-500">累计涨粉</div>
          <div class="text-xl font-bold text-green-600">{{ totalFollowers.toLocaleString() }}</div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">周目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="weeklyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span class="text-gray-600">人</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">月目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="monthlyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <span class="text-gray-600">人</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">年目标</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="yearlyTarget"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <span class="text-gray-600">人</span>
        </div>
      </div>
      <div class="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-1">初始粉丝</div>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="initialFollowers"
            type="number"
            class="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span class="text-gray-600">人</span>
        </div>
      </div>
    </div>
    
    <div class="space-y-6">
      <div>
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-medium text-gray-700">📊 月度粉丝增量趋势</h4>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <div v-if="chartData.length > 0">
            <svg :width="'100%'" height="200" viewBox="0 0 800 200" class="mx-auto">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#3b82f6" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g transform="translate(60, 20)">
                <line x1="0" y1="0" x2="0" y2="160" stroke="#e5e7eb" stroke-width="1" />
                <line x1="0" y1="160" x2="700" y2="160" stroke="#e5e7eb" stroke-width="1" />
                <template v-for="i in 5" :key="'grid-h-' + i">
                  <line 
                    x1="0" 
                    :y1="160 - (i - 1) * 40" 
                    x2="700" 
                    :y2="160 - (i - 1) * 40" 
                    stroke="#f3f4f6" 
                    stroke-width="1"
                    stroke-dasharray="4,4"
                  />
                  <text :x="-10" :y="165 - (i - 1) * 40" text-anchor="end" class="text-xs fill-gray-400">
                    {{ Math.round((maxValue * (i - 1)) / 4).toLocaleString() }}
                  </text>
                </template>
                <template v-for="(item, index) in chartData" :key="'bar-' + index">
                  <text 
                    :x="index * (700 / (chartData.length - 1 || 1))" 
                    y="175" 
                    text-anchor="middle" 
                    class="text-xs fill-gray-500"
                  >
                    {{ item.month }}
                  </text>
                </template>
                <path
                  :d="areaPath"
                  fill="url(#areaGradient)"
                />
                <path
                  :d="linePath"
                  fill="none"
                  stroke="url(#lineGradient)"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <template v-for="(item, index) in chartData" :key="'point-' + index">
                  <circle
                    :cx="index * (700 / (chartData.length - 1 || 1))"
                    :cy="160 - (item.value / maxValue) * 160"
                    r="5"
                    fill="#10b981"
                    stroke="white"
                    stroke-width="2"
                  />
                  <circle
                    :cx="index * (700 / (chartData.length - 1 || 1))"
                    :cy="160 - (item.value / maxValue) * 160"
                    r="8"
                    fill="#10b981"
                    opacity="0.2"
                  />
                </template>
                <line
                  v-if="maxValue > 0"
                  x1="0"
                  :y1="160 - (monthlyTarget / maxValue) * 160"
                  x2="700"
                  :y2="160 - (monthlyTarget / maxValue) * 160"
                  stroke="#f59e0b"
                  stroke-width="2"
                  stroke-dasharray="8,4"
                />
              </g>
            </svg>
            <div class="flex items-center justify-center gap-6 mt-4">
              <div class="flex items-center gap-2">
                <div class="w-4 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded"></div>
                <span class="text-sm text-gray-600">实际增量</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-1 bg-amber-500 rounded" style="background: repeating-linear-gradient(90deg, #f59e0b, #f59e0b 8px, transparent 8px, transparent 12px);"></div>
                <span class="text-sm text-gray-600">月目标</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            <span class="text-4xl mb-2 block">📈</span>
            <p>上传数据后将显示月度粉丝增量趋势图</p>
          </div>
        </div>
      </div>
      
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
              <span class="text-gray-600">实际涨粉</span>
              <span class="font-semibold text-gray-800">{{ item.actual.toLocaleString() }}人</span>
            </div>
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-gray-600">目标</span>
              <span class="text-gray-500">{{ item.target.toLocaleString() }}人</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                  <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      :class="['h-full transition-all duration-500 flex items-center justify-end pr-2', item.percentage >= 100 ? 'bg-green-500' : 'bg-orange-500']"
                      :style="{ width: `${Math.max(item.percentage, 5)}%` }"
                    >
                      <span v-if="item.percentage >= 20" class="text-xs text-white font-medium">
                        {{ item.actual.toLocaleString() }}人
                      </span>
                    </div>
                  </div>
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>目标: {{ item.target.toLocaleString() }}人</span>
                    <span>实际: {{ item.actual.toLocaleString() }}人</span>
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
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div class="text-sm opacity-80">表格涨粉</div>
              <div class="text-xl font-bold">{{ yearlyStats.actual.toLocaleString() }} 人</div>
            </div>
            <div>
              <div class="text-sm opacity-80">其他涨粉</div>
              <div class="flex items-center gap-1">
                <input 
                  v-model.number="additionalFollowers"
                  type="number"
                  class="w-20 px-2 py-1 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <span class="text-sm">人</span>
              </div>
            </div>
            <div>
              <div class="text-sm opacity-80">年度目标</div>
              <div class="text-xl font-bold">{{ yearlyStats.target.toLocaleString() }} 人</div>
            </div>
            <div>
              <div class="text-sm opacity-80">年度达成率</div>
              <div class="text-xl font-bold">{{ yearlyStats.percentage }}%</div>
            </div>
          </div>
          <div class="bg-white/10 rounded-lg p-3 mb-4">
            <div class="flex items-center justify-between text-sm">
              <span>年度总涨粉 = 表格涨粉 + 其他涨粉</span>
              <span class="font-bold">{{ yearlyStats.total.toLocaleString() }} = {{ yearlyStats.actual.toLocaleString() }} + {{ yearlyStats.additional.toLocaleString() }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-3 bg-white/30 rounded-full overflow-hidden">
              <div 
                class="h-full bg-white transition-all duration-500"
                :style="{ width: `${yearlyStats.percentage}%` }"
              ></div>
            </div>
            <span class="text-sm font-medium">{{ yearlyStats.total.toLocaleString() }} / {{ yearlyStats.target.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
