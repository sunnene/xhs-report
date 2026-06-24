<script setup lang="ts">
import type { OperationAdviceType } from '@/types'

defineProps<{
  advice: OperationAdviceType
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-lg">🎯</span>
      <h3 class="text-lg font-semibold text-gray-800">运营建议</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-green-500">✓</span>
          <span class="font-medium text-gray-700">继续保持</span>
        </div>
        <ul class="space-y-2">
          <li 
            v-for="(item, index) in advice.keep" 
            :key="index"
            class="flex items-start gap-2 text-sm text-gray-600"
          >
            <span class="text-green-400 mt-1">•</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
      
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-blue-500">⚡</span>
          <span class="font-medium text-gray-700">优化方向</span>
        </div>
        <ul class="space-y-2">
          <li 
            v-for="(item, index) in advice.optimize" 
            :key="index"
            class="flex items-start gap-2 text-sm text-gray-600"
          >
            <span class="text-blue-400 mt-1">•</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
