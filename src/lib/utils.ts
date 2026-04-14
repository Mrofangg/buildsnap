import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  if (isToday(date)) return `Heute, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Gestern, ${format(date, "HH:mm")}`;
  return format(date, "dd. MMM yyyy", { locale: de });
}

export function formatDateShort(date: Date): string {
  return format(date, "dd.MM.yy");
}

export function formatRelative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: de });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function groupImagesByDate(
  images: { uploadedAt: Date; [key: string]: any }[]
) {
  const groups: Record<string, typeof images> = {};
  for (const img of images) {
    const key = format(img.uploadedAt, "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(img);
  }
  return groups;
}

export async function downloadImages(urls: string[], projectName: string) {
  // For single images, direct download
  if (urls.length === 1) {
    const a = document.createElement("a");
    a.href = urls[0];
    a.download = `${projectName}-photo.jpg`;
    a.target = "_blank";
    a.click();
    return;
  }
  // For multiple, open each in new tab (zip would need server-side)
  for (const url of urls) {
    window.open(url, "_blank");
  }
}
