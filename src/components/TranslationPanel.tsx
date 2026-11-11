import type { TranslationEntry } from "../types";

interface Props {
  selectedText: string;
  selectedSourceId: string | null;
  history: TranslationEntry[];
  isTranslating: boolean;
  onTranslateSelection: () => void;
  onClearSelection: () => void;
}

export default function TranslationPanel({
  selectedText,
  selectedSourceId,
  history,
  isTranslating,
  onTranslateSelection,
  onClearSelection,
}: Props) {
  const latest = selectedSourceId
    ? [...history].reverse().find((entry) => entry.sourceId === selectedSourceId && entry.original === selectedText)
    : undefined;

  return (
    <aside className="translation-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">ENGLISH → ARABIC</span>
          <h2>Translation</h2>
        </div>
        <span className="language-badge">EN / AR</span>
      </div>

      <section className="selection-section">
        <div className="panel-section-heading">
          <span>Selected text</span>
          {selectedText && (
            <button className="text-button" onClick={onClearSelection}>Clear</button>
          )}
        </div>
        <div className={`selected-text ${selectedText ? "" : "placeholder"}`}>
          {selectedText || "Select a phrase or sentence in the document, or translate a full paragraph."}
        </div>
        <button
          className="button button-primary translate-button"
          onClick={onTranslateSelection}
          disabled={!selectedText.trim() || isTranslating}
        >
          {isTranslating ? <><span className="spinner" /> Translating…</> : "Translate selection"}
        </button>
      </section>

      <section className="result-section">
        <div className="panel-section-heading">
          <span>Arabic translation</span>
          {latest && <span className="result-tag">Latest result</span>}
        </div>
        <div className="translation-result" dir="rtl">
          {latest?.translation || (
            <span className="translation-placeholder">
              ستظهر الترجمة هنا
            </span>
          )}
        </div>
        {latest && (
          <div className="source-caption">
            Translated {latest.scope === "paragraph" ? "paragraph" : "selection"}
          </div>
        )}
      </section>

      <section className="history-section">
        <div className="panel-section-heading">
          <span>Recent translations</span>
          <span className="page-count">{history.length}</span>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <p className="history-empty">Your translations will appear here.</p>
          ) : (
            [...history].reverse().slice(0, 8).map((entry) => (
              <article className="history-item" key={entry.id}>
                <p>{entry.original}</p>
                <p dir="rtl">{entry.translation}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
