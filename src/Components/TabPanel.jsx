import React, { memo } from 'react';
import { Box } from '@mui/material';
import { TabVisibilityContext } from '../context/TabVisibilityContext';

const TabPanel = memo(function TabPanel({ visible, children }) {
  return (
    <TabVisibilityContext.Provider value={visible}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: visible ? 'flex' : 'none',
          flexDirection: 'column',
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
          pointerEvents: visible ? 'auto' : 'none',
        }}
        aria-hidden={!visible}
      >
        {children}
      </Box>
    </TabVisibilityContext.Provider>
  );
}, (prev, next) => prev.visible === next.visible);

export default TabPanel;
