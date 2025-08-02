<script setup>
import Spread from '@/components/charts/Spread.vue'
import { useExchangeStore } from '../stores/exchangesStore.js';
import { useAuthStore } from '../stores/authStore.js';
import { computed, onMounted, ref, onUnmounted, reactive, watch } from 'vue'
import {useColorMode} from "@nuxt/ui/runtime/vue/stubs.js";
import { useLogStore } from '../stores/logStore.js';

const colorMode = useColorMode()
const exchangeStore = useExchangeStore()
const authStore = useAuthStore();
const logStore = useLogStore();

const handleLogout = () => {
  authStore.logout();
};
const showDropdown = ref(false)
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
  const cexPairs = Object.keys(exchangeStore.cexPrices)
  const dexPairs = Object.keys(exchangeStore.dexPrices)

  for (const cexPair of cexPairs) {
    for (const dexPair of dexPairs) {
      const cexPrice = exchangeStore.cexPrices[cexPair]
      const dexPrice = exchangeStore.dexPrices[dexPair]

      if (cexPrice !== null && cexPrice !== undefined && dexPrice !== null && dexPrice !== undefined) {
        results.push({ pair: `${cexPair} / ${dexPair}`, value: cexPrice / dexPrice - 1 })
      }
    }
  }
  return results
})

const firstBotId = computed(() => exchangeStore.bots.length > 0 ? exchangeStore.bots[0] : null)
const showFullConfig = ref(false)

const tabItems = [
  { label: 'Market', icon: 'i-heroicons-chart-bar-20-solid' },
  { label: 'Control', icon: 'i-heroicons-cog-8-tooth-20-solid' },
  { label: 'Logs', icon: 'i-heroicons-document-text-20-solid' }
]

const cexLiquidityWithPercent = computed(() => {
    const amounts = exchangeStore.cexLiquidity.map(l => l.amount);
    if (amounts.length === 0) return exchangeStore.cexLiquidity.map(l => ({ ...l, width: 0 }));
    const max = Math.max(...amounts);
    if (max === 0) return exchangeStore.cexLiquidity.map(l => ({ ...l, width: 0 }));
    return exchangeStore.cexLiquidity.map(l => ({
        ...l,
        width: (l.amount / max) * 100
    }))
})

const dexLiquidityWithPercent = computed(() => {
    const amounts = exchangeStore.dexLiquidity.map(l => l.amount);
    if (amounts.length === 0) return exchangeStore.dexLiquidity.map(l => ({ ...l, width: 0 }));
    const max = Math.max(...amounts);
    if (max === 0) return exchangeStore.dexLiquidity.map(l => ({ ...l, width: 0 }));
    return exchangeStore.dexLiquidity.map(l => ({
        ...l,
        width: (l.amount / max) * 100
    }))
})

// Fixed computed properties for displaying prices
const cexPricesArray = computed(() => {
  return Object.entries(exchangeStore.cexPrices)
    .filter(([pair, price]) => price !== null && price !== undefined)
    .map(([pair, price]) => ({ pair, price }))
})

