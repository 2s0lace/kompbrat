"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SetValue<T> = T | ((currentValue: T) => T);

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueRef = useRef(initialValue);
  const [value, setValueState] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        setValueState(JSON.parse(raw) as T);
      }
    } catch {
      setValueState(initialValueRef.current);
    } finally {
      setIsReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined" || !isReady) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [isReady, key, value]);

  const setValue = useCallback((nextValue: SetValue<T>) => {
    setValueState((currentValue) =>
      typeof nextValue === "function" ? (nextValue as (currentValue: T) => T)(currentValue) : nextValue,
    );
  }, []);

  const clearValue = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }

    setValueState(initialValueRef.current);
  }, [key]);

  return { value, setValue, clearValue, isReady } as const;
}
