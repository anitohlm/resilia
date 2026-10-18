/**
 * Resident UI primitives — consistent spacing, type, touch targets (≥48px) and accessible dialogs.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Info, X } from 'lucide-react';
import { EmergencyAlertIcon } from '../../components/icons/ResidentIcons';
import { DeliveryInfo, formatTime } from './residentUtils';
import { t } from './strings';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ---------------- Layout ---------------- */

export const ScreenHeader: React.FC<{ title: string; subtitle?: string; onBack?: () => void }> = ({
  title,
  subtitle,
  onBack,
}) => (
  <div className="flex items-start gap-2 mb-5">
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mt-0.5 w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-rs-text hover:bg-rs-border/60"
        aria-label="Go back"
      >
        <ArrowLeft className="w-6 h-6" aria-hidden />
      </button>
    )}
    <div className="min-w-0 pt-2">
      <h1 className="text-2xl font-bold text-rs-text leading-tight">{title}</h1>
      {subtitle && <p className="text-base text-rs-muted mt-1">{subtitle}</p>}
    </div>
  </div>
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('bg-rs-card border border-rs-border rounded-2xl', className)} {...rest} />
);

export const SectionTitle: React.FC<{ children: React.ReactNode; action?: React.ReactNode; id?: string }> = ({
  children,
  action,
  id,
}) => (
  <div className="flex items-center justify-between gap-3 mb-3 mt-8">
    <h2 id={id} className="text-lg font-semibold text-rs-text">
      {children}
    </h2>
    {action}
  </div>
);

/* ---------------- Buttons ---------------- */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean };

export const PrimaryButton: React.FC<BtnProps> = ({ className, full, ...rest }) => (
  <button
    {...rest}
    className={cx(
      'min-h-[52px] px-6 rounded-xl bg-rs-primary hover:bg-rs-primary-dark text-white text-base font-semibold',
      'inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
      full && 'w-full',
      className
    )}
  />
);

export const SecondaryButton: React.FC<BtnProps> = ({ className, full, ...rest }) => (
  <button
    {...rest}
    className={cx(
      'min-h-[48px] px-5 rounded-xl bg-rs-card border border-rs-border hover:bg-rs-bg text-rs-text text-base font-medium',
      'inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
      full && 'w-full',
      className
    )}
  />
);

export const LinkButton: React.FC<BtnProps> = ({ className, ...rest }) => (
  <button
    {...rest}
    className={cx(
      'min-h-[44px] px-1 text-rs-primary font-semibold text-base inline-flex items-center gap-1 hover:underline',
      className
    )}
  />
);

/* ---------------- Notices ---------------- */

type Tone = 'critical' | 'warning' | 'info' | 'success' | 'neutral';
const toneClasses: Record<Tone, string> = {
  critical: 'bg-rs-critical-bg border-rs-critical/30 text-rs-text',
  warning: 'bg-rs-warning-bg border-rs-warning/30 text-rs-text',
  info: 'bg-rs-info-bg border-rs-info/25 text-rs-text',
  success: 'bg-rs-tint border-rs-primary/25 text-rs-text',
  neutral: 'bg-rs-bg border-rs-border text-rs-text',
};
const toneIcon: Record<Tone, React.ReactNode> = {
  critical: <EmergencyAlertIcon className="w-5 h-5 text-rs-critical shrink-0 mt-0.5" aria-hidden="true" />,
  warning: <EmergencyAlertIcon className="w-5 h-5 text-rs-warning shrink-0 mt-0.5" aria-hidden="true" />,
  info: <Info className="w-5 h-5 text-rs-info shrink-0 mt-0.5" aria-hidden />,
  success: <CheckCircle2 className="w-5 h-5 text-rs-primary shrink-0 mt-0.5" aria-hidden />,
  neutral: <Info className="w-5 h-5 text-rs-muted shrink-0 mt-0.5" aria-hidden />,
};

export const Notice: React.FC<{ tone?: Tone; title?: string; children?: React.ReactNode; role?: string }> = ({
  tone = 'neutral',
  title,
  children,
  role,
}) => (
  <div role={role} className={cx('flex gap-3 p-4 rounded-xl border text-[15px] leading-relaxed', toneClasses[tone])}>
    {toneIcon[tone]}
    <div className="min-w-0">
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cx(title && 'mt-0.5', 'text-rs-text/90')}>{children}</div>}
    </div>
  </div>
);

