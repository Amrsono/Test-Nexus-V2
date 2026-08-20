import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const socketUrl = isLocal ? 'http://localhost:5000' : window.location.origin;

export const useSocket = () => {
  const [agentLogs, setAgentLogs] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('agent:status', (data) => {
      setAgentLogs(prev => {
        const next = [...prev.slice(-4), data.message];
        return next;
      });
    });

    return () => {
      newSocket.off('agent:status');
      newSocket.disconnect();
    };
  }, []);

  const addLog = useCallback((message) => {
    setAgentLogs(prev => [...prev.slice(-4), message]);
  }, []);

  return { socket, agentLogs, addLog, setAgentLogs };
};

export default useSocket;
