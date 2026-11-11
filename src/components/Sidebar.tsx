import type { PdfDocument } from "../types";

interface Props {
  document: PdfDocument | null;
  activePage: number;
  onSelectPage: (page: number) => void;
  onOpenFile: () => void;
}

export default function Sidebar({
  document,
  activePage,
  onSelectPage,
  onOpenFile,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">L</div>
        <div>
          <strong>LingoPDF</strong>
          <span>Read beyond language</span>
        </div>
      </div>

      <button className="button button-primary upload-button" onClick={onOpenFile}>
        <span>＋</span> Open PDF
      </button>

      <div className="sidebar-section">
        <div className="section-label">WORKSPACE</div>
        {document ? (
          <div className="document-card">
            <div className="document-icon">PDF</div>
            <div className="document-info">
              <strong title={document.name}>{document.name}</strong>
              <span>{document.pageCount} pages</span>
            </div>
          </div>
        ) : (
          <div className="empty-sidebar">
            <span className="empty-file-icon">▤</span>
            <span>No document opened</span>
          </div>
        )}
      </div>

      {document && (
        <div className="sidebar-section page-list-section">
          <div className="section-heading">
            <span className="section-label">PAGES</span>
            <span className="page-count">{document.pageCount}</span>
          </div>
          <div className="page-list">
            {document.pages.map((page) => (
              <button
                key={page.pageNumber}
                className={`page-item ${activePage === page.pageNumber ? "active" : ""}`}
                onClick={() => onSelectPage(page.pageNumber)}
              >
                <span className="page-number">{page.pageNumber}</span>
                <span>Page {page.pageNumber}</span>
                <span className="page-paragraph-count">
                  {page.paragraphs.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-footer">
        <span className="local-indicator" />
        Local processing enabled
      </div>
    </aside>
  );
}
