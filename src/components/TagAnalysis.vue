<template>
  <div class="bg-white rounded-xl shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-800">🏷️ 自定义标签分类分析</h3>
      <div v-if="tagStats.length === 0" class="text-sm text-gray-500">
        暂无标签数据，请上传包含标签列的表格
      </div>
    </div>

    <div v-if="tagStats.length > 0" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <div class="text-sm text-purple-600 mb-1">标签总数</div>
          <div class="text-2xl font-bold text-purple-800">{{ totalTags }}</div>
        </div>
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div class="text-sm text-blue-600 mb-1">带标签笔记</div>
          <div class="text-2xl font-bold text-blue-800">{{ totalTaggedNotes }}</div>
        </div>
        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <div class="text-sm text-green-600 mb-1">总互动量</div>
          <div class="text-2xl font-bold text-green-800">{{ formatNumber(totalInteraction) }}</div>
        </div>
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <div class="text-sm text-orange-600 mb-1">总投流费用</div>
          <div class="text-2xl font-bold text-orange-800">¥{{ formatNumber(totalCost) }}</div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-3 py-2 text-left font-medium text-gray-600">标签名称</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">笔记数</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">曝光量</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">阅读量</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">点赞</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">评论</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">收藏</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">分享</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">总互动</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流费用</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">费用占比</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流曝光</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流曝光占比</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流阅读</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流阅读占比</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流互动</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">投流互动占比</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">非投流曝光</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">非投流阅读</th>
              <th class="px-3 py-2 text-center font-medium text-gray-600">非投流互动</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(stat, index) in tagStats" 
              :key="stat.tag"
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td class="px-3 py-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getTagColor(index)">
                  {{ stat.tag }}
                </span>
              </td>
              <td class="px-3 py-2 text-center font-medium text-gray-800">{{ stat.noteCount }}</td>
              <td class="px-3 py-2 text-center text-indigo-600">{{ formatNumber(stat.exposure) }}</td>
              <td class="px-3 py-2 text-center text-blue-600">{{ formatNumber(stat.read) }}</td>
              <td class="px-3 py-2 text-center text-pink-600">{{ formatNumber(stat.like) }}</td>
              <td class="px-3 py-2 text-center text-blue-600">{{ formatNumber(stat.comment) }}</td>
              <td class="px-3 py-2 text-center text-green-600">{{ formatNumber(stat.collect) }}</td>
              <td class="px-3 py-2 text-center text-orange-600">{{ formatNumber(stat.share) }}</td>
              <td class="px-3 py-2 text-center font-semibold text-gray-800">{{ formatNumber(stat.totalInteraction) }}</td>
              <td class="px-3 py-2 text-center text-red-600">¥{{ formatNumber(stat.cost) }}</td>
              <td class="px-3 py-2 text-center">
                <div class="flex items-center justify-center">
                  <div class="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 rounded-full transition-all" :style="{ width: stat.costPercentage + '%' }"></div>
                  </div>
                  <span class="ml-1 text-xs text-gray-500">{{ stat.costPercentage.toFixed(1) }}%</span>
                </div>
              </td>
              <td class="px-3 py-2 text-center text-purple-600">{{ formatNumber(stat.paidExposure) }}</td>
              <td class="px-3 py-2 text-center text-xs text-gray-500">{{ stat.paidExposurePercentage.toFixed(1) }}%</td>
              <td class="px-3 py-2 text-center text-purple-600">{{ formatNumber(stat.paidRead) }}</td>
              <td class="px-3 py-2 text-center text-xs text-gray-500">{{ stat.paidReadPercentage.toFixed(1) }}%</td>
              <td class="px-3 py-2 text-center text-purple-600">{{ formatNumber(stat.paidInteraction) }}</td>
              <td class="px-3 py-2 text-center text-xs text-gray-500">{{ stat.paidInteractionPercentage.toFixed(1) }}%</td>
              <td class="px-3 py-2 text-center text-teal-600">{{ formatNumber(stat.organicExposure) }}</td>
              <td class="px-3 py-2 text-center text-teal-600">{{ formatNumber(stat.organicRead) }}</td>
              <td class="px-3 py-2 text-center text-teal-600">{{ formatNumber(stat.organicInteraction) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Note, TagStats } from '@/types'

const props = defineProps<{
  notes: Note[]
}>()

const tagStats = computed<TagStats[]>(() => {
  const tagMap = new Map<string, TagStats>()
  
  props.notes.forEach(note => {
    if (note.tags && note.tags.length > 0) {
      note.tags.forEach(tag => {
        const trimmedTag = tag.trim()
        if (!trimmedTag) return
        
        const existing = tagMap.get(trimmedTag) || {
          tag: '',
          noteCount: 0,
          like: 0,
          comment: 0,
          collect: 0,
          share: 0,
          totalInteraction: 0,
          noteCountPercentage: 0,
          interactionPercentage: 0,
          exposure: 0,
          read: 0,
          cost: 0,
          costPercentage: 0,
          paidExposure: 0,
          paidExposurePercentage: 0,
          paidRead: 0,
          paidReadPercentage: 0,
          paidInteraction: 0,
          paidInteractionPercentage: 0,
          organicExposure: 0,
          organicRead: 0,
          organicInteraction: 0
        }
        
        const noteInteraction = (note.like || 0) + (note.comment || 0) + (note.collect || 0) + (note.share || 0)
        const isPaid = note.paid === 1 || note.paid === '是' || note.paid === '投流'
        
        tagMap.set(trimmedTag, {
          tag: trimmedTag,
          noteCount: existing.noteCount + 1,
          like: existing.like + (note.like || 0),
          comment: existing.comment + (note.comment || 0),
          collect: existing.collect + (note.collect || 0),
          share: existing.share + (note.share || 0),
          totalInteraction: existing.totalInteraction + noteInteraction,
          noteCountPercentage: 0,
          interactionPercentage: 0,
          exposure: existing.exposure + (note.exposure || note.exposureAmount || 0),
          read: existing.read + (note.view || note.play || note.read || 0),
          cost: existing.cost + (note.cost || note.paidCost || 0),
          costPercentage: 0,
          paidExposure: existing.paidExposure + (isPaid ? (note.exposure || note.exposureAmount || 0) : 0),
          paidExposurePercentage: 0,
          paidRead: existing.paidRead + (isPaid ? (note.view || note.play || note.read || 0) : 0),
          paidReadPercentage: 0,
          paidInteraction: existing.paidInteraction + (isPaid ? noteInteraction : 0),
          paidInteractionPercentage: 0,
          organicExposure: existing.organicExposure + (isPaid ? 0 : (note.exposure || note.exposureAmount || 0)),
          organicRead: existing.organicRead + (isPaid ? 0 : (note.view || note.play || note.read || 0)),
          organicInteraction: existing.organicInteraction + (isPaid ? 0 : noteInteraction)
        })
      })
    }
  })

  const totalTaggedNotes = props.notes.filter(n => n.tags && n.tags.length > 0).length
  const totalInteraction = Array.from(tagMap.values()).reduce((sum, v) => sum + v.totalInteraction, 0)
  const totalCost = Array.from(tagMap.values()).reduce((sum, v) => sum + v.cost, 0)

  return Array.from(tagMap.values())
    .map(stat => ({
      ...stat,
      noteCountPercentage: totalTaggedNotes > 0 ? (stat.noteCount / totalTaggedNotes) * 100 : 0,
      interactionPercentage: totalInteraction > 0 ? (stat.totalInteraction / totalInteraction) * 100 : 0,
      costPercentage: totalCost > 0 ? (stat.cost / totalCost) * 100 : 0,
      paidExposurePercentage: stat.exposure > 0 ? (stat.paidExposure / stat.exposure) * 100 : 0,
      paidReadPercentage: stat.read > 0 ? (stat.paidRead / stat.read) * 100 : 0,
      paidInteractionPercentage: stat.totalInteraction > 0 ? (stat.paidInteraction / stat.totalInteraction) * 100 : 0
    }))
    .sort((a, b) => b.totalInteraction - a.totalInteraction)
})

const totalTags = computed(() => tagStats.value.length)
const totalTaggedNotes = computed(() => props.notes.filter(n => n.tags && n.tags.length > 0).length)
const totalInteraction = computed(() => tagStats.value.reduce((sum, stat) => sum + stat.totalInteraction, 0))
const totalCost = computed(() => tagStats.value.reduce((sum, stat) => sum + stat.cost, 0))

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  return num.toLocaleString()
}

function getTagColor(index: number): string {
  const colors = [
    'bg-purple-100 text-purple-700',
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-cyan-100 text-cyan-700',
    'bg-yellow-100 text-yellow-700',
    'bg-red-100 text-red-700'
  ]
  return colors[index % colors.length]
}
</script>