const dexPricesArray = computed(() => {
  return Object.entries(exchangeStore.dexPrices)
    .filter(([pair, price]) => price !== null && price !== undefined)
    .map(([pair, price]) => ({ pair, price }))
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

const getCexPriceForSpread = (spreadPair) => {
  const cexPair = spreadPair.split(' / ')[0]
  const price = exchangeStore.cexPrices[cexPair]
  return formatPrice(price)
}

const getDexPriceForSpread = (spreadPair) => {
  const dexPair = spreadPair.split(' / ')[1]
  const price = exchangeStore.dexPrices[dexPair]
  return formatPrice(price)
}

const trade = ref({
  exchange: 'cex',
  side: 'buy',
  currencyPair: null,
  amount: null,
  loading: false
});

const availablePairs = computed(() => {
  return trade.value.exchange === 'cex' 
    ? exchangeStore.cexCurrencyPairs 
    : exchangeStore.dexCurrencyPairs;
});

let selectedPair = ref(availablePairs.value[0])

watch(availablePairs, (newPairs) => {
    console.log('Available pairs changed:', newPairs[0])
    if(!selectedPair.value || !newPairs.includes(selectedPair.value)) {
        selectedPair.value = newPairs[0]
    }
}, { immediate: true });

const executeTrade = async () => {
    trade.value.currencyPair = selectedPair.value
    console.log("trade", trade.value)
  if (!firstBotId.value || !trade.value.currencyPair || !trade.value.amount) {
    console.error('Missing required trade parameters');
    return;
  }

  trade.value.loading = true;
  try {
    const result = await exchangeStore.manualTrade(firstBotId.value, {
      exchange: trade.value.exchange,
      side: trade.value.side,
      currencyPair: trade.value.currencyPair,
      amount: trade.value.amount
    });
    console.log('Trade successful:', result);
  } catch (error) {
    console.error('Trade failed:', error);
  } finally {
    trade.value.loading = false;
  }
};

watch(() => trade.exchange, () => {
  trade.currencyPair = null; // Reset currency pair when exchange changes
});

const getPriceDifferenceForSpread = (spreadPair) => {
  const cexPair = spreadPair.split(' / ')[0]
  const dexPair = spreadPair.split(' / ')[1]
  const cexPrice = exchangeStore.cexPrices[cexPair]
  const dexPrice = exchangeStore.dexPrices[dexPair]

  if (!cexPrice || !dexPrice) return '0.0000'

  const difference = Math.abs(cexPrice - dexPrice)
  return formatPrice(difference)
}

const expandedLog = ref(null);

const toggleLogData = (index) => {
  expandedLog.value = expandedLog.value === index ? null : index;
};

const getBorderColor = (color) => {
  if (!color) return 'ring-gray-200 dark:ring-gray-700';
  // You can add more color mappings here if needed
  if (color.toLowerCase() === 'red') return 'ring-red-500';
  if (color.toLowerCase() === 'green') return 'ring-green-500';
  if (color.toLowerCase() === 'yellow') return 'ring-yellow-500';
  return `ring-${color}-500`;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const logsForCurrentBot = computed(() => {
  if (firstBotId.value && logStore.logs[firstBotId.value]) {
    return logStore.logs[firstBotId.value];
  }
  return [];
});
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
        <UButton color="primary" variant="solid" @click="handleLogout">Logout</UButton>
      </div>
    </header>

    <div v-if="exchangeStore.loading.bots" class="flex justify-center items-center p-8">
      <USkeleton class="h-32 w-full" />
    </div>
    <div v-else-if="firstBotId">
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white font-mono truncate">{{ firstBotId }}</h2>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          <UButton icon="i-heroicons-play-20-solid" color="green" variant="soft" @click="exchangeStore.resumeBot(firstBotId)">Resume</UButton>
          <UButton icon="i-heroicons-pause-20-solid" color="yellow" variant="soft" @click="exchangeStore.pauseBot(firstBotId)">Pause</UButton>
        </div>
      </div>

      <UTabs :items="tabItems" class="w-full">
        <template #content="{ item }">
          <UCard :ui="{ body: { base: 'mt-4' } }">
            <template v-if="item.label === 'Control'">
              <div v-if="exchangeStore.loading.botState || exchangeStore.loading.botConfig" class="flex justify-center items-center p-4">
                  <USkeleton class="h-32 w-full" />
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 class="text-lg font-semibold mb-4">Bot State</h3>
                    <div class="space-y-3 text-sm">
                      <div v-for="state in botStateDisplay(exchangeStore.botStates[firstBotId])" :key="state.label" class="flex justify-between items-center">
                        <span class="text-gray-500 dark:text-gray-400">{{ state.label }}</span>
                        <UBadge :color="state.color" variant="soft">
                          <UIcon v-if="state.icon" :name="state.icon" class="w-4 h-4 mr-1" />
                          {{ state.value }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-lg font-semibold">Configuration</h3>
                      <UButton size="xs" variant="ghost" @click="showFullConfig = !showFullConfig">
                        {{ showFullConfig ? 'Hide JSON' : 'Show JSON' }}
                      </UButton>
                    </div>

                    <div v-if="!showFullConfig && exchangeStore.botConfigs[firstBotId]" class="space-y-4">
                      <!-- Bot Overview -->
                      <UCard :ui="{ body: { padding: 'p-3' } }">
                        <div class="flex items-center space-x-3 mb-3">
                          <UIcon name="i-heroicons-identification-20-solid" class="w-5 h-5 text-primary" />
                          <h4 class="font-medium">Bot Identity</h4>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">Name:</span>
                            <span class="font-mono">{{ exchangeStore.botConfigs[firstBotId].botName }}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-500 dark:text-gray-400">UUID:</span>
                            <span class="font-mono">{{ exchangeStore.botConfigs[firstBotId].uuid }}</span>
                          </div>
                        </div>
                      </UCard>

                      <!-- Exchange Configuration -->
                      <UCard :ui="{ body: { padding: 'p-3' } }">
                        <div class="flex items-center space-x-3 mb-3">
                          <UIcon name="i-heroicons-arrow-path-20-solid" class="w-5 h-5 text-primary" />
                          <h4 class="font-medium">Exchange Setup</h4>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div class="space-y-2">
                            <div class="flex items-center space-x-2">
                              <UIcon name="i-heroicons-building-office-20-solid" class="w-4 h-4 text-blue-500" />
                              <span class="font-medium">CEX: {{ exchangeStore.botConfigs[firstBotId].cexName }}</span>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              {{ exchangeStore.botConfigs[firstBotId].defaultPairs?.cexCurrencyPair }}
                            </div>
                          </div>
                          <div class="space-y-2">
                            <div class="flex items-center space-x-2">
                              <UIcon name="i-heroicons-squares-2x2-20-solid" class="w-4 h-4 text-purple-500" />
                              <span class="font-medium">DEX: {{ exchangeStore.botConfigs[firstBotId].dexName }}</span>
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              {{ exchangeStore.botConfigs[firstBotId].dexContract }})
                            </div>
                          </div>
                        </div>
                      </UCard>

                      <!-- Trading Parameters -->
                      <UCard :ui="{ body: { padding: 'p-3' } }">
                        <div class="flex items-center space-x-3 mb-3">
                          <UIcon name="i-heroicons-cog-6-tooth-20-solid" class="w-5 h-5 text-primary" />
                          <h4 class="font-medium">Trading Parameters</h4>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div class="font-semibold text-primary">{{ (exchangeStore.botConfigs[firstBotId].dexPriceChangeThreshold * 100).toFixed(2) }}%</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Price Threshold</div>
                          </div>
                          <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div class="font-semibold text-primary">${{ exchangeStore.botConfigs[firstBotId].liquidityBalanceThreshold }}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Balance Threshold</div>
                          </div>
                          <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div class="font-semibold text-primary">{{ (exchangeStore.botConfigs[firstBotId].dexVolumeIncrease * 100).toFixed(2) }}%</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Volume Increase</div>
                          </div>
                          <div class="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div class="font-semibold text-primary">{{ exchangeStore.botConfigs[firstBotId].botExecutionBufferTime }}ms</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Buffer Time</div>
                          </div>
                        </div>
                      </UCard>

                      <!-- Starting Balances -->
                      <UCard v-if="exchangeStore.botConfigs[firstBotId].symbolRelations?.startingBalances" :ui="{ body: { padding: 'p-3' } }">
                        <div class="flex items-center space-x-3 mb-3">
                          <UIcon name="i-heroicons-banknotes-20-solid" class="w-5 h-5 text-primary" />
                          <h4 class="font-medium">Starting Balances</h4>
                        </div>
                        <div class="space-y-2">
                          <div v-for="balance in exchangeStore.botConfigs[firstBotId].symbolRelations.startingBalances" :key="balance.currency" 
                               class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div class="flex items-center space-x-2">
                              <div class="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                                {{ balance.currency.charAt(0) }}
                              </div>
                              <span class="font-medium">{{ balance.currency }}</span>
                            </div>
                            <div class="text-right">
                              <div class="font-semibold">{{ formatNumber(balance.amount) }}</div>
                              <div class="text-xs text-gray-500 dark:text-gray-400">±{{ balance.acceptableDeviationPercentage }}%</div>
                            </div>
                          </div>
                        </div>
                      </UCard>

                      <!-- Trading Orders -->
                      <UCard v-if="exchangeStore.botConfigs[firstBotId].orders" :ui="{ body: { padding: 'p-3' } }">
                        <div class="flex items-center space-x-3 mb-3">
                          <UIcon name="i-heroicons-list-bullet-20-solid" class="w-5 h-5 text-primary" />
                          <h4 class="font-medium">Trading Orders ({{ exchangeStore.botConfigs[firstBotId].orders?.length || 0 }})</h4>
                        </div>
                        <div class="space-y-2">
                          <div v-for="(order, index) in exchangeStore.botConfigs[firstBotId].orders" :key="index" 
                               class="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center justify-between mb-2">
                              <UBadge :color="order.side === 'buy' ? 'green' : 'red'" variant="soft">
                                <UIcon :name="order.side === 'buy' ? 'i-heroicons-arrow-down-20-solid' : 'i-heroicons-arrow-up-20-solid'" class="w-3 h-3 mr-1" />
                                {{ order.side.toUpperCase() }}
                              </UBadge>
                              <div class="text-xs text-gray-500 dark:text-gray-400">
                                {{ order.cexCurrencyPair }} ↔ {{ order.dexCurrencyPair }}
                              </div>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span class="text-gray-500 dark:text-gray-400">Spread:</span>
                                <span class="font-mono ml-1">{{ (order.spreadOffset * 100).toFixed(1) }}%</span>
                              </div>
                              <div>
                                <span class="text-gray-500 dark:text-gray-400">Balance:</span>
                                <span class="font-mono ml-1">{{ (order.balanceSpreadOffset * 100).toFixed(1) }}%</span>
                              </div>
                              <div>
                                <span class="text-gray-500 dark:text-gray-400">Min Vol:</span>
                                <span class="font-mono ml-1">${{ order.minTradeVolume }}</span>
                              </div>
                              <div>
                                <span class="text-gray-500 dark:text-gray-400">Max Vol:</span>
                                <span class="font-mono ml-1">${{ order.maxTradeVolume }}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </UCard>
                    </div>

                    <div v-else-if="showFullConfig">
                      <pre class="p-4 rounded-lg font-mono text-white bg-gray-900 dark:bg-gray-800 text-xs overflow-x-auto">{{ JSON.stringify(exchangeStore.botConfigs[firstBotId], null, 2) }}</pre>
                    </div>
                  </div>
              </div>
            </template>
            <template v-if="item.label === 'Market'">
              <div class="space-y-4">
                <!-- Current Prices -->
                <UCard :ui="{ body: { padding: 'p-3' } }">
                  <div class="flex items-center space-x-3 mb-3">
                    <UIcon name="i-heroicons-currency-dollar-20-solid" class="w-5 h-5 text-primary" />
                    <h4 class="font-medium">Current Prices</h4>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- CEX Prices -->
                    <div>
                      <div class="flex items-center space-x-2 mb-3">
                        <UIcon name="i-heroicons-building-office-20-solid" class="w-4 h-4 text-blue-500" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Centralized Exchange</span>
                      </div>
                      <div class="space-y-2">
                        <div v-if="cexPricesArray.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                          No CEX prices available
                        </div>
                        <div v-for="priceData in cexPricesArray" :key="priceData.pair" 
                             class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div class="flex items-center space-x-2">
                            <div class="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {{ priceData.pair.split('-')[0].charAt(0) }}
                            </div>
                            <span class="font-medium text-sm">{{ priceData.pair }}</span>
                          </div>
                          <div class="text-right">
                            <div class="font-mono font-semibold">${{ formatPrice(priceData.price) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- DEX Prices -->
                    <div>
                      <div class="flex items-center space-x-2 mb-3">
                        <UIcon name="i-heroicons-squares-2x2-20-solid" class="w-4 h-4 text-purple-500" />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Decentralized Exchange</span>
                      </div>
                      <div class="space-y-2">
                        <div v-if="dexPricesArray.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                          No DEX prices available
                        </div>
                        <div v-for="priceData in dexPricesArray" :key="priceData.pair" 
                             class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div class="flex items-center space-x-2">
                            <div class="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {{ priceData.pair.split('-')[0].charAt(0) }}
                            </div>
                            <span class="font-medium text-sm">{{ priceData.pair }}</span>
                          </div>
                          <div class="text-right">
                            <div class="font-mono font-semibold">${{ formatPrice(priceData.price) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </UCard>

                <!-- Arbitrage Opportunities -->
                <UCard :ui="{ body: { padding: 'p-3' } }">
                  <div class="flex items-center space-x-3 mb-3">
                    <UIcon name="i-heroicons-scale-20-solid" class="w-5 h-5 text-primary" />
                    <h4 class="font-medium">Arbitrage Opportunities</h4>
                  </div>
                  <div v-if="spreads.length === 0" class="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No arbitrage opportunities detected
                  </div>
                  <div v-else class="space-y-2">
                    <div v-for="spread in spreads" :key="spread.pair" 
                         class="p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50">
                      <div class="flex items-center justify-between mb-2">
                        <div>
                          <div class="font-medium text-sm">{{ spread.pair.split(' / ')[0] }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">vs {{ spread.pair.split(' / ')[1] }}</div>
                        </div>
                        <div class="text-right">
                          <div class="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">${{ getPriceDifferenceForSpread(spread.pair) }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ (spread.value * 100).toFixed(2) }}%</div>
                        </div>
                      </div>
                      <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center space-x-4">
                          <div class="text-gray-600 dark:text-gray-400">
                            <span class="text-blue-600 dark:text-blue-400">CEX:</span>
                            <span class="font-mono ml-1">${{ getCexPriceForSpread(spread.pair) }}</span>
                          </div>
                          <div class="text-gray-600 dark:text-gray-400">
                            <span class="text-purple-600 dark:text-purple-400">DEX:</span>
                            <span class="font-mono ml-1">${{ getDexPriceForSpread(spread.pair) }}</span>
                          </div>
                        </div>
                        <div class="text-gray-500 dark:text-gray-400">
                          <span>Diff:</span>
                          <span class="font-mono ml-1">${{ getPriceDifferenceForSpread(spread.pair) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </UCard>

                <!-- Liquidity Overview -->
                <UCard :ui="{ body: { padding: 'p-3' } }">
                  <div class="flex items-center space-x-3 mb-3">
                    <UIcon name="i-heroicons-banknotes-20-solid" class="w-5 h-5 text-primary" />
                    <h4 class="font-medium">Liquidity Overview</h4>
                  </div>

                  <!-- Total Liquidity -->
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50">
                      <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">${{ formatNumber(totalLiquidity.usd) }}</div>
                      <div class="text-xs text-emerald-700 dark:text-emerald-300">Total USD</div>
                    </div>
                    <div class="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
                      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{{ formatNumber(totalLiquidity.sei) }}</div>
                      <div class="text-xs text-blue-700 dark:text-blue-300">Total SEI</div>
                    </div>
                  </div>

                  <!-- Exchange Holdings -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div class="flex items-center space-x-2 mb-2">
                        <div class="w-3 h-3 rounded bg-blue-500"></div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">CEX Holdings</span>
                      </div>
                      <div class="space-y-2">
                        <div v-for="liquidity in cexLiquidityWithPercent" :key="liquidity.symbol" 
                             class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <span class="font-medium text-sm">{{ liquidity.symbol }}</span>
                          <div class="flex items-center space-x-2">
                            <span class="font-mono text-sm">{{ formatNumber(liquidity.amount) }}</span>
                            <div class="w-8 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" :style="{ width: `${liquidity.width}%` }"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div class="flex items-center space-x-2 mb-2">
                        <div class="w-3 h-3 rounded bg-purple-500"></div>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">DEX Holdings</span>
                      </div>
                      <div class="space-y-2">
                        <div v-for="liquidity in dexLiquidityWithPercent" :key="liquidity.symbol" 
                             class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <span class="font-medium text-sm">{{ liquidity.symbol }}</span>
                          <div class="flex items-center space-x-2">
                            <span class="font-mono text-sm">{{ formatNumber(liquidity.amount) }}</span>
                            <div class="w-8 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div class="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" :style="{ width: `${liquidity.width}%` }"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </UCard>
<!-- Manual Trade -->
<UCard :ui="{ body: { padding: 'p-2' } }">
  <div class="flex items-center space-x-3 mb-2">
    <UIcon name="i-heroicons-wrench-screwdriver-20-solid" class="w-5 h-5 text-primary" />
    <h4 class="font-medium">Manual Trade</h4>
  </div>
  <div class="space-y-4">
    <div class="flex items-center gap-1 flex-wrap">
      <div class="flex-1">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Exchange</span>
        <div class="grid grid-cols-2 gap-1 mt-1">
          <UButton 
            v-for="option in ['cex', 'dex']" 
            :key="option" 
            :label="option.toUpperCase()" 
            size="xs" 
            :variant="trade.exchange === option ? 'solid' : 'outline'" 
            @click="() => {trade.exchange = option; selectedPair = availablePairs[0]}" 
            class="w-full justify-center" 
          />
        </div>
      </div>
      <div class="flex-1">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Side</span>
        <div class="grid grid-cols-2 gap-1 mt-1">
          <UButton 
            v-for="option in ['buy', 'sell']" 
            :key="option" 
            :label="option.toUpperCase()" 
            size="xs" 
            :variant="trade.side === option ? 'solid' : 'outline'" 
            @click="trade.side = option" 
            class="w-full justify-center" 
          />
        </div>
      </div>
                                                  <div class="flex-1">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Side</span>
         <USelectMenu v-model="selectedPair" :items="availablePairs" class="text-xs" />

      </div>

    </div>
    <div class="flex items-center gap-4">
      <UInput 
        v-model.number="trade.amount" 
        type="number" 
        placeholder="Amount" 
        class="flex-1" 
      />
      <UButton 
        @click="executeTrade" 
        color="primary" 
        variant="solid" 
        :loading="trade.loading"
      >
        Trade
      </UButton>
    </div>
  </div>
</UCard>








               <!-- Spread Analysis Chart -->
                <UCard>
                  <template #header>
                    <div class="flex items-center space-x-3">
                      <UIcon name="i-heroicons-chart-bar-20-solid" class="w-5 h-5 text-primary" />
                      <h4 class="font-medium">Spread Analysis</h4>
                    </div>
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
              </div>
            </template>
            <template v-if="item.label === 'Logs'">
              <div class="h-[600px] overflow-y-auto space-y-2 pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                <UCard v-for="(log, index) in logsForCurrentBot.slice().reverse()" :key="index" :ui="{ ring: `ring-1 ${getBorderColor(log.color)}`, body: { padding: 'p-2 sm:p-3' } }">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                         <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ formatTimestamp(log.timestamp) }} - <span :style="{ color: log.color }">{{ log.source }}</span></span>
                      </div>
                      <p class="text-sm text-gray-800 dark:text-gray-200">{{ log.message }}</p>
                    </div>
                    <UButton v-if="log.data"
                      :icon="expandedLog === index ? 'i-heroicons-chevron-up' : 'i-heroicons-code-bracket'"
                      size="xs"
                      color="gray"
                      variant="ghost"
                      class="ml-2"
                      @click="toggleLogData(index)"
                    />
                  </div>
                  <div v-if="expandedLog === index" class="mt-2">
                    <pre class="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-x-auto"><code>{{ JSON.stringify(log.data, null, 2) }}</code></pre>
                  </div>
                </UCard>
              </div>
            </template>
          </UCard>
        </template>
      </UTabs>

    </div>
    <div v-else class="text-center py-16">
      <UIcon name="i-heroicons-wifi-off" class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No connected bots</h3>
      <p class="mt-1 text-sm text-gray-500">Waiting for bots to connect to the server.</p>
    </div>
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