/** Text + icon label; never colour alone. */
export const StatusPill: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({
  tone,
  children,
  className,
}) => {
  const c: Record<Tone, string> = {
    critical: 'bg-rs-critical-bg text-rs-critical',
    warning: 'bg-rs-warning-bg text-rs-warning',
    info: 'bg-rs-info-bg text-rs-info',
    success: 'bg-rs-tint text-rs-primary-dark',
    neutral: 'bg-rs-bg text-rs-muted',
  };
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 text-center',
        c[tone],
        className
      )}
    >
      {children}
    </span>
  );
};

export const DeliveryStatus: React.FC<{ info: DeliveryInfo }> = ({ info }) => {
  if (info.state === 'DELIVERED') {
    return (
      <StatusPill tone="success">
        <CheckCircle2 className="w-4 h-4" aria-hidden />
        {t.delivery.DELIVERED}
        {info.ackAt ? ` · ${formatTime(info.ackAt)}` : ''}
      </StatusPill>
    );
  }
  if (info.state === 'NO_RECORD') {
    return <StatusPill tone="neutral">{t.delivery.NO_RECORD}</StatusPill>;
  }
  return (
    <StatusPill tone="warning">
      <Clock className="w-4 h-4" aria-hidden />
      {info.state === 'FAILED' ? 'Not delivered yet · will retry' : 'Saved on this device · not delivered yet'}
    </StatusPill>
  );
};

/* ---------------- Form controls ---------------- */

export const Field: React.FC<{
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (id: string, describedBy?: string) => React.ReactNode;
}> = ({ label, hint, error, optional, children }) => {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-semibold text-rs-text">
        {label} {optional && <span className="font-normal text-rs-muted">(optional)</span>}
      </label>
      {hint && (
        <p id={hintId} className="text-sm text-rs-muted">
          {hint}
        </p>
      )}
      {children(id, describedBy)}
      {error && (
        <p id={errId} role="alert" className="text-sm font-medium text-rs-critical">
          {error}
        </p>
      )}
    </div>
  );
};

export const inputClass =
  'w-full min-h-[52px] px-4 rounded-xl border border-rs-border bg-rs-card text-base text-rs-text placeholder:text-rs-muted/80 focus:outline-none focus:ring-2 focus:ring-rs-primary focus:border-rs-primary';

