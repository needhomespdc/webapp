import { useState } from 'react';
import {
  RiNotification3Line,
  RiCheckDoubleLine,
  RiShieldLine,
  RiWalletLine,
  RiHome4Line,
  RiInformationLine,
} from 'react-icons/ri';
import { useNotificationsList, useNotifications } from '@/hooks/useNotifications';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case 'security_alert':
      return { icon: RiShieldLine, bg: 'bg-blue-500/15', color: 'text-blue-400' };
    case 'wallet':
    case 'deposit':
    case 'withdrawal':
      return { icon: RiWalletLine, bg: 'bg-green-500/15', color: 'text-green-400' };
    case 'investment':
    case 'property':
      return { icon: RiHome4Line, bg: 'bg-accent/15', color: 'text-accent' };
    default:
      return { icon: RiInformationLine, bg: 'bg-foreground/10', color: 'text-foreground/50' };
  }
}

function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dayLabel: string;
  if (date.toDateString() === today.toDateString()) {
    dayLabel = 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    dayLabel = 'Yesterday';
  } else {
    dayLabel = formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const time = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  return `${dayLabel} · ${time}`;
}

function NotificationDialog({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  if (!notification) return null;
  const { icon: Icon, bg, color } = getNotificationIcon(notification.type);

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4 pr-12">
          <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center shrink-0', bg, color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">{notification.title}</p>
            <p className="text-foreground/40 text-xs mt-0.5">{formatNotificationTime(notification.createdAt)}</p>
          </div>
        </div>
        <div className="mx-4 mb-5 bg-foreground/5 rounded-2xl px-4 py-4">
          <p className="text-foreground/80 text-sm leading-relaxed">{notification.body}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<Notification | null>(null);
  const { notifications, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useNotificationsList(tab, 20);
  const { markRead, markAllRead } = useNotifications();
  const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });

  const handleClick = (n: Notification) => {
    setSelected(n);
    if (!n.isRead) markRead(n.id);
  };

  const content = isLoading ? (
    <div className="space-y-3 mt-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  ) : !notifications?.length ? (
    <EmptyState
      icon={<RiNotification3Line />}
      title="No notifications"
      description="You're all caught up. New activity will appear here."
    />
  ) : (
    <div className="space-y-2 mt-4">
      {notifications.map((n) => {
        const { icon: Icon, bg, color } = getNotificationIcon(n.type);
        return (
          <button
            key={n.id}
            onClick={() => handleClick(n)}
            className={cn(
              'w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all',
              n.isRead
                ? 'bg-foreground/5 border-foreground/10'
                : 'bg-accent/5 border-accent/20'
            )}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', n.isRead ? 'bg-foreground/10 text-foreground/40' : bg)}>
              <Icon className={cn('h-4 w-4', n.isRead ? 'text-foreground/40' : color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-semibold', n.isRead ? 'text-foreground/70' : 'text-foreground')}>
                  {n.title}
                </p>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
              </div>
              <p className="text-foreground/50 text-xs mt-0.5 line-clamp-1">{n.body}</p>
              <p className="text-foreground/30 text-xs mt-1.5">{formatDate(n.createdAt)}</p>
            </div>
          </button>
        );
      })}

      <div ref={sentinelRef} className="h-px" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-foreground/50 text-sm mt-1">
            Stay up to date with your account activity.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-accent"
          onClick={() => markAllRead()}
        >
          <RiCheckDoubleLine className="h-4 w-4 mr-1.5" />
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            {content}
          </TabsContent>
        ))}
      </Tabs>

      <NotificationDialog notification={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
