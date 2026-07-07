import { CLOSING_HOUR, OPENING_HOUR, SLOT_MINUTES, SLOT_STEP_MINUTES } from "@/lib/config";
import type { CalendarView } from "@/lib/types";

export type TimeOption = {
  value: string;
  label: string;
  minutesFromMidnight: number;
};

export function toDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateParam(dateParam?: string | string[]): string {
  const raw = Array.isArray(dateParam) ? dateParam[0] : dateParam;
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return toDateInputValue();
  return raw;
}

export function parseViewParam(viewParam?: string | string[]): CalendarView {
  const raw = Array.isArray(viewParam) ? viewParam[0] : viewParam;
  return raw === "week" ? "week" : "day";
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function compareDateValues(left: string, right: string): number {
  return left.localeCompare(right);
}

export function startOfWeekMonday(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return toDateInputValue(addDays(date, diffToMonday));
}

export function getCalendarDates(dateValue: string, view: CalendarView): string[] {
  if (view === "day") return [dateValue];
  const monday = startOfWeekMonday(dateValue);
  const start = new Date(`${monday}T12:00:00`);
  return Array.from({ length: 7 }, (_, index) => toDateInputValue(addDays(start, index)));
}

export function getRangeForView(dateValue: string, view: CalendarView): { startsOn: string; endsBefore: string } {
  const dates = getCalendarDates(dateValue, view);
  const startsOn = dates[0];
  const last = dates[dates.length - 1];
  const endsBefore = toDateInputValue(addDays(new Date(`${last}T12:00:00`), 1));
  return { startsOn, endsBefore };
}

export function toTimeLabel(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}


export function parseTimeValue(raw: FormDataEntryValue | string | null): { hour: number; minute: number } | null {
  const value = String(raw ?? "");
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (minute !== 0 && minute !== 30) return null;
  return { hour, minute };
}

export function timeToMinutes(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return Number.NaN;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function isValidTimeOption(time: string, options: TimeOption[]): boolean {
  return options.some((option) => option.value === time);
}

function makeTimeOptions(firstMinutes: number, lastMinutes: number): TimeOption[] {
  const options: TimeOption[] = [];
  for (let value = firstMinutes; value <= lastMinutes; value += SLOT_STEP_MINUTES) {
    const hour = Math.floor(value / 60);
    const minute = value % 60;
    const label = toTimeLabel(hour, minute);
    options.push({ value: label, label, minutesFromMidnight: value });
  }
  return options;
}

export function bookingStartTimes() {
  const slots: { value: string; label: string }[] = [];

  const firstStartHour = 7;
  const lastStartHour = 21;

  for (let hour = firstStartHour; hour <= lastStartHour; hour += 1) {
    slots.push({
      value: `${String(hour).padStart(2, "0")}:00`,
      label: `${String(hour).padStart(2, "0")}:00`
    });

    if (hour < lastStartHour) {
      slots.push({
        value: `${String(hour).padStart(2, "0")}:30`,
        label: `${String(hour).padStart(2, "0")}:30`
      });
    }
  }

  return slots;
}

export function adminStartTimes(): TimeOption[] {
  return makeTimeOptions(OPENING_HOUR * 60, CLOSING_HOUR * 60 - SLOT_STEP_MINUTES);
}

export function adminEndTimes(): TimeOption[] {
  return makeTimeOptions(OPENING_HOUR * 60 + SLOT_STEP_MINUTES, CLOSING_HOUR * 60);
}

export function addMinutesToLocalIso(dateValue: string, time: string, minutesToAdd: number): string {
  const start = new Date(`${dateValue}T${time}:00`);
  start.setMinutes(start.getMinutes() + minutesToAdd);
  return `${toDateInputValue(start)}T${toTimeLabel(start.getHours(), start.getMinutes())}:00`;
}

export function getSlotLocal(dateValue: string, startTimeOrHour: string | number, minute = 0): { startsAt: string; endsAt: string } {
  const startTime = typeof startTimeOrHour === "number" ? toTimeLabel(startTimeOrHour, minute) : startTimeOrHour;
  return {
    startsAt: `${dateValue}T${startTime}:00`,
    endsAt: addMinutesToLocalIso(dateValue, startTime, SLOT_MINUTES)
  };
}

export function slotStarts(): Array<TimeOption & { hour: number; minute: number }> {
  return bookingStartTimes().map((option) => {
    const parsed = parseTimeValue(option.value);
    return { ...option, label: option.label, hour: parsed?.hour ?? 0, minute: parsed?.minute ?? 0 };
  });
}

export function timeOptionsForRange(): TimeOption[] {
  return makeTimeOptions(OPENING_HOUR * 60, CLOSING_HOUR * 60);
}

export function getTimeRangeLocal(dateValue: string, startsTime: string, endsTime: string): { startsAt: string; endsAt: string } {
  return {
    startsAt: `${dateValue}T${startsTime}:00`,
    endsAt: `${dateValue}T${endsTime}:00`
  };
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function formatDateLong(dateValue: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function formatDateShort(dateValue: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(`${dateValue}T12:00:00`));
}

export function overlapsSlot(bookingStartIso: string, bookingEndIso: string, slotStartIso: string, slotEndIso: string): boolean {
  const bookingStart = new Date(bookingStartIso).getTime();
  const bookingEnd = new Date(bookingEndIso).getTime();
  const slotStart = new Date(slotStartIso).getTime();
  const slotEnd = new Date(slotEndIso).getTime();
  return bookingStart < slotEnd && bookingEnd > slotStart;
}

export function createWeeklyDates(startDate: string, untilDate: string): string[] {
  const dates: string[] = [];
  let cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${untilDate}T12:00:00`);

  while (cursor <= end) {
    dates.push(toDateInputValue(cursor));
    cursor = addDays(cursor, 7);
  }

  return dates;
}
