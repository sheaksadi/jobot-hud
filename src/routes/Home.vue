<script setup>
import Spread from '@/components/charts/Spread.vue'
import { useExchangeStore } from '@/stores/exchangesStore.ts'
import { computed, onMounted } from 'vue'
import {useColorMode} from "@nuxt/ui/runtime/vue/stubs.js";

const colorMode = useColorMode()
const exchangeStore = useExchangeStore()

onMounted(() => {
  exchangeStore.initialize()
})

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})

const refreshData = () => {
  exchangeStore.initializeData()
}

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

const botAccordionItems = computed(() => {
  return exchangeStore.bots.map((botId) => ({
    label: botId,
    botId,
    slot: 'bot-content'
  }))
})

const botStateDisplay = (state) => {
  if (!state) return []
  return [
    { label: 'Status', value: state.isBotStopped ? 'Stopped' : 'Running', color: state.isBotStopped ? 'yellow' : 'green', icon: state.isBotStopped ? 'i-heroicons-pause-circle-20-solid' : 'i-heroicons-play-circle-20-solid' },
    { label: 'Balance', value: state.isBotUnbalanced ? 'Unbalanced' : 'Balanced', color: state.isBotUnbalanced ? 'red' : 'green', icon: state.isBotUnbalanced ? 'i-heroicons-exclamation-triangle-20-solid' : 'i-heroicons-check-circle-20-solid' },
    { label: 'Swapping', value: state.isBotSwaping ? 'Active' : 'Idle', color: state.isBotSwaping ? 'primary' : 'gray' },
    { label: 'Placing Orders', value: state.isBotPlacingOrders ? 'Active' : 'Idle', color: state.isBotPlacingOrders ? 'primary' : 'gray' },
    { label: 'Canceling Orders', value: state.isBotCancelingOrders ? 'Active' : 'Idle', color: state.isBotCancelingOrders ? 'primary' : 'gray' },
    { label: 'Approving', value: state.isBotApproving ? 'Active' : 'Idle', color: state.isBotApproving ? 'primary' : 'gray' },
    { label: 'To Be Traded', value: state.toBeTraded, color: 'gray' },
  ]
}

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
  <UContainer class="py-4">
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          <span class="text-primary">Jobot</span> HUD
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Real-time CEX & DEX monitoring</p>
      </div>
      <div class="flex items-center space-x-2">
        <UBadge :color="exchangeStore.isConnected ? 'green' : 'red'" variant="soft" size="lg">
          <div class="w-2 h-2 rounded-full mr-2" :class="[exchangeStore.isConnected ? 'bg-green-500' : 'bg-red-500', exchangeStore.isConnected && 'animate-pulse']"></div>
          {{ exchangeStore.isConnected ? 'Connected' : 'Disconnected' }}
        </UBadge>
        <UButton icon="i-heroicons-arrow-path-20-solid" size="sm" color="primary" square variant="solid" @click="refreshData" :loading="Object.values(exchangeStore.loading).some(l => l)" />
        <UButton :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'" color="gray" variant="ghost" aria-label="Theme" @click="isDark = !isDark" />
      </div>
    </header>

    <UPageGrid class="grid-cols-1 lg:grid-cols-3">
      <!-- Market Overview - Spans 2 columns -->
      <div class="lg:col-span-2">
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 border border-white/20 dark:border-gray-700/50 backdrop-blur-sm">
          <!-- Animated background pattern -->
          <div class="absolute inset-0 opacity-30">
            <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob"></div>
            <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div class="relative p-6">
            <!-- Header with market sentiment -->
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <UIcon name="i-heroicons-chart-bar-20-solid" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 class="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Market Overview</h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Real-time price & liquidity analytics</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <div class="px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span class="text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Price Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <!-- CEX Prices -->
              <div class="space-y-3">
                <div class="flex items-center space-x-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <UIcon name="i-heroicons-building-office-20-solid" class="w-4 h-4 text-white" />
                  </div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Centralized Exchange</h3>
                </div>
                <div class="space-y-2">
                  <div v-for="(price, pair) in exchangeStore.cexPrices" :key="pair" 
                       class="group relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 p-4 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {{ pair.split('-')[0].charAt(0) }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{{ pair }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">CEX Price</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-bold text-gray-900 dark:text-white font-mono">${{ formatPrice(price) }}</div>
                        <div class="flex items-center space-x-1 mt-1">
                          <UIcon name="i-heroicons-arrow-trending-up-20-solid" class="w-3 h-3 text-emerald-500" />
                          <span class="text-xs text-emerald-500 font-medium">+0.25%</span>
                        </div>
                      </div>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>

              <!-- DEX Prices -->
              <div class="space-y-3">
                <div class="flex items-center space-x-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <UIcon name="i-heroicons-squares-2x2-20-solid" class="w-4 h-4 text-white" />
                  </div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Decentralized Exchange</h3>
                </div>
                <div class="space-y-2">
                  <div v-for="(price, pair) in exchangeStore.dexPrices" :key="pair" 
                       class="group relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 p-4 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                          {{ pair.split('-')[0].charAt(0) }}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-white">{{ pair }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">DEX Price</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-bold text-gray-900 dark:text-white font-mono">${{ formatPrice(price) }}</div>
                        <div class="flex items-center space-x-1 mt-1">
                          <UIcon name="i-heroicons-arrow-trending-down-20-solid" class="w-3 h-3 text-red-500" />
                          <span class="text-xs text-red-500 font-medium">-0.12%</span>
                        </div>
                      </div>
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Spread Analysis Section -->
            <div class="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4 mb-6">
              <div class="flex items-center space-x-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <UIcon name="i-heroicons-scale-20-solid" class="w-4 h-4 text-white" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Arbitrage Opportunities</h3>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="spread in spreads" :key="spread.pair" 
                     class="group relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 p-3 hover:shadow-md transition-all duration-300">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ spread.pair.split(' / ')[0] }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">vs {{ spread.pair.split(' / ')[1] }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">{{ (spread.value * 100).toFixed(2) }}%</div>
                      <UBadge :color="Math.abs(spread.value) > 0.01 ? 'amber' : 'gray'" variant="soft" size="xs">
                        {{ Math.abs(spread.value) > 0.01 ? 'Opportunity' : 'Neutral' }}
                      </UBadge>
                    </div>
                  </div>
                  <div class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 group-hover:h-2" 
                       :style="{ width: `${Math.min(Math.abs(spread.value) * 1000, 100)}%` }"></div>
                </div>
                <div v-if="spreads.length === 0" class="col-span-2 text-center py-4 text-gray-400 dark:text-gray-500 text-sm">
                  No arbitrage opportunities detected
                </div>
              </div>
            </div>

            <!-- Liquidity Overview -->
            <div class="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 p-4">
              <div class="flex items-center space-x-2 mb-4">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                  <UIcon name="i-heroicons-banknotes-20-solid" class="w-4 h-4 text-white" />
                </div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Liquidity Distribution</h3>
              </div>

              <!-- Total Liquidity Stats -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div class="text-center p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-700/50">
                  <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">${{ formatNumber(totalLiquidity.usd) }}</div>
                  <div class="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Total USD Liquidity</div>
                  <div class="mt-2 h-2 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse" style="width: 85%"></div>
                  </div>
                </div>
                <div class="text-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50">
                  <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 font-mono">{{ formatNumber(totalLiquidity.sei) }}</div>
                  <div class="text-sm text-blue-700 dark:text-blue-300 font-medium">Total SEI Liquidity</div>
                  <div class="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse" style="width: 70%"></div>
                  </div>
                </div>
              </div>

              <!-- Exchange Breakdown -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <div class="w-4 h-4 rounded bg-blue-500 mr-2"></div>
                    CEX Holdings
                  </h4>
                  <div class="space-y-2">
                    <div v-for="liquidity in exchangeStore.cexLiquidity" :key="liquidity.symbol" 
                         class="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm">
                      <span class="font-medium text-gray-900 dark:text-white">{{ liquidity.symbol }}</span>
                      <div class="flex items-center space-x-2">
                        <span class="font-mono text-sm text-gray-600 dark:text-gray-300">{{ formatNumber(liquidity.amount) }}</span>
                        <div class="w-12 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" 
                               :style="{ width: `${(liquidity.amount / Math.max(...exchangeStore.cexLiquidity.map(l => l.amount))) * 100}%` }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 class="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <div class="w-4 h-4 rounded bg-purple-500 mr-2"></div>
                    DEX Holdings
                  </h4>
                  <div class="space-y-2">
                    <div v-for="liquidity in exchangeStore.dexLiquidity" :key="liquidity.symbol" 
                         class="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm">
                      <span class="font-medium text-gray-900 dark:text-white">{{ liquidity.symbol }}</span>
                      <div class="flex items-center space-x-2">
                        <span class="font-mono text-sm text-gray-600 dark:text-gray-300">{{ formatNumber(liquidity.amount) }}</span>
                        <div class="w-12 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div class="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" 
                               :style="{ width: `${(liquidity.amount / Math.max(...exchangeStore.dexLiquidity.map(l => l.amount))) * 100}%` }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
        <template #header><h2 class="text-lg font-semibold text-primary">Bot Control</h2></template>
        <div v-if="exchangeStore.loading.bots">
          <div class="p-4"><USkeleton class="h-12 w-full" v-for="i in 3" :key="i" /></div>
        </div>
        <div v-else-if="exchangeStore.bots.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
          No connected bots found.
        </div>
        <UAccordion v-else :items="botAccordionItems">
          <template #trailing="{ item }">
            <div class="flex items-center space-x-2">
              <UButton size="2xs" icon="i-heroicons-play-20-solid" color="green" variant="soft" @click.stop="exchangeStore.resumeBot(item.botId)" />
              <UButton size="2xs" icon="i-heroicons-pause-20-solid" color="yellow" variant="soft" @click.stop="exchangeStore.pauseBot(item.botId)" />
            </div>
          </template>
          <template #bot-content="{ item }">
            <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50">
              <div v-if="exchangeStore.loading.botState || exchangeStore.loading.botConfig" class="flex justify-center items-center p-4">
                <USkeleton class="h-6 w-1/2" />
              </div>
              <div v-else class="space-y-3 text-sm">
                <div v-for="state in botStateDisplay(exchangeStore.botStates[item.botId])" :key="state.label" class="flex justify-between items-center">
                  <span class="text-gray-500 dark:text-gray-400">{{ state.label }}</span>
                  <UBadge :color="state.color" variant="soft">
                    <UIcon v-if="state.icon" :name="state.icon" class="w-4 h-4 mr-1" />
                    {{ state.value }}
                  </UBadge>
                </div>
                 <div>
                    <h4 class="font-semibold mb-1 mt-3 text-gray-500 dark:text-gray-400">Config:</h4>
                    <pre class="p-2 rounded font-mono text-white bg-gray-900 dark:bg-gray-900/50 text-xs">{{ JSON.stringify(exchangeStore.botConfigs[item.botId], null, 2) }}</pre>
                  </div>
              </div>
            </div>
          </template>
        </UAccordion>
      </UCard>
    </UPageGrid>

    <UCard class="mt-8">
       <template #header>
        <h2 class="text-xl font-semibold text-primary">Spread Analysis</h2>
       </template>
      <Suspense>
        <Spread :spreads="spreads" :theme="isDark ? 'dark' : 'light'" />
        <template #fallback>
          <div class="flex justify-center items-center h-64">
            <USkeleton class="h-full w-full" />
          </div>
        </template>
      </Suspense>
    </UCard>

  </UContainer>
</template>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>

