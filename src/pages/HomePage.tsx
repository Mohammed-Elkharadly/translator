import { useCallback, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import Sidebar from "../components/Sidebar";
import ModelStatus from "../components/ModelStatus";
import TranslationPanel from "../components/TranslationPanel";
import { extractPdf } from "../services/pdf.service";
import { useTranslation } from "../hooks/useTranslation";
import type {
  PdfDocument,
  TranslationEntry,
  TranslationScope,
} from "../types";

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<PdfDocument | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationEntry[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const {
    modelState,
    progress,
    isTranslating,
    loadModel,
    translate,
  } = useTranslation();

  const currentPage = useMemo(
    () => document?.pages.find((page) => page.pageNumber === activePage) ?? null,
    [document, activePage],
  );

  const openFile = useCallback(async (file?: File) => {
    if (!file) return;

    setIsOpening(true);
    setDocumentError(null);
    setHistory([]);
    setSelectedText("");
    setSelectedSourceId(null);

    try {
      const result = await extractPdf(file);
      setDocument(result);
      setActivePage(1);
    } catch (cause) {
      setDocumentError(cause instanceof Error ? cause.message : "Could not open PDF.");
    } finally {
      setIsOpening(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleSelection = (
    event: MouseEvent<HTMLParagraphElement>,
    paragraphId: string,
    paragraphText: string,
  ) => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim() ?? "";

    if (
      selected &&
      selection?.anchorNode &&
      event.currentTarget.contains(selection.anchorNode)
    ) {
      setSelectedText(selected);
      setSelectedSourceId(paragraphId);
      return;
    }

    setSelectedText("");
    setSelectedSourceId(null);
    void paragraphText;
  };

  const runTranslation = async (
    text: string,
    sourceId: string,
    scope: TranslationScope,
  ) => {
    if (!text.trim()) return;

    setTranslationError(null);
    try {
      const translation = await translate(text);
      setHistory((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sourceId,
          original: text,
          translation,
          scope,
          createdAt: Date.now(),
        },
      ]);
    } catch (cause) {
      setTranslationError(
        cause instanceof Error ? cause.message : "Translation failed.",
      );
    }
  };

  const translateSelection = () => {
    if (!selectedText || !selectedSourceId) return;
    void runTranslation(selectedText, selectedSourceId, "selection");
  };

  const translateParagraph = (paragraphId: string, text: string) => {
    setSelectedText(text);
    setSelectedSourceId(paragraphId);
    void runTranslation(text, paragraphId, "paragraph");
  };

  return (
    <div className="app-shell">
      <Sidebar
        document={document}
        activePage={activePage}
        onSelectPage={setActivePage}
        onOpenFile={() => inputRef.current?.click()}
      />

      <main className="main-workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{document?.name ?? "New document"}</strong>
          </div>
          <div className="topbar-actions">
            <span className="privacy-label"><span /> Processed on this device</span>
            <button className="button button-outline" onClick={() => inputRef.current?.click()}>
              Open another PDF
            </button>
          </div>
        </header>

        <div className="workspace-content">
          <section className="reader-column">
            <div className="reader-toolbar">
              <div>
                <span className="eyebrow">DOCUMENT READER</span>
                <h1>{document?.name ?? "Your reading space"}</h1>
              </div>
              {document && (
                <div className="page-controls">
                  <button
                    className="icon-button"
                    disabled={activePage <= 1}
                    onClick={() => setActivePage((page) => Math.max(1, page - 1))}
                    aria-label="Previous page"
                  >‹</button>
                  <span>Page <strong>{activePage}</strong> of {document.pageCount}</span>
                  <button
                    className="icon-button"
                    disabled={activePage >= document.pageCount}
                    onClick={() => setActivePage((page) => Math.min(document.pageCount, page + 1))}
                    aria-label="Next page"
                  >›</button>
                </div>
              )}
            </div>

            {!document ? (
              <div className="welcome-card">
                <div className="welcome-icon">文</div>
                <h2>Read. Understand. Translate.</h2>
                <p>Open a PDF to extract its text and translate complete phrases, sentences, or paragraphs.</p>
                <button
                  className="button button-primary"
                  onClick={() => inputRef.current?.click()}
                  disabled={isOpening}
                >
                  {isOpening ? "Opening PDF…" : "Choose a PDF"}
                </button>
                <span className="file-hint">PDF files · Text-based documents</span>
                {documentError && <p className="error-message">{documentError}</p>}
              </div>
            ) : (
              <div className="document-scroll">
                {currentPage && (
                  <article className="document-page">
                    <div className="document-page-header">
                      <span>{document.name}</span>
                      <span>Page {currentPage.pageNumber}</span>
                    </div>

                    {currentPage.paragraphs.length === 0 ? (
                      <div className="no-text">
                        No selectable text found on this page. This may be a scanned PDF.
                      </div>
                    ) : (
                      <div className="paragraph-list">
                        {currentPage.paragraphs.map((paragraph, index) => (
                          <section className="paragraph-block" key={paragraph.id}>
                            <div className="paragraph-meta">
                              <span>PARAGRAPH {index + 1}</span>
                              <button
                                className="paragraph-translate"
                                onClick={() => translateParagraph(paragraph.id, paragraph.original)}
                                disabled={isTranslating}
                              >
                                Translate paragraph
                              </button>
                            </div>
                            <p
                              className={`document-paragraph ${selectedSourceId === paragraph.id ? "paragraph-selected" : ""}`}
                              onMouseUp={(event) => handleSelection(event, paragraph.id, paragraph.original)}
                            >
                              {paragraph.original}
                            </p>
                          </section>
                        ))}
                      </div>
                    )}
                  </article>
                )}
              </div>
            )}

            {documentError && document && (
              <p className="error-message inline-error">{documentError}</p>
            )}
          </section>

          <section className="right-column">
            <ModelStatus
              state={modelState}
              progress={progress}
              onLoad={() => void loadModel().catch(() => undefined)}
            />
            {translationError && <p className="error-message">{translationError}</p>}
            <TranslationPanel
              selectedText={selectedText}
              selectedSourceId={selectedSourceId}
              history={history}
              isTranslating={isTranslating}
              onTranslateSelection={translateSelection}
              onClearSelection={() => {
                setSelectedText("");
                setSelectedSourceId(null);
                window.getSelection()?.removeAllRanges();
              }}
            />
          </section>
        </div>
      </main>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => void openFile(event.target.files?.[0])}
      />
    </div>
  );
}
