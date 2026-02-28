import { useCallback, useEffect, useState } from "react";

interface UseResizableOptions {
  initialSize: number;
  minSize: number;
  maxSize: number;
  reversed?: boolean;
}

export function useResizable({
  initialSize,
  minSize,
  maxSize,
  reversed = false,
}: UseResizableOptions) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newSize = reversed
        ? document.documentElement.clientWidth - e.clientX
        : e.clientX;

      setSize(Math.max(minSize, Math.min(maxSize, newSize)));
    },
    [isDragging, minSize, maxSize, reversed]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (isDragging) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  return {
    size,
    setSize,
    isDragging,
    handleMouseDown,
  };
}
