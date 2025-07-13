import { reactive } from "vue";
import { io } from "socket.io-client";
export const serverUrl = "http://deadhorse.net:6900"

export const state = reactive({
  connected: false,
  fooEvents: [],
  barEvents: []
});

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === "production" ? undefined : `${serverUrl}/v1`;

export const socket = io(URL);

