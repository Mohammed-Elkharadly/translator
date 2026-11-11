import * as pdfjs from "pdfjs-dist";
import type {
  PdfDocument,
  PdfPage,
  PdfParagraph,
} from "../types";

// Now textItems is TextItem[] and has str, transform, width, height   

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PositionedTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL?: boolean;
}

interface TextLine {
  y: number;
  height: number;
  items: PositionedTextItem[];
  text: string;
}


function isPositionedTextItem(value: unknown): value is PositionedTextItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.str === "string" &&
    Array.isArray(item.transform) &&
    typeof item.width === "number" &&
    typeof item.height === "number"
  );
}

function xOf(item: PositionedTextItem): number {
  return item.transform[4] ?? 0;
}

function yOf(item: PositionedTextItem): number {
  return item.transform[5] ?? 0;
}

function buildLines(items: PositionedTextItem[]): TextLine[] {
  const sorted = [...items].sort((a, b) => {
    const yDifference = yOf(b) - yOf(a);
    return Math.abs(yDifference) > 2 ? yDifference : xOf(a) - xOf(b);
  });

  const lines: TextLine[] = [];

  for (const item of sorted) {
    const y = yOf(item);
    const height = Math.max(item.height, 1);
    let target = lines.find((line) => {
      const tolerance = Math.max(2, Math.min(height, line.height) * 0.35);
      return Math.abs(line.y - y) <= tolerance;
    });

    if (!target) {
      target = { y, height, items: [], text: "" };
      lines.push(target);
    }
    target.items.push(item);
  }

  for (const line of lines) {
    line.items.sort((a, b) => xOf(a) - xOf(b));
    let text = "";
    let previous: PositionedTextItem | undefined;

    for (const item of line.items) {
      if (!item.str) continue;

      if (previous) {
        const gap = xOf(item) - (xOf(previous) + previous.width);
        const threshold = Math.max(previous.height, item.height, 1) * 0.18;
        if (gap > threshold && !text.endsWith(" ") && !item.str.startsWith(" ")) {
          text += " ";
        }
      }

      text += item.str;
      previous = item;
    }

    line.text = text.replace(/\s+/g, " ").trim();
  }

  return lines
    .filter((line) => line.text.length > 0)
    .sort((a, b) => b.y - a.y);
}

function buildParagraphs(
  lines: TextLine[],
  pageNumber: number,
): PdfParagraph[] {
  const paragraphs: PdfParagraph[] = [];
  let current = "";
  let previous: TextLine | undefined;

  const flush = () => {
    const original = current.replace(/\s+/g, " ").trim();
    if (original) {
      paragraphs.push({
        id: `page-${pageNumber}-paragraph-${paragraphs.length + 1}`,
        original,
      });
    }
    current = "";
  };

  for (const line of lines) {
    if (previous) {
      const gap = previous.y - line.y;
      const typicalHeight = Math.max(previous.height, line.height, 1);
      const paragraphBreak = gap > typicalHeight * 1.55;

      if (paragraphBreak) flush();
      else if (current) current += " ";
    }

    current += line.text;
    previous = line;
  }

  flush();
  return paragraphs;
}

export async function extractPdf(file: File): Promise<PdfDocument> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Please select a PDF file.");
  }
  if (file.size === 0) throw new Error("The selected PDF is empty.");

  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  }).promise;

  try {
    const pages: PdfPage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items.filter(isPositionedTextItem);
      const lines = buildLines(items);

      pages.push({
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        paragraphs: buildParagraphs(lines, pageNumber),
      });

      page.cleanup();
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      pageCount: pdf.numPages,
      pages,
    };
  } finally {
    await pdf.loadingTask.destroy();
  }
}
