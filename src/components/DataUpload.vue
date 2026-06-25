<script setup lang="ts">
import { ref } from 'vue'
import { parseFile, COLUMN_KEYWORDS } from '@/utils/parser'
import type { Note } from '@/types'

const emit = defineEmits<{
  (e: 'uploaded', data: Note[]): void
}>()

const error = ref('')
const isUploading = ref(false)
const detectedPeriod = ref<'week' | 'month' | 'year' | null>(null)
const detectedColumns = ref<Record<string, string>>({})

function detectPeriod(dates: string[]): 'week' | 'month' | 'year' | null {
  if (dates.length < 2) return null
  
  const datePatterns: Record<string, number> = {
    year: 0,
    month: 0,
    week: 0,
    day: 0
  }
  
  dates.forEach(date => {
    const dateStr = String(date).trim()
    if (dateStr.includes('周')) datePatterns.week++
    else if (dateStr.includes('月')) datePatterns.month++
    else if (dateStr.includes('年') && !dateStr.includes('月')) datePatterns.year++
    else {
      try {
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) datePatterns.day++
      } catch {
        // ignore
      }
    }
  })
  
  if (datePatterns.week >= datePatterns.month && datePatterns.week >= datePatterns.day) {
    return 'week'
  } else if (datePatterns.month >= datePatterns.week && datePatterns.month >= datePatterns.day) {
    return 'month'
  } else if (datePatterns.year > 0 && datePatterns.year >= datePatterns.month) {
    return 'year'
  }
  
  const uniqueDates = [...new Set(dates)]
  const daysDiff = uniqueDates.length
  if (daysDiff <= 7) return 'week'
  if (daysDiff <= 31) return 'month'
  return 'year'
}

async function processFile(file: File) {
  isUploading.value = true
  error.value = ''
  detectedPeriod.value = null
  detectedColumns.value = {}
  
  try {
    const notes = await parseFile(file)
    
    const dates = notes.map(n => n.date).filter(Boolean)
    detectedPeriod.value = detectPeriod(dates as string[])
    
    const foundColumns: Record<string, string> = {}
    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      if (notes.some(n => {
        if (field === 'title') return !!n.title
        if (field === 'type') return !!n.type
        if (field === 'exposure') return n.exposure > 0
        if (field === 'view') return n.view > 0
        if (field === 'clickRate') return n.clickRate > 0
        if (field === 'like') return n.like > 0
        if (field === 'comment') return n.comment > 0
        if (field === 'collect') return n.collect > 0
        if (field === 'share') return n.share > 0
        if (field === 'followers') return n.followers > 0
        if (field === 'date') return !!n.date
        if (field === 'tags') return !!n.tags
        return false
      })) {
        foundColumns[field] = keywords[0]
      }
    }
    detectedColumns.value = foundColumns
    
    emit('uploaded', notes)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败'
    console.error('解析错误:', err)
  } finally {
    isUploading.value = false
  }
}

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function getPeriodText(period: 'week' | 'month' | 'year' | null): string {
  switch (period) {
    case 'week': return '📅 周维度'
    case 'month': return '📆 月维度'
    case 'year': return '📈 年维度'
    default: return ''
  }
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xl">📁</span>
      <h3 class="text-lg font-semibold text-gray-800">数据上传</h3>
    </div>
    
    <div 
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
      :class="isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'"
      @drop="handleDrop"
      @dragover.prevent
      @click="() => ($refs.fileInput as HTMLInputElement)?.click()"
    >
      <input 
        ref="fileInput"
        type="file" 
        accept=".csv,.xlsx,.xls" 
        class="hidden" 
        @change="handleFileUpload"
      />
      
      <div v-if="!isUploading">
        <span class="text-4xl">📊</span>
        <p class="mt-2 text-gray-600">点击或拖拽上传数据表格</p>
        <p class="text-sm text-gray-400">支持 CSV、Excel 格式</p>
      </div>
      <div v-else>
        <span class="text-4xl">⏳</span>
        <p class="mt-2 text-gray-600">正在解析...</p>
      </div>
    </div>
    
    <div v-if="Object.keys(detectedColumns).length > 0" class="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <p class="text-sm text-green-600 font-medium mb-2">✅ 已识别到以下数据列：</p>
      <div class="flex flex-wrap gap-2">
        <span 
          v-for="(originalName, field) in detectedColumns" 
          :key="field"
          class="px-3 py-1 bg-white border border-green-300 rounded-full text-xs text-green-700"
        >
          {{ originalName }}
        </span>
      </div>
    </div>
    
    <div v-if="detectedPeriod" class="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
      <div class="flex items-center justify-center gap-2">
        <span class="text-xl">🎯</span>
        <span class="font-bold">已自动检测到数据周期：{{ getPeriodText(detectedPeriod) }}</span>
      </div>
    </div>
    
    <div v-if="error" class="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-600">{{ error }}</p>
    </div>
    
    <div class="mt-4 bg-blue-50 rounded-lg p-4">
      <p class="text-sm text-blue-600">💡 支持识别的字段：标题、曝光量、播放量、点赞、评论、收藏、分享、涨粉、日期、标签等</p>
      <p class="text-sm text-blue-600 mt-1">系统会自动识别表格中的数据列，无需固定列顺序</p>
      <p class="text-xs text-blue-500 mt-2">提示：确保表头行包含上述关键字段名称，数据从表头下一行开始</p>
    </div>
  </div>
</template>
