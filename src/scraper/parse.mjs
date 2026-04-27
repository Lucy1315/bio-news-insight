/**
 * @typedef {Object} RssItem
 * @property {string} title
 * @property {string} link
 * @property {string} pubDate
 * @property {string} description
 * @property {string} source
 */

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function decodeEntities(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function stripCdata(s) {
  const m = String(s ?? '').match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : String(s ?? '');
}

function stripHtml(s) {
  return String(s ?? '').replace(/<[^>]+>/g, '');
}

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = block.match(re);
  return m ? m[1] : '';
}

/**
 * Parse Google News RSS XML into structured items.
 * @param {string} xml
 * @returns {RssItem[]}
 */
export function parseRssItems(xml) {
  const items = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = decodeEntities(stripCdata(extractTag(block, 'title'))).trim();
    const link = decodeEntities(stripCdata(extractTag(block, 'link'))).trim();
    const pubDate = decodeEntities(stripCdata(extractTag(block, 'pubDate'))).trim();
    const source = decodeEntities(stripCdata(extractTag(block, 'source'))).trim();
    const descRaw = stripCdata(extractTag(block, 'description'));
    const description = decodeEntities(stripHtml(decodeEntities(descRaw))).replace(/\s+/g, ' ').trim();
    items.push({ title, link, pubDate, description, source });
  }
  return items;
}

/**
 * @param {string|undefined|null} text
 * @returns {string}
 */
export function normalizeSource(text) {
  const trimmed = String(text ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unknown';
}
