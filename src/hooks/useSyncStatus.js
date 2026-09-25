import { useEffect, useState } from "react";
import { getSyncState, subscribeSync, syncNow } from "@/lib/syncEngine";

export function useSyncStatus() {
  const [state, setState] = useState(() => getSyncState());
  useEffect(() => subscribeSync(setState), []);
  return { ...state, sync: () => syncNow() };
}

export default useSyncStatus;