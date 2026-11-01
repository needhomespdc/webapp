import { useState } from 'react';
import { RiArrowLeftLine, RiBuildingLine, RiInformationLine, RiMapPinLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatDate, cn } from '@/lib/utils';
import type { Investment } from '@/types';
import { MODEL_BADGE } from './modelBadge';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const shortDate = (d: string) => formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * One development stage, built from the investment's `milestones`
 * (id, stepNumber, title, subtitle, status, targetDate, isCurrentStage).
 */
interface Stage {
  id: string;
  number: number;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  percent: number | null;
  description: string;
}

const STAGE_STATUS: Record<Stage['status'], { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-green-600 text-white' },
  in_progress: {
    label: 'In Progress',
    cls: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300',
  },
  upcoming: { label: 'Upcoming', cls: 'bg-foreground/10 text-foreground/60' },
};

function toStages(inv: Investment): Stage[] {
  const milestones = inv.milestones ?? [];
  return milestones
    .map((m) => {
      const status: Stage['status'] =
        m.status === 'completed' ? 'completed' : m.status === 'in_progress' ? 'in_progress' : 'upcoming';
      return {
        id: m.id,
        number: m.stepNumber,
        title: m.title,
        status,
        // No progress figure in the response: full when completed, empty when upcoming
        percent: status === 'completed' ? 100 : status === 'upcoming' ? 0 : null,
        description: m.subtitle ?? '',
      };
    })
    .sort((a, b) => a.number - b.number);
}

function StagePill({ status }: { status: Stage['status'] }) {
  const s = STAGE_STATUS[status];
  return <span className={cn('text-sm px-4 py-1 rounded-full shrink-0', s.cls)}>{s.label}</span>;
}

function StageBar({ percent }: { percent: number | null }) {
  if (percent == null) return null;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-4 mt-3">
      <div className="flex-1 h-2.5 rounded-full bg-foreground/10 overflow-hidden">
        <div className="h-full rounded-full bg-green-600" style={{ width: `${p}%` }} />
      </div>
      <span className="text-foreground font-bold text-base w-12 text-right">{Math.round(p)}%</span>
    </div>
  );
}

// ─── Single stage (opened by tapping a stage) ────────────────────────────────

function StageDetail({ stage }: { stage: Stage }) {
  return (
    <div className={cn(CARD, 'p-4')}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-foreground font-bold text-base">Stage {stage.number}</p>
        <StagePill status={stage.status} />
      </div>
      <p className="text-foreground font-bold text-base mt-4">{stage.title}</p>
      <StageBar percent={stage.percent} />
      {stage.description && (
        <p className="text-foreground/50 text-sm leading-relaxed mt-3 whitespace-pre-line">{stage.description}</p>
      )}
    </div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface Props {
  inv: Investment;
  isOpen: boolean;
  onClose: () => void;
}

export function MilestonesSheet({ inv, isOpen, onClose }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [openStageId, setOpenStageId] = useState<string | null>(null);
  const stages = toStages(inv);
  const openStage = stages.find((s) => s.id === openStageId) ?? null;

  const close = () => {
    setOpenStageId(null);
    onClose();
  };

  const stats = [
    {
      label: 'Project Progress',
      value: inv.progressLabel || '—',
    },
    {
      label: 'Exp. Completion',
      value: inv.projectEndDate ? shortDate(inv.projectEndDate) : '—',
    },
    { label: 'Investment Date', value: shortDate(inv.startedAt) },
  ];

  const body = (
    <>
      {/* Header: centred title, back from a single stage; the modal's own close button sits top-right */}
      <div className="relative px-12 py-5 shrink-0">
        {openStage && (
          <button
            onClick={() => setOpenStageId(null)}
            aria-label="Back to all stages"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
        )}
        <DialogTitle className="text-center text-base font-bold">Development Milestones</DialogTitle>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {openStage ? (
          <StageDetail stage={openStage} />
        ) : (
          <>
            {/* Investment summary */}
            <div className={cn(CARD, 'p-4')}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                  {inv.propertyImageUrl ? (
                    <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                      <RiBuildingLine className="text-accent h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-bold text-xl leading-tight truncate">{inv.title}</p>
                  <span
                    className={cn(
                      'inline-block mt-1.5 text-xs font-medium px-4 py-1 rounded-full',
                      MODEL_BADGE[inv.type] ?? 'bg-foreground/10 text-foreground/70',
                    )}
                  >
                    {inv.typeLabel}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
                    <RiMapPinLine className="h-4 w-4 shrink-0" />
                    <span className="truncate">{inv.location}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl py-2.5">
                {stats.map(({ label, value }) => (
                  <div key={label} className="px-3 min-w-0">
                    <p className="text-foreground/50 text-xs truncate">{label}</p>
                    <p className="text-foreground font-bold text-sm mt-1 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div className="bg-blue-100 dark:bg-blue-500/15 rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <RiInformationLine className="h-5 w-5 text-blue-900 dark:text-blue-300 shrink-0" />
                <p className="text-blue-900 dark:text-blue-300 font-bold text-sm">About Milestone</p>
              </div>
              <p className="text-foreground/50 text-xs leading-relaxed mt-3">
                Track the progress of the project through key development milestones.
              </p>
            </div>

            {/* Stages */}
            <div className={cn(CARD, 'px-4')}>
              {stages.length === 0 ? (
                <p className="text-foreground/50 text-sm text-center py-8">No development stages yet</p>
              ) : (
                stages.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setOpenStageId(stage.id)}
                    className="block w-full text-left py-4 border-b border-foreground/10 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-foreground font-bold text-sm">Stage {stage.number}</p>
                      <StagePill status={stage.status} />
                    </div>
                    <p className="text-foreground font-bold text-sm mt-3">{stage.title}</p>
                    <StageBar percent={stage.percent} />
                  </button>
                ))
              )}
            </div>

            {/* Last updated */}
            <div className="bg-foreground/[0.07] rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <RiInformationLine className="h-5 w-5 text-foreground shrink-0" />
                <p className="text-foreground font-bold text-sm">
                  Last Updated
                  {inv.updatedAt ? `: ${shortDate(inv.updatedAt)}` : ''}
                </p>
              </div>
              <p className="text-foreground/50 text-xs leading-relaxed mt-3">
                We update milestone progress regularly. Check back for the latest project status
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl"
        >
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] max-h-[90vh] rounded-3xl">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
}
