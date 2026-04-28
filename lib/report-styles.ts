export const REPORT_DOCUMENT_CSS = `
.report-document {
  --brand-teal: #19aebb;
  --brand-teal-deep: #178a95;
  --brand-ink: #182028;
  --brand-soft: #eaf7f8;
  --brand-soft-alt: #f6fbfb;
  --brand-line: rgba(25, 174, 187, 0.18);
  font-family: "Outfit", "DM Sans", Arial, sans-serif;
  color: var(--brand-ink);
  background: #f6fbfb;
}
.report-document * {
  box-sizing: border-box;
}
.report-page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto 20px;
  background: #ffffff;
  position: relative;
  padding: 14mm;
  box-shadow: 0 20px 60px rgba(17, 24, 39, 0.08);
  page-break-after: always;
  overflow: hidden;
}
.report-page:last-child {
  page-break-after: auto;
}
.report-band {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 18mm;
  background: var(--brand-soft);
}
.report-cover-grid,
.report-two-column {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 20px;
}
.report-logo {
  width: 220px;
  max-width: 100%;
  object-fit: contain;
}
.report-kicker {
  font-size: 12px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--brand-teal-deep);
  margin-bottom: 18px;
}
.report-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 44px;
  line-height: 1.05;
  margin: 18px 0 10px;
  color: var(--brand-ink);
}
.report-subtitle {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 22px;
  line-height: 1.2;
  color: var(--brand-teal-deep);
  margin: 0 0 20px;
}
.report-positioning {
  font-size: 15px;
  line-height: 1.7;
  max-width: 70ch;
  color: #394150;
}
.report-meta-card,
.report-note-card,
.report-tile,
.report-rec-card,
.report-pathway-card,
.report-action-card,
.report-finding-card {
  border: 1px solid var(--brand-line);
  border-radius: 24px;
  background: #fff;
}
.report-meta-card {
  padding: 24px;
  background: var(--brand-soft-alt);
}
.report-meta-row {
  padding: 12px 0;
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
}
.report-meta-row:last-child {
  border-bottom: none;
}
.report-meta-label {
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-teal-deep);
  margin-bottom: 6px;
}
.report-meta-value {
  font-size: 15px;
  line-height: 1.5;
  color: var(--brand-ink);
}
.report-footer-note {
  position: absolute;
  left: 14mm;
  right: 14mm;
  bottom: 9mm;
  font-size: 11px;
  color: rgba(24, 32, 40, 0.72);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.report-section-label {
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--brand-teal-deep);
  margin-bottom: 12px;
}
.report-section-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 28px;
  line-height: 1.1;
  margin: 0 0 14px;
}
.report-text {
  font-size: 14px;
  line-height: 1.75;
  color: #374151;
  margin: 0;
  white-space: pre-wrap;
}
.report-textarea {
  width: 100%;
  border: 1px dashed rgba(25, 174, 187, 0.32);
  background: #ffffff;
  padding: 12px 14px;
  border-radius: 18px;
  font: inherit;
  color: #374151;
  resize: vertical;
  min-height: 110px;
}
.report-edit-controls {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.report-grid-tiles {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}
.report-tile {
  padding: 14px;
  background: #ffffff;
}
.report-tile-label {
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #6b7280;
}
.report-tile-value {
  margin-top: 10px;
  font-size: 24px;
  font-weight: 600;
  color: var(--brand-ink);
}
.report-tile-subvalue {
  margin-top: 8px;
  font-size: 12px;
  color: var(--brand-teal-deep);
}
.report-progress {
  margin-top: 12px;
  height: 6px;
  border-radius: 999px;
  background: #e3eff0;
  overflow: hidden;
}
.report-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-teal);
}
.report-gauge-wrap {
  display: grid;
  gap: 18px;
  grid-template-columns: 0.8fr 1.2fr;
  align-items: center;
  margin-top: 20px;
}
.report-gauge-card {
  background: #fcffff;
  color: var(--brand-ink);
  border-radius: 28px;
  padding: 24px;
  border: 1px solid var(--brand-line);
}
.report-gauge-meta {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #46525d;
}
.report-confidence {
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-teal-deep);
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}
.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 12px;
}
.report-table th,
.report-table td {
  border-bottom: 1px solid rgba(17, 24, 39, 0.08);
  padding: 10px 10px;
  text-align: left;
  vertical-align: top;
}
.report-table th {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #6b7280;
}
.report-table tbody tr:nth-child(even) td {
  background: #fbfefe;
}
.report-table-prospect {
  border-left: 4px solid var(--brand-teal);
}
.report-table-cell-good {
  background: rgba(22, 163, 74, 0.12) !important;
}
.report-table-cell-warning {
  background: rgba(245, 158, 11, 0.14) !important;
}
.report-table-cell-danger {
  background: rgba(220, 38, 38, 0.12) !important;
}
.report-layout-split {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;
}
.report-radar-card,
.report-gap-card,
.report-callout {
  border-radius: 28px;
  border: 1px solid var(--brand-line);
  background: var(--brand-soft-alt);
  padding: 20px;
}
.report-position-pill {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-teal-deep);
  border: 1px solid var(--brand-line);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 18px;
}
.report-findings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}
.report-finding-card {
  padding: 18px;
  background: #ffffff;
}
.report-finding-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  line-height: 1.2;
  margin: 0 0 12px;
}
.report-metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--brand-soft);
  font-size: 12px;
  color: var(--brand-ink);
}
.report-risk-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.report-risk-low {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}
.report-risk-medium {
  background: rgba(245, 158, 11, 0.16);
  color: #92400e;
}
.report-risk-high,
.report-risk-critical {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}
.report-gap-row {
  display: grid;
  grid-template-columns: 160px 1fr 90px;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}
.report-gap-bars {
  display: grid;
  gap: 6px;
}
.report-gap-bar-track {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: #e5f0f1;
}
.report-gap-bar-prospect,
.report-gap-bar-competitor {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 999px;
}
.report-gap-bar-prospect {
  background: var(--brand-teal);
}
.report-gap-bar-competitor {
  background: #5b7479;
  opacity: 0.9;
}
.report-gap-label {
  font-size: 12px;
  line-height: 1.4;
  color: var(--brand-ink);
}
.report-gap-value {
  font-size: 12px;
  line-height: 1.3;
  color: #6b7280;
  text-align: right;
}
.report-rec-grid {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}
.report-rec-card {
  padding: 18px;
  position: relative;
  overflow: hidden;
}
.report-rec-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: var(--brand-teal);
}
.report-rec-card.programme::before {
  background: #5b7479;
}
.report-rec-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  margin: 0 0 8px;
}
.report-rec-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 10px 0 0;
}
.report-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--brand-soft);
  color: var(--brand-teal-deep);
}
.report-risk-callout {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fbfefe;
  font-size: 13px;
  line-height: 1.65;
  color: #374151;
}
.report-pathway-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 18px;
}
.report-pathway-card {
  padding: 22px;
}
.report-pathway-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 22px;
  margin: 0 0 10px;
}
.report-list {
  margin: 12px 0 0;
  padding-left: 18px;
  font-size: 14px;
  line-height: 1.7;
  color: #374151;
}
.report-callout {
  margin-top: 20px;
  background: var(--brand-soft);
  color: var(--brand-ink);
}
.report-action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 26px;
}
.report-action-card {
  padding: 22px;
  background: #ffffff;
}
.report-action-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 22px;
  margin: 0 0 10px;
}
.report-contact-grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.report-contact-card {
  padding: 16px;
  border-radius: 20px;
  background: var(--brand-soft-alt);
}
.report-contact-label {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--brand-teal-deep);
}
.report-contact-value {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--brand-ink);
}
.report-version {
  position: absolute;
  left: 14mm;
  right: 14mm;
  bottom: 10mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: #6b7280;
}
@media print {
  html, body {
    margin: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .report-page {
    box-shadow: none;
    margin: 0;
  }
}
`;
