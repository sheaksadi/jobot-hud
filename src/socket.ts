import io from "socket.io-client";

export const serverUrl = "http://deadhorse.net:6900";
const URL = `${serverUrl}/v1`;

export const socket = io(URL, {
    autoConnect: true,
});