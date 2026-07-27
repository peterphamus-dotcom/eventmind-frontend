import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_ORIGIN, SOCKET_PATH } from './api';

// One socket for the whole app lifetime (not per-component) — components
// join/leave conversation rooms as they mount/unmount, but the underlying
// connection (and its personal user:{id} room membership) persists across
// navigation so a badge elsewhere in the app still updates live.
let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_ORIGIN, {
      path: SOCKET_PATH,
      withCredentials: true,
    });
  }
  return sharedSocket;
}

/** The shared Socket.IO connection. Safe to call from multiple components. */
export function useSocket(): Socket {
  return getSocket();
}

/** Subscribe to a socket event for the lifetime of the calling component. */
export function useSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const socket = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

/** Join a conversation's live room while mounted/while the id is set; leaves on change/unmount. */
export function useConversationRoom(conversationId: string | null) {
  const socket = useSocket();

  useEffect(() => {
    if (!conversationId) return;
    socket.emit('conversation:join', conversationId);
    return () => {
      socket.emit('conversation:leave', conversationId);
    };
  }, [socket, conversationId]);
}
