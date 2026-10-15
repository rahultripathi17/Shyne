import { useEffect, useState } from 'react';

/** A message that clears itself after a couple of seconds (for FormSheet's notice line). */
export function useNotice(ms = 2400) {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), ms);
    return () => clearTimeout(t);
  }, [notice, ms]);
  return [notice, setNotice] as const;
}
