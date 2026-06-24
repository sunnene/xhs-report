<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  subtext?: string
  gradient: string
}>()
</script>

<template>
  <div :class="['relative rounded-xl p-5 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl', `bg-${gradient}`]">
    <div class="text-sm opacity-80 mb-2">{{ title }}</div>
    <div class="text-3xl font-bold mb-1">{{ value }}</div>
    <div v-if="subtext" class="text-xs opacity-70">{{ subtext }}</div>
  </div>
</template>
