<script setup lang="ts">
import type { Note } from '@/types'
import { formatNumber } from '@/utils/analyzer'

defineProps<{
  notes: Note[]
}>()

function getIcon(type: string) {
  return type === '视频' ? '📹' : '📝'
}

function getInteraction(note: Note): number {
  return note.like + note.collect + note.comment + note.share
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-xl">🔥</span>
      <h3 class="text-lg font-semibold text-gray-800">爆款笔记排行榜</h3>
    </div>
    
    <div class="space-y-3">
      <div 
        v-for="(note, index) in notes" 
        :key="note.id"
        :class="[
          'flex items-center justify-between p-4 rounded-lg transition-all duration-200 hover:bg-gray-50',
          index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
        ]"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
          <div>
            <div class="flex items-center gap-2">
              <span>{{ getIcon(note.type) }}</span>
              <span class="font-medium text-gray-800 text-sm">{{ note.title }}</span>
              <span v-if="index === 0" class="text-orange-500 text-xs">爆款</span>
            </div>
            <div class="text-xs text-gray-400 mt-1">
              {{ note.type }} · {{ note.date }}
            </div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-semibold text-gray-800">互动 {{ formatNumber(getInteraction(note)) }}</div>
          <div class="text-xs text-gray-400">点赞 {{ note.like }} · 收藏 {{ note.collect }} · 评论 {{ note.comment }} · 分享 {{ note.share }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
