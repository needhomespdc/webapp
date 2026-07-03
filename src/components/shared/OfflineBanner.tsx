import { useEffect, useRef, useState } from 'react';
import { RiWifiOffLine, RiCheckLine } from 'react-icons/ri';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasPreviouslyOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasPreviouslyOffline.current = true;
      setJustReconnected(false);
      setVisible(true);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    } else if (wasPreviouslyOffline.current) {
      setJustReconnected(true);
      reconnectTimer.current = setTimeout(() => {
        setVisible(false);
        setJustReconnected(false);
        wasPreviouslyOffline.current = false;
      }, 2500);
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [isOnline]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-xl text-sm font-medium transition-all duration-300 ${
        justReconnected
          ? 'bg-green-600 text-white'
          : 'bg-[#0B1F3A] border border-white/10 text-white'
      }`}
    >
      {justReconnected ? (
        <>
          <RiCheckLine className="h-4 w-4 shrink-0" />
          Back online
        </>
      ) : (
        <>
          <RiWifiOffLine className="h-4 w-4 shrink-0" />
          No internet connection
        </>
      )}
    </div>
  );
}
