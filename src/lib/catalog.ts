import type { Kind } from "./types";

export interface CatalogEntry {
  id: string;
  kind: Kind;
  genres: string[];
  /** Override the Archive item title, e.g. "Bonanza public domain episodes" → "Bonanza". */
  title?: string;
  /** For items whose Archive metadata has no year. */
  year?: number;
  /** Replace uploader notes or ads in the Archive description. */
  description?: string;
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

  // Creative Commons films, 2006–2023
  { id: "wing_it", title: "Wing It!", year: 2023, kind: "movie", genres: ["Animation", "Comedy", "Short"] },
  { id: "charge_202601", title: "Charge", year: 2022, kind: "movie", genres: ["Animation", "Action", "Short"] },
  {
    id: "sprite-fright",
    title: "Sprite Fright",
    year: 2021,
    kind: "movie",
    genres: ["Animation", "Horror", "Comedy", "Short"],
    description:
      "A group of rowdy teenagers on a camping trip in the woods meet the tiny, adorable forest sprites who live there, and quickly learn they are not as friendly as they look. A Blender Studio open movie.",
  },
  { id: "coffee-run", title: "Coffee Run", year: 2020, kind: "movie", genres: ["Animation", "Short"] },
  {
    id: "springopenmovie",
    title: "Spring",
    year: 2019,
    kind: "movie",
    genres: ["Animation", "Fantasy", "Short"],
    description:
      "A shepherd girl and her dog face ancient spirits to keep the cycle of life going. Inspired by director Andy Goralczyk's childhood in the mountains of Germany. A Blender Studio open movie.",
  },
  { id: "hero_20260106", title: "Hero", year: 2018, kind: "movie", genres: ["Animation", "Action", "Short"] },
  {
    id: "agent327operationbarbershop",
    title: "Agent 327: Operation Barbershop",
    year: 2017,
    kind: "movie",
    genres: ["Animation", "Action", "Comedy", "Short"],
    description:
      "Undercover in a barbershop, Agent 327 trades blows with a barber who is more than he seems. A teaser for a feature film based on the classic Dutch comic series, made by Blender Studio.",
  },
  { id: "CosmosLaundromatFirstCycle", title: "Cosmos Laundromat", kind: "movie", genres: ["Animation", "Sci-Fi", "Short"] },
  { id: "TheInternetsOwnBoyTheStoryOfAaronSwartz", title: "The Internet's Own Boy", kind: "movie", genres: ["Documentary"] },
  { id: "Tears-of-Steel", kind: "movie", genres: ["Sci-Fi", "Action", "Short"] },
  { id: "Decay2012-TheLhcZombieFilmfullFilm", title: "Decay", kind: "movie", genres: ["Horror", "Sci-Fi"] },
  { id: "valkaama", title: "Valkaama", kind: "movie", genres: ["Adventure", "Drama"] },
  { id: "rip_a_remix_manifesto", title: "RiP!: A Remix Manifesto", kind: "movie", genres: ["Documentary"] },
  { id: "ElephantsDream", kind: "movie", genres: ["Animation", "Sci-Fi", "Short"] },

  // Public domain, 1952–1972
  { id: "SilentNightBloodyNight1972", title: "Silent Night, Bloody Night", kind: "movie", genres: ["Horror"] },
  {
    id: "night_of_the_living_dead_dvd",
    kind: "movie",
    genres: ["Horror"],
    description:
      "George A. Romero's landmark zombie film. Strangers trapped in a remote Pennsylvania farmhouse try to survive the night as the recently dead rise and close in.",
  },
  { id: "TheLastManOnEarth_72", year: 1964, kind: "movie", genres: ["Horror", "Sci-Fi"] },
  { id: "santa-claus-conquers-the-martians-1964_202512", title: "Santa Claus Conquers the Martians", kind: "movie", genres: ["Sci-Fi", "Comedy", "Family"] },
  {
    id: "charade-1963-cary-grant-audrey-hepburn-walter-matthau-1080p-reup",
    title: "Charade",
    year: 1963,
    kind: "movie",
    genres: ["Comedy", "Mystery", "Romance"],
    description:
      "In Paris, a widow learns her late husband stole a fortune, and his old partners want it back. A charming stranger offers to help, but he keeps changing his name. Starring Cary Grant and Audrey Hepburn.",
  },
  { id: "TheTerror", kind: "movie", genres: ["Horror"] },
  {
    id: "dementia-13-1963_202312",
    title: "Dementia 13",
    kind: "movie",
    genres: ["Horror", "Thriller"],
    description:
      "After her husband dies, a scheming widow hides his death to stay in his family's will, only to find an axe murderer stalking their Irish castle. Francis Ford Coppola's first mainstream feature.",
  },
  { id: "CarnivalofSouls", kind: "movie", genres: ["Horror"] },
  { id: "TheBrainThatWouldntDie_165", title: "The Brain That Wouldn't Die", kind: "movie", genres: ["Sci-Fi", "Horror"] },
  { id: "NightTide1961", title: "Night Tide", year: 1961, kind: "movie", genres: ["Horror", "Fantasy"] },
  { id: "The_Little_Shop_of_Horrors.mpeg", kind: "movie", genres: ["Comedy", "Horror"] },
  { id: "ABucketofBlood", year: 1959, kind: "movie", genres: ["Comedy", "Horror"] },
  { id: "teenagers_from_outerspace", title: "Teenagers from Outer Space", kind: "movie", genres: ["Sci-Fi"] },
  {
    id: "Hitch_Hiker",
    kind: "movie",
    genres: ["Noir", "Thriller"],
    description:
      "Two friends on a fishing trip pick up a hitchhiker who turns out to be a psychopathic killer on the run. Ida Lupino's tense noir, the first mainstream American film noir directed by a woman.",
  },
  { id: "kansascityconfidencial", title: "Kansas City Confidential", kind: "movie", genres: ["Noir", "Crime"] },

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
