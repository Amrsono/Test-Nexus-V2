import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

export const useBurndown = (API_BASE, selectedProjectId) => {
  const [burndownData, setBurndownData] = useState([]);
  const [burndownMeta, setBurndownMeta] = useState(null);
  
  const selectedProjectIdRef = useRef(selectedProjectId);
  useEffect(() => {
    selectedProjectIdRef.current = selectedProjectId;
  }, [selectedProjectId]);

  const fetchBurndown = useCallback(async (projectIdOverride) => {
    const id = projectIdOverride || selectedProjectIdRef.current;
    if (!id) return;
    try {
      const res = await axios.get(`${API_BASE}/test-cases/burndown?projectId=${id}`);
      if (id !== selectedProjectIdRef.current) return;
      if (res.data && res.data.data) {
        setBurndownData(res.data.data);
        setBurndownMeta(res.data.meta);
      } else {
        setBurndownData(res.data);
        setBurndownMeta(null);
      }
    } catch (err) {
      console.error('Burndown error', err);
    }
  }, [API_BASE]);

  return {
    burndownData,
    burndownMeta,
    fetchBurndown,
    setBurndownData,
    setBurndownMeta
  };
};

export default useBurndown;
