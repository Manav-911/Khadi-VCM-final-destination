import { createContext, useContext, useState } from "react";

const MeetingContext = createContext();

export function MeetingProvider({ children }) {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const triggerRefresh = () => setRefreshFlag(prev => !prev);

  return (
    <MeetingContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeetingContext() {
  return useContext(MeetingContext);
}
