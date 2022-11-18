const WIKIURL =
  "https://en.wikibooks.org/w/api.php?redirects&origin=*&action=query&prop=extracts&formatversion=2&format=json&titles=Chess_Opening_Theory";

const cache: Record<string, string> = {};

export async function pgnToResult(pgn: string) {
  const moves = pgn.trim().split(" ");
  const wikiPgn =
    pgn !== "-"
      ? "/" +
        moves
          .map((move, i) => {
            if (/^\d/g.test(move)) {
              return move.replace(".", "._");
            } else {
              return Math.ceil(i / 2).toString() + "..." + move;
            }
          })
          .join("/")
      : "";
  if (cache[wikiPgn]) {
    return cache[wikiPgn];
  }
  const result = await fetch(WIKIURL + wikiPgn).then((res) => res.json());
  const { extract } = result.query.pages[0];
  return (cache[wikiPgn] = sanitizeExtract(extract));
}

function sanitizeExtract(extract: string) {
  if (!extract) {
    return "No info found for this game";
  }
  const parser = new DOMParser();
  const fakeDom = parser.parseFromString(extract, "text/html");
  fakeDom.querySelectorAll("p,form,script").forEach((el) => {
    if (el.textContent.trim() === "") {
      el.remove();
    }
  });
  return fakeDom.body.innerHTML;
}
