<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Note } from '@/types'
import { mockNotes } from '@/data/mockData'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

import InteractionTarget from '@/components/InteractionTarget.vue'
import HotTarget from '@/components/HotTarget.vue'
import CommentQuality from '@/components/CommentQuality.vue'
import FileUpload from '@/components/FileUpload.vue'
import TargetSummary from '@/components/TargetSummary.vue'

const notes = ref<Note[]>(mockNotes)
const activeTab = ref<'interaction' | 'hot' | 'comment'>('interaction')
const reportRef = ref<HTMLElement | null>(null)

const weeklyStats = computed(() => {
  const weeks: Record<string, number> = {}
  notes.value.forEach(note => {
    const date = note.date || '2026-06-10'
    const day = new Date(date).getDay()
    const diff = new Date(date).getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(new Date(date).setDate(diff))
    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    weeks[weekStart] = (weeks[weekStart] || 0) + (note.followers || 0)
  })
  return Object.entries(weeks).map(([week, actual]) => ({
    week,
    actual,
    target: 100,
    percentage: Math.min(Math.round((actual / 100) * 100), 100)
  }))
})

const monthlyStats = computed(() => {
  const months: Record<string, number> = {}
  weeklyStats.value.forEach(item => {
    const month = item.week.substring(0, 7)
    months[month] = (months[month] || 0) + item.actual
  })
  return Object.entries(months).map(([month, actual]) => ({
    month,
    actual,
    target: 400,
    percentage: Math.min(Math.round((actual / 400) * 100), 100)
  }))
})

const yearlyStats = computed(() => {
  const totalFromTable = monthlyStats.value.reduce((sum, item) => sum + item.actual, 0)
  return {
    actual: totalFromTable,
    additional: 0,
    total: totalFromTable,
    target: 5000,
    percentage: Math.min(Math.round((totalFromTable / 5000) * 100), 100)
  }
})

function handleFileUpload(data: Note[]) {
  notes.value = data
}

function getDateRange() {
  const dates = notes.value.map(n => n.date).filter(Boolean)
  if (dates.length === 0) return '2026年6月'
  
  const sortedDates = [...dates].sort()
  return `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`
}

async function exportAsPDF() {
  if (!reportRef.value) return
  
  try {
    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY
    })
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    })
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`目标拆解看板_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`)
  } catch (error) {
    console.error('导出PDF失败:', error)
    alert('导出PDF失败，请重试')
  }
}

async function exportAsImage() {
  if (!reportRef.value) return
  
  try {
    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY
    })
    
    const link = document.createElement('a')
    link.download = `目标拆解看板_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('导出图片失败:', error)
    alert('导出图片失败，请重试')
  }
}
</script>

<template>
  <div ref="reportRef" class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <header class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span class="text-white text-xl">🎯</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">目标拆解看板</h1>
              <p class="text-sm text-gray-500">数据周期：{{ getDateRange() }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <FileUpload @uploaded="handleFileUpload" />
            <button 
              @click="exportAsPDF"
              class="flex items-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              <span>📄</span>
              <span>导出PDF</span>
            </button>
            <button 
              @click="exportAsImage"
              class="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              <span>🖼️</span>
              <span>导出图片</span>
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <nav class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex gap-1">
          <button 
            @click="activeTab = 'interaction'"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'interaction' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            ]"
          >
            <span>📊</span>
            <span>互动量目标拆解</span>
          </button>
          <button 
            @click="activeTab = 'hot'"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'hot' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            ]"
          >
            <span>🔥</span>
            <span>爆款目标拆解</span>
          </button>
          <button 
            @click="activeTab = 'comment'"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'comment' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            ]"
          >
            <span>💬</span>
            <span>评论区质量分析</span>
          </button>
        </div>
      </div>
    </nav>
    
    <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div v-if="activeTab === 'interaction'" class="max-w-4xl mx-auto">
        <InteractionTarget :notes="notes" />
      </div>
      
      <div v-else-if="activeTab === 'hot'" class="max-w-4xl mx-auto">
        <HotTarget :notes="notes" />
      </div>
      
      <div v-else-if="activeTab === 'comment'" class="max-w-4xl mx-auto">
        <CommentQuality />
      </div>
      
      <div class="max-w-4xl mx-auto">
        <TargetSummary 
          :weekly-stats="weeklyStats"
          :monthly-stats="monthlyStats"
          :yearly-stats="yearlyStats"
        />
      </div>
    </main>
    
    <footer class="bg-white border-t border-gray-100 mt-8">
      <div class="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
        目标拆解看板 · 数据仅供参考
      </div>
    </footer>
  </div>
</template>