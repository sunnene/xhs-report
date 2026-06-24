<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import type { Note } from '@/types'

const emit = defineEmits<{
  (e: 'uploaded', data: Note[]): void
}>()

const error = ref('')
const isUploading = ref(false)
const detectedPeriod = ref<'week' | 'month' | 'year' | null>(null)
const detectedColumns = ref<Record<string, string>>({})
const debugInfo = ref('')

const COLUMN_KEYWORDS: Record<string, string[]> = {
  title: ['标题', '笔记标题', '内容标题', '内容', '文案', '笔记', '名称'],
  type: ['体裁', '类型', '内容类型', '形式', '视频/图文', '格式', '视频', '图文'],
  exposure: ['曝光', '曝光量', '曝光次数', '展现', '展现量', '流量', '曝光数'],
  view: ['观看', '观看量', '播放', '播放量', '浏览', '浏览量', '阅读', '阅读量', '播放次数'],
  clickRate: ['点击', '点击率', '封面点击率', '点击量', '点击转化率', '点击率%'],
  followers: ['涨粉', '关注量', '新增粉丝', '新增关注', '净增粉丝', '涨粉量', '增粉', '粉丝增长', '粉丝增加', '新增粉', '涨粉数'],
  like: ['点赞', '点赞数', '喜欢', '赞', '爱心', '点赞量'],
  comment: ['评论', '评论数', '留言', '回复', '评论量'],
  collect: ['收藏', '收藏数', '保存', '收藏量'],
  share: ['分享', '分享数', '转发', '分享量'],
  date: ['时间', '发布时间', '首次发布时间', '日期', '发布日期', '周期', '周', '月', '年', '星期', '发布日'],
  tags: ['标签', '自定义标签', '分类标签', '关键词', '话题', '分类', '标签列表']
}

function normalizeHeader(header: string): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\u00A0\s]/g, '')
    .replace(/[（）]/g, '')
    .replace(/[()]/g, '')
    .replace(/：/g, '')
    .replace(/:/g, '')
    .replace(/【/g, '')
    .replace(/】/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
}

function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i])
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(normalized)) {
        return i
      }
    }
  }
  return -1
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  const strValue = String(value)
    .replace(/,/g, '')
    .replace(/，/g, '')
    .replace(/\s/g, '')
    .trim()
  if (strValue === '') return 0
  const num = parseFloat(strValue)
  return isNaN(num) ? 0 : num
}

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

