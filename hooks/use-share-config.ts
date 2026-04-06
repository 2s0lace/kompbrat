"use client";

export function useShareConfig() {
  async function share(url: string) {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: "KOMPBRAT",
        url,
      });
      return true;
    }

    return false;
  }

  return { share };
}
