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
      <UCard>
        <template #header><h2 class="text-lg font-semibold text-primary">Prices</h2></template>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 class="font-medium mb-2 text-gray-500 dark:text-gray-400">CEX</h3>
            <div class="space-y-2">
              <div v-for="(price, pair) in exchangeStore.cexPrices" :key="pair" class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span class="text-gray-500 dark:text-gray-400">{{ pair }}</span>
                <span class="font-mono text-gray-900 dark:text-gray-100">${{ formatPrice(price) }}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-medium mb-2 text-gray-500 dark:text-gray-400">DEX</h3>
            <div class="space-y-2">
              <div v-for="(price, pair) in exchangeStore.dexPrices" :key="pair" class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span class="text-gray-500 dark:text-gray-400">{{ pair }}</span>
                <span class="font-mono text-gray-900 dark:text-gray-100">${{ formatPrice(price) }}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-medium mb-2 text-gray-500 dark:text-gray-400">Spread</h3>
            <div class="space-y-2">
              <div v-for="spread in spreads" :key="spread.pair" class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ spread.pair }}</span>
                <span class="font-mono text-gray-900 dark:text-gray-100">{{ spread.value.toFixed(4) }}</span>
              </div>
              <div v-if="spreads.length === 0" class="text-xs text-center py-2 text-gray-400 dark:text-gray-500">No matching pairs.</div>
            </div>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header><h2 class="text-lg font-semibold text-primary">Liquidity</h2></template>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium text-gray-500 dark:text-gray-400">Total (CEX + DEX)</h3>
            <div class="space-y-2 text-sm mt-2">
              <div class="flex justify-between items-center p-2 rounded-lg bg-primary-50 dark:bg-primary-400/10"><span class="font-semibold text-primary-600 dark:text-primary-400">Total USD</span><span class="font-mono font-semibold text-primary-600 dark:text-primary-400">{{ formatNumber(totalLiquidity.usd) }}</span></div>
              <div class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800"><span class="font-semibold text-gray-600 dark:text-gray-300">Total SEI</span><span class="font-mono font-semibold text-gray-600 dark:text-gray-300">{{ formatNumber(totalLiquidity.sei) }}</span></div>
            </div>
          </div>
          <UDivider />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 class="font-medium mb-2 text-gray-500 dark:text-gray-400">CEX</h3>
              <div class="space-y-2">
                <div v-for="liquidity in exchangeStore.cexLiquidity" :key="liquidity.symbol" class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span class="font-medium" :class="liquidity.symbol.includes('USD') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'">{{ liquidity.symbol }}</span>
                  <span class="font-mono text-gray-900 dark:text-gray-100">{{ formatNumber(liquidity.amount) }}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="font-medium mb-2 text-gray-500 dark:text-gray-400">DEX</h3>
              <div class="space-y-2">
                <div v-for="liquidity in exchangeStore.dexLiquidity" :key="liquidity.symbol" class="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <span class="font-medium" :class="liquidity.symbol.includes('USD') ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'">{{ liquidity.symbol }}</span>
                  <span class="font-mono text-gray-900 dark:text-gray-100">{{ formatNumber(liquidity.amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

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

