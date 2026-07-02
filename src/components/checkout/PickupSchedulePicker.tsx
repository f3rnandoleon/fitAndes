"use client";

import { useState, useMemo, useCallback } from "react";
import type { DeliveryOptionsConfig } from "@/types/checkout";
import {
  getAvailableDatesForPickup,
  getSchedulesForDate,
  getFilteredTimeSlotsForDate,
  formatDateLabel,
  formatDateISO,
} from "@/lib/delivery-options";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PickupSchedulePickerProps {
  config: DeliveryOptionsConfig;

  /** Selected pickup point name */
  pickupPoint: string;
  onPickupPointChange: (value: string) => void;

  /** Selected date as "YYYY-MM-DD" */
  pickupDate: string;
  onPickupDateChange: (value: string) => void;

  /** Selected schedule ID (for the chosen date) */
  pickupScheduleId: string;
  onPickupScheduleIdChange: (value: string) => void;

  /** Selected time slot string, e.g. "14:30" */
  pickupTime: string;
  onPickupTimeChange: (value: string) => void;
}

// ─── Calendar Widget ────────────────────────────────────────────────────────

function CalendarGrid({
  availableDates,
  selectedDate,
  onSelect,
}: {
  availableDates: string[];
  selectedDate: string;
  onSelect: (dateStr: string) => void;
}) {
  const availableSet = useMemo(() => new Set(availableDates), [availableDates]);

  // Determine the month to display based on selected date or first available
  const focusDate = useMemo(() => {
    if (selectedDate) return new Date(selectedDate + "T12:00:00");
    if (availableDates.length > 0) return new Date(availableDates[0] + "T12:00:00");
    return new Date();
  }, [selectedDate, availableDates]);

  const [viewMonth, setViewMonth] = useState(focusDate.getMonth());
  const [viewYear, setViewYear] = useState(focusDate.getFullYear());

  const dayNames = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  // Generate calendar grid for the current view month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{ date: string; day: number; isAvailable: boolean } | null> = [];

    // Empty slots before first day
    for (let i = 0; i < startWeekday; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isAvailable: availableSet.has(dateStr),
      });
    }

    return days;
  }, [viewMonth, viewYear, availableSet]);

  const canGoPrev = useMemo(() => {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const today = new Date();
    return prevYear > today.getFullYear() || (prevYear === today.getFullYear() && prevMonth >= today.getMonth());
  }, [viewMonth, viewYear]);

  const handlePrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [viewMonth, viewYear, canGoPrev]);

  const handleNextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }, [viewMonth, viewYear]);

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden w-82">
      {/* Month navigation */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-gradient-to-b from-[#faf8f5] to-white">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center border border-border rounded-full bg-white text-muted hover:border-foreground hover:bg-surface hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="Mes anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-[13px] font-semibold text-foreground tracking-wide">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 flex items-center justify-center border border-border rounded-full bg-white text-muted hover:border-foreground hover:bg-surface hover:text-foreground transition-all"
          aria-label="Mes siguiente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-[2px] p-2">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-[9px] uppercase tracking-wider text-subtle py-1.5 font-semibold">
            {name}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((cell, idx) => {
          if (!cell) {
            return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
          }

          const isSelected = cell.date === selectedDate;
          const isToday = cell.date === formatDateISO(new Date());

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.isAvailable}
              onClick={() => onSelect(cell.date)}
              className={`
                aspect-square flex items-center justify-center text-[13px] rounded-sm border-0 relative font-medium transition-all duration-200
                ${cell.isAvailable
                  ? "cursor-pointer text-foreground bg-[#f5f2ee] font-semibold hover:bg-surface hover:scale-105 hover:shadow-sm"
                  : "text-subtle opacity-35 cursor-default"
                }
                ${isSelected ? "!bg-foreground !text-background scale-105 shadow-[0_4px_12px_rgba(26,26,26,0.2)]" : ""}
              `}
              aria-label={`${formatDateLabel(cell.date)}${cell.isAvailable ? "" : " - no disponible"}`}
              aria-pressed={isSelected}
            >
              {cell.day}
              {isToday && !isSelected && (
                <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Time Slot Pills ────────────────────────────────────────────────────────

function TimeSlotPills({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: string[];
  selectedSlot: string;
  onSelect: (slot: string) => void;
}) {
  if (slots.length === 0) {
    return (
      <p className="text-xs text-muted italic">
        No hay horarios disponibles para esta fecha.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`
              px-4 py-2 border rounded-full text-[13px] font-medium cursor-pointer transition-all duration-200 letter-spacing-[0.02em]
              ${isSelected
                ? "bg-foreground text-background border-foreground shadow-[0_4px_12px_rgba(26,26,26,0.15)] -translate-y-[1px]"
                : "border-border bg-white text-foreground hover:border-foreground hover:bg-surface hover:-translate-y-[1px] hover:shadow-sm"
              }
            `}
            aria-pressed={isSelected}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { number: 1, label: "Punto" },
    { number: 2, label: "Fecha" },
    { number: 3, label: "Hora" },
  ];

  return (
    <div className="flex items-center justify-center p-2">
      {steps.map((step, idx) => (
        <div key={step.number} className="flex items-center gap-1.5">
          <div
            className={`
              w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-1.5 transition-all duration-300
              ${currentStep > step.number
                ? "border-success text-white bg-success"
                : currentStep === step.number
                  ? "border-foreground text-foreground bg-surface"
                  : "border-border text-subtle bg-white"
              }
            `}
          >
            {currentStep > step.number ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              step.number
            )}
          </div>
          <span className={`text-[10px] uppercase tracking-wider transition-colors duration-300 ${currentStep >= step.number ? "text-foreground" : "text-subtle"}`}>
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <div className={`w-8 sm:w-12 h-[1.5px] mx-1 transition-colors duration-300 ${currentStep > step.number ? "bg-success" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PickupSchedulePicker({
  config,
  pickupPoint,
  onPickupPointChange,
  pickupDate,
  onPickupDateChange,
  pickupScheduleId,
  onPickupScheduleIdChange,
  pickupTime,
  onPickupTimeChange,
}: PickupSchedulePickerProps) {
  const now = useMemo(() => new Date(), []);

  // Derive available dates from config + 12-hour rule
  const availableDates = useMemo(
    () => getAvailableDatesForPickup(config, now),
    [config, now],
  );

  // Derive schedules for the selected date
  const schedulesForDate = useMemo(
    () => (pickupDate ? getSchedulesForDate(pickupDate, config, now) : []),
    [pickupDate, config, now],
  );

  // Derive filtered time slots for the selected schedule + date
  const filteredTimeSlots = useMemo(
    () =>
      pickupDate && pickupScheduleId
        ? getFilteredTimeSlotsForDate(pickupDate, pickupScheduleId, config, now)
        : [],
    [pickupDate, pickupScheduleId, config, now],
  );

  // Determine current step for the indicator
  const currentStep = pickupDate && pickupScheduleId ? 3 : pickupPoint ? 2 : 1;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handlePickupPointChange(value: string) {
    onPickupPointChange(value);
  }

  function handleDateSelect(dateStr: string) {
    onPickupDateChange(dateStr);

    // Auto-select schedule if there's only one for this date
    const schedules = getSchedulesForDate(dateStr, config, now);
    if (schedules.length === 1) {
      onPickupScheduleIdChange(schedules[0].id);
      // Auto-select time if there's only one slot
      const slots = getFilteredTimeSlotsForDate(dateStr, schedules[0].id, config, now);
      if (slots.length === 1) {
        onPickupTimeChange(slots[0]);
      } else if (!slots.includes(pickupTime)) {
        onPickupTimeChange("");
      }
    } else {
      onPickupScheduleIdChange("");
      onPickupTimeChange("");
    }
  }

  function handleScheduleChange(scheduleId: string) {
    onPickupScheduleIdChange(scheduleId);
    // Reset time when schedule changes
    const slots = getFilteredTimeSlotsForDate(pickupDate, scheduleId, config, now);
    if (slots.length === 1) {
      onPickupTimeChange(slots[0]);
    } else if (!slots.includes(pickupTime)) {
      onPickupTimeChange("");
    }
  }

  function handleTimeSelect(time: string) {
    onPickupTimeChange(time);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-md bg-gradient-to-br from-[#b8965a12] to-[#b8965a08] border border-[#b8965a25] text-xs leading-normal text-muted">
        <div className="flex-shrink-0 mt-0.5 text-accent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p>
          Las entregas se programan con un <strong className="text-foreground font-semibold">mínimo de 12 horas de anticipación</strong> para preparar tu pedido.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Pickup Point */}
      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-subtle font-medium">
          <span className="w-4.5 h-4.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold bg-foreground text-background">1</span>
          Punto de encuentro
        </label>
        <div className="relative">
          <select
            id="pickup-point-select"
            value={pickupPoint}
            onChange={(e) => handlePickupPointChange(e.target.value)}
            className="w-full border border-border p-3 pr-10 text-sm bg-white text-foreground rounded-md transition-all outline-none focus:border-foreground focus:ring-3 focus:ring-foreground/5 cursor-pointer appearance-none"
          >
            <option value="">Selecciona un punto...</option>
            {config.pickupPoints.map((point) => (
              <option key={point.id} value={point.name}>
                {point.name}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Step 2: Date Picker — only visible after pickup point is selected */}
      {pickupPoint && (
        <div className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mr-4">
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-subtle font-medium">
              <span className="w-4.5 h-4.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold bg-foreground text-background">2</span>
              Selecciona una fecha
            </label>

            {availableDates.length === 0 ? (
              <p className="text-xs text-muted italic">
                No hay fechas disponibles en los próximos 30 días.
              </p>
            ) : (
              <CalendarGrid
                availableDates={availableDates}
                selectedDate={pickupDate}
                onSelect={handleDateSelect}
              />
            )}
            {/* Show selected date label */}
            {pickupDate && (
              <div className="inline-flex items-center mt-4 gap-2 px-3.5 py-2 bg-surface border border-border rounded-full text-xs font-medium text-foreground w-fit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatDateLabel(pickupDate)}
              </div>
            )}
          </div>
          {/* Step 3: Time Slots — only visible after date + schedule are selected */}
          {pickupDate && pickupScheduleId && (
            <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-subtle font-medium">
                <span className="w-4.5 h-4.5 rounded-full inline-flex items-center justify-center text-[9px] font-bold bg-foreground text-background">3</span>
                Selecciona una hora
              </label>
              <TimeSlotPills
                slots={filteredTimeSlots}
                selectedSlot={pickupTime}
                onSelect={handleTimeSelect}
              />
            </div>
          )}

        </div>
      )}

      {/* Schedule selector — only if multiple schedules exist for the date */}
      {pickupDate && schedulesForDate.length > 1 && (
        <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <label className="text-[10px] uppercase tracking-wider text-subtle font-medium">
            Rango horario
          </label>
          <div className="flex flex-wrap gap-2">
            {schedulesForDate.map((schedule) => (
              <button
                key={schedule.id}
                type="button"
                onClick={() => handleScheduleChange(schedule.id)}
                className={`
                  px-4 py-2 border rounded-full text-xs font-medium cursor-pointer transition-all duration-200 letter-spacing-[0.04em]
                  ${pickupScheduleId === schedule.id
                    ? "bg-foreground text-background border-foreground shadow-[0_4px_12px_rgba(26,26,26,0.15)] -translate-y-[1px]"
                    : "border-border bg-white text-foreground hover:border-foreground hover:bg-surface hover:-translate-y-[1px]"
                  }
                `}
                aria-pressed={pickupScheduleId === schedule.id}
              >
                {schedule.start} - {schedule.end}
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Summary badge when all selections are made */}
      {pickupPoint && pickupDate && pickupScheduleId && pickupTime && (
        <div className="flex items-start gap-3 p-3.5 rounded-md bg-gradient-to-br from-[#4f7a5710] to-[#4f7a5708] border border-[#4f7a5730] text-success animate-in fade-in slide-in-from-bottom-2 duration-300">
          <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5">Entrega programada</p>
            <p className="text-xs text-foreground font-medium leading-relaxed">
              {pickupPoint} — {formatDateLabel(pickupDate)} a las {pickupTime}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
