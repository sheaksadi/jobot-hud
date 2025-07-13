<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
} from 'echarts/components'

// Register the necessary components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
])

const props = defineProps({
  spreads: {
    type: Array,
    default: () => [],
  },
  theme: {
    type: String,
    default: 'dark',
  },
})

const option = ref({})
const spreadHistory = ref<Record<string, { value: number; time: string }[]>>({})
const MAX_HISTORY = 1000

const updateChart = () => {
  const isDark = props.theme === 'dark'
  const textColor = isDark ? '#ccc' : '#333'
  const axisLineColor = isDark ? '#555' : '#ccc'
  const splitLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  const seriesData = Object.keys(spreadHistory.value)
    .map((pair, index) => {
      const colors = ['#00ff88', '#4d94ff', '#ffca28', '#ff7043']
      const color = colors[index % colors.length]
      const seriesHistory = spreadHistory.value[pair]

      if (!seriesHistory || seriesHistory.length === 0) {
        return null
      }

      return {
        name: pair,
        type: 'line',
        smooth: 0.3,
        showSymbol: false,
        data: seriesHistory.map(item => [item.time, item.value]),
        lineStyle: {
          color: color,
          width: 2,
        },
      }
    })
    .filter(Boolean)

  const allValues = Object.values(spreadHistory.value).flat().map(item => item.value)
  const maxAbsValue = allValues.reduce((max, val) => Math.max(max, Math.abs(val)), 0)
  const yAxisMax = maxAbsValue > 0 ? Math.ceil(maxAbsValue * 1.2 * 10000) / 10000 : 0.01

  option.value = {
    backgroundColor: 'transparent',
    legend: {
      data: Object.keys(spreadHistory.value),
      textStyle: {
        color: textColor,
      },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let tooltipContent = `${params[0].axisValue}<br/>`
        params.forEach((item: any) => {
          tooltipContent += `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`
          tooltipContent += `${item.seriesName}: ${item.value[1].toFixed(4)}<br/>`
        })
        return tooltipContent
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        color: textColor,
      },
      axisLine: {
        lineStyle: {
          color: axisLineColor,
        },
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      min: -yAxisMax,
      max: yAxisMax,
      axisLabel: {
        color: textColor,
        formatter: (value: number) => value.toFixed(4),
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
        },
      },
    },
    series: seriesData,
    dataZoom: [
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 20,
        bottom: 10,
        textStyle: {
          color: textColor,
        },
      },
    ],
  }
}

watch(
  () => props.spreads,
  (newSpreads) => {
    const now = new Date().toISOString()
    newSpreads.forEach((spread: any) => {
      if (!spreadHistory.value[spread.pair]) {
        spreadHistory.value[spread.pair] = []
      }
      const history = spreadHistory.value[spread.pair]
      history.push({ value: spread.value, time: now })
      if (history.length > MAX_HISTORY) {
        history.shift()
      }
    })
    updateChart()
  },
  { deep: true }
)

watch(
  () => props.theme,
  () => {
    updateChart()
  }
)

onMounted(() => {
  updateChart()
})
</script>

<template>
  <div class="w-full h-96">
    <VChart :option="option" class="h-full w-full" autoresize :key="theme" />
  </div>
</template>
