<script setup lang="ts">
import { ref, computed } from 'vue'

interface Comment {
  content: string
}

const allComments = ref<Comment[]>([])
const targetKeywords = ref('')
const error = ref('')
const isUploading = ref(false)

function handleFileUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      processFile(files[i])
    }
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      processFile(files[i])
    }
  }
}

async function processFile(file: File) {
  isUploading.value = true
  error.value = ''
  
  try {
    const data = await readFile(file)
    const comments = parseComments(data, file.name)
    allComments.value = [...allComments.value, ...comments]
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败'
  } finally {
    isUploading.value = false
  }
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function parseComments(data: string, fileName: string): Comment[] {
  const comments: Comment[] = []
  
  if (fileName.endsWith('.csv')) {
    const lines = data.split('\n').filter(line => line.trim())
    const header = lines[0].split(',').map(col => col.trim().toLowerCase())
    const contentIndex = header.findIndex(h => h.includes('评论') || h.includes('内容') || h.includes('comment'))
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (contentIndex >= 0 && values[contentIndex]) {
        comments.push({ content: values[contentIndex].trim() })
      }
    }
  } else {
    const lines = data.split('\n').filter(line => line.trim())
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        comments.push({ content: trimmed })
      }
    }
  }
  
  return comments
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  
  return values
}

function clearAll() {
  allComments.value = []
  targetKeywords.value = ''
}

const hasData = computed(() => allComments.value.length > 0)

const keywordSearchAnalysis = computed(() => {
  if (!hasData.value || !targetKeywords.value.trim()) {
    return null
  }
  
  const targetKeys = targetKeywords.value.split(/[,，;；、\s]+/).filter(k => k.trim())
  const totalCount = allComments.value.length
  
  const hitComments = allComments.value.filter(c => {
    const lowerContent = c.content.toLowerCase()
    return targetKeys.some(key => lowerContent.includes(key.toLowerCase()))
  })
  
  const hitCount = hitComments.length
  const hitRate = totalCount > 0 ? (hitCount / totalCount) * 100 : 0
  
  const keywordDetails = targetKeys.map(key => {
    const count = allComments.value.filter(c => 
      c.content.toLowerCase().includes(key.toLowerCase())
    ).length
    return {
      keyword: key,
      count,
      rate: totalCount > 0 ? (count / totalCount) * 100 : 0
    }
  }).sort((a, b) => b.count - a.count)
  
  return {
    targetKeys,
    totalCount,
    hitCount,
    hitRate,
    keywordDetails
  }
})
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center gap-2 mb-6">
      <span class="text-xl">💬</span>
      <h3 class="text-lg font-semibold text-gray-800">评论关键词检索分析</h3>
    </div>
    
    <div 
      class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-6 transition-colors"
      :class="isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'"
      @drop="handleDrop"
      @dragover.prevent
      @click="() => ($refs.commentInput as HTMLInputElement)?.click()"
    >
      <input 
        ref="commentInput"
        type="file" 
        accept=".csv,.txt" 
        class="hidden" 
        @change="handleFileUpload"
        multiple
      />
      
      <div v-if="!hasData || isUploading">
        <span class="text-4xl">📁</span>
        <p class="mt-2 text-gray-600">{{ isUploading ? '正在解析...' : '点击或拖拽上传评论文件（支持批量上传多个文件）' }}</p>
        <p class="text-sm text-gray-400">支持 CSV、TXT 格式</p>
      </div>
      <div v-else class="flex items-center justify-center gap-4">
        <span class="text-green-500">✓</span>
        <span class="text-gray-700">已加载 {{ allComments.length }} 条评论</span>
        <button 
          @click.stop="clearAll"
          class="text-sm text-red-500 hover:text-red-600"
        >
          清空重新上传
        </button>
      </div>
    </div>
    
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">{{ error }}</p>
    </div>
    
    <div v-if="hasData" class="space-y-6">
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">🔍</span>
          <span class="font-bold text-blue-700">关键词搜索分析</span>
        </div>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-blue-600 mb-1">目标检索词（多个用空格或逗号分隔）</label>
            <input 
              v-model="targetKeywords"
              type="text"
              placeholder="例如：宠物 滴滴宠物出行 服务"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div v-if="keywordSearchAnalysis" class="mt-4 bg-white rounded-lg p-4">
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-4">
              <span class="text-gray-600">目标检索词：<span class="font-medium text-gray-800">{{ keywordSearchAnalysis.targetKeys.join('、') }}</span></span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-gray-600">总评论基数：<span class="font-medium text-gray-800">{{ keywordSearchAnalysis.totalCount }} 条</span></span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-gray-600">命中关键词的评论：<span class="font-medium text-green-600">{{ keywordSearchAnalysis.hitCount }} 条（占比 {{ keywordSearchAnalysis.hitRate.toFixed(2) }}%）</span></span>
            </div>
            <div class="flex flex-wrap gap-4">
              <span class="text-gray-600">关键词明细：</span>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="item in keywordSearchAnalysis.keywordDetails" 
                  :key="item.keyword"
                  class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  '{{ item.keyword }}' ({{ item.count }}条，{{ item.rate.toFixed(1) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="!hasData" class="bg-blue-50 rounded-lg p-4">
      <p class="text-sm text-blue-600">💡 提示：上传包含评论内容的CSV或TXT文件，支持批量上传多个文件进行分析</p>
    </div>
  </div>
</template>
