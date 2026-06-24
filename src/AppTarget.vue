<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '@/types'
import { mockNotes } from '@/data/mockData'

import InteractionTarget from '@/components/InteractionTarget.vue'
import HotTarget from '@/components/HotTarget.vue'
import CommentQuality from '@/components/CommentQuality.vue'
import FileUpload from '@/components/FileUpload.vue'

const notes = ref<Note[]>(mockNotes)
const activeTab = ref<'interaction' | 'hot' | 'comment'>('interaction')

function handleFileUpload(data: Note[]) {
  notes.value = data
}

function getDateRange() {
  const dates = notes.value.map(n => n.date).filter(Boolean)
  if (dates.length === 0) return '2026年6月'
  
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
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span class="text-white text-xl">🎯</span>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-800">目标拆解看板</h1>
              <p class="text-sm text-gray-500">数据周期：{{ getDateRange() }}</p>
            </div>
          </div>
          <FileUpload @uploaded="handleFileUpload" />
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
    
    <main class="max-w-7xl mx-auto px-4 py-6">
      <div v-if="activeTab === 'interaction'" class="max-w-4xl mx-auto">
        <InteractionTarget :notes="notes" />
      </div>
      
      <div v-else-if="activeTab === 'hot'" class="max-w-4xl mx-auto">
        <HotTarget :notes="notes" />
      </div>
      
      <div v-else-if="activeTab === 'comment'" class="max-w-4xl mx-auto">
        <CommentQuality />
      </div>
    </main>
    
    <footer class="bg-white border-t border-gray-100 mt-8">
      <div class="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
        目标拆解看板 · 数据仅供参考
      </div>
    </footer>
  </div>
</template>
