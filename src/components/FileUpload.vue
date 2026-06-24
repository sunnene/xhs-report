<script setup lang="ts">
import { ref } from 'vue'
import { parseFile } from '@/utils/parser'
import type { Note } from '@/types'

const emit = defineEmits<{
  (e: 'uploaded', data: Note[]): void
}>()

const isDragging = ref(false)
const isUploading = ref(false)
const error = ref('')

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

async function processFile(file: File) {
  isUploading.value = true
  error.value = ''
  
  try {
    const notes = await parseFile(file)
    if (notes.length === 0) {
      error.value = '文件中没有有效数据'
    } else {
      emit('uploaded', notes)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上传失败，请重试'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <div 
    :class="[
      'bg-white rounded-xl shadow-sm p-6 border-2 border-dashed transition-all duration-300 cursor-pointer',
      isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    @click="() => ($refs.fileInput as HTMLInputElement)?.click()"
  >
    <input 
      ref="fileInput" 
      type="file" 
      accept=".csv,.xlsx,.xls" 
      class="hidden" 
      @change="handleFileSelect"
    />
    
    <div class="flex flex-col items-center gap-3">
      <div :class="['w-16 h-16 rounded-full flex items-center justify-center transition-colors', isDragging ? 'bg-orange-100' : 'bg-gray-100']">
        <span class="text-3xl">📁</span>
      </div>
      <div>
        <div class="text-lg font-medium text-gray-800">
          {{ isUploading ? '正在解析文件...' : '点击或拖拽上传数据文件' }}
        </div>
        <div class="text-sm text-gray-500 mt-1">
          支持 CSV、Excel (.xlsx/.xls) 格式
        </div>
      </div>
      <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
    </div>
  </div>
</template>
