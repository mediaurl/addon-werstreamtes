const fetch = require("node-fetch");
const { getSources, extractUrl } = require("../dist/scraper");

test("scraper", async () => {
  const resp = await fetch(
    "https://www.werstreamt.es/film/details/1529092/joker/"
  );
  const html = await resp.text();
  const results = getSources(html);

  // console.log('result', results);
  // console.log(results.length);

  expect(results.length > 10).toBe(true);
});

test("url extractor", async () => {
  const resp = await fetch(
    "https://www.werstreamt.es/suche/suggestTitle?term=tt7286456"
  );
  const json = await resp.json();

  const url = extractUrl(json);

  expect(url).toBe("https://www.werstreamt.es/film/details/1529092/joker/");
});
