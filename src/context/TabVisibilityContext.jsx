import { createContext, useContext } from 'react';

export const TabVisibilityContext = createContext(true);

export const useIsTabActive = () => useContext(TabVisibilityContext);
