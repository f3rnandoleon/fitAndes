import deliveryOptionsData from "@/data/delivery-options.json";
import type { DeliveryOptionsConfig, PickupScheduleOption } from "@/types/checkout";

export const EMPTY_DELIVERY_OPTIONS: DeliveryOptionsConfig = {
  pickupPoints: [],
  pickupSchedules: [],
  shippingCompanies: [],
};

export const deliveryOptionsFallback: DeliveryOptionsConfig = deliveryOptionsData;

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number(part));

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function formatMinutesAsTime(value: number): string {
  const normalized = Math.max(0, value);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getPickupScheduleById(scheduleId: string, config: DeliveryOptionsConfig = deliveryOptionsFallback) {
  return config.pickupSchedules.find((schedule) => schedule.id === scheduleId);
}

export function getPickupScheduleTimeSlots(
  scheduleId: string,
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
  intervalMinutes = 30,
): string[] {
  const schedule = getPickupScheduleById(scheduleId, config);
  if (!schedule) return [];

  const start = parseTimeToMinutes(schedule.start);
  const end = parseTimeToMinutes(schedule.end);
  if (end < start || intervalMinutes <= 0) return [];

  const slots: string[] = [];
  for (let current = start; current <= end; current += intervalMinutes) {
    slots.push(formatMinutesAsTime(current));
  }

  return slots;
}

// ─── 12-Hour Advance Scheduling Logic ───────────────────────────────────────

/**
 * Maps Spanish day names (from pickupSchedules) to JavaScript Date.getDay() indices.
 * Sunday=0, Monday=1, ..., Saturday=6.
 */
const DAY_MAP: Record<string, number> = {
  Domingo: 0,
  Lunes: 1,
  Martes: 2,
  Miercoles: 3,
  Miércoles: 3,
  Jueves: 4,
  Viernes: 5,
  Sabado: 6,
  Sábado: 6,
};

/** Minimum number of hours in advance required to schedule a pickup. */
const MIN_ADVANCE_HOURS = 12;

/**
 * Returns the earliest possible delivery datetime: current time + 12 hours.
 */
export function getMinimumDeliveryDate(now: Date = new Date()): Date {
  return new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
}

/**
 * Formats a Date as "YYYY-MM-DD" string for date comparisons and input[type=date].
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Given a date string "YYYY-MM-DD", returns the pickup schedules that
 * have at least one valid time slot (respecting the 12-hour rule).
 */
export function getSchedulesForDate(
  dateStr: string,
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
  now: Date = new Date(),
): PickupScheduleOption[] {
  const date = new Date(dateStr + "T00:00:00");
  const dayOfWeek = date.getDay();
  const minimumDelivery = getMinimumDeliveryDate(now);

  return config.pickupSchedules.filter((schedule) => {
    // Must match the weekday
    const scheduleDay = DAY_MAP[schedule.day];
    if (scheduleDay === undefined || scheduleDay !== dayOfWeek) return false;

    // Check if at least one time slot passes the 12-hour filter
    const slots = getFilteredTimeSlotsForDate(dateStr, schedule.id, config, now);
    return slots.length > 0;
  });
}

/**
 * Returns time slots for a specific schedule on a specific date,
 * filtered by the 12-hour advance rule.
 *
 * If the selected date is the same day as the minimum delivery date,
 * only time slots starting at or after the minimum delivery time are returned.
 * If the selected date is after the minimum delivery date, all slots are returned.
 */
export function getFilteredTimeSlotsForDate(
  dateStr: string,
  scheduleId: string,
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
  now: Date = new Date(),
  intervalMinutes = 30,
): string[] {
  const allSlots = getPickupScheduleTimeSlots(scheduleId, config, intervalMinutes);
  const minimumDelivery = getMinimumDeliveryDate(now);
  const minimumDateStr = formatDateISO(minimumDelivery);

  // If selected date is after the minimum delivery date, all slots are valid
  if (dateStr > minimumDateStr) {
    return allSlots;
  }

  // If selected date IS the minimum delivery date, filter by time
  if (dateStr === minimumDateStr) {
    const minTimeMinutes = minimumDelivery.getHours() * 60 + minimumDelivery.getMinutes();
    return allSlots.filter((slot) => parseTimeToMinutes(slot) >= minTimeMinutes);
  }

  // If selected date is before the minimum delivery date, no slots available
  return [];
}

/**
 * Generates an array of available pickup dates (as "YYYY-MM-DD" strings)
 * for the next N days, considering:
 * 1. Only days that have matching pickupSchedules
 * 2. Only days where at least one time slot passes the 12-hour filter
 */
export function getAvailableDatesForPickup(
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
  now: Date = new Date(),
  lookAheadDays = 30,
): string[] {
  const minimumDelivery = getMinimumDeliveryDate(now);
  const startDate = new Date(minimumDelivery);
  startDate.setHours(0, 0, 0, 0);

  const availableDates: string[] = [];

  for (let i = 0; i <= lookAheadDays; i++) {
    const candidate = new Date(startDate);
    candidate.setDate(startDate.getDate() + i);
    const candidateStr = formatDateISO(candidate);

    const validSchedules = getSchedulesForDate(candidateStr, config, now);
    if (validSchedules.length > 0) {
      availableDates.push(candidateStr);
    }
  }

  return availableDates;
}

/**
 * Returns a human-readable label for a date string, e.g. "Lunes 3 de Julio".
 */
export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return `${dayNames[date.getDay()]} ${date.getDate()} de ${monthNames[date.getMonth()]}`;
}

// ─── Shipping Helpers (unchanged) ───────────────────────────────────────────

export function getShippingDepartments(config: DeliveryOptionsConfig = deliveryOptionsFallback): string[] {
  return Array.from(
    new Set(
      config.shippingCompanies.flatMap((company) =>
        company.departments.map((department) => department.name),
      ),
    ),
  ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

export function getShippingCompaniesByDepartment(
  department: string,
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
) {
  if (!department) return [];

  return config.shippingCompanies.filter((company) =>
    company.departments.some((item) => item.name === department),
  );
}

export function getShippingBranches(
  department: string,
  shippingCompany: string,
  config: DeliveryOptionsConfig = deliveryOptionsFallback,
): string[] {
  if (!department || !shippingCompany) return [];

  const company = config.shippingCompanies.find((item) => item.name === shippingCompany);
  const departmentInfo = company?.departments.find((item) => item.name === department);
  return departmentInfo?.branches ?? [];
}
