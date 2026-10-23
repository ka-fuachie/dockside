import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function formatSmartDate(isoString: string, maxRelativeDays = 7) {
  const date = dayjs(isoString);
  if (!date.isValid()) return "Invalid Date";

  const diffInDays = Math.abs(date.diff(dayjs(), "day"));

  if (diffInDays <= maxRelativeDays) {
    return date.fromNow();
  }

  return date.format("MMMM D, YYYY");
}

export function formatAbsoluteDate(isoString: string) {
  const date = dayjs(isoString);
  if (!date.isValid()) return "Invalid Date";
  return date.format("DD MMMM, YYYY h:mm A");
}
