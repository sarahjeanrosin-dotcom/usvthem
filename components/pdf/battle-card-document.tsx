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
    backgroundColor: theme.colors.white,
  },
  // Header banner
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.page.marginH,
    paddingTop: theme.page.marginV,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { height: 18, objectFit: "contain" },
  headerVs: { fontSize: 9, color: theme.colors.grayText, marginHorizontal: 6 },
  headerRight: { alignItems: "flex-end" },
  headerMeta: { fontSize: theme.fontSize.small, color: theme.colors.grayText },
  headerDate: { fontSize: theme.fontSize.caption, color: theme.colors.blue, marginTop: 2 },
  headerDivider: { flexDirection: "row", height: 4 },
  headerDividerSeg: { flex: 1 },
  body: {
    paddingHorizontal: theme.page.marginH,
    paddingVertical: theme.page.marginV,
  },
  // Section — blue label bar + tinted body (left-column-style narrative sections)
  sectionWrap: { marginBottom: 12 },
  sectionHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.blue,
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  sectionHeaderDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.white,
  },
  sectionHeader: {
    fontSize: theme.fontSize.sectionHeader,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionBody: {
    backgroundColor: theme.colors.blueIce,
    borderRadius: 3,
    padding: 10,
  },
  // Why We Win / Why We Lose style callout row
  calloutRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  calloutBox: {
    backgroundColor: theme.colors.cream,
    borderRadius: 3,
    padding: 10,
  },
  calloutHeader: {
    fontSize: theme.fontSize.sectionHeader,
    fontFamily: "Helvetica-Bold",
    color: theme.colors.navy,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  // Objection handling — repeating two-column Q&A rows
  objectionSectionHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.navy,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  objectionRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  objectionBox: {
    flex: 1,
    backgroundColor: theme.colors.gray100,
    borderRadius: 3,
    padding: 8,
    justifyContent: "center",
  },
  objectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: theme.fontSize.small,
    color: theme.colors.navy,
    marginBottom: 2,
  },
  responseBox: {
    flex: 1,
    backgroundColor: theme.colors.blue,
    borderRadius: 3,
    padding: 8,
  },
  responseLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: theme.fontSize.small,
    color: theme.colors.white,
    marginBottom: 2,
  },
  responseText: { color: theme.colors.white, lineHeight: 1.4 },
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

// ─── Objection/Response pair parser ──────────────────────────────────────────

function parseObjections(content: string): Array<{ objection: string; response: string }> {
  const pairs: Array<{ objection: string; response: string }> = [];
  let current: { objection: string; response: string } | null = null;
  let mode: "objection" | "response" | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const objMatch = line.match(/^\*\*Objection\*\*:?\s*(.*)$/i);
    const respMatch = line.match(/^\*\*Response\*\*:?\s*(.*)$/i);

    if (objMatch) {
      if (current) pairs.push(current);
      current = { objection: objMatch[1], response: "" };
      mode = "objection";
    } else if (respMatch) {
      if (!current) current = { objection: "", response: "" };
      current.response = respMatch[1];
      mode = "response";
    } else if (current && mode) {
      current[mode] += (current[mode] ? " " : "") + line;
    }
  }
  if (current) pairs.push(current);

  return pairs.filter((p) => p.objection || p.response);
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

const DIVIDER_TONES = [
  theme.colors.navy,
  theme.colors.blue,
  theme.colors.blueSoft,
  theme.colors.blueIce,
];

// Narrative sections get a blue label bar + tinted body (left-column style).
const NARRATIVE_SECTION_KEYS: SectionKey[] = [
  "executive_summary",
  "competitive_positioning",
  "key_differentiators",
  "feature_comparison",
  "discovery_questions",
  "talk_track",
  "recent_releases",
  "ideal_customer",
  "sources",
];

// Sidebar-style callouts stacked below the win/lose row.
const SIDEBAR_SECTION_KEYS: SectionKey[] = [
  "suggested_positioning",
  "recommended_messaging",
  "risks",
];

function NarrativeSection({ sectionKey, text }: { sectionKey: SectionKey; text: string }) {
  return (
    <View style={s.sectionWrap} wrap>
      <View style={s.sectionHeaderBar}>
        <View style={s.sectionHeaderDot} />
        <Text style={s.sectionHeader}>{SECTION_LABELS[sectionKey]}</Text>
      </View>
      <View style={s.sectionBody}>
        <RenderContent content={text} />
      </View>
    </View>
  );
}

function CalloutBox({
  label,
  text,
  grow,
}: {
  label: string;
  text: string;
  grow?: boolean;
}) {
  return (
    <View style={grow ? [s.calloutBox, { flex: 1 }] : s.calloutBox}>
      <Text style={s.calloutHeader}>{label}</Text>
      <RenderContent content={text} />
    </View>
  );
}

function ObjectionHandlingSection({ text }: { text: string }) {
  const pairs = parseObjections(text);
  if (pairs.length === 0) {
    return <NarrativeSection sectionKey="objection_handling" text={text} />;
  }
  return (
    <View style={s.sectionWrap}>
      <View style={s.objectionSectionHeaderBar}>
        <View style={s.sectionHeaderDot} />
        <Text style={s.sectionHeader}>{SECTION_LABELS.objection_handling}</Text>
      </View>
      {pairs.map((pair, i) => (
        <View key={i} style={s.objectionRow} wrap={false}>
          <View style={s.objectionBox}>
            <Text style={s.objectionLabel}>Objection</Text>
            <Text style={s.para}>{parseInline(pair.objection)}</Text>
          </View>
          <View style={s.responseBox}>
            <Text style={s.responseLabel}>Genea&apos;s Response</Text>
            <Text style={[s.responseText, s.para]}>{parseInline(pair.response)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
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
        <View style={s.headerDivider} fixed>
          {DIVIDER_TONES.map((color, i) => (
            <View key={i} style={[s.headerDividerSeg, { backgroundColor: color }]} />
          ))}
        </View>

        <View style={s.body}>
          {/* Narrative sections */}
          {NARRATIVE_SECTION_KEYS.map((key) => {
            const text = content[key];
            if (!text) return null;
            return <NarrativeSection key={key} sectionKey={key} text={text} />;
          })}

          {/* Why We Win / Why We Lose */}
          {(content.strengths || content.weaknesses) && (
            <View style={s.calloutRow} wrap={false}>
              {content.strengths && (
                <CalloutBox label={SECTION_LABELS.strengths} text={content.strengths} grow />
              )}
              {content.weaknesses && (
                <CalloutBox label={SECTION_LABELS.weaknesses} text={content.weaknesses} grow />
              )}
            </View>
          )}

          {/* Sidebar-style callouts */}
          {SIDEBAR_SECTION_KEYS.map((key) => {
            const text = content[key];
            if (!text) return null;
            return (
              <View key={key} style={s.sectionWrap} wrap={false}>
                <CalloutBox label={SECTION_LABELS[key]} text={text} />
              </View>
            );
          })}

          {/* Objection handling */}
          {content.objection_handling && (
            <ObjectionHandlingSection text={content.objection_handling} />
          )}
        </View>
      </Page>
    </Document>
  );
}
