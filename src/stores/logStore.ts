import { defineStore } from 'pinia';
import { socket } from '../socket.js';
import type { LogEntry } from '../types/exchange';

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: {} as Record<string, LogEntry[]>,
    maxLogsPerBot: 500,
  }),

  actions: {
    initializeListeners(botIds: string[]) {
      console.log(`Initializing log listeners for bots:`, botIds);
      botIds.forEach(botId => {
        // Ensure log array exists for each bot
        if (!this.logs[botId]) {
          this.logs[botId] = [];
        }

        // Remove any existing listener to prevent duplicates
        socket.off(`log/${botId}`);

        // Add the new listener
        socket.on(`log/${botId}`, (log: LogEntry) => {
          this.addLog(log);
        });
      });
    },

    addLog(log: LogEntry) {
      if (!log.botid) return;

      if (!this.logs[log.botid]) {
        this.logs[log.botid] = [];
      }

      const logArray = this.logs[log.botid];
      if (logArray.length >= this.maxLogsPerBot) {
        logArray.shift();
      }
      logArray.push(log);
    },

    cleanupListeners(botIds: string[]) {
      botIds.forEach(botId => {
        socket.off(`log/${botId}`);
      });
    },
  },
});
