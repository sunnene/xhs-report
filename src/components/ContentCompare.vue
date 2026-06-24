<script setup lang="ts">
import type { ContentStats } from '@/types'
import { formatNumber } from '@/utils/analyzer'

defineProps<{
  videoData: ContentStats
  imageData: ContentStats
  insight: string
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="w-1 h-4 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full"></span>
      <h3 class="text-lg font-semibold text-gray-800">内容类型表现对比</h3>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">📹</span>
          <span class="text-sm font-medium text-gray-600">视频笔记({{ videoData.count }}篇)</span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">曝光量</span>
            <span class="font-medium text-gray-800">{{ formatNumber(videoData.exposure) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">观看量</span>
            <span class="font-medium text-gray-800">{{ formatNumber(videoData.view) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">点赞数</span>
            <span class="font-medium text-gray-800">{{ formatNumber(videoData.like) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">评论数</span>
            <span class="font-medium text-gray-800">{{ formatNumber(videoData.comment) }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">📝</span>
          <span class="text-sm font-medium text-gray-600">图文笔记({{ imageData.count }}篇)</span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">曝光量</span>
            <span class="font-medium text-gray-800">{{ formatNumber(imageData.exposure) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">观看量</span>
            <span class="font-medium text-gray-800">{{ formatNumber(imageData.view) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">点赞数</span>
            <span class="font-medium text-gray-800">{{ formatNumber(imageData.like) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">评论数</span>
            <span class="font-medium text-gray-800">{{ formatNumber(imageData.comment) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-yellow-500">💡</span>
        <span class="text-sm font-medium text-gray-700">数据洞察</span>
      </div>
      <p class="text-sm text-gray-600">{{ insight }}</p>
    </div>
  </div>
</template>
