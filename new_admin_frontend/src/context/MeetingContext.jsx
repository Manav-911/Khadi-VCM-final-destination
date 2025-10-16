import { createContext, useContext, useState } from "react";

// 1️⃣ Create the context
export const MeetingContext = createContext();

// 2️⃣ Provider component
export function MeetingProvider({ children }) {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const triggerRefresh = () => setRefreshFlag(prev => !prev);

  return (
    <MeetingContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </MeetingContext.Provider>
  );
}

// 3️⃣ Custom hook for consuming context
export function useMeetingContext() {
  return useContext(MeetingContext);
}