async function processFile(file: File) {
  isUploading.value = true
  error.value = ''
  detectedPeriod.value = null
  detectedColumns.value = {}
  debugInfo.value = ''
  
  try {
    const data = await new Promise<string | ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string | ArrayBuffer)
      reader.onerror = () => reject(new Error('读取文件失败'))
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8')
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
    
    let workbook: XLSX.WorkBook
    if (file.name.toLowerCase().endsWith('.csv')) {
      workbook = XLSX.read(data as string, { type: 'string' })
    } else {
      workbook = XLSX.read(data as ArrayBuffer, { type: 'array' })
    }
    
    if (workbook.SheetNames.length === 0) {
      throw new Error('文件中没有工作表')
    }
    
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      blankrows: false 
    }) as (string | number)[][]
    
    debugInfo.value = `工作表: ${sheetName}, 行数: ${jsonData.length}`
    
    if (!jsonData || jsonData.length < 1) {
      throw new Error('文件内容为空或格式不正确')
    }
    
    let headerRowIndex = -1
    let maxScore = 0
    
    for (let i = 0; i < Math.min(15, jsonData.length); i++) {
      const row = jsonData[i]
      if (!row) continue
      
      let score = 0
      for (const cell of row) {
        const cellStr = String(cell ?? '').toLowerCase().trim()
        for (const keywords of Object.values(COLUMN_KEYWORDS)) {
          for (const keyword of keywords) {
            if (cellStr.includes(keyword.toLowerCase())) {
              score++
              break
            }
          }
        }
      }
      
      if (score > maxScore) {
        maxScore = score
        headerRowIndex = i
      }
    }
    
    if (headerRowIndex === -1) {
      headerRowIndex = 0
    }
    
    const headers = jsonData[headerRowIndex].map((h, index) => ({
      original: String(h ?? '').trim(),
      normalized: normalizeHeader(String(h ?? '')),
      index
    }))
    
    debugInfo.value += `\n表头行: ${headerRowIndex}`
    debugInfo.value += `\n表头内容: ${headers.map(h => h.original).join(' | ')}`
    
    const columnMapping: Record<string, number> = {}
    const foundColumns: Record<string, string> = {}
    
    for (const [field, keywords] of Object.entries(COLUMN_KEYWORDS)) {
      const index = findColumnIndex(headers.map(h => h.original), keywords)
      if (index !== -1) {
        columnMapping[field] = index
        foundColumns[field] = headers[index].original
      }
    }
    
    detectedColumns.value = foundColumns
    
    debugInfo.value += `\n识别到的字段: ${JSON.stringify(foundColumns)}`
    
    const hasAnyData = Object.keys(columnMapping).length > 0
    if (!hasAnyData) {
      throw new Error(`未识别到任何数据列。请确保表格包含以下关键字段之一：标题、曝光、观看、点赞、评论、收藏、分享、日期、标签等。\n\n当前表格的表头：\n${headers.map(h => h.original).join('\n')}`)
    }
    
    const notes: Note[] = []
    const dates: string[] = []
    const titleIndex = columnMapping.title
    const typeIndex = columnMapping.type
    const exposureIndex = columnMapping.exposure
    const viewIndex = columnMapping.view
    const clickRateIndex = columnMapping.clickRate
    const likeIndex = columnMapping.like
    const commentIndex = columnMapping.comment
    const collectIndex = columnMapping.collect
    const shareIndex = columnMapping.share
    const followersIndex = columnMapping.followers
    const dateIndex = columnMapping.date
    const tagsIndex = columnMapping.tags
    
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row) continue
      
      let hasRowData = false
      const rowData: Partial<Note> = {
        id: `note-${i}`
      }
      
      let rowHasContent = false
      for (const cell of row) {
        if (String(cell ?? '').trim() !== '') {
          rowHasContent = true
          break
        }
      }
      if (!rowHasContent) continue
      
      if (titleIndex !== undefined) {
        const title = String(row[titleIndex] ?? '').trim()
        if (title) {
          rowData.title = title
          hasRowData = true
        }
      } else {
        rowData.title = `笔记 ${i - headerRowIndex}`
        hasRowData = true
      }
      
      if (typeIndex !== undefined) {
        const typeStr = String(row[typeIndex] ?? '').trim()
        rowData.type = typeStr === '视频' || typeStr.includes('视频') ? '视频' : '图文'
      } else {
        rowData.type = '图文'
      }
      
      if (exposureIndex !== undefined) {
        rowData.exposure = toNumber(row[exposureIndex])
        if (rowData.exposure > 0) hasRowData = true
      } else {
        rowData.exposure = 0
      }
      
      if (viewIndex !== undefined) {
        rowData.view = toNumber(row[viewIndex])
      } else {
        rowData.view = 0
      }
      
      if (clickRateIndex !== undefined) {
        rowData.clickRate = toNumber(row[clickRateIndex])
      } else {
        rowData.clickRate = 0
      }
      
      if (likeIndex !== undefined) {
        rowData.like = toNumber(row[likeIndex])
        if (rowData.like > 0) hasRowData = true
      } else {
        rowData.like = 0
      }
      
      if (commentIndex !== undefined) {
        rowData.comment = toNumber(row[commentIndex])
        if (rowData.comment > 0) hasRowData = true
      } else {
        rowData.comment = 0
      }
      
      if (collectIndex !== undefined) {
        rowData.collect = toNumber(row[collectIndex])
      } else {
        rowData.collect = 0
      }
      
      if (shareIndex !== undefined) {
        rowData.share = toNumber(row[shareIndex])
      } else {
        rowData.share = 0
      }
      
      if (followersIndex !== undefined) {
        rowData.followers = toNumber(row[followersIndex])
      } else {
        rowData.followers = 0
      }
      
      if (dateIndex !== undefined) {
        const date = String(row[dateIndex] ?? '').trim()
        if (date) {
          rowData.date = date
          dates.push(date)
        }
      }
      
      if (tagsIndex !== undefined) {
        const tagsStr = String(row[tagsIndex] ?? '').trim()
        rowData.tags = tagsStr ? tagsStr.split(/[,，;；、\s]+/).filter(t => t.trim()) : undefined
      }
      
      if (hasRowData) {
        notes.push(rowData as Note)
      }
    }
    
    debugInfo.value += `\n有效数据行数: ${notes.length}`
    
    if (notes.length === 0) {
      throw new Error('没有找到有效数据行。请检查表格数据是否正确填写，或尝试调整表格格式。')
    }
    
    detectedPeriod.value = detectPeriod(dates)
    emit('uploaded', notes)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败'
    console.error('解析错误:', err)
  } finally {
    isUploading.value = false
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
    
    <div v-if="debugInfo && error" class="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p class="text-xs text-gray-500">调试信息：{{ debugInfo }}</p>
    </div>
    
    <div class="mt-4 bg-blue-50 rounded-lg p-4">
      <p class="text-sm text-blue-600">💡 支持识别的字段：标题、曝光量、播放量、点赞、评论、收藏、分享、涨粉、日期、标签等</p>
      <p class="text-sm text-blue-600 mt-1">系统会自动识别表格中的数据列，无需固定列顺序</p>
      <p class="text-xs text-blue-500 mt-2">提示：确保表头行包含上述关键字段名称，数据从表头下一行开始</p>
    </div>
  </div>
</template>
