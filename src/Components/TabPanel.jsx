import React, { memo, useLayoutEffect, useState } from 'react';
import { Box } from '@mui/material';
import { TabVisibilityContext } from '../context/TabVisibilityContext';

/**
 * Keep-alive tab host.
 * - `visible` drives display immediately so the URL/UI switch paints fast.
 * - Context updates for the tab being hidden are deferred one frame so heavy
 *   pages (Log/Summary) don't re-render in the same commit as the switch.
 * - `Component` must be a stable reference; children are not passed from the
 *   parent so memo can actually skip inactive tabs.
 */
const TabPanel = memo(function TabPanel({ visible, Component }) {
  const [ctxVisible, setCtxVisible] = useState(visible);

  useLayoutEffect(() => {
    if (visible) {
      setCtxVisible(true);
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setCtxVisible(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <TabVisibilityContext.Provider value={ctxVisible}>
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
        <Component />
      </Box>
    </TabVisibilityContext.Provider>
  );
}, (prev, next) => prev.visible === next.visible && prev.Component === next.Component);

export default TabPanel;
