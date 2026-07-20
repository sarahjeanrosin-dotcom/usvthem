import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { theme } from "@/lib/pdf/theme";
import { SECTION_KEYS, SECTION_LABELS, type SectionKey } from "@/lib/claude/prompts";

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: theme.fontSize.body,
    color: theme.colors.grayText,
    paddingHorizontal: theme.page.marginH,
    paddingVertical: theme.page.marginV,
    backgroundColor: theme.colors.white,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.blue,
    paddingBottom: 10,
    marginBottom: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { height: 18, objectFit: "contain" },
  headerVs: { fontSize: 9, color: theme.colors.blueSoft, marginHorizontal: 6 },
  headerRight: { alignItems: "flex-end" },
  headerMeta: { fontSize: theme.fontSize.small, color: theme.colors.grayText },
  headerDate: { fontSize: theme.fontSize.caption, color: theme.colors.blueSoft, marginTop: 2 },
  // Section
  sectionWrap: { marginBottom: 12 },
  sectionHeader: {
    fontSize: theme.fontSize.sectionHeader,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.navy,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.blueSoft,
    paddingBottom: 3,
    marginBottom: 5,
  },
  // Text
  para: { lineHeight: 1.45, marginBottom: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  subheading: {
    fontFamily: "Helvetica-Bold",
    fontSize: theme.fontSize.subheading,
    color: theme.colors.navy,
    marginTop: 5,
    marginBottom: 3,
  },
  // Bullets
  bullet: { flexDirection: "row", marginBottom: 2.5, paddingLeft: 2 },
  bulletDot: { width: 10, fontSize: theme.fontSize.body, color: theme.colors.blue },
  bulletText: { flex: 1, lineHeight: 1.4 },
  // Table
  tableWrap: { marginTop: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: theme.colors.gray200 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.navy,
    borderRadius: 2,
    marginBottom: 1,
  },
  tableCell: { flex: 1, padding: 4, fontSize: theme.fontSize.small, lineHeight: 1.35 },
  tableCellHeader: {
    flex: 1,
    padding: 4,
    fontSize: theme.fontSize.small,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.white,
  },
  tableRowAlt: { backgroundColor: theme.colors.gray50 },
});

// ─── Inline markdown parser ──────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={i} style={s.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

// ─── Markdown table parser ───────────────────────────────────────────────────

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } {
  const dataLines = lines.filter(
    (l) => l.trim().startsWith("|") && !l.match(/^\|[-: |]+\|$/)
  );
  const parseRow = (l: string) =>
    l
      .split("|")
      .filter((c) => c.trim() !== "")
      .map((c) => c.trim());
  const headers = dataLines[0] ? parseRow(dataLines[0]) : [];
  const rows = dataLines.slice(1).map(parseRow);
  return { headers, rows };
}

// ─── Section content renderer ────────────────────────────────────────────────

function RenderContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let tableLines: string[] = [];
  let inTable = false;
  let tableKey = 0;

  const flushTable = () => {
    if (!tableLines.length) return;
    const { headers, rows } = parseTable(tableLines);
    elements.push(
      <View key={`table-${tableKey++}`} style={s.tableWrap}>
        {headers.length > 0 && (
          <View style={s.tableHeaderRow}>
            {headers.map((h, i) => (
              <Text key={i} style={s.tableCellHeader}>
                {h}
              </Text>
            ))}
          </View>
        )}
        {rows.map((row, ri) => (
          <View
            key={ri}
            style={[s.tableRow, ri % 2 === 1 ? s.tableRowAlt : {}]}
          >
            {row.map((cell, ci) => (
              <Text key={ci} style={s.tableCell}>
                {cell}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
    tableLines = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|")) {
      inTable = true;
      tableLines.push(trimmed);
      return;
    }

    if (inTable) {
      flushTable();
      inTable = false;
    }

    if (!trimmed) {
      elements.push(<View key={idx} style={{ height: 3 }} />);
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <Text key={idx} style={s.subheading}>
          {trimmed.slice(3)}
        </Text>
      );
    } else if (trimmed.startsWith("### ")) {
      elements.push(
        <Text key={idx} style={[s.subheading, { fontSize: theme.fontSize.small }]}>
          {trimmed.slice(4)}
        </Text>
      );
    } else if (trimmed.match(/^[-*]\s/)) {
      elements.push(
        <View key={idx} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{parseInline(trimmed.slice(2))}</Text>
        </View>
      );
    } else if (trimmed.match(/^\d+\.\s/)) {
      const num = trimmed.match(/^(\d+)\.\s/)![1];
      elements.push(
        <View key={idx} style={s.bullet}>
          <Text style={s.bulletDot}>{num}.</Text>
          <Text style={s.bulletText}>{parseInline(trimmed.replace(/^\d+\.\s/, ""))}</Text>
        </View>
      );
    } else {
      elements.push(
        <Text key={idx} style={s.para}>
          {parseInline(trimmed)}
        </Text>
      );
    }
  });

  if (inTable) flushTable();

  return <>{elements}</>;
}

// ─── Document ────────────────────────────────────────────────────────────────

interface BattleCardDocumentProps {
  content: Record<string, string>;
  decisionMaker: string;
  vertical: string;
  productCategory: string;
  generatedAt: string;
  competitors: Array<{ name: string; logoBase64: string | null }>;
  geneaLogoBase64: string | null;
}

export function BattleCardDocument({
  content,
  decisionMaker,
  vertical,
  productCategory,
  generatedAt,
  competitors,
  geneaLogoBase64,
}: BattleCardDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
            {geneaLogoBase64 && (
              <Image src={geneaLogoBase64} style={s.headerLogo} />
            )}
            {competitors.map((c, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={s.headerVs}>vs.</Text>
                {c.logoBase64 ? (
                  <Image src={c.logoBase64} style={s.headerLogo} />
                ) : (
                  <Text style={[s.headerMeta, { fontFamily: "Helvetica-Bold" }]}>
                    {c.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerMeta}>
              {decisionMaker} · {vertical} · {productCategory}
            </Text>
            <Text style={s.headerDate}>{generatedAt}</Text>
          </View>
        </View>

        {/* Sections */}
        {SECTION_KEYS.map((key) => {
          const text = content[key];
          if (!text) return null;
          return (
            <View key={key} style={s.sectionWrap} wrap>
              <Text style={s.sectionHeader}>{SECTION_LABELS[key as SectionKey]}</Text>
              <RenderContent content={text} />
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
