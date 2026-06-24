<script setup lang="ts">
import type { Note } from '@/types'
import { formatNumber } from '@/utils/analyzer'

defineProps<{
  data: Note[]
}>()

function getHotIds(data: Note[]): string[] {
  const sorted = [...data].sort((a, b) => b.exposure - a.exposure)
  return sorted.slice(0, 3).map(n => n.id)
}

function getIcon(type: string) {
  return type === '视频' ? '📹' : '📝'
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-lg">📊</span>
      <h3 class="text-lg font-semibold text-gray-800">详细数据表格</h3>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-4 py-3 text-left font-medium text-gray-600 rounded-tl-lg">笔记标题</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">体裁</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">曝光</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">观看</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">点击率</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">点赞</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">评论</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600">收藏</th>
            <th class="px-4 py-3 text-center font-medium text-gray-600 rounded-tr-lg">分享</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="item in data" 
            :key="item.id"
            :class="[
              'border-b border-gray-100 hover:bg-gray-50 transition-colors',
              getHotIds(data).includes(item.id) ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
            ]"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span>{{ getIcon(item.type) }}</span>
                <span class="text-gray-800">{{ item.title }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-center text-gray-600">{{ item.type }}</td>
            <td class="px-4 py-3 text-center font-medium text-gray-800">{{ formatNumber(item.exposure) }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ formatNumber(item.view) }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="['font-medium', item.clickRate >= 10 ? 'text-green-500' : item.clickRate >= 5 ? 'text-yellow-500' : 'text-red-500']">
                {{ item.clickRate }}%
              </span>
            </td>
            <td class="px-4 py-3 text-center text-gray-600">{{ item.like }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ item.comment }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ item.collect }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ item.share }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
