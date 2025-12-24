import React, { useEffect, useState, useCallback } from 'react';
import { LevelUpCelebration } from './LevelUpCelebration';
import { onLevelUp, LevelUpPayload } from '@/state/gamificationEvents';

export function LevelUpCelebrationHost() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<LevelUpPayload | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onLevelUp(event => {
      setPayload(event);
      setVisible(true);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return <LevelUpCelebration visible={visible} payload={payload} onClose={handleClose} />;
}
