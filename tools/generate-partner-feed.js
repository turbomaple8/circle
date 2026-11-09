#!/usr/bin/env node
/**
 * Rentser Partner Listing Feed Generator
 * Builds feeds/rentser.json from the room cards on the property pages,
 * plus the ids, room types and photos in tools/data/partner-feed.json.
 * Pure Node.js — no dependencies.
 *
 * Usage: node tools/generate-partner-feed.js
 * Run after any change to room cards, prices or photos, and commit the output.
 * Fails (exit 1) when a room card has no entry in the config, or an entry
 * points at a card that no longer exists, so the feed cannot drift silently.
 */

const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'partner-feed.json'), 'utf8'));

const ROOM_TYPES = ['private_room', 'ensuite_room', 'shared_room', 'studio', 'entire_place'];
// Card tags that describe the room type or the price, not a feature of the room
const GENERIC_TAGS = ['private room', 'private ensuite', 'private bathroom', 'entire apartment',
  'furnished', 'wifi included', 'male only', 'best value'];

const errors = [];

// ── Helpers ───────────────────────────────────────────────────
function decode(text) {
  return text.replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function count(details, word) {
  const hit = details.find(d => new RegExp(`\\b${word}s?\\b`, 'i').test(d));
  return hit ? Number(hit.match(/[\d.]+/)[0]) : null;
}

function readPage(page) {
  const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
  let geo = null;
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const item of data['@graph'] || [data]) {
        if (item.geo) geo = { latitude: Number(item.geo.latitude), longitude: Number(item.geo.longitude) };
      }
    } catch (e) { /* other JSON-LD blocks */ }
  }
  const cards = [];
  for (const m of html.matchAll(/<div class="room-card fade-in">([\s\S]*?)data-modal="tour"/g)) {
    const block = m[1];
    const details = [...block.matchAll(/class="room-card__detail">([\s\S]*?)<\/span>/g)]
      .map(d => d[1].replace(/<[^>]+>/g, ' ').replace(/&#\d+;/g, ' ').replace(/\s+/g, ' ').trim());
    cards.push({
      name: decode(block.match(/room-card__name">([^<]+)</)[1]),
      price: Number(block.match(/room-card__price">C\$([\d,]+)\/week/)[1].replace(',', '')),
      bedrooms: count(details, 'bed'),
      bathrooms: count(details, 'bath'),
      tags: [...block.matchAll(/room-card__tag">([^<]+)</g)].map(t => decode(t[1])),
    });
  }
  return { geo, cards };
}

function describe(entry, card, building) {
  const baths = `${card.bathrooms} bathroom${card.bathrooms === 1 ? '' : 's'}`;
  let summary = entry.summary;
  if (!summary && entry.room_type === 'ensuite_room') {
    summary = `Furnished private room with its own ensuite bathroom, in a shared ${card.bedrooms}-bedroom suite`;
  } else if (!summary) {
    summary = `Furnished private room in a shared ${card.bedrooms}-bedroom suite with ${baths}`;
  }
  const parts = [`${summary}, at ${building.name}, ${building.street}, Toronto.`];
  // A written summary already covers the card's tags
  const features = entry.summary ? [] : card.tags.filter(t => !GENERIC_TAGS.includes(t.toLowerCase())).map(t => t.toLowerCase());
  if (features.length) parts.push(`Highlights: ${features.join(', ')}.`);
  if (/male only/i.test(card.name) || card.tags.some(t => /male only/i.test(t))) {
    parts.push('This room is for male residents only.');
  }
  parts.push(building.about);
  parts.push('The all-inclusive price covers furniture, high-speed WiFi and all utilities (hydro, water, heat)' +
    (building.common_area_cleaning ? ', plus bi-weekly common-area cleaning.' : '.'));
  parts.push(`Minimum stay is ${building.min_stay_months} months.`);
  return parts.join(' ');
}

function validate(listing) {
  const where = `listing ${listing.id}`;
  const required = ['id', 'title', 'description', 'price', 'price_period', 'currency', 'latitude', 'longitude',
    'room_type', 'bedrooms', 'bathrooms', 'available_from', 'photos'];
  for (const field of required) {
    if (listing[field] === null || listing[field] === undefined || listing[field] === '') errors.push(`${where}: missing ${field}`);
  }
  if (!listing.address.street || !listing.address.city) errors.push(`${where}: missing address.street or address.city`);
  if (listing.title.length < 10 || listing.title.length > 140) errors.push(`${where}: title must be 10-140 characters`);
  if (listing.description.length < 150) errors.push(`${where}: description is under 150 characters`);
  if (/@|\+?\d[\d\s().-]{8,}\d/.test(listing.description)) errors.push(`${where}: description looks like it holds an email or phone number`);
  if (!ROOM_TYPES.includes(listing.room_type)) errors.push(`${where}: unknown room_type ${listing.room_type}`);
  if (!Number.isInteger(listing.bedrooms)) errors.push(`${where}: bedrooms must be an integer`);
  if (listing.photos.length < 3 || listing.photos.length > 6) errors.push(`${where}: needs 3-6 photos, has ${listing.photos.length}`);
  if (!(listing.price > 0)) errors.push(`${where}: price must be a positive number`);
}

// ── Build ─────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const pages = {};
for (const page of Object.keys(config.buildings)) pages[page] = readPage(page);

const data = [];
const seenIds = new Set();
const covered = new Set();
for (const entry of config.listings) {
  const page = pages[entry.page];
  const card = page && page.cards.find(c => c.name === entry.card);
  if (!card) { errors.push(`config entry "${entry.card}" on ${entry.page} has no matching room card`); continue; }
  covered.add(`${entry.page}|${entry.card}`);
  if (entry.exclude) continue;
  if (seenIds.has(entry.id)) errors.push(`duplicate id ${entry.id}`);
  seenIds.add(entry.id);

  const building = config.buildings[entry.page];
  const address = { street: building.street, city: config.city };
  if (building.postcode) address.postcode = building.postcode;
  if (building.neighborhood) address.neighborhood = building.neighborhood;

  const listing = {
    id: entry.id,
    title: `${card.name} – ${building.name}, ${building.street}`,
    description: describe(entry, card, building),
    price: card.price,
    price_period: 'week',
    currency: config.currency,
    address,
    latitude: page.geo && page.geo.latitude,
    longitude: page.geo && page.geo.longitude,
    room_type: entry.room_type,
    bedrooms: card.bedrooms,
    bathrooms: card.bathrooms,
    available_from: today,
    min_stay_months: building.min_stay_months,
    bills_included: true,
    furnished: true,
    photos: entry.photos.map(p => config.photo_base + p),
    url: `${config.site}/${entry.page.replace(/\.html$/, '')}`,
  };
  validate(listing);
  data.push(listing);
}

for (const [page, { cards }] of Object.entries(pages)) {
  for (const card of cards) {
    if (!covered.has(`${page}|${card.name}`)) {
      errors.push(`room card "${card.name}" on ${page} has no entry in tools/data/partner-feed.json (add it, or add it with "exclude")`);
    }
  }
}

if (errors.length) {
  console.error(`Feed not written, ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

const out = path.join(ROOT, config.output);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ data }, null, 2) + '\n');
const skipped = config.listings.filter(e => e.exclude).map(e => `${e.card} (${e.page})`);
console.log(`Wrote ${data.length} listings to ${config.output}` + (skipped.length ? `; skipped: ${skipped.join(', ')}` : ''));
