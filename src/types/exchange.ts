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

export interface BotState {
  [key: string]: any
}

export interface BotConfig {
  [key: string]: any
}

export type ManualTradeArg = {
  side: "buy" | "sell"
  amount: number
  exchange: "cex" | "dex"
  currencyPair: string
};

export interface LoadingState {
  cexLiquidity: boolean
  dexLiquidity: boolean
  cexPrices: boolean
  dexPrices: boolean
  allPrices: boolean
  bots: boolean
  botState: boolean
  botConfig: boolean
  currencyPairs: boolean
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  data: any | null;
  color: string | null;
  type: string | null;
  source: string;
  sessionid: string;
  botid: string | null;
}

export interface ExchangeState {
  socket: any
  isConnected: boolean
  cexLiquidity: Liquidity[]
  cexPrice: number | null
  cexPrices: PriceData
  dexLiquidity: Liquidity[]
  dexPrices: PriceData
  bots: string[]
  botStates: { [botId: string]: BotState }
  botConfigs: { [botId: string]: BotConfig }
  loading: LoadingState
  connectionCheckInterval: NodeJS.Timeout | null
}
