import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categoriesFor,
  categoryPath,
  categoryQuery,
  DECADES,
  findCategory,
  findSub,
  PAGES_PER_BATCH,
  parseDecade,
  parseSort,
  SORTS,
} from "@/lib/categories";
import { type Lang, t, translated } from "@/lib/i18n";
import { getTmdbList } from "@/lib/tmdb";
import type { Kind } from "@/lib/types";
import { LoadMore } from "./LoadMore";
import { PageHeader } from "./PageHeader";
import { Grid } from "./Row";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-accent bg-accent font-semibold text-accent-ink"
          : "border-white/20 text-foreground/80 hover:border-white/60 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * A category of movies or series as a grid, with subcategory, sort and decade filters and Load more.
 * In Kids mode only kids categories open, limited to kids ratings.
 */
export async function CategoryView({
  kind,
  slug,
  searchParams,
  lang,
  kids,
}: {
  kind: Kind;
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
  lang: Lang;
  kids: boolean;
}) {
  const category = findCategory(kind, slug);
  if (!category) notFound();
  const sort = parseSort(first(searchParams.sort));
  const decade = parseDecade(first(searchParams.decade));
  const sub = findSub(category, first(searchParams.sub));
  // A title of its own where the language needs one ("مسلسلات سورية"), otherwise "Series: {category}".
  const label = sub?.label ?? category.label;
  const own = `${label} ${kind === "movie" ? "movies" : "series"}`;
  const heading = translated(lang, own)
    ? t(lang, own)
    : t(lang, kind === "movie" ? "{category} movies" : "{category} series", { category: t(lang, label) });
  if (kids && !category.kids) {
    return (
      <>
        <PageHeader title={heading} />
        <p className="text-muted">{t(lang, "Not available in Kids mode")}</p>
      </>
    );
  }
  const { path, params } = categoryQuery(kind, category, sort, decade, sub, kids);
  const titles = await getTmdbList(path, params, PAGES_PER_BATCH, 1, lang);

  // Switching category drops the subcategory, which belongs to the old one.
  const href = (next: { slug?: string; sub?: string; sort?: string; decade?: string }) => {
    const query = new URLSearchParams();
    const s = next.sort ?? sort;
    const d = next.decade ?? decade;
    const sb = next.slug ? "" : (next.sub ?? sub?.slug ?? "");
    if (sb) query.set("sub", sb);
    if (s !== "popular") query.set("sort", s);
    if (d) query.set("decade", d);
    const qs = query.toString();
    return categoryPath(kind, next.slug ?? slug) + (qs ? `?${qs}` : "");
  };
  const row = "no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0";

  return (
    <>
      <PageHeader title={heading} />
      <div className="mb-8 space-y-3">
        {/* The navbar menu needs a mouse, so the categories are listed here too. */}
        <nav aria-label={t(lang, "Categories")} className={row}>
          {categoriesFor(kind, kids).map((c) => (
            <Chip key={c.slug} href={href({ slug: c.slug })} active={c.slug === slug}>
              {t(lang, c.label)}
            </Chip>
          ))}
        </nav>
        {category.subs && (
          <div className={row} role="group" aria-label={t(lang, "Subcategories")}>
            <Chip href={href({ sub: "" })} active={!sub}>
              {t(lang, "All")}
            </Chip>
            {category.subs.map((s) => (
              <Chip key={s.slug} href={href({ sub: s.slug })} active={s.slug === sub?.slug}>
                {t(lang, s.label)}
              </Chip>
            ))}
          </div>
        )}
        <div className={row} role="group" aria-label={t(lang, "Sort")}>
          {SORTS.map((s) => (
            <Chip key={s.value} href={href({ sort: s.value })} active={s.value === sort}>
              {t(lang, s.label)}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 self-stretch bg-white/15" aria-hidden />
          {DECADES.map((d) => (
            <Chip key={d.value} href={href({ decade: d.value })} active={d.value === decade}>
              {t(lang, d.label)}
            </Chip>
          ))}
        </div>
      </div>
      {titles.length ? (
        // Keyed by the filters so Load more starts over when they change.
        <LoadMore
          key={`${slug}-${sub?.slug}-${sort}-${decade}`}
          kind={kind}
          slug={slug}
          sub={sub?.slug ?? ""}
          sort={sort}
          decade={decade}
          initial={titles}
        >
          <Grid titles={titles} lang={lang} />
        </LoadMore>
      ) : (
        <p className="text-muted">{t(lang, "Nothing to show for these filters.")}</p>
      )}
    </>
  );
}