export const Stepper: React.FC<{
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}> = ({ label, value, min = 0, max = 50, onChange }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-base font-semibold text-rs-text" id={`stepper-${label}`}>
      {label}
    </span>
    <div className="flex items-center gap-2" role="group" aria-labelledby={`stepper-${label}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-12 h-12 rounded-xl border border-rs-border bg-rs-card text-2xl font-semibold text-rs-text disabled:opacity-40"
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <output aria-live="polite" className="w-10 text-center text-xl font-bold text-rs-text tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-12 h-12 rounded-xl border border-rs-border bg-rs-card text-2xl font-semibold text-rs-text disabled:opacity-40"
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  </div>
);

export const CheckRow: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}> = ({ checked, onChange, label, hint }) => (
  <label
    className={cx(
      'flex items-start gap-3 p-4 min-h-[56px] rounded-xl border cursor-pointer transition-colors',
      checked ? 'border-rs-primary bg-rs-tint' : 'border-rs-border bg-rs-card hover:bg-rs-bg'
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-6 h-6 accent-[#16856B] shrink-0"
    />
    <span>
      <span className="block text-base font-medium text-rs-text">{label}</span>
      {hint && <span className="block text-sm text-rs-muted mt-0.5">{hint}</span>}
    </span>
  </label>
);

/** Visual single-choice tile used in step-1 pickers (radio semantics). */
export const ChoiceTile: React.FC<{
  selected?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  hint?: string;
  tone?: 'default' | 'critical' | 'warning' | 'info' | 'success';
  badge?: string;
}> = ({ selected, onClick, icon, label, hint, tone = 'default', badge }) => {
  const toneStyles: Record<string, { bg: string; text: string; border: string; hover: string; iconBg: string; iconColor: string }> = {
    critical: {
      bg: 'bg-rose-50/50 hover:bg-rose-50',
      text: 'text-rose-950',
      border: 'border-rose-200 hover:border-rose-400',
      hover: 'shadow-xs hover:shadow-sm',
      iconBg: 'bg-rose-100 text-rose-600 group-hover:scale-105',
      iconColor: 'text-rose-600',
    },
    warning: {
      bg: 'bg-amber-50/50 hover:bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-200 hover:border-amber-400',
      hover: 'shadow-xs hover:shadow-sm',
      iconBg: 'bg-amber-100 text-amber-700 group-hover:scale-105',
      iconColor: 'text-amber-700',
    },
    info: {
      bg: 'bg-sky-50/50 hover:bg-sky-50',
      text: 'text-sky-950',
      border: 'border-sky-200 hover:border-sky-400',
      hover: 'shadow-xs hover:shadow-sm',
      iconBg: 'bg-sky-100 text-sky-700 group-hover:scale-105',
      iconColor: 'text-sky-700',
    },
    success: {
      bg: 'bg-emerald-50/50 hover:bg-emerald-50',
      text: 'text-emerald-950',
      border: 'border-emerald-200 hover:border-emerald-400',
      hover: 'shadow-xs hover:shadow-sm',
      iconBg: 'bg-emerald-100 text-emerald-700 group-hover:scale-105',
      iconColor: 'text-emerald-700',
    },
    default: {
      bg: 'bg-rs-card hover:bg-rs-tint/20',
      text: 'text-rs-text',
      border: 'border-rs-border hover:border-rs-primary/40',
      hover: 'shadow-xs hover:shadow-sm',
      iconBg: 'bg-rs-tint text-rs-primary group-hover:scale-105',
      iconColor: 'text-rs-primary',
    },
  };

  const currentTone = toneStyles[tone] || toneStyles.default;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      onClick={onClick}
      className={cx(
        'w-full text-left group flex items-center justify-between gap-4 p-4 sm:p-5 min-h-[76px] rounded-2xl border transition-all duration-200',
        currentTone.bg,
        selected ? 'border-rs-primary ring-2 ring-rs-primary/30 shadow-sm' : currentTone.border,
        currentTone.hover
      )}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {icon && (
          <span
            className={cx(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200',
              currentTone.iconBg
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cx('block text-base sm:text-lg font-bold tracking-tight', currentTone.text)}>
              {label}
            </span>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white/80 border border-current/20 shadow-2xs">
                {badge}
              </span>
            )}
          </div>
          {hint && <span className="block text-xs sm:text-sm text-rs-muted mt-0.5 leading-snug">{hint}</span>}
        </div>
      </div>
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-rs-muted/60 group-hover:text-rs-primary group-hover:translate-x-0.5 transition-all">
        <ArrowRight className="w-5 h-5" />
      </div>
    </button>
  );
};

/* ---------------- Accessible dialog ---------------- */

export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ open, onClose, title, children, footer }) => {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => !el.hasAttribute('disabled'));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const f = focusables();
        if (f.length === 0) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div
      className="resident-ui fixed inset-0 z-[100] flex items-end sm:items-center justify-center font-inter animate-in fade-in duration-200"
      role="presentation"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-rs-card w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl animate-sheet sm:animate-modal z-10 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3.5 border-b border-rs-border bg-rs-card shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 id={titleId} className="text-lg sm:text-xl font-bold text-rs-text leading-snug">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 -mr-1 -mt-1 rounded-full flex items-center justify-center text-rs-muted hover:text-rs-text hover:bg-rs-bg transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden />
          </button>
        </div>
        <div className="p-5 overflow-y-auto overscroll-contain text-base text-rs-text space-y-4 flex-1">
          {children}
        </div>
        {footer && (
          <div className="p-4 sm:p-5 pt-3 border-t border-rs-border bg-rs-card/95 backdrop-blur-xs shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (
    mounted &&
    typeof document !== 'undefined' &&
    document.body &&
    typeof (document.body as any).appendChild === 'function' &&
    (document.body as any).nodeType === 1
  ) {
    return createPortal(content, document.body);
  }
  return content;
};

export const Spinner: React.FC<{ label: string }> = ({ label }) => (
  <div role="status" className="flex items-center gap-3 text-rs-muted text-base">
    <span className="w-5 h-5 border-2 border-rs-primary border-t-transparent rounded-full animate-spin" aria-hidden />
    {label}
  </div>
);
