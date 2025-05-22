import { createContext, useContext, type ParentProps } from 'solid-js';
import { getApiBaseUrl } from '~/lib/api-utils';

// Create a context for API-related values
interface ApiContextValue {
  baseUrl: string;
}

const ApiContext = createContext<ApiContextValue>({
  baseUrl: getApiBaseUrl(),
});

/**
 * Provider component that supplies API-related context values to children
 */
export function ApiProvider(props: ParentProps) {
  const value: ApiContextValue = {
    baseUrl: getApiBaseUrl(),
  };
  
  return (
    <ApiContext.Provider value={value}>
      {props.children}
    </ApiContext.Provider>
  );
}

/**
 * Hook to access the API context
 * @returns API context values including baseUrl
 */
export function useApi(): ApiContextValue {
  const context = useContext(ApiContext);
  
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  
  return context;
} 