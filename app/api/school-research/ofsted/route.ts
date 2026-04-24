import { NextResponse } from "next/server";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type OfstedPayload = {
  schoolName: string;
};

function isOfstedPayload(value: unknown): value is OfstedPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.schoolName === "string" && v.schoolName.trim().length > 0;
}

function safeTextSnippet(text: string, maxLen = 2500) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

function parseLikelyRatingFromHtml(html: string) {
  const h = html.toLowerCase();
  if (h.includes("outstanding")) return "Outstanding";
  if (h.includes("requires improvement")) return "Requires Improvement";
  if (h.includes("inadequate")) return "Inadequate";
  if (h.includes("good")) return "Good";
  if (h.includes("not yet inspected")) return "Not yet inspected";
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isOfstedPayload(body)) {
      return jsonError("Invalid request body. Expected { schoolName: string }.", 400);
    }

    const schoolName = body.schoolName.trim();

    const candidateUrls = [
      // Primary target as requested (may block non-browser user agents).
      `https://www.compare-school-performance.service.gov.uk/`,
      // Fallback: GIAS search (HTML) – sometimes more accessible.
      `https://get-information-schools.service.gov.uk/Establishments/EstablishmentSearch?searchText=${encodeURIComponent(
        schoolName,
      )}`,
    ];

    const headers: HeadersInit = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    };

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
        if (!res.ok) continue;

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = (await res.json()) as unknown;
          return NextResponse.json(
            {
              ok: true,
              data: {
                query: schoolName,
                source: url,
                raw: data,
              },
            },
            { status: 200 },
          );
        }

        const html = await res.text();
        const rating = parseLikelyRatingFromHtml(html);

        // Minimal structured response; do not claim certainty from weak parsing.
        return NextResponse.json(
          {
            ok: true,
            data: {
              query: schoolName,
              source: url,
              rating: rating ?? "Unknown",
              snippet: safeTextSnippet(html),
            },
          },
          { status: 200 },
        );
      } catch {
        // try next URL
      }
    }

    return NextResponse.json({ ok: false, error: "Could not fetch Ofsted data" }, { status: 200 });
  } catch (err) {
    if (err instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const message = err instanceof Error ? err.message : "Could not fetch Ofsted data";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}

