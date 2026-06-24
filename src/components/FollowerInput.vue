<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'update', data: { totalFollowers: number; newFollowers: number }): void
}>()

const totalFollowers = ref('')
const newFollowers = ref('')
const imagePreview = ref('')
const isDragging = ref(false)

function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      imagePreview.value = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

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
    const file = files[0]
    const reader = new FileReader()
    reader.onload = (event) => {
      imagePreview.value = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function parseNumber(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, '')
  const num = parseFloat(cleaned)
  
  if (value.includes('W') || value.includes('万')) {
    return num * 10000
  }
  return num || 0
}

function submitData() {
  const total = parseNumber(totalFollowers.value)
  const newF = parseNumber(newFollowers.value)
  
  if (total > 0 || newF > 0) {
    emit('update', {
      totalFollowers: total,
      newFollowers: newF
    })
  }
}

function clearAll() {
  totalFollowers.value = ''
  newFollowers.value = ''
  imagePreview.value = ''
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xl">📸</span>
      <h3 class="text-lg font-semibold text-gray-800">账号粉丝数据输入</h3>
    </div>
    
    <div class="mb-4">
      <p class="text-sm text-gray-500 mb-3">上传账号主页截图（可选），然后手动输入数据</p>
      
      <div 
        :class="[
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
        ]"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        @click="() => ($refs.imageInput as HTMLInputElement)?.click()"
      >
        <input 
          ref="imageInput" 
          type="file" 
          accept="image/*" 
          class="hidden" 
          @change="handleImageUpload"
        />
        
        <div v-if="!imagePreview">
          <span class="text-4xl">🖼️</span>
          <p class="mt-2 text-gray-600">点击或拖拽上传截图</p>
          <p class="text-sm text-gray-400">支持 JPG、PNG 格式</p>
        </div>
        <div v-else>
          <img 
            :src="imagePreview" 
            alt="截图预览" 
            class="max-h-48 mx-auto rounded-lg object-contain"
          />
          <button 
            @click.stop="imagePreview = ''"
            class="mt-2 text-sm text-red-500 hover:text-red-600"
          >
            移除图片
          </button>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          总粉丝数
        </label>
        <input 
          v-model="totalFollowers"
          type="text"
          placeholder="例如：3.5W 或 35000"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          新增粉丝数
        </label>
        <input 
          v-model="newFollowers"
          type="text"
          placeholder="例如：520"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
        />
      </div>
    </div>
    
    <div class="flex gap-3">
      <button 
        @click="submitData"
        class="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-medium"
      >
        应用数据
      </button>
      <button 
        @click="clearAll"
        class="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all"
      >
        清空
      </button>
    </div>
    
    <div class="mt-4 p-3 bg-blue-50 rounded-lg">
      <p class="text-sm text-blue-600">💡 提示：</p>
      <ul class="text-xs text-blue-500 mt-1 list-disc list-inside">
        <li>支持输入格式：3.5W、35000、3万5</li>
        <li>如果上传截图后无法自动识别，请手动输入</li>
        <li>输入后点击"应用数据"更新看板</li>
      </ul>
    </div>
  </div>
</template>
