import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const socketUrl = isLocal ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : '');

export const useSocket = () => {
  const [agentLogs, setAgentLogs] = useState([]);
  const [socket] = useState(() => (typeof window !== 'undefined' ? io(socketUrl, { transports: ['websocket', 'polling'] }) : null));

  useEffect(() => {
    if (!socket) return;
    const handleStatus = (data) => {
      setAgentLogs(prev => [...prev.slice(-4), data.message]);
    };
    socket.on('agent:status', handleStatus);
    return () => {
      socket.off('agent:status', handleStatus);
    };
  }, [socket]);

  const addLog = useCallback((message) => {
    setAgentLogs(prev => [...prev.slice(-4), message]);
  }, []);

  return { socket, agentLogs, addLog, setAgentLogs };
};

export default useSocket;


