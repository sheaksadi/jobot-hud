
import axiosInstance from '../axios.js';
import { defineStore } from 'pinia';
import { useLogStore } from './logStore';
import { socket } from '../socket.js';
import type { Liquidity, LiquidityResponse, PriceData, AllPricesResponse, PriceUpdateData, BotState, BotConfig, ExchangeState, ManualTradeArg } from '../types/exchange';



export const useExchangeStore = defineStore('exchange', {
  state: (): ExchangeState => ({
    // WebSocket connection
    socket: null,
    isConnected: false,
    // CEX data
    cexLiquidity: [],
    cexPrice: null,
    cexPrices: {},
    // DEX data
    dexLiquidity: [],
    dexPrices: {},
    bots: [],
    botStates: {},
    botConfigs: {},
    cexCurrencyPairs: [],
    dexCurrencyPairs: [],
    loading: {
      cexLiquidity: false,
      dexLiquidity: false,
      cexPrices: false,
      dexPrices: false,
      allPrices: false,
      bots: false,
      botState: false,
      botConfig: false,
      currencyPairs: false
    },

    // Connection monitoring
    connectionCheckInterval: null
  }),

  actions: {
    // HTTP fetching functions
    async fetchCexLiquidity(botId: string): Promise<void> {
      this.loading.cexLiquidity = true
      try {
        const response = await axiosInstance.get<LiquidityResponse>(`/bots/${botId}/liquidities/cex`)
        this.cexLiquidity = response.data.liquidity
      } catch (error) {
        console.error('Error fetching CEX liquidity:', error)
      } finally {
        this.loading.cexLiquidity = false
      }
    },

    async fetchDexLiquidity(botId: string): Promise<void> {
      this.loading.dexLiquidity = true
      try {
        const response = await axiosInstance.get<LiquidityResponse>(`/bots/${botId}/liquidities/dex`)
        this.dexLiquidity = response.data.liquidity
      } catch (error) {
        console.error('Error fetching DEX liquidity:', error)
      } finally {
        this.loading.dexLiquidity = false
      }
    },

    async fetchCexPrices(botId: string): Promise<void> {
      this.loading.cexPrices = true
      try {
        const response = await axiosInstance.get<PriceData>(`/bots/${botId}/prices/cex`)
        this.cexPrices = response.data || {}
        // Also update the single cexPrice for SEI-USDT
        if (response.data && response.data['SEI-USDT']) {
          this.cexPrice = response.data['SEI-USDT']
        }
      } catch (error) {
        console.error('Error fetching CEX prices:', error)
      } finally {
        this.loading.cexPrices = false
      }
    },

    async fetchDexPrices(botId: string): Promise<void> {
      this.loading.dexPrices = true
      try {
        const response = await axiosInstance.get<PriceData>(`/bots/${botId}/prices/dex`)
        this.dexPrices = response.data || {}
      } catch (error) {
        console.error('Error fetching DEX prices:', error)
      } finally {
        this.loading.dexPrices = false
      }
    },

    async fetchAllPrices(botId: string): Promise<void> {
      this.loading.allPrices = true
      try {
        const response = await axiosInstance.get<AllPricesResponse>(`/bots/${botId}/prices`)
        this.cexPrices = response.data.cex || {}
        this.dexPrices = { ...this.dexPrices, ...(response.data.dex || {}) }
        // Update single cexPrice for SEI-USDT
        if (response.data.cex && response.data.cex['SEI-USDT']) {
          this.cexPrice = response.data.cex['SEI-USDT']
        }
      } catch (error) {
        console.error('Error fetching all prices:', error)
      } finally {
        this.loading.allPrices = false
      }
    },
    // BOT RELATED HTTP-FUNCTIONS
    async fetchBots(): Promise<void> {
      this.loading.bots = true
      try {
        const response = await axiosInstance.get<string[]>(`/bots`)
        console.log('response:', response);
        this.bots = response.data
        // Initialize log listeners after fetching bots
        const logStore = useLogStore();
        logStore.initializeListeners(this.bots);
      } catch (error) {
        console.error('Error fetching bots:', error)
      } finally {
        this.loading.bots = false
      }
    },

    async fetchBotState(botId: string): Promise<void> {
      this.loading.botState = true
      try {
        const response = await axiosInstance.get<BotState>(`/bots/${botId}/state`)
        this.botStates[botId] = response.data
      } catch (error) {
        console.error(`Error fetching state for bot ${botId}:`, error)
      } finally {
        this.loading.botState = false
      }
    },

    async fetchBotConfig(botId: string): Promise<void> {
      this.loading.botConfig = true
      try {
        const response = await axiosInstance.get<BotConfig>(`/bots/${botId}/config`)
        this.botConfigs[botId] = response.data
      } catch (error) {
        console.error(`Error fetching config for bot ${botId}:`, error)
      } finally {
        this.loading.botConfig = false
      }
    },

    async pauseBot(botId: string): Promise<void> {
      try {
        await axiosInstance.post(`/bots/${botId}/pause`)
      } catch (error) {
        console.error(`Error pausing bot ${botId}:`, error)
      }
    },

    async resumeBot(botId: string): Promise<void> {
      try {
        await axiosInstance.post(`/bots/${botId}/resume`)
      } catch (error) {
        console.error(`Error resuming bot ${botId}:`, error)
      }
    },

    async fetchCurrencyPairs(botId: string): Promise<void> {
      this.loading.currencyPairs = true;
      try {
        const response = await axiosInstance.get(`/bots/${botId}/currencyPairs`);
        console.log('Fetched Currency Pairs:', response.data); // <-- DEBUGGING
        this.cexCurrencyPairs = response.data.cex || [];
        this.dexCurrencyPairs = response.data.dex || [];
      } catch (error) {
        console.error(`Error fetching currency pairs for bot ${botId}:`, error);
      } finally {
        this.loading.currencyPairs = false;
      }
    },

    async manualTrade(botId: string, tradeArgs: ManualTradeArg): Promise<any> {
      try {
        const response = await axiosInstance.post(`/bots/${botId}/manualTrade`, tradeArgs);
        return response.data;
      } catch (error) {
        console.error('Error executing manual trade:', error);
        throw error; // Re-throw to be caught in the component
      }
    },

    // Initialize with HTTP data fetch
    async initializeData(): Promise<void> {
      console.log('Initializing data...');
      await this.fetchBots();

      if (this.bots.length === 0) {
        console.warn('No bots found. Aborting data fetch.');
        return;
      }

      const firstBotId = this.bots[0];
      console.log(`Fetching data for bot: ${firstBotId}`); // <-- DEBUGGING

      const botDataPromises = this.bots.flatMap(botId => [
        this.fetchBotState(botId),
        this.fetchBotConfig(botId)
      ]);

      await Promise.all([
        this.fetchCexLiquidity(firstBotId),
        this.fetchDexLiquidity(firstBotId),
        this.fetchCexPrices(firstBotId),
        this.fetchDexPrices(firstBotId),
        this.fetchCurrencyPairs(firstBotId),
        ...botDataPromises
      ]);
    },
    // Check connection status and reconnect if needed
    checkConnection(): void {
      if (!this.socket) {
        console.log('Socket not initialized')
        return
      }

      const isActuallyConnected = this.socket.connected

      if (!isActuallyConnected && this.isConnected) {
        console.log('Socket connection lost, updating state')
        this.isConnected = false
      }
      if (isActuallyConnected) {
        this.isConnected = true
      }

      if (!isActuallyConnected) {
        console.log('Attempting to reconnect socket...')
        this.socket.connect()
      }
    },

    // Start periodic connection monitoring
    startConnectionMonitoring(): void {
      // Clear existing interval if any
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval)
      }

      // Check connection every 5 seconds
      this.connectionCheckInterval = setInterval(() => {
        this.checkConnection()
      }, 5000)

      console.log('Connection monitoring started (checking every 5 seconds)')
    },

    // Stop connection monitoring
    stopConnectionMonitoring(): void {
      if (this.connectionCheckInterval) {
        clearInterval(this.connectionCheckInterval)
        this.connectionCheckInterval = null
        console.log('Connection monitoring stopped')
      }
    },

    // WebSocket connection management
    initializeWebSocket(): void {
      this.socket = socket

      this.socket.on('connect', () => {
        this.isConnected = true
        console.log("WebSocket connected!")
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
        console.log("WebSocket disconnected!")
      })

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts!`);
        this.isConnected = true; // Ensure state is true on reconnect
      });

      this.socket.on('connect_error', (error) => {
        console.error("WebSocket connection error:", error.message);
        this.isConnected = false; // Ensure state is false on error
      });

      // Update liquidity data when received via socket
      this.socket.on('cexLiquidityUpdate', (data: Liquidity[]) => {
        this.cexLiquidity = data
      })

      this.socket.on('dexLiquidityUpdate', (data: Liquidity[]) => {
        this.dexLiquidity = data
      })

      // Update price data when received via socket
      this.socket.on('cex-SEI-USDT-price', (price: number) => {
        this.cexPrice = price
        this.cexPrices['SEI-USDT'] = price
      })

      this.socket.on('price-update', (data: PriceUpdateData) => {
        console.log(data)
        if (data.currencyPair && data.exchange === 'seichain') {
          this.dexPrices[data.currencyPair] = data.price
        }
      })
      // BOT RELATED SOCKET EVENTS
      this.socket.on('botState', (data: { botId: string; state: BotState }) => {
        console.log(data);

        if (data.botId && data.state) {
          this.botStates[data.botId] = data.state;
        }
      });
      // Start connection monitoring after WebSocket is initialized
      this.startConnectionMonitoring()
    },

    // Combined initialization
    async initialize(): Promise<void> {
      // First fetch initial data via HTTP
      await this.initializeData()
      // Then setup WebSocket for real-time updates
      this.initializeWebSocket()
    },

    // Cleanup method (call this when component is unmounted or store is destroyed)
    cleanup(): void {
      this.stopConnectionMonitoring()
      if (this.socket) {
        this.socket.disconnect()
      }
    }
  }
})
