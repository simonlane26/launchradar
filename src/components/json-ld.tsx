/**
 * Renders a schema.org JSON-LD block. Server-rendered into the initial HTML
 * so crawlers and AI assistants see the structured data without executing JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Escape `<` so a stray "</script>" in any string can't break out of the
  // tag. Content here is all first-party, but this keeps it safe by default.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
