import { describe, it, expect } from "vitest";
import {
  parseMarkdown,
  sanitizeHtml,
  extractTitle,
  countWords,
  countCharacters,
  generateId,
} from "../markdown";

describe("parseMarkdown", () => {
  it("should parse headers", () => {
    const markdown = "# Hello World";
    const html = parseMarkdown(markdown);
    expect(html).toContain("<h1");
    expect(html).toContain("Hello World");
  });

  it("should parse bold text", () => {
    const markdown = "**bold text**";
    const html = parseMarkdown(markdown);
    expect(html).toContain("<strong");
    expect(html).toContain("bold text");
  });

  it("should parse italic text", () => {
    const markdown = "*italic text*";
    const html = parseMarkdown(markdown);
    expect(html).toContain("<em");
    expect(html).toContain("italic text");
  });

  it("should parse links", () => {
    const markdown = "[link](https://example.com)";
    const html = parseMarkdown(markdown);
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("link");
  });

  it("should parse code blocks", () => {
    const markdown = "```\ncode block\n```";
    const html = parseMarkdown(markdown);
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain("code block");
  });

  it("should parse lists", () => {
    const markdown = "- item 1\n- item 2\n- item 3";
    const html = parseMarkdown(markdown);
    expect(html).toContain("<ul");
    expect(html).toContain("<li");
    expect(html).toContain("item 1");
    expect(html).toContain("item 2");
    expect(html).toContain("item 3");
  });

  it("should handle empty string", () => {
    const markdown = "";
    const html = parseMarkdown(markdown);
    expect(html).toBe("");
  });
});

describe("sanitizeHtml", () => {
  it("should remove script tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("<script");
    expect(sanitized).toContain("<p>Hello</p>");
  });

  it("should remove iframe tags", () => {
    const html = '<p>Hello</p><iframe src="evil.com"></iframe>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("<iframe");
    expect(sanitized).toContain("<p>Hello</p>");
  });

  it("should remove onclick handlers", () => {
    const html = '<p onclick="alert(1)">Hello</p>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).toContain("<p");
  });

  it("should remove onerror handlers", () => {
    const html = '<img src="x" onerror="alert(1)">';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).not.toContain("onerror");
  });

  it("should keep safe HTML", () => {
    const html = '<p><strong>Hello</strong> <em>World</em></p>';
    const sanitized = sanitizeHtml(html);
    expect(sanitized).toEqual(html);
  });
});

describe("extractTitle", () => {
  it("should extract title from h1 header", () => {
    const content = "# My Title\n\nSome content";
    const title = extractTitle(content);
    expect(title).toBe("My Title");
  });

  it("should return first line if no h1", () => {
    const content = "First line\n## Not a title";
    const title = extractTitle(content);
    expect(title).toBe("First line");
  });

  it("should return Untitled for empty content", () => {
    const content = "";
    const title = extractTitle(content);
    expect(title).toBe("Untitled");
  });

  it("should trim whitespace from title", () => {
    const content = "#   Trimmed Title   \n\nContent";
    const title = extractTitle(content);
    expect(title).toBe("Trimmed Title");
  });
});

describe("countWords", () => {
  it("should count words correctly", () => {
    const content = "Hello world this is a test";
    const count = countWords(content);
    expect(count).toBe(6);
  });

  it("should handle markdown syntax", () => {
    const content = "# Hello\n\n**bold** and *italic*";
    const count = countWords(content);
    expect(count).toBe(4);
  });

  it("should return 0 for empty string", () => {
    const content = "";
    const count = countWords(content);
    expect(count).toBe(0);
  });

  it("should handle multiple spaces", () => {
    const content = "Hello    world";
    const count = countWords(content);
    expect(count).toBe(2);
  });
});

describe("countCharacters", () => {
  it("should count characters correctly", () => {
    const content = "Hello";
    const count = countCharacters(content);
    expect(count).toBe(5);
  });

  it("should return 0 for empty string", () => {
    const content = "";
    const count = countCharacters(content);
    expect(count).toBe(0);
  });

  it("should count all characters including spaces", () => {
    const content = "Hello World";
    const count = countCharacters(content);
    expect(count).toBe(11);
  });
});

describe("generateId", () => {
  it("should generate a unique id", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("should generate a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("should generate a non-empty string", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});
