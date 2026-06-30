import { useState } from 'react';
import { RiNotification3Line, RiCheckDoubleLine } from 'react-icons/ri';
import { useNotificationsList, useNotifications } from '@/hooks/useNotifications';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const { notifications, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useNotificationsList(tab, 20);
  const { markRead, markAllRead } = useNotifications();
  const sentinelRef = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/50 text-sm mt-1">Stay up to date with your account activity.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-accent" onClick={() => markAllRead()}>
          <RiCheckDoubleLine className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-3 mt-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
          ) : !notifications?.length ? (
            <EmptyState
              icon={<RiNotification3Line />}
              title="No notifications"
              description="You're all caught up. New activity will appear here."
            />
          ) : (
            <div className="space-y-2 mt-4">
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all',
                    n.isRead
                      ? 'bg-white/5 border-white/10'
                      : 'bg-accent/5 border-accent/20'
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                    n.isRead ? 'bg-white/10 text-white/40' : 'bg-accent/15 text-accent'
                  )}>
                    <RiNotification3Line className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('text-sm font-semibold', n.isRead ? 'text-white/70' : 'text-white')}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                    </div>
                    <p className="text-white/50 text-sm mt-0.5">{n.body}</p>
                    <p className="text-white/30 text-xs mt-1.5">{formatDate(n.createdAt)}</p>
                  </div>
                </button>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-px" />

              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
