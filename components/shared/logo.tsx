import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="KOMPBRAT — strona główna" className="inline-flex items-center gap-3">
      <Image src="/logo.svg" alt="KOMPBRAT" width={120} height={32} priority />
    </Link>
  );
}
