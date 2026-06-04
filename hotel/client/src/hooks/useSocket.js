import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';
import { addNotification } from '../features/ui/uiSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
export const getSocket = () => socket;

export const useSocket = () => {
  const { token, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const ref = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    ref.current = socket;

    socket.on('connect', () => console.log('[socket] connected', socket.id));
    socket.on('notification', (n) => {
      dispatch(addNotification(n));
      toast.info(n.title || n.message || 'New notification');
    });
    socket.on('booking_created', () => toast.info('New booking received'));
    socket.on('booking_status', (p) => toast.info(`Booking status: ${p.status}`));
    socket.on('room_status', (p) => toast.info(`Room status updated: ${p.status}`));

    return () => {
      socket?.disconnect();
      socket = null;
      ref.current = null;
    };
  }, [token, isAuthenticated, dispatch]);

  return ref.current;
};
