<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note, OperationAdviceType } from '@/types'
import { mockNotes } from '@/data/mockData'
import { 
  calculateStats, 
  calculateContentStats, 
  generateInsight, 
  getHotNotes, 
  generateOperationAdvice,
  formatNumber 
} from '@/utils/analyzer'
import StatCard from '@/components/StatCard.vue'
import ContentCompare from '@/components/ContentCompare.vue'
import HotRanking from '@/components/HotRanking.vue'
import DataTable from '@/components/DataTable.vue'
import OperationAdvice from '@/components/OperationAdvice.vue'
import FileUpload from '@/components/FileUpload.vue'
import FollowerInput from '@/components/FollowerInput.vue'
import InteractionTarget from '@/components/InteractionTarget.vue'
import HotTarget from '@/components/HotTarget.vue'
import FollowerTarget from '@/components/FollowerTarget.vue'
import CommentQuality from '@/components/CommentQuality.vue'
import DataUpload from '@/components/DataUpload.vue'
import TagAnalysis from '@/components/TagAnalysis.vue'

const activeBoard = ref<'dashboard' | 'target'>('dashboard')

const dashboardNotes = ref<Note[]>(mockNotes)
const targetNotes = ref<Note[]>([])

const customTotalFollowers = ref<number | null>(null)
const customNewFollowers = ref<number | null>(null)

const baseStats = computed(() => calculateStats(dashboardNotes.value))
const stats = computed(() => ({
  ...baseStats.value,
  totalFollowers: customTotalFollowers.value ?? baseStats.value.totalFollowers,
  newFollowers: customNewFollowers.value ?? baseStats.value.newFollowers
}))
const contentStats = computed(() => calculateContentStats(dashboardNotes.value))
const insight = computed(() => generateInsight(dashboardNotes.value))
const hotNotes = computed(() => getHotNotes(dashboardNotes.value))
const operationAdvice = computed<OperationAdviceType>(() => generateOperationAdvice(dashboardNotes.value))

function handleDashboardFileUpload(data: Note[]) {
  dashboardNotes.value = data
  customTotalFollowers.value = null
  customNewFollowers.value = null
}

function handleTargetFileUpload(data: Note[]) {
  targetNotes.value = data
}

function handleFollowerUpdate(data: { totalFollowers: number; newFollowers: number }) {
  if (data.totalFollowers > 0) customTotalFollowers.value = data.totalFollowers
  if (data.newFollowers > 0) customNewFollowers.value = data.newFollowers
}

function getDashboardDateRange() {
  const dates = dashboardNotes.value.map(n => n.date).filter(Boolean)
  if (dates.length === 0) return '2026年6月8日 - 2026年6月13日'
  const sortedDates = [...dates].sort()
  return `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
}

function getTargetDateRange() {
  const dates = targetNotes.value.map(n => n.date).filter(Boolean)
  if (dates.length === 0) return '请上传数据'
  const sortedDates = [...dates].sort()
  return `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              activeBoard === 'dashboard' 
                ? 'bg-gradient-to-br from-red-500 to-orange-500' 
                : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            ]">
              <span class="text-white text-xl">{{ activeBoard === 'dashboard' ? '📕' : '🎯' }}</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">
                {{ activeBoard === 'dashboard' ? '小红书运营周报看板' : '目标拆解看板' }}
              </h1>
              <p class="text-sm text-gray-500">
                数据周期：{{ activeBoard === 'dashboard' ? getDashboardDateRange() : getTargetDateRange() }}
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <div class="flex bg-gray-100 rounded-lg p-1">
              <button 
                @click="activeBoard = 'dashboard'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  activeBoard === 'dashboard' 
                    ? 'bg-white shadow text-red-600' 
                    : 'text-gray-600 hover:text-gray-800'
                ]"
              >
                📊 运营看板
              </button>
              <button 
                @click="activeBoard = 'target'"
                :class="[
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  activeBoard === 'target' 
                    ? 'bg-white shadow text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                ]"
              >
                🎯 目标拆解
              </button>
            </div>
            <FileUpload v-if="activeBoard === 'dashboard'" @uploaded="handleDashboardFileUpload" />
          </div>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-6">
      <template v-if="activeBoard === 'dashboard'">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard 
                title="总曝光量" 
                :value="formatNumber(stats.totalExposure)" 
                subtext="+12% 较上周增长" 
                gradient="gradient-to-br from-red-500 via-orange-500 to-red-400"
              />
              <StatCard 
                title="总观看量" 
                :value="formatNumber(stats.totalView)" 
                subtext="点击率 14.9%" 
                gradient="gradient-to-br from-blue-500 via-indigo-500 to-purple-500"
              />
              <StatCard 
                title="总互动数" 
                :value="formatNumber(stats.totalInteraction)" 
                subtext="点赞+评论+收藏+分享" 
                gradient="gradient-to-br from-pink-500 via-purple-500 to-pink-400"
              />
              <StatCard 
                title="新增粉丝" 
                :value="formatNumber(stats.newFollowers)" 
                :subtext="customNewFollowers !== null ? '已手动更新' : '转化率 0.12%'" 
                gradient="gradient-to-br from-cyan-500 via-teal-500 to-green-500"
              />
              <StatCard 
                title="总粉丝数" 
                :value="formatNumber(stats.totalFollowers)" 
                :subtext="customTotalFollowers !== null ? '已手动更新' : '账号粉丝总量'" 
                gradient="gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
              />
            </div>
            
            <ContentCompare 
              :video-data="contentStats.video" 
              :image-data="contentStats.image" 
              :insight="insight" 
            />
            
            <HotRanking :notes="hotNotes" />
            
            <DataTable :data="dashboardNotes" />
            
            <OperationAdvice :advice="operationAdvice" />
          </div>
          
          <div class="lg:col-span-1">
            <FollowerInput @update="handleFollowerUpdate" />
          </div>
        </div>
      </template>
      
      <template v-else>
        <div class="max-w-4xl mx-auto space-y-6">
          <DataUpload @uploaded="handleTargetFileUpload" />
          <FollowerTarget :notes="targetNotes" />
          <InteractionTarget :notes="targetNotes" />
          <HotTarget :notes="targetNotes" />
          <TagAnalysis :notes="targetNotes" />
          <CommentQuality />
        </div>
      </template>
    </main>
    
    <footer class="bg-white border-t border-gray-100 mt-8">
      <div class="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
        小红书运营看板 · 数据仅供参考
      </div>
    </footer>
  </div>
</template>
