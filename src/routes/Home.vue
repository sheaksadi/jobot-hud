<script setup>
import Spread from '@/components/charts/Spread.vue'
import { useExchangeStore } from '@/stores/exchangesStore.ts'
import { computed, ref, onMounted } from 'vue'
import { serverUrl } from '@/socket'

const theme = ref('dark')
const serverTestResult = ref('Testing...')
const expandedBots = ref({}); // To track expanded state for each bot's details

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

const exchangeStore = useExchangeStore()
// Initialize data on component mount
onMounted(() => {
  exchangeStore.initialize()
  testServerConnection()
})

const testServerConnection = async () => {
  serverTestResult.value = 'Testing...'
  try {
    const response = await fetch(`${serverUrl}/ping`)
    if (response.ok) {
      serverTestResult.value = `Success: ${response.status} ${response.statusText}`
    } else {
      serverTestResult.value = `Error: ${response.status} ${response.statusText}`
    }
  } catch (error) {
    serverTestResult.value = `Network Error: ${error.message}`
  }
}

// Function to manually refresh all data
const refreshData = () => {
  exchangeStore.initializeData()
}

// Toggle visibility of bot details
const toggleBotDetails = (botId) => {
  expandedBots.value[botId] = !expandedBots.value[botId];
}

// Computed properties for totaled liquidity
const totalCexLiquidity = computed(() => {
  const liquidity = exchangeStore.cexLiquidity
  const usdtLiq = liquidity.find(item => item.symbol === 'USDT')?.amount || 0
  const usdcLiq = liquidity.find(item => item.symbol === 'USDC')?.amount || 0
  const seiLiq = liquidity.find(item => item.symbol === 'SEI')?.amount || 0
  return { usd: usdtLiq + usdcLiq, sei: seiLiq }
})

const totalDexLiquidity = computed(() => {
  const liquidity = exchangeStore.dexLiquidity
  const usdtLiq = liquidity.find(item => item.symbol === 'USDT')?.amount || 0
  const usdcLiq = liquidity.find(item => item.symbol === 'USDC')?.amount || 0
  const wseiLiq = liquidity.find(item => item.symbol === 'WSEI')?.amount || 0
  return { usd: usdtLiq + usdcLiq, sei: wseiLiq }
})

const totalLiquidity = computed(() => ({
  usd: totalCexLiquidity.value.usd + totalDexLiquidity.value.usd,
  sei: totalCexLiquidity.value.sei + totalDexLiquidity.value.sei
}))

const spreads = computed(() => {
  const results = []
  const cexPrice = exchangeStore.cexPrices['SEI-USDT']
  const dexPrice1 = exchangeStore.dexPrices['WSEI-USDC']
  const dexPrice2 = exchangeStore.dexPrices['WSEI-USDT']

  if (cexPrice && dexPrice1) {
    results.push({ pair: 'SEI-USDT / WSEI-USDC', value: cexPrice / dexPrice1 - 1 })
  }
  if (cexPrice && dexPrice2) {
    results.push({ pair: 'SEI-USDT / WSEI-USDT', value: cexPrice / dexPrice2 - 1 })
  }
  return results
})

