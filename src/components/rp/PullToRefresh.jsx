import { useRef, useState } from "react";
import { Icon } from "./Icon";

const THRESHOLD = 70;
const MAX_PULL = 110;

// Swipe-down-to-refresh gesture wrapper (native Android feel).
// Only engages when the page is scrolled to the top.
export function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);

  const onTouchStart = (e) => {
    if (refreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (startY.current == null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0 || window.scrollY > 0) {
      startY.current = null;
      setPull(0);
      setDragging(false);
      return;
    }
    setPull(Math.min(delta * 0.45, MAX_PULL));
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    setDragging(false);
    if (pull >= THRESHOLD && onRefresh) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      className="relative"
    >
      {(pull > 0 || refreshing) && (
        <div
          className="pointer-events-none absolute left-1/2 z-30"
          style={{ top: pull - 44, transform: "translateX(-50%)" }}
        >
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-elevated ${refreshing ? "animate-spin" : ""}`}
            style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }}
          >
            <Icon name="sync" size={20} className="text-primary-deep" />
          </span>
        </div>
      )}
      <div style={{ transform: `translateY(${pull}px)`, transition: dragging ? "none" : "transform 0.2s ease" }}>
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;