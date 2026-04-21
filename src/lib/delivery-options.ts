import deliveryOptionsData from "@/data/delivery-options.json";
import type { DeliveryOptionsConfig } from "@/types/checkout";

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
