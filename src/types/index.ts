export interface PdfParagraph {
  id: string;
  original: string;
}

export interface PdfPage {
  pageNumber: number;
  width: number;
  height: number;
  paragraphs: PdfParagraph[];
}

export interface PdfDocument {
  id: string;
  name: string;
  pageCount: number;
  pages: PdfPage[];
}

export type TranslationScope = "selection" | "paragraph";

export interface TranslationEntry {
  id: string;
  sourceId: string;
  original: string;
  translation: string;
  scope: TranslationScope;
  createdAt: number;
}

export type ModelState =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export interface ModelProgress {
  status: string;
  progress?: number;
  file?: string;
}
