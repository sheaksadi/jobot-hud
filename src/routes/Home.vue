<script setup>
import Spread from '@/components/charts/Spread.vue';
import { useExchangeStore } from "@/stores/exchangesStore.ts"
import { computed, ref } from 'vue'

const theme = ref('dark')

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const exchangeStore = useExchangeStore()
exchangeStore.initialize()

// Computed properties for totaled liquidity
const totalCexLiquidity = computed(() => {
  const liquidity = exchangeStore.cexLiquidity

  const usdtLiq = liquidity.find(item => item.symbol === 'USDT')?.amount || 0
  const usdcLiq = liquidity.find(item => item.symbol === 'USDC')?.amount || 0
  const seiLiq = liquidity.find(item => item.symbol === 'SEI')?.amount || 0

  return {
    usd: usdtLiq + usdcLiq,
    sei: seiLiq
  }
})

const totalDexLiquidity = computed(() => {
  const liquidity = exchangeStore.dexLiquidity

  const usdtLiq = liquidity.find(item => item.symbol === 'USDT')?.amount || 0
  const usdcLiq = liquidity.find(item => item.symbol === 'USDC')?.amount || 0
  const wseiLiq = liquidity.find(item => item.symbol === 'WSEI')?.amount || 0

  return {
    usd: usdtLiq + usdcLiq,
    sei: wseiLiq
  }
})

const totalLiquidity = computed(() => {
  return {
    usd: totalCexLiquidity.value.usd + totalDexLiquidity.value.usd,
    sei: totalCexLiquidity.value.sei + totalDexLiquidity.value.sei
  }
})

const spreads = computed(() => {
  const results = []
  const cexPrice = exchangeStore.cexPrices['SEI-USDT']
  const dexPrice1 = exchangeStore.dexPrices['WSEI-USDC']
  const dexPrice2 = exchangeStore.dexPrices['WSEI-USDT']

  if (cexPrice && dexPrice1) {
    results.push({
      pair: 'SEI-USDT / WSEI-USDC',
      value: cexPrice / dexPrice1 - 1
    })
  }

  if (cexPrice && dexPrice2) {
    results.push({
      pair: 'SEI-USDT / WSEI-USDT',
      value: cexPrice / dexPrice2 - 1
    })
  }

  return results
})

// Format number with commas
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
}

// Format price
const formatPrice = (price) => {
  if (price === null || price === undefined) return '0.0000'
  return Number(price).toFixed(4)
}
</script>

<template>
  <div class="min-h-screen p-4 transition-colors duration-300" :class="theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div class="text-left">
          <h1 class="text-2xl md:text-3xl font-bold">
            <span :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Jobot</span> HUD
          </h1>
          <p class="text-sm" :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">Real-time CEX & DEX monitoring</p>
        </div>
        <div class="flex items-center space-x-4">
          <!-- Connection Status -->
          <div class="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="[
              exchangeStore.isConnected ? 'border-green-500' : 'border-red-500',
              theme === 'dark' ? 
                (exchangeStore.isConnected ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400') :
                (exchangeStore.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
            ]">
            <div class="w-2 h-2 rounded-full animate-pulse"
              :class="exchangeStore.isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
            <span>
              {{ exchangeStore.isConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <button @click="toggleTheme" class="p-2 rounded-full transition-colors" :class="theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'">
            <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Prices & Liquidity Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Prices Card -->
        <div class="rounded-lg p-4 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
          <h2 class="text-lg font-semibold mb-3" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Prices</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <!-- CEX Prices -->
            <div class="md:col-span-1">
              <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">CEX</h3>
              <div class="space-y-2">
                <div v-for="(price, pair) in exchangeStore.cexPrices" :key="pair"
                  class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                  <span :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ pair }}</span>
                  <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">
                    ${{ formatPrice(price) }}
                  </span>
                </div>
              </div>
            </div>
            <!-- DEX Prices -->
            <div class="md:col-span-1">
              <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">DEX</h3>
              <div class="space-y-2">
                <div v-for="(price, pair) in exchangeStore.dexPrices" :key="pair"
                  class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                  <span :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ pair }}</span>
                  <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">
                    ${{ formatPrice(price) }}
                  </span>
                </div>
              </div>
            </div>
            <!-- Spread -->
            <div class="md:col-span-1">
              <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">Spread</h3>
              <div class="space-y-2">
                <div v-for="spread in spreads" :key="spread.pair"
                  class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                  <span :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ spread.pair }}</span>
                  <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">
                    {{ spread.value.toFixed(4) }}
                  </span>
                </div>
                <div v-if="spreads.length === 0" class="text-xs text-center py-2" :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-400'">
                  No matching pairs for spread calculation.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Liquidity Card -->
        <div class="rounded-lg p-4 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
          <h2 class="text-lg font-semibold mb-3" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Liquidity</h2>
          <div class="space-y-3">
            <!-- Total Liquidity -->
            <div>
              <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">Total (CEX + DEX)</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                  <span :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">Total USD</span>
                  <span class="font-mono font-semibold" :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">
                    {{ formatNumber(totalLiquidity.usd) }}
                  </span>
                </div>
                <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                  <span :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">Total SEI</span>
                  <span class="font-mono font-semibold" :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">
                    {{ formatNumber(totalLiquidity.sei) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="border-t" :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"></div>

            <!-- CEX & DEX Breakdown -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">CEX</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                    <span :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">USD</span>
                    <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(totalCexLiquidity.usd) }}</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                    <span :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">SEI</span>
                    <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(totalCexLiquidity.sei) }}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">DEX</h3>
                <div class="space-y-2">
                  <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                    <span :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">USD</span>
                    <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(totalDexLiquidity.usd) }}</span>
                  </div>
                  <div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'">
                    <span :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">SEI</span>
                    <span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(totalDexLiquidity.sei) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading States -->
      <div v-if="Object.values(exchangeStore.loading).some(loading => loading)"
        class="fixed bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
        :class="theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>

      <!-- Spread Chart -->
      <!--
      <div class="rounded-lg p-6 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
        <h2 class="text-xl font-semibold mb-4" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Spread Analysis</h2>
        <Suspense>
          <Spread />
          <template #fallback>
            <div class="flex justify-center items-center h-64">
              <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </template>
        </Suspense>
      </div>
      -->
    </div>
  </div>
</template>
