import { marked } from "marked";

/**
 * Parse markdown content to HTML
 */
export function parseMarkdown(content: string): string {
  return marked.parse(content) as string;
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production, consider using DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/on\w+='[^']*'/g, "");
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract title from markdown content
 */
export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  // Fallback to first line
  const firstLine = content.split("\n")[0]?.trim();
  return firstLine || "Untitled";
}

/**
 * Count words in markdown content
 */
export function countWords(content: string): number {
  const text = content.replace(/[#*_~`>\[\]()]/g, "");
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Count characters in markdown content
 */
export function countCharacters(content: string): number {
  return content.length;
}