// Formatters
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

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
        <div class="flex items-center space-x-2 md:space-x-4">
          <!-- Connection Status -->
          <div class="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="[
              exchangeStore.isConnected ? 'border-green-500' : 'border-red-500',
              theme === 'dark' ? 
                (exchangeStore.isConnected ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400') :
                (exchangeStore.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
            ]">
            <div class="w-2 h-2 rounded-full animate-pulse" :class="exchangeStore.isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
            <span>{{ exchangeStore.isConnected ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <!-- Refresh Button -->
          <button @click="refreshData" class="p-2 rounded-full transition-colors" :class="theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'" aria-label="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h5M20 20v-5h-5M20 4s-1.5-2-6-2-6 2-6 2" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 20s1.5 2 6 2 6-2 6-2" />
            </svg>
          </button>
          <!-- Theme Toggle -->
          <button @click="toggleTheme" class="p-2 rounded-full transition-colors" :class="theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'" aria-label="Toggle Theme">
            <svg v-if="theme === 'dark'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          </button>
        </div>
      </div>

      <!-- Main Data Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Prices Card -->
        <div class="rounded-lg p-4 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
          <h2 class="text-lg font-semibold mb-3" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Prices</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <!-- CEX, DEX, Spread Columns -->
            <div class="md:col-span-1"><h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">CEX</h3><div class="space-y-2"><div v-for="(price, pair) in exchangeStore.cexPrices" :key="pair" class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ pair }}</span><span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">${{ formatPrice(price) }}</span></div></div></div>
            <div class="md:col-span-1"><h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">DEX</h3><div class="space-y-2"><div v-for="(price, pair) in exchangeStore.dexPrices" :key="pair" class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ pair }}</span><span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">${{ formatPrice(price) }}</span></div></div></div>
            <div class="md:col-span-1"><h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">Spread</h3><div class="space-y-2"><div v-for="spread in spreads" :key="spread.pair" class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span class="text-xs" :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">{{ spread.pair }}</span><span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ spread.value.toFixed(4) }}</span></div><div v-if="spreads.length === 0" class="text-xs text-center py-2" :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-400'">No matching pairs.</div></div></div>
          </div>
        </div>

        <!-- Liquidity Card -->
        <div class="rounded-lg p-4 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
          <h2 class="text-lg font-semibold mb-3" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Liquidity</h2>
          <div class="space-y-3"><h3 class="font-medium" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">Total (CEX + DEX)</h3><div class="space-y-2 text-sm"><div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">Total USD</span><span class="font-mono font-semibold" :class="theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'">{{ formatNumber(totalLiquidity.usd) }}</span></div><div class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">Total SEI</span><span class="font-mono font-semibold" :class="theme === 'dark' ? 'text-red-400' : 'text-red-600'">{{ formatNumber(totalLiquidity.sei) }}</span></div></div><div class="border-t" :class="theme === 'dark' ? 'border-gray-700' : 'border-gray-200'"></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">CEX</h3><div class="space-y-2"><div v-for="liquidity in exchangeStore.cexLiquidity" :key="liquidity.symbol" class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span class="font-medium" :class="[liquidity.symbol.includes('USD') ? (theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')]">{{ liquidity.symbol }}</span><span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(liquidity.amount) }}</span></div></div></div><div><h3 class="font-medium mb-2" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-600'">DEX</h3><div class="space-y-2"><div v-for="liquidity in exchangeStore.dexLiquidity" :key="liquidity.symbol" class="flex justify-between items-center p-2 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'"><span class="font-medium" :class="[liquidity.symbol.includes('USD') ? (theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')]">{{ liquidity.symbol }}</span><span class="font-mono" :class="theme === 'dark' ? 'text-white' : 'text-gray-900'">{{ formatNumber(liquidity.amount) }}</span></div></div></div></div></div>
        </div>

        <!-- Bots Card -->
        <div class="rounded-lg p-4 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
          <h2 class="text-lg font-semibold mb-3" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Bot Control</h2>
          <div v-if="exchangeStore.loading.bots" class="flex justify-center items-center h-full">
             <div class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="exchangeStore.bots.length === 0" class="text-center py-4" :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-400'">
            No connected bots found.
          </div>
          <div v-else class="space-y-3">
            <div v-for="botId in exchangeStore.bots" :key="botId" class="p-3 rounded-lg" :class="theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50/50 border'">
              <div class="flex justify-between items-center">
                <p class="font-mono text-sm truncate" :class="theme === 'dark' ? 'text-gray-300' : 'text-gray-700'">{{ botId }}</p>
                <div class="flex items-center space-x-2">
                  <button @click="exchangeStore.resumeBot(botId)" class="p-1.5 rounded-md" :class="theme === 'dark' ? 'bg-green-800 hover:bg-green-700 text-green-300' : 'bg-green-100 hover:bg-green-200 text-green-700'" aria-label="Resume Bot">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                  </button>
                  <button @click="exchangeStore.pauseBot(botId)" class="p-1.5 rounded-md" :class="theme === 'dark' ? 'bg-yellow-800 hover:bg-yellow-700 text-yellow-300' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'" aria-label="Pause Bot">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" /></svg>
                  </button>
                  <button @click="toggleBotDetails(botId)" class="p-1.5 rounded-md" :class="theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'" aria-label="Toggle Details">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform transition-transform" :class="expandedBots[botId] ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>
              <div v-if="expandedBots[botId]" class="mt-3 pt-3 border-t text-xs" :class="theme === 'dark' ? 'border-gray-600' : 'border-gray-200'">
                <div v-if="exchangeStore.loading.botState || exchangeStore.loading.botConfig" class="flex justify-center items-center p-4">
                  <div class="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div v-else class="space-y-2">
                  <div>
                    <h4 class="font-semibold mb-1" :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">State:</h4>
                    <pre class="p-2 rounded font-mono text-white" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'">{{ JSON.stringify(exchangeStore.botStates[botId], null, 2) }}</pre>
                  </div>
                  <div>
                    <h4 class="font-semibold mb-1" :class="theme === 'dark' ? 'text-gray-400' : 'text-gray-500'">Config:</h4>
                    <pre class="p-2 rounded font-mono text-white" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'">{{ JSON.stringify(exchangeStore.botConfigs[botId], null, 2) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading States Toast -->
      <div v-if="Object.values(exchangeStore.loading).some(loading => loading)" class="fixed bottom-4 right-4 text-white px-4 py-2 rounded-lg shadow-lg text-sm" :class="theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'">
        <div class="flex items-center space-x-2">
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>

      <!-- Spread Chart -->
      <div class="rounded-lg p-6 border" :class="theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'">
        <h2 class="text-xl font-semibold mb-4" :class="theme === 'dark' ? 'text-blue-400' : 'text-blue-600'">Spread Analysis</h2>
        <Suspense>
          <Spread :spreads="spreads" :theme="theme" />
          <template #fallback>
            <div class="flex justify-center items-center h-64">
              <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

