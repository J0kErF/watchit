import type { Kind } from "./types";

export interface CatalogEntry {
  id: string;
  kind: Kind;
  genres: string[];
  /** Override the Archive item title, e.g. "Bonanza public domain episodes" → "Bonanza". */
  title?: string;
  /** Override episode names when the Archive file names are unhelpful. */
  episodeTitles?: string[];
}

/**
 * Hand-picked Internet Archive items that are public domain or openly licensed.
 * Add your own by Archive identifier (the part after archive.org/details/).
 */
export const CATALOG: CatalogEntry[] = [
  // Movies
  { id: "his_girl_friday", kind: "movie", genres: ["Comedy", "Romance"] },
  { id: "TheStranger_0", kind: "movie", genres: ["Noir", "Thriller"] },
  { id: "house_on_haunted_hill_ipod", kind: "movie", genres: ["Horror"] },
  { id: "ScarletStreet", kind: "movie", genres: ["Noir", "Drama"] },
  { id: "Sita_Sings_the_Blues", kind: "movie", genres: ["Animation", "Musical"] },
  { id: "charlie_chaplin_film_fest", kind: "movie", genres: ["Comedy", "Silent"] },
  { id: "dressed_to_kill", kind: "movie", genres: ["Mystery", "Thriller"] },
  { id: "suddenly", kind: "movie", genres: ["Noir", "Thriller"] },
  { id: "mclintok_widescreen", kind: "movie", genres: ["Western", "Comedy"] },
  { id: "my_favorite_brunette", kind: "movie", genres: ["Comedy", "Noir"] },
  { id: "gullivers_travels1939", kind: "movie", genres: ["Animation", "Family"] },
  { id: "ThePhantomoftheOpera", kind: "movie", genres: ["Horror", "Silent"] },
  { id: "lost_world", kind: "movie", genres: ["Adventure", "Sci-Fi", "Silent"] },
  { id: "DasKabinettdesDoktorCaligariTheCabinetofDrCaligari", title: "The Cabinet of Dr. Caligari", kind: "movie", genres: ["Horror", "Silent"] },
  { id: "royal_wedding", kind: "movie", genres: ["Musical", "Romance"] },
  { id: "TheFlyingDeuces", kind: "movie", genres: ["Comedy"] },
  { id: "meet_john_doe", kind: "movie", genres: ["Drama"] },
  { id: "little_princess", title: "The Little Princess", kind: "movie", genres: ["Family", "Drama"] },
  { id: "JungleBook", kind: "movie", genres: ["Adventure", "Family"] },
  { id: "Killers_from_space", kind: "movie", genres: ["Sci-Fi"] },
  { id: "Sintel", kind: "movie", genres: ["Animation", "Fantasy"] },
  { id: "BigBuckBunny_124", kind: "movie", genres: ["Animation", "Family"] },

  // Series
  { id: "SherlockHolmes1954", title: "The Adventures of Sherlock Holmes", kind: "series", genres: ["Mystery"] },
  { id: "Bonanza_pd", title: "Bonanza", kind: "series", genres: ["Western", "Drama"] },
  {
    id: "theloneranger_201705",
    title: "The Lone Ranger",
    kind: "series",
    genres: ["Western", "Adventure"],
    episodeTitles: ["Enter the Lone Ranger"],
  },
  {
    id: "3stooges",
    title: "The Three Stooges",
    kind: "series",
    genres: ["Comedy"],
    episodeTitles: ["Sing a Song of Six Pants", "Disorder in the Court", "Brideless Groom", "Malice in the Palace"],
  },
  { id: "FourStarPlayhouse-48Episodes", title: "Four Star Playhouse", kind: "series", genres: ["Drama", "Anthology"] },
  { id: "manwithacamera_202002", title: "Man with a Camera", kind: "series", genres: ["Crime", "Drama"] },
  { id: "tateseason1", title: "Tate", kind: "series", genres: ["Western"] },
  { id: "CaptainZ-ro_201508", title: "Captain Z-Ro", kind: "series", genres: ["Sci-Fi", "Family"] },
];

export const FEATURED_ID = "his_girl_friday";

export const catalogEntry = (id: string) => CATALOG.find((e) => e.id === id);
