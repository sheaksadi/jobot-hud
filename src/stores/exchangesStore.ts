import { defineStore } from 'pinia'
import { socket, serverUrl } from '../socket'
import axios from 'axios'

// Types
export interface Liquidity {
  amount: number
  symbol: string
}

export interface LiquidityResponse {
  exchange: string
  liquidity: Liquidity[]
  type: 'cex' | 'dex'
}

export interface PriceData {
  [key: string]: number | null
}

export interface AllPricesResponse {
  cex: PriceData
  dex: PriceData
}

export interface PriceUpdateData {
  currencyPair: string
  exchange: string
  price: number
}

export interface LoadingState {
  cexLiquidity: boolean
  dexLiquidity: boolean
  cexPrices: boolean
  dexPrices: boolean
  allPrices: boolean
}

export interface ExchangeState {
  serverUrl: string
  socket: any
  isConnected: boolean
  cexLiquidity: Liquidity[]
  cexPrice: number | null
  cexPrices: PriceData
  dexLiquidity: Liquidity[]
  dexPrices: PriceData
  loading: LoadingState
}

export const useExchangeStore = defineStore('exchange', {
  state: (): ExchangeState => ({
    // Server configuration
    serverUrl: serverUrl,
    // WebSocket connection
    socket: null,
    isConnected: false,
    // CEX data
    cexLiquidity: [],
    cexPrice: null,
    cexPrices: {},
    // DEX data
    dexLiquidity: [],
    dexPrices: {
      'WSEI-USDC': null,
      'WSEI-USDT': null
    },
    // Loading states
    loading: {
      cexLiquidity: false,
      dexLiquidity: false,
      cexPrices: false,
      dexPrices: false,
      allPrices: false
    }
  }),

  actions: {
    // HTTP fetching functions
    async fetchCexLiquidity(): Promise<void> {
      this.loading.cexLiquidity = true
      try {
        const response = await axios.get<LiquidityResponse>(`${this.serverUrl}/api/v1/liquidities/cex`)
        this.cexLiquidity = response.data.liquidity
      } catch (error) {
        console.error('Error fetching CEX liquidity:', error)
      } finally {
        this.loading.cexLiquidity = false
      }
    },

    async fetchDexLiquidity(): Promise<void> {
      this.loading.dexLiquidity = true
      try {
        const response = await axios.get<LiquidityResponse>(`${this.serverUrl}/api/v1/liquidities/dex`)
        this.dexLiquidity = response.data.liquidity
      } catch (error) {
        console.error('Error fetching DEX liquidity:', error)
      } finally {
        this.loading.dexLiquidity = false
      }
    },

    async fetchCexPrices(): Promise<void> {
      this.loading.cexPrices = true
      try {
        const response = await axios.get<PriceData>(`${this.serverUrl}/api/v1/prices/cex`)
        this.cexPrices = response.data
        // Also update the single cexPrice for SEI-USDT
        if (response.data['SEI-USDT']) {
          this.cexPrice = response.data['SEI-USDT']
        }
      } catch (error) {
        console.error('Error fetching CEX prices:', error)
      } finally {
        this.loading.cexPrices = false
      }
    },

    async fetchDexPrices(): Promise<void> {
      this.loading.dexPrices = true
      try {
        const response = await axios.get<PriceData>(`${this.serverUrl}/api/v1/prices/dex`)
        this.dexPrices = { ...this.dexPrices, ...response.data }
      } catch (error) {
        console.error('Error fetching DEX prices:', error)
      } finally {
        this.loading.dexPrices = false
      }
    },

    async fetchAllPrices(): Promise<void> {
      this.loading.allPrices = true
      try {
        const response = await axios.get<AllPricesResponse>(`${this.serverUrl}/api/v1/prices`)
        this.cexPrices = response.data.cex
        this.dexPrices = { ...this.dexPrices, ...response.data.dex }
        // Update single cexPrice for SEI-USDT
        if (response.data.cex['SEI-USDT']) {
          this.cexPrice = response.data.cex['SEI-USDT']
        }
      } catch (error) {
        console.error('Error fetching all prices:', error)
      } finally {
        this.loading.allPrices = false
      }
    },

    // Initialize with HTTP data fetch
    async initializeData(): Promise<void> {
      await Promise.all([
        this.fetchCexLiquidity(),
        this.fetchDexLiquidity(),
        this.fetchAllPrices()
      ])
    },

    // WebSocket connection management
    initializeWebSocket(): void {
      this.socket = socket

      this.socket.on('connect', () => {
        this.isConnected = true
        console.log("connected")
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
      })

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
    },

    // Combined initialization
    async initialize(): Promise<void> {
      // First fetch initial data via HTTP
      await this.initializeData()
      // Then setup WebSocket for real-time updates
      this.initializeWebSocket()
    },

    // Utility method to update server URL
    setServerUrl(url: string): void {
      this.serverUrl = url
    }
  }
})
