import { navigate } from "./navigate";

// One navigation vocabulary for the whole app: query-param routes, view
// transitions, and a popstate event so the router re-reads the URL.
export type RouteParams = Record<string, string | null | undefined>;

export function routeParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function hrefFor(p: RouteParams): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  for (const [k, v] of Object.entries(p)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const qs = url.searchParams.toString();
  return url.pathname + (qs ? `?${qs}` : "");
}

export function navigateTo(p: RouteParams): void {
  navigate(hrefFor(p), () => window.dispatchEvent(new PopStateEvent("popstate")));
}

// Lesson links keep the subject/course context; everything else is flat.
export function lessonHref(ladder: string, course: string | undefined, slug: string, extra?: RouteParams): string {
  return hrefFor({ s: ladder, c: course, t: slug, ...extra });
}