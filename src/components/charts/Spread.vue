<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import VChart from 'vue-echarts'
import 'echarts'

// Props
const props = defineProps(['data']);

// Reactive data
const data = ref([]);
const dataTime = ref([]);
const option = ref({});
let updateInterval = null;

// Generate mock data
function generateMockSpread() {
    const cexPrice = 0.5 + Math.random() * 0.1;
    const dexPrice = 0.5 + Math.random() * 0.1;
    return Math.round((cexPrice / dexPrice - 1) * 10000) / 10000;
}

// Add new data point
function addDataPoint(spread) {
    data.value.push(spread);
    dataTime.value.push(new Date().toLocaleTimeString());

    // Keep only last 100 points
    if (data.value.length > 100) {
        data.value.shift();
        dataTime.value.shift();
    }

    // Only update the data, not the entire chart option
    updateDataOnly();
}

// Update only the data without redrawing the entire chart
function updateDataOnly() {
    if (option.value.series && option.value.series[0]) {
        option.value.series[0].data = [...data.value];
        option.value.xAxis.data = [...dataTime.value];
    }
}

// Initialize chart options (called once)
function initChartOptions() {
    option.value = {
        backgroundColor: 'transparent',
        xAxis: {
            type: 'category',
            data: dataTime.value,
            axisLine: { onZero: true },
            axisTick: false,
            axisLabel: {
                color: '#fff'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        yAxis: {
            type: 'value',
            name: 'Spread',
            scale: true,
            axisLine: {
                show: true,
                lineStyle: {
                    color: "#FF5900FF"
                }
            },
            axisLabel: {
                color: '#fff'
            },
            nameTextStyle: {
                color: '#fff'
            },
            min: -0.02,
            max: 0.02,
            splitLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        },
        series: [{
            data: data.value,
            type: 'line',
            smooth: true,
            lineStyle: {
                color: '#00ff88',
                width: 2
            },
            itemStyle: {
                color: '#00ff88'
            },
            markPoint: {
                symbol: 'rect',
                symbolSize: [60, 20],
                position: 'top',
                data: [
                    {
                        type: 'max',
                        name: 'Current',
                        label: {
                            show: true,
                            formatter: (params) => params.value.toFixed(4)
                        },
                        itemStyle: {
                            color: '#fff',
                            borderColor: '#666',
                            borderWidth: 1
                        }
                    }
                ]
            },
            markLine: {
                symbol: 'circle',
                precision: 4,
                data: [
                    {
                        yAxis: 0.008,
                        lineStyle: { color: 'green', type: 'dashed', width: 1 },
                        label: { formatter: 'Buy order', position: 'end' }
                    },
                    {
                        yAxis: 0.013,
                        lineStyle: { color: 'blue', type: 'dashed', width: 1 },
                        label: { formatter: 'Buy order', position: 'end' }
                    },
                    {
                        yAxis: -0.008,
                        lineStyle: { color: 'orange', type: 'solid', width: 1 },
                        label: { formatter: 'Sell order', position: 'end' }
                    },
                    {
                        yAxis: -0.013,
                        lineStyle: { color: 'red', type: 'dotted', width: 1 },
                        label: { formatter: 'Sell order', position: 'end' }
                    }
                ]
            }
        }]
    };
}

// Initialize with mock data
onMounted(() => {
    console.log("Component mounted");

    // Generate initial data
    for (let i = 0; i < 20; i++) {
        const spread = generateMockSpread();
        data.value.push(spread);
        dataTime.value.push(new Date().toLocaleTimeString());
    }

    // Initialize chart options once
    initChartOptions();

    // Start real-time updates
    updateInterval = setInterval(() => {
        addDataPoint(generateMockSpread());
    }, 3000);
});

// Watch for props changes
watch(() => props.data, (newValue) => {
    if (newValue?.cexPrice && newValue?.dexPrice) {
        const spread = Math.round((newValue.cexPrice / newValue.dexPrice - 1) * 10000) / 10000;
        addDataPoint(spread);
        console.log("New spread from props:", spread);
    }
});

// Cleanup on unmount
onUnmounted(() => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
</script>

<template>
    <div class="p-3 h-full w-full">
        <div class="mb-2 text-sm text-gray-400">
            Test Version - Price Spread Chart
        </div>
        <div class="w-full h-96 rounded-xl bg-slate-800">
            <VChart :option="option" class="h-full w-full" autoresize />
        </div>
    </div>
</template>

<style scoped></style>
