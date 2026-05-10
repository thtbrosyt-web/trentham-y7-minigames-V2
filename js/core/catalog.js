export const cosmeticItems = [
  {
    id: "base_boy",
    label: "Boy base",
    category: "base",
    value: null,
    price: 0,
    description: "Full-body foundation layer — align with hair/shirt/hat overlays (512×512)."
  },
  {
    id: "base_girl",
    label: "Girl base",
    category: "base",
    value: null,
    price: 0,
    description: "Full-body foundation layer — align with hair/shirt/hat overlays (512×512)."
  },
  { id: "form_normal", label: "Student", category: "form", value: null, price: 0 },
  {
    id: "form_god",
    label: "God form",
    category: "form",
    value: null,
    price: 8888,
    description: "Transforms your hub avatar into the god illustration (art: see ASSETS_TO_CREATE_FOR_ARTIST.md)."
  },
  { id: "hair_basic", label: "Basic Hair", category: "hair", value: "#5c3a1b", price: 0 },
  { id: "hair_spiky", label: "Spiky Hair", category: "hair", value: "#1f1f1f", price: 90 },
  { id: "hair_gold", label: "Gold Hair", category: "hair", value: "#ffbf00", price: 160 },
  { id: "hair_curly", label: "Curly Hair", category: "hair", value: "#3d2817", price: 120 },
  { id: "hair_bob", label: "Bob Cut", category: "hair", value: "#2c1810", price: 100 },
  { id: "hair_pigtails", label: "Pigtails", category: "hair", value: "#4a3020", price: 115 },
  { id: "hair_long_waves", label: "Long waves", category: "hair", value: "#2a1a10", price: 135 },
  { id: "hair_side_bangs", label: "Side bangs", category: "hair", value: "#3d2818", price: 105 },
  { id: "hair_purple", label: "Purple Streak", category: "hair", value: "#6b3fa0", price: 175 },
  { id: "hair_silver", label: "Silver Hair", category: "hair", value: "#b8b8c8", price: 200 },
  { id: "shirt_basic", label: "Basic Shirt", category: "shirt", value: "#2f4cff", price: 0 },
  { id: "shirt_red", label: "Red Shirt", category: "shirt", value: "#cf334d", price: 110 },
  { id: "shirt_neon", label: "Neon Shirt", category: "shirt", value: "#68f767", price: 190 },
  { id: "shirt_stripes", label: "Striped Shirt", category: "shirt", value: "#e8dcc4", price: 130 },
  { id: "shirt_hoodie", label: "School Hoodie", category: "shirt", value: "#4a5a78", price: 145 },
  { id: "shirt_tie", label: "Uniform + Tie", category: "shirt", value: "#1e3a5f", price: 165 },
  { id: "shirt_pe", label: "PE Kit", category: "shirt", value: "#2d8a4e", price: 95 },
  { id: "shirt_cardigan", label: "Cardigan", category: "shirt", value: "#c8a8d8", price: 128 },
  { id: "shirt_polo_girl", label: "Polo top", category: "shirt", value: "#f0427a", price: 118 },
  { id: "shirt_dressy", label: "Dressy top", category: "shirt", value: "#5c3d6b", price: 142 },
  { id: "colour_sand", label: "Skin Sand", category: "colour", value: "#f2d2a2", price: 0 },
  { id: "colour_bronze", label: "Skin Bronze", category: "colour", value: "#b97548", price: 80 },
  { id: "colour_rose", label: "Skin Rose", category: "colour", value: "#e2aa9d", price: 80 },
  { id: "colour_olive", label: "Skin Olive", category: "colour", value: "#c4a574", price: 85 },
  { id: "colour_deep", label: "Skin Deep", category: "colour", value: "#6b4423", price: 85 },
  { id: "colour_fair", label: "Skin Fair", category: "colour", value: "#f5d5c8", price: 75 },
  { id: "hat_none", label: "No hat", category: "hat", value: null, price: 0 },
  { id: "hat_cap", label: "Academy Cap", category: "hat", value: null, price: 70 },
  { id: "hat_beanie", label: "Winter Beanie", category: "hat", value: null, price: 85 },
  { id: "hat_crown", label: "Fun Crown", category: "hat", value: null, price: 220 },
  { id: "hat_bow", label: "Hair bow", category: "hat", value: null, price: 55 },
  {
    id: "hat_star_pin",
    label: "Star merit pin",
    category: "hat",
    value: null,
    price: 0,
    codeExclusive: true,
    description: "Redeem a code — not sold for coins."
  },
  {
    id: "shirt_library_pass",
    label: "Library pass tee",
    category: "shirt",
    value: "#4a6fa5",
    price: 0,
    codeExclusive: true,
    description: "Souvenir tee — code exclusive."
  },
  {
    id: "bundle_school_kit",
    label: "School kit",
    category: "bundle",
    value: null,
    price: 185,
    bundleContents: ["shirt_tie", "hat_cap"],
    description: "Uniform + tie shirt and academy cap together."
  },
  {
    id: "bundle_pe_kit",
    label: "PE kit bundle",
    category: "bundle",
    value: null,
    price: 155,
    bundleContents: ["shirt_pe", "hat_beanie"],
    description: "PE top and winter beanie together."
  }
];

export function getItemById(id) {
  return cosmeticItems.find((item) => item.id === id);
}

/** Cosmetics that count toward wardrobe badges (excludes bundle SKUs). */
export function countableCosmeticItems() {
  return cosmeticItems.filter((it) => it.category !== "bundle");
}
