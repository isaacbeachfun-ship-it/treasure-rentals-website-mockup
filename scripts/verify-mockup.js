const fs = require("fs");
const vm = require("vm");

const read = (path) => fs.readFileSync(path, "utf8");
const html = read("index.html");
const script = read("script.js");
const styles = read("styles.css");
const dataSource = read("mockup-data.js");
const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(dataSource, dataContext);
const mockup = dataContext.window.TREASURE_MOCKUP;
const properties = mockup.properties;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(html.includes('name="locationClass"'), "Hero search needs a location-class field.");
assert(html.includes('data-view="home-video"'), "Mockup needs a copied video homepage view.");
assert(html.includes('data-home-version="home-video" aria-label="Show video homepage">1</button>'), "Demo switcher should make video version 1.");
assert(html.includes('data-home-version="home" aria-label="Show image homepage">2</button>'), "Demo switcher should make image version 2.");
assert(html.includes('class="brand" href="#home-video" data-view-link="home-video"'), "Header logo should route to the default video homepage.");
assert(html.includes('data-menu-toggle aria-expanded="false" aria-controls="primary-navigation"'), "Mobile menu button should expose expanded state.");
assert(html.includes('id="primary-navigation"'), "Primary navigation should be targetable by the mobile menu button.");
assert(script.includes("function closePrimaryMenu()"), "Mobile navigation needs a helper to close the open menu.");
assert(script.includes("function togglePrimaryMenu()"), "Mobile navigation needs a helper to toggle expanded state.");
assert(script.includes('const isPrimaryNavParent = viewLink.matches(".nav-item > button");'), "Mobile nav should distinguish parent menu buttons from final selections.");
assert(script.includes("if (!isPrimaryNavParent) {\n          closePrimaryMenu();"), "Final navigation selections should close the mobile menu after routing.");
assert(html.includes('name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex"'), "Hosted review mockup should discourage search indexing.");
assert(fs.existsSync(".nojekyll"), "GitHub Pages deploy should include .nojekyll for a plain static site.");
assert(html.includes("downloaded-assets/Tvr-Hero.mp4"), "Video homepage should use the provided Tvr-Hero.mp4 asset.");
assert(fs.existsSync("downloaded-assets/Tvr-Hero.mp4"), "Provided homepage video asset should exist.");
assert(html.includes("<video") && html.includes("playsinline"), "Video homepage hero should use an inline background video.");
assert(styles.includes(".video-home-hero"), "Video homepage needs dedicated compact hero styling.");
assert(html.includes("video-hero-message"), "Video homepage should group the centered message over the footage.");
assert(html.includes("video-search-dock"), "Video homepage search should be docked inside the video hero.");
assert(styles.includes("min-height: clamp(420px, 50vh, 520px);"), "Video homepage hero should be tighter than the rotating-image hero.");
assert(styles.includes("grid-template-rows: minmax(0, 1fr) auto;"), "Video homepage content should reserve the lower video area for search.");
assert(styles.includes(".video-hero-message {\n  align-self: center;"), "Video homepage message should be centered inside the video.");
assert(styles.includes(".video-search-dock"), "Video homepage search needs dedicated in-video dock styling.");
assert(styles.includes("margin: 0 auto;"), "Desktop video homepage search should stay docked in the video hero.");
assert(styleBlock(".video-home-hero .video-hero-media").includes("position: relative;"), "Mobile video homepage should put the video in normal flow above the search form.");
assert(styleBlock(".video-home-hero .video-hero-media").includes("height: var(--mobile-video-height);"), "Mobile video homepage should reserve visible height for the video before the search form.");
assert(styleBlock(".video-home-hero .video-hero-message").includes("position: absolute;"), "Mobile video homepage message should overlay the visible video panel.");
assert(styleBlock(".video-home-hero .video-search-dock").includes("margin: 14px auto 18px;"), "Mobile video homepage search should sit below the video panel.");
assert(styles.includes(".demo-home-toggle"), "Demo home switcher needs top-of-page styling.");
assert(styles.includes("@media (max-width: 620px) {\n  .demo-home-toggle {"), "Mobile demo switcher needs its own responsive top row.");
assert(styleBlock("@media (max-width: 620px) {\n  .demo-home-toggle").includes("position: static;"), "Mobile demo switcher should not overlay the account links.");
assert(styleBlock("@media (max-width: 620px) {\n  .demo-home-toggle").includes("margin: 6px auto;"), "Mobile demo switcher should sit above the header as its own compact centered row.");
assert(styles.includes("  .utility-bar {\n    display: none;\n  }"), "Mobile header should hide the utility link strip to avoid wasting the first viewport.");
assert(styles.includes("  .main-nav {\n    min-height: 78px;"), "Mobile header should use a compact logo/menu row.");
assert(styles.includes("  .brand {\n    align-self: center;"), "Mobile brand should align inside the compact header instead of hanging below it.");
assert(styles.includes("  .brand img {\n    width: 205px;"), "Mobile logo should be smaller than the desktop header logo.");
assert(styles.includes("translateX(calc(var(--hero-slide-index, 0) * -100%))"), "Image homepage hero should slide horizontally between photos.");
assert(styles.includes(".hero-slides.no-transition"), "Image homepage hero needs a no-transition reset state for looping.");
assert(script.includes("initViewFromQuery"), "Mockup should initialize the copied video homepage from the URL.");
assert(script.includes("window.location.hash"), "Mockup should initialize direct hash routes such as #nightlife.");
assert(script.includes("window.setTimeout(() => window.scrollTo({ top: 0"), "Direct hash routes should reset scroll after browser anchor positioning.");
assert(script.includes("function routeFromUrl()"), "Mockup should parse browser URLs into internal routes.");
assert(script.includes("function navigateToRoute(route, options = {})"), "Internal navigation should use a route helper instead of changing views silently.");
assert(script.includes("window.history.pushState({ route: nextRoute }, \"\", url);"), "Internal navigation should push browser history entries for back/forward buttons.");
assert(script.includes('window.addEventListener("popstate"'), "Browser back/forward buttons should restore the previous mockup route.");
assert(!script.includes('setView(viewLink.dataset.viewLink);\n        if (viewLink.dataset.pill)'), "View-link clicks should not bypass browser history.");
assert(script.includes('params.get("v") === "video-home"'), "Video homepage should be available at ?v=video-home.");
assert(script.includes('view: "home-video"'), "Video homepage should be the default landing-page version.");
assert(script.includes('params.get("v") === "home"'), "Image homepage should remain directly available at ?v=home.");
assert(script.includes('url.searchParams.set("v", "home")'), "Image homepage toggle should keep a durable URL parameter.");
assert(script.includes("syncHomeVersionToggle"), "Homepage version controls need active-state syncing.");
assert(script.includes("updateHomeVersionQuery"), "Homepage version controls should update the demo URL.");
assert(script.includes("slidePosition"), "Hero carousel should track the visual slide position separately for horizontal looping.");
assert(script.includes('data.heroSlides.concat(data.heroSlides[0])'), "Image homepage hero should include a first-slide clone for smooth looping.");
assert(script.includes('document.querySelectorAll("[data-search-form]")'), "All copied homepage search forms should submit, not only the first one.");
assert(html.includes('class="section-pad town-picture-section"'), "Homepage town section should use the three-picture card layout.");
assert(html.includes("data-town-cards"), "Homepage town section needs a dedicated town-card render target.");
assert(!html.includes('class="section-pad split-feature"'), "Homepage town section should no longer use the old split-feature layout.");
assert((html.match(/class="town-picture-card"/g) || []).length >= 6, "Both homepage versions should include fallback town picture cards.");
assert(script.includes("town-picture-card") && script.includes("town.image") && script.includes("town.description"), "Town cards should render image-backed town cards with descriptions.");
assert(styles.includes(".town-picture-card:hover") && styles.includes("filter: brightness(.86)") && styles.includes("box-shadow: 0 18px 34px"), "Town cards should reuse the popular-search hover shade and shadow treatment.");
["owners", "management", "area", "town", "restaurants", "nightlife"].forEach((view) => {
  assert(html.includes(`data-view="${view}"`), `Missing ${view} content view.`);
});
assert(html.includes('data-view="content"'), "Mockup needs a generic content view for original demo pages.");
[
  "renderOwnerPages",
  "renderAreaPage",
  "renderTownPage",
  "renderRestaurantsPage",
  "renderNightlifePage",
  "renderGenericPage"
].forEach((renderer) => {
  assert(script.includes(renderer), `Missing renderer: ${renderer}.`);
});
[
  "oceanfront",
  "pet-friendly",
  "pool-access",
  "event-friendly",
  "elevator",
  "specials",
  "owner-portal",
  "what-to-stock-vacation-rental",
  "real-estate",
  "faq",
  "explore-eastern-nc",
  "guest-portal",
  "blog",
  "high-tides-good-vibes",
  "about",
  "contact"
].forEach((pageId) => {
  assert(Array.isArray(mockup.demoPages) && mockup.demoPages.some((page) => page.id === pageId), `Original demo page missing from mockup data: ${pageId}`);
});
const stockingPage = mockup.demoPages.find((page) => page.id === "what-to-stock-vacation-rental");
const stockingArticleText = JSON.stringify(stockingPage.article || {});
const internalArticlePhrases = ["mockup", "vision page", "placeholder", "source document", "required furnishings inventory", "readable owner guide", "This checklist turns"];
mockup.demoPages.filter((page) => page.article).forEach((page) => {
  const articleText = JSON.stringify(page.article);
  internalArticlePhrases.forEach((phrase) => {
    assert(!articleText.includes(phrase), `Article page ${page.id} should read like a public page, not internal instructions: ${phrase}`);
  });
});
assert(stockingPage.section === "Owner Info", "Vacation rental stocking article should live under Owner Info.");
assert(stockingPage.title.includes("What To Stock In A Vacation Rental"), "Stocking article should target the vacation-rental stocking search phrase.");
assert(stockingPage.image === "./assets/owner-guides/vacation-rental-stocked-kitchen-topsail.png", "Stocking article should use the generated Topsail kitchen image.");
assert(fs.existsSync("assets/owner-guides/vacation-rental-stocked-kitchen-topsail.png"), "Generated stocking article hero image should exist locally.");
assert(Array.isArray(stockingPage.article?.sections) && stockingPage.article.sections.length >= 5, "Stocking article should be a real room-by-room owner guide.");
["A well-stocked vacation rental", "Topsail Island owners", "Treasure Vacation Rentals"].forEach((phrase) => {
  assert(stockingArticleText.includes(phrase), `Stocking article should include publishable owner-facing copy: ${phrase}`);
});
["2x the number the property can sleep", "Topsail Island vacation rental", "Functional Smoke Detectors", "Functional CO Detectors", "Fire Extinguisher"].forEach((phrase) => {
  assert(dataSource.includes(phrase), `Stocking article should include source-list phrase: ${phrase}`);
});
assert(!dataSource.includes("Extinguister"), "Stocking article should fix the source document's fire-extinguisher typo.");
assert(mockup.nav.some((item) => item.label === "Owner Info" && item.children.some((child) => child.page === "what-to-stock-vacation-rental")), "Owner Info navigation should link to the stocking article.");
assert(script.includes("page.article") && script.includes("owner-guide-article"), "Generic page renderer should support a polished long-form owner guide article.");
[
  ".owner-guide-article",
  ".owner-guide-intro",
  ".owner-guide-section",
  ".owner-guide-checklist",
  ".owner-guide-cta"
].forEach((selector) => {
  assert(styles.includes(selector), `Stocking article needs styling for ${selector}.`);
});
assert(!styles.includes("var(--muted)") && !styles.includes("var(--gold)"), "Owner guide styles should use defined Treasure palette variables.");
assert(script.includes("data-page"), "Original demo pages need data-page routing.");
assert(script.includes("state.selectedPage"), "Original demo page routing needs selected page state.");
assert(script.includes("local-feature-gallery"), "Generic area-guide pages should render venue photo galleries.");
assert(script.includes("restaurant.page"), "Restaurant cards should link to dedicated local feature pages when available.");
assert(script.includes("restaurant.priceRange"), "Restaurant cards should show the average price range.");
assert(script.includes("restaurant.menuUrl"), "Restaurant cards should expose menu links.");
assert(script.includes("venue.positiveReviews"), "Dedicated restaurant pages should render positive review takeaways.");
assert(script.includes("venue.priceRange"), "Dedicated restaurant pages should render price-range information.");
assert(styles.includes(".restaurant-card-actions button.outline-button"), "Restaurant guide-page buttons need a readable button-specific color treatment.");
assert(styles.includes("color: var(--white);"), "Restaurant guide-page buttons should use light text on the dark teal fill.");
assert(Array.isArray(mockup.ownerHighlights) && mockup.ownerHighlights.length >= 3, "Owner pages need management highlights.");
assert(script.includes("We'll Take Care of It"), "Property management page should use the document hero headline.");
assert(script.includes("With a proven track record as a leader in the short term rental market on Topsail Island"), "Property management page should use the document intro copy.");
assert(script.includes("Call 910-328-4444 today or Request a Call Back"), "Property management contact card should include the document CTA line.");
["First name", "Last name", "Phone", "Email", "Property address", "Anything you'd like to share"].forEach((field) => {
  assert(script.includes(field), `Property management contact form should include: ${field}`);
});
assert(script.includes("Why Should You Choose Treasure Vacation Rentals?"), "Property management page should use the document advantages heading.");
[
  "Consistent Rate Analysis",
  "set it and forget it",
  "precision and context...not just algorithms",
  "Thoughtful Property Care",
  "hands-on inspections by someone who knows your property",
  "We Answer The Phone",
  "You shouldn't have to fight for attention from your property manager",
  "Looking For Estimated Revenue?",
  "We look beyond bedroom count when evaluating potential revenue",
  "Owners@treasurerentals.com",
  "Owner reviews/testimonials"
].forEach((phrase) => {
  assert(script.includes(phrase) || dataSource.includes(phrase), `Property management page should include document phrase: ${phrase}`);
});
assert(!script.includes("A Better Owner Experience Starts Before The First Booking"), "Property management page should not use the older placeholder hero headline.");
assert(!script.includes("Property Management Advanteges"), "Property management page should not carry forward the typo from the original implementation.");
assert(!script.includes("John Doe 1"), "Property management page should not use fake owner testimonial filler.");
assert(styles.includes('url("./assets/property-management/canal-hero.jpg") center/cover'), "Property management hero should use the copied canal aerial from the original site.");
[".management-contact-grid", ".management-reasons-grid", ".management-revenue-band", ".management-testimonial-hold"].forEach((selector) => {
  assert(styles.includes(selector), `Property management page needs styling for ${selector}.`);
});
assert(Array.isArray(mockup.areaTowns) && mockup.areaTowns.length === 3, "Area guide needs the three Topsail town pages.");
["North Topsail Beach", "Surf City", "Topsail Beach"].forEach((town) => {
  assert(mockup.areaTowns.some((entry) => entry.label === town), `Missing town page data for ${town}.`);
});
assert(mockup.heroSlides.length === 4, "Homepage hero should keep a four-image scrolling rotation.");
assert(!mockup.heroSlides.some((slide) => slide.image === mockup.downloadedTopsailPhotos.southEndTowerSunset), "Homepage hero should remove the tower/sunrise slide.");
assert(mockup.heroSlides.some((slide) => slide.image === mockup.downloadedTopsailPhotos.oceanfrontDeckChairs), "Homepage hero should bring back the older deck-chairs oceanfront slide.");
mockup.towns.forEach((town) => {
  assert(town.image, `${town.label} needs an image for the homepage town card.`);
  assert(town.description && town.description.length > town.note.length, `${town.label} needs a fuller homepage town-card description.`);
});
assert(styles.includes('url("./assets/topsail-beach/island-overview.jpg") center/cover'), "Area Guide hero should use a local Topsail Island aerial image.");
assert(!styles.includes("photo-1507525428034"), "Area Guide hero should not use the generic palm-tree beach image.");
assert(Array.isArray(mockup.restaurants) && mockup.restaurants.length >= 18, "Restaurants page needs a more complete local starter list.");
["North Topsail Beach", "Surf City", "Topsail Beach", "Sneads Ferry"].forEach((town) => {
  assert(mockup.restaurants.some((entry) => entry.town === town || entry.near === town), `Restaurants page needs ${town} coverage.`);
});
assert(!mockup.restaurants.some((entry) => /shuckin'? shack|subway|mcdonald|burger king|wendy|domino|pizza hut|taco bell|bojangles|starbucks/i.test(entry.name)), "Restaurant guide should not include chain restaurants.");
mockup.restaurants.forEach((restaurant) => {
  assert(restaurant.page, `${restaurant.name} needs a dedicated page route.`);
  assert(restaurant.priceRange, `${restaurant.name} needs a visible price range.`);
  assert(restaurant.menuUrl, `${restaurant.name} needs a menu URL or menu source.`);
  assert(restaurant.officialUrl || restaurant.googlePlaceUrl, `${restaurant.name} needs a restaurant source link.`);
  assert(Array.isArray(restaurant.positiveReviews) && restaurant.positiveReviews.length >= 3, `${restaurant.name} needs positive review takeaways.`);
  assert(Array.isArray(restaurant.images) && restaurant.images.length >= 3, `${restaurant.name} needs at least three actual restaurant images.`);
  assert(!restaurant.images.some((image) => /images\.unsplash\.com/i.test(image)), `${restaurant.name} should not use generic Unsplash photos.`);
  assert(mockup.demoPages.some((page) => page.id === restaurant.page && page.venue && page.venue.name === restaurant.name), `${restaurant.name} needs a dedicated venue-backed demo page.`);
});
const highTidesPage = mockup.demoPages.find((page) => page.id === "high-tides-good-vibes");
assert(highTidesPage, "High Tides & Good Vibes needs a dedicated area-guide page.");
assert(highTidesPage.section === "Area Guide", "High Tides page should live in the Area Guide section.");
assert(highTidesPage.venue && highTidesPage.venue.googlePlaceUrl.includes("google.com/maps"), "High Tides page needs a Google Place URL.");
assert(highTidesPage.venue.officialUrl.includes("hightidesandgoodvibes.com"), "High Tides page needs the official site as a source.");
assert(highTidesPage.venue.images.length >= 3, "High Tides page needs a small photo set.");
assert(mockup.nav.some((item) => item.children.some((child) => child.page === "high-tides-good-vibes")), "High Tides page should be reachable from nav.");
assert(mockup.restaurants.some((entry) => entry.name === "High Tides & Good Vibes" && entry.page === "high-tides-good-vibes"), "High Tides should appear in the restaurant guide with a page link.");
assert(Array.isArray(mockup.nightlife) && mockup.nightlife.length >= 24, "Nightlife page needs a broad local bar starter list.");
["Surf City", "North Topsail Beach", "Topsail Beach", "Hampstead", "Sneads Ferry", "Holly Ridge"].forEach((town) => {
  assert(mockup.nightlife.some((entry) => entry.town === town || entry.near === town), `Nightlife page needs ${town} coverage.`);
});
assert(!mockup.nightlife.some((entry) => /quarter moon/i.test(entry.name)), "Nightlife guide should not include Quarter Moon as an active bar.");
assert(script.includes("state.nightlifeTown"), "Nightlife town filters need selected town state.");
assert(script.includes("data-nightlife-town"), "Nightlife town filters need click routing.");
assert(script.includes("data-nightlife-page"), "Nightlife view needs a render target.");
assert(mockup.nav.some((menu) => menu.children.some((item) => item.view === "nightlife")), "Navigation should expose the nightlife page.");
mockup.nightlife.forEach((bar) => {
  assert(bar.page, `${bar.name} needs a dedicated page route.`);
  assert(bar.priceRange, `${bar.name} needs a visible price range.`);
  assert(bar.googlePlaceUrl || bar.officialUrl, `${bar.name} needs a source link.`);
  assert(Array.isArray(bar.positiveReviews) && bar.positiveReviews.length >= 3, `${bar.name} needs positive review takeaways.`);
  assert(Array.isArray(bar.images) && bar.images.length >= 3, `${bar.name} needs at least three actual bar or venue images.`);
  assert(!bar.images.some((image) => /images\.unsplash\.com/i.test(image)), `${bar.name} should not use generic Unsplash photos.`);
  assert(mockup.demoPages.some((page) => page.id === bar.page && page.venue && page.venue.name === bar.name), `${bar.name} needs a dedicated venue-backed guide page.`);
});
const petFriendlyPage = mockup.demoPages.find((page) => page.id === "pet-friendly");
assert(petFriendlyPage, "Pet-friendly rentals page needs demo-page data.");
assert(petFriendlyPage.image.includes("assets/pet-friendly/black-goldendoodle-beach.png"), "Pet-friendly page should use the generated black Goldendoodle beach hero.");
assert(fs.existsSync("assets/pet-friendly/black-goldendoodle-beach.png"), "Generated pet-friendly hero asset should exist in the project.");
assert(petFriendlyPage.matchingTitle === "Dog-friendly Properties", "Pet-friendly matching section should be labeled Dog-friendly Properties.");
assert(script.includes("page.matchingTitle || \"Matching Rentals\""), "Generic page renderer should support page-specific matching section titles.");
const guestPortalPage = mockup.demoPages.find((page) => page.id === "guest-portal");
assert(guestPortalPage, "Guest Portal needs demo-page data.");
assert(guestPortalPage.image.includes("assets/topsail-beach/coastal-residential-community.jpg"), "Guest Portal should use a Topsail beach hero, not a tropical resort image.");
assert(!guestPortalPage.image.includes("photo-1499793983690"), "Guest Portal should not use the old tropical resort Unsplash image.");
const downloadedTopsailPhotos = mockup.downloadedTopsailPhotos;
assert(downloadedTopsailPhotos && typeof downloadedTopsailPhotos === "object", "Mockup data needs a reusable downloaded Topsail photo pool.");
const requiredDownloadedPhotoKeys = [
  "jollyRogerTower",
  "southEndTowerSunset",
  "oceanfrontDeckChairs",
  "wideBeach",
  "dogWalkBeach",
  "beachFromBalcony"
];
requiredDownloadedPhotoKeys.forEach((key) => {
  const image = downloadedTopsailPhotos[key];
  assert(typeof image === "string" && image.includes("assets/topsail-downloads/"), `Downloaded Topsail photo missing from pool: ${key}`);
  assert(fs.existsSync(image.replace(/^\.\//, "")), `Downloaded Topsail photo asset should exist: ${image}`);
});
const downloadedTopsailPhotoUrls = new Set(Object.values(downloadedTopsailPhotos));
assert(mockup.heroSlides.filter((slide) => downloadedTopsailPhotoUrls.has(slide.image)).length >= 3, "Homepage hero should favor downloaded Topsail Island photos over generic stock.");
assert(mockup.quickLinks.filter((link) => downloadedTopsailPhotoUrls.has(link.image) || link.image.includes("assets/pet-friendly/") || link.image.includes("assets/quick-cards/")).length >= 4, "Quick trip cards should favor project-local or real listing imagery over generic stock.");
const expectedQuickCardImages = {
  Oceanfront: "./assets/quick-cards/oceanfront-living-room-ocean-view.png",
  "Private Pool": "./assets/quick-cards/private-pool-aerial-home.png",
  "Dog Friendly": "./assets/quick-cards/dog-friendly-beach.png",
  "Event Friendly": "./assets/quick-cards/event-friendly-beach-wedding.png",
  Specials: "./assets/quick-cards/specials-beach-sunset.png"
};
Object.entries(expectedQuickCardImages).forEach(([label, image]) => {
  const link = mockup.quickLinks.find((entry) => entry.label === label);
  assert(link, `Missing quick card: ${label}`);
  assert(link.image === image, `${label} quick card should use ${image}.`);
  assert(fs.existsSync(image.replace(/^\.\//, "")), `${label} quick card asset should exist: ${image}`);
});
assert(mockup.quickLinks.length === 5, "Popular Topsail Searches should have five quick cards including Specials.");
const quickLinksBlock = styleBlock(".quick-links.section-pad");
const quickGridBlock = styleBlock(".quick-grid");
const quickCardBlock = styleBlock(".quick-card");
assert(quickLinksBlock.includes("width: min(1480px, calc(100% - 40px));"), "Popular Topsail Searches should use a wider fluid section width on large screens.");
assert(quickGridBlock.includes("grid-template-columns: repeat(5, minmax(0, 1fr));"), "Popular Topsail Searches should fit all five quick cards on one desktop row.");
assert(quickGridBlock.includes("gap: clamp(10px, 1.1vw, 16px);"), "Popular Topsail Searches should contract spacing fluidly with viewport width.");
assert(quickCardBlock.includes("min-height: clamp(190px, 15vw, 235px);"), "Popular Topsail quick cards should scale their height fluidly instead of keeping a fixed desktop size.");
assert(styles.includes("  .quick-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }"), "Popular Topsail Searches should use a compact two-column tablet layout.");
assert(styles.includes("  .quick-grid {\n    grid-template-columns: 1fr;\n  }"), "Popular Topsail Searches should keep a simple one-card mobile layout.");
const specialsQuickCard = mockup.quickLinks.find((entry) => entry.label === "Specials");
assert(specialsQuickCard.view === "content", "Specials quick card should route to the existing Specials page.");
assert(specialsQuickCard.page === "specials", "Specials quick card should target the specials page id.");
assert(specialsQuickCard.pill === "High-End Top 20", "Specials quick card should keep the existing specials inventory filter.");
assert(script.includes("quickLinkRouteAttributes"), "Quick-card renderer should support per-card route metadata.");
[
  "oceanfront",
  "event-friendly",
  "elevator",
  "specials",
  "owner-portal",
  "real-estate",
  "faq",
  "explore-eastern-nc",
  "blog",
  "about",
  "contact",
  "terms"
].forEach((pageId) => {
  const page = mockup.demoPages.find((entry) => entry.id === pageId);
  assert(page, `Missing demo page for local photo check: ${pageId}`);
  assert(downloadedTopsailPhotoUrls.has(page.image), `${pageId} should use a downloaded Topsail Island image instead of generic stock.`);
});
const teamPage = mockup.demoPages.find((entry) => entry.id === "team");
assert(teamPage, "About Us > Our Team needs a dedicated team page.");
assert(teamPage.image === "./assets/team/treasure-booty-back-team.png", "Our Team page should use the provided humorous team photo asset.");
assert(teamPage.video === "./assets/team/treasure-booty-back-team.mp4", "Our Team page should use the provided team video asset.");
assert(teamPage.heroImage && teamPage.heroImage !== teamPage.image && teamPage.heroImage !== teamPage.video, "Our Team hero should use a separate Topsail beach image instead of repeating the team video/photo.");
assert(downloadedTopsailPhotoUrls.has(teamPage.heroImage), "Our Team hero should use a downloaded Topsail Island image.");
assert(fs.existsSync("assets/team/treasure-booty-back-team.png"), "Our Team photo asset should be copied into the project.");
assert(fs.existsSync("assets/team/treasure-booty-back-team.mp4"), "Our Team video asset should be copied into the project.");
assert(mockup.nav.some((item) => item.label === "About Us" && item.children.some((child) => child.label === "Our Team" && child.page === "team")), "About Us > Our Team should route to the team page, not the generic about page.");
assert(script.includes("team-page-body") && script.includes("team-photo-card"), "Generic page renderer should give the team page a custom photo-forward layout.");
assert(script.includes("page.heroImage || page.image"), "Generic page hero should support a separate hero image from the content image.");
assert(script.includes("team-video-card") && script.includes("data-team-video") && script.includes("data-team-poster"), "Team page should render a poster-first video card.");
assert(script.includes("window.setTimeout(playTeamVideo, 3000)") && script.includes("teamVideoHasPlayed") && script.includes('addEventListener("ended"'), "Team video should wait 3 seconds, play once, then return to the photo.");
assert(script.includes("Local, A Little Playful, But Serious About Your Investment"), "Team page headline should balance playful tone with owner-investment seriousness.");
assert(!script.includes("Local, A Little Playful, And Very Much Human"), "Team page should not use the older softer headline.");
assert(styles.includes(".team-photo-card"), "Team page needs dedicated photo styling.");
assert(styles.includes(".team-video-card") && styles.includes(".team-poster-frame") && styles.includes(".team-video-frame"), "Team page needs dedicated poster/video styling.");
function styleBlock(selector) {
  const start = styles.indexOf(selector);
  assert(start >= 0, `Missing style block: ${selector}`);
  const end = styles.indexOf("\n}", start);
  assert(end >= 0, `Could not read style block: ${selector}`);
  return styles.slice(start, end + 2);
}
[".page-hero", ".owner-hero", ".management-hero", ".restaurants-hero"].forEach((selector) => {
  const block = styleBlock(selector);
  assert(block.includes("assets/topsail-downloads/") || block.includes("assets/topsail-beach/") || block.includes("assets/property-management/"), `${selector} should use a local Topsail image.`);
  assert(!block.includes("images.unsplash.com"), `${selector} should not use a generic Unsplash background.`);
});
const searchHeroBlock = styleBlock(".search-hero");
assert(searchHeroBlock.includes('url("./assets/topsail-downloads/search-results-sunset.png") center/cover'), "Search results hero should use the supplied Topsail sunset image.");
assert(fs.existsSync("assets/topsail-downloads/search-results-sunset.png"), "Search results hero asset should exist locally.");
["Oceanfront", "Second Row", "Sound View", "Sound Front", "Canal Front", "Interior"].forEach((label) => {
  assert(html.includes(`>${label}<`) || html.includes(`>${label}</option>`), `Missing location type: ${label}`);
});
assert(!html.includes("<option>North Topsail Beach</option>"), "Hero location field should not list towns.");
assert((html.match(/class="intro-block intro-band"/g) || []).length >= 2, "Both homepages should use the full-width intro band.");
assert(!html.includes("class=\"intro-block section-pad\""), "Intro should no longer be a narrow section-pad card.");
assert(styleBlock(".intro-block").includes("padding: 58px 24px 50px;"), "Intro band should trim top and bottom blue space by about 20%.");
assert((html.match(/<span class="intro-script">Topsail Island Getaway<\/span>/g) || []).length >= 2, "Both intro headlines should use a script-styled Topsail Island Getaway phrase.");
assert(!html.includes("Vacation homes made for your Topsail getaways"), "Intro blocks should not use the previous compact headline.");
assert(!html.includes("Vacation Homes Made For Your Topsail Island Getaway"), "Intro blocks should not use the oversized older getaway headline.");
const featuredCopy = "Our featured homes capture the best of Topsail Island living - set along its beaches, soundside marshes, and quiet coastal neighborhoods. Whether it's a true oceanfront retreat, a luxury escape near the water, or a home with sweeping sunset views, each one offers a stay that feels distinctly local and genuinely memorable.";
assert((html.match(/class="featured-band"/g) || []).length >= 2, "Both homepages should give Featured Properties a full-width blue intro band.");
assert((html.split('<span>The</span> <span class="featured-script">Treasure Trove</span>').length - 1) >= 2, "Featured Properties should use a script-styled Treasure Trove headline.");
assert((html.match(new RegExp(featuredCopy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length >= 2, "Both Featured Properties sections should use the supplied Treasure Trove copy.");
assert(!html.includes("View All Properties"), "Treasure Trove band should not include a View All Properties button.");
assert(!html.includes("<h2>Featured Topsail Homes</h2>"), "Featured Properties should not use the old plain Featured Topsail Homes heading.");
assert(styleBlock(".featured-band").includes("var(--parrot-teal-soft)"), "Featured Properties band should reuse the blue background treatment.");
assert(styleBlock(".featured-band").includes("padding: 42px 24px 38px;"), "Featured Properties band should be tightened vertically.");
assert(styleBlock(".featured-band-inner").includes("gap: 14px;"), "Featured Properties band inner spacing should be tightened.");
assert(styles.includes(".featured-script"), "Featured Properties needs a decorative script font class.");
assert(script.includes("const FEATURED_PROPERTY_COUNT = 11"), "Featured Properties should show the original three plus eight more featured homes.");
assert(script.includes(".slice(0, FEATURED_PROPERTY_COUNT)"), "Featured Properties should use the configured 11-property count.");
assert((html.match(/class="featured-carousel"/g) || []).length >= 2, "Both Featured Properties sections should use a horizontal carousel shell.");
assert((html.match(/class="featured-property-track"/g) || []).length >= 2, "Both Featured Properties sections should render cards into a horizontal track.");
assert((html.match(/data-featured-scroll/g) || []).length >= 4, "Featured Properties should include previous and next scroll controls on both homepages.");
assert(!html.includes('class="property-grid" data-featured-properties'), "Featured Properties should no longer use the three-column static grid.");
assert(html.includes("./styles.css?v=20260527-owner-stock-guide"), "Owner guide styles should bump the stylesheet cache key.");
assert(html.includes("./script.js?v=20260527-owner-stock-guide"), "Owner guide renderer should bump the script cache key.");
assert(html.includes("./mockup-data.js?v=20260527-owner-stock-guide"), "Owner guide content should bump the mockup data cache key.");
assert(script.includes("const FEATURED_SCROLL_SPEED = 0.075"), "Featured Properties should auto-scroll at the requested 3x preview pace.");
assert(script.includes("function scrollFeaturedProperties(timestamp)"), "Featured Properties should have a dedicated auto-scroll loop.");
assert(script.includes("window.requestAnimationFrame(scrollFeaturedProperties)"), "Featured Properties auto-scroll should use requestAnimationFrame.");
assert(script.includes('window.matchMedia("(prefers-reduced-motion: reduce)")'), "Featured Properties auto-scroll should respect reduced-motion preferences.");
assert(script.includes('track.matches(":hover")') && script.includes("track.contains(document.activeElement)"), "Featured Properties auto-scroll should pause during hover or keyboard focus.");
assert(script.includes('track.classList.add("is-auto-scrolling")'), "Featured Properties auto-scroll should disable snap while it is actively moving.");
assert(script.includes("track.dataset.featuredScrollLeft"), "Featured Properties auto-scroll should retain sub-pixel scroll progress between frames.");
assert(styleBlock(".featured-property-track.is-auto-scrolling").includes("scroll-snap-type: none;"), "Featured Properties auto-scroll should not be pinned by scroll snapping.");
assert(script.includes("pauseFeaturedAutoScroll(track"), "Featured Properties manual controls should briefly pause auto-scroll.");
assert(!html.includes("Property Management Should Feel As Cared For As The Home"), "Homepages should not show the old owner CTA band.");
assert((html.match(/class="section-pad reviews-band"/g) || []).length >= 2, "Both homepages should replace the owner CTA with a guest reviews band.");
assert((html.match(/data-review-carousel/g) || []).length >= 2, "Guest reviews need carousel containers on both homepages.");
assert((html.match(/What Our Guests Say/g) || []).length >= 2, "Guest reviews should use the screenshot-style 'What Our Guests Say' heading on both homepages.");
assert((html.match(/class="review-stars"/g) || []).length >= 8, "Guest reviews should show five-star social proof on every slide.");
assert((html.match(/data-review-dot="0"/g) || []).length >= 2, "Guest reviews should use dot pagination on both homepages.");
assert(!html.includes("data-review-action=\"pause\""), "Guest reviews should not show the old bulky pause control.");
assert(styles.includes(".reviews-script-heading"), "Guest review band needs the script heading style from the reference.");
assert(styles.includes(".review-dots"), "Guest review band needs centered dot pagination styling.");
assert(!styleBlock(".review-carousel").includes("background: var(--teal-dark);"), "Guest review carousel should not use the old dark card treatment.");
assert(script.includes("rotateReviewCarousels"), "Guest reviews should rotate automatically over time.");
assert(script.includes("setInterval(rotateReviewCarousels"), "Guest reviews should schedule automatic rotation.");
assert(styleBlock(".featured-property-track").includes("overflow-x: auto"), "Featured Properties track should allow horizontal scrolling.");
assert(styleBlock(".featured-property-track").includes("scroll-snap-type: x mandatory"), "Featured Properties track should snap between cards.");
assert(styleBlock(".featured-property-track .property-card").includes("scroll-snap-align: start"), "Featured cards should snap cleanly at card edges.");
assert(script.includes("data-featured-scroll"), "Featured Properties scroll buttons need JS handling.");
assert(script.includes("scrollTo"), "Featured Properties scroll buttons should move to the next card position.");
["home", "home-video"].forEach((viewId) => {
  const start = html.indexOf(`<section id="${viewId}"`);
  const end = viewId === "home" ? html.indexOf(`<section id="home-video"`) : html.indexOf(`<section id="search"`);
  const viewHtml = html.slice(start, end);
  assert(viewHtml.indexOf("booking-search") < viewHtml.indexOf("intro-band"), `${viewId} intro band should sit below the search form.`);
  assert(viewHtml.indexOf("intro-band") < viewHtml.indexOf("quick-links"), `${viewId} intro band should sit above Popular Topsail Searches.`);
});
const townIntroCopy = "Experience the charm of our 26-mile barrier island off the coast of North Carolina, where every stay feels uniquely your own. Topsail Island is home to three distinct communities, North Topsail Beach, Surf City, and Topsail Beach, each offering its own rhythm and character, all contributing to the island's award-winning appeal. Days here are spent by the water - fishing at sunrise, paddling through quiet inlets, boating along the Intracoastal, or surfing rolling Atlantic waves. Evenings invite exploration of locally loved restaurants, coastal shops, and vibrant community events. With its rich history and quiet access to nature, Topsail Island is the perfect destination for a relaxed, beach-focused getaway.";
assert((html.match(new RegExp(townIntroCopy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length >= 2, "Both homepage town sections should use the expanded Topsail Island intro copy.");
assert(!html.includes("North Topsail Beach, Surf City, and Topsail Beach each bring their own pace."), "Town section should not use the older short intro copy.");
[
  "Welcome to Treasure Vacation Rentals...your starting point",
  "slow mornings, salt air",
  "Find Eastern North Carolina peace",
  "truly feel at home"
].forEach((phrase) => {
  assert(html.includes(phrase), `Intro copy should include: ${phrase}.`);
});
assert(script.includes("galleryImages"), "Property cards/detail need gallery image handling.");
assert(script.includes("property.images"), "Property carousels should read per-property image arrays.");
assert(!script.includes("const fallbackImages = data.heroSlides"), "Property carousels should not pad listings with generic hero slides.");
const heroImages = new Set(mockup.heroSlides.map((slide) => slide.image));
const carouselRichProperties = properties.filter((property) => Array.isArray(property.images) && property.images.length >= 2);
assert(carouselRichProperties.length >= properties.length - 1, "Almost every property should have multiple sourced listing images.");
properties.forEach((property) => {
  assert(Array.isArray(property.images) && property.images.length >= 1, `Missing sourced image array for ${property.id}`);
  property.images.forEach((image) => {
    assert(typeof image === "string" && image.startsWith("http"), `Invalid image URL for ${property.id}`);
    assert(!heroImages.has(image), `Property carousel should not use generic hero image for ${property.id}`);
    assert(!image.includes("images.unsplash.com"), `Property carousel should use sourced listing/Supabase images, not Unsplash: ${property.id}`);
    assert(!image.includes("airbnb-platform-assets"), `Airbnb platform asset leaked into listing carousel for ${property.id}`);
  });
});
assert(script.includes("formatSquareFeet"), "SERP cards need square-foot formatting.");
assert(script.includes("property.squareFeet"), "SERP cards should render square feet from property data.");
assert(!dataSource.includes("function estimateSquareFeet"), "Square feet should come from Supabase data, not an estimate formula.");
assert(dataSource.includes("const propertySquareFeet"), "Mockup data needs a Supabase-sourced square-foot map.");
assert(!script.includes("Est. ${number.format(value)} sq ft"), "SERP square feet should not be labeled as estimated.");
[
  ["P29221", 3473],
  ["P6797", 5839],
  ["P37354", 2130],
  ["P5216", 3112],
  ["P6440", 4726]
].forEach(([id, squareFeet]) => {
  const property = properties.find((entry) => entry.id === id);
  assert(property && property.squareFeet === squareFeet, `${id} should use Supabase square feet ${squareFeet}.`);
});
assert(script.includes("photo-scroll-indicator"), "Image galleries need scroll indicators.");
assert(script.includes("carousel-button"), "Search result photos need visible carousel controls.");
assert(script.includes("data-carousel-direction"), "Carousel controls need directional behavior.");
assert(script.includes("moveCardCarousel"), "Search result carousel controls should scroll card photos.");
assert(script.includes("&#9825;"), "Visible save control should use a heart icon.");
assert(script.includes('aria-hidden="true"'), "Heart icon should be hidden from screen readers.");
assert(!script.includes('aria-label="Save ${property.name}">Save</button>'), "Save button should not show the word Save in the circle.");
assert(script.includes("locationClass"), "Search filtering needs locationClass support.");
assert(styles.includes(".photo-track"), "Search result cards need a scrollable photo track.");
assert(styles.includes(".carousel-button"), "Search result carousel controls need styling.");
assert(styles.includes(".detail-photo-track"), "Property detail needs a scrollable gallery track.");
[
  "detail-photo-mosaic",
  "detail-property-kicker",
  "detail-page-actions",
  "detail-key-facts",
  "detail-action-icons",
  "detail-summary-grid",
  "property-deal-banner",
  "weekly-specials",
  "detail-location-map",
  "detail-calendar-pair",
  "featured-amenities",
  "amenity-category-grid",
  "bedding-room-grid",
  "guest-info-list",
  "property-qa-panel",
  "request-info-panel",
  "review-list",
  "mobile-availability-bar",
  "detail-booking-sidebar"
].forEach((token) => {
  assert(script.includes(token), `Property detail should include reference-style ${token}.`);
});
assert(script.includes("Matterport Virtual Tour"), "Property detail should expose a virtual tour action near the photo/title area.");
assert(script.includes("Send to a Friend"), "Property detail should include send-to-friend action like the reference flow.");
assert(script.includes("Ask Your Question"), "Property detail should include a property-specific Q&A prompt.");
assert(script.includes("Request Info"), "Property detail should include a request-info form panel.");
assert(script.includes("Choose your dates"), "Property detail booking sidebar should use reference-style choose-your-dates language.");
assert(!script.includes("<h2>Book This Stay</h2>"), "Property detail should not use the old generic Book This Stay sidebar.");
[
  ".detail-photo-mosaic",
  ".detail-property-kicker",
  ".detail-page-actions",
  ".detail-key-facts",
  ".detail-action-icons",
  ".detail-summary-grid",
  ".property-deal-banner",
  ".weekly-specials",
  ".detail-location-map",
  ".detail-calendar-pair",
  ".featured-amenities",
  ".amenity-category-grid",
  ".bedding-room-grid",
  ".guest-info-list",
  ".property-qa-panel",
  ".request-info-panel",
  ".review-list",
  ".mobile-availability-bar",
  ".detail-booking-sidebar"
].forEach((selector) => {
  assert(styles.includes(selector), `Property detail styles should include ${selector}.`);
});
assert(styles.includes("min-height: clamp(520px, 66vh, 650px);"), "Hero should be about 30% shorter.");
assert(styles.includes("font-size: clamp(40px, 5vw, 66px);"), "Hero headline should be visually reduced.");
const sixteenBedroomCopies = properties.filter((property) => property.name === "Large Oceanfront House *16 BR * Pool/Elevator");
assert(sixteenBedroomCopies.length === 1, "Only one sixteen-bedroom duplicate should remain.");
assert(sixteenBedroomCopies[0].reviews === 5, "The retained sixteen-bedroom listing should be the five-review copy.");
const topsailManor = properties.find((property) => property.name === "Topsail Manor");
assert(topsailManor, "Topsail Manor should exist in the inventory.");
assert(topsailManor.locationClass === "Oceanfront", "Topsail Manor should be classified as Oceanfront.");
assert(topsailManor.tags.includes("Oceanfront"), "Topsail Manor should carry an Oceanfront tag.");
assert(!topsailManor.tags.includes("Second Row"), "Topsail Manor should not carry a Second Row tag.");
assert(!topsailManor.description.toLowerCase().includes("second row"), "Topsail Manor copy should not call it second row.");
const topsailBeachProperties = properties.filter((property) => property.location === "Topsail Beach");
assert(topsailBeachProperties.length >= 8, "Topsail Beach town page needs at least eight real property rows.");
topsailBeachProperties.forEach((property) => {
  assert(!property.image.includes("images.unsplash.com"), `Topsail Beach property should use a sourced listing image: ${property.id}`);
  assert(Number.isFinite(property.lat) && Number.isFinite(property.lng), `Topsail Beach property needs coordinates: ${property.id}`);
});
const surfCityTown = mockup.areaTowns.find((town) => town.label === "Surf City");
assert(surfCityTown, "Surf City town landing page should exist.");
assert(surfCityTown.image.includes("Surf_City_Pier_1.jpg"), "Surf City town landing page should use a real Surf City pier/beach image.");
const northTopsailTown = mockup.areaTowns.find((town) => town.label === "North Topsail Beach");
assert(northTopsailTown, "North Topsail Beach town landing page should exist.");
assert(downloadedTopsailPhotoUrls.has(northTopsailTown.image), "North Topsail Beach should use a downloaded Topsail image instead of generic stock.");
const topsailBeachTown = mockup.areaTowns.find((town) => town.label === "Topsail Beach");
assert(topsailBeachTown, "Topsail Beach town landing page should exist.");
assert(Array.isArray(topsailBeachTown.images) && topsailBeachTown.images.length >= 3, "Topsail Beach town page should use the downloaded local photos as a carousel.");
topsailBeachTown.images.forEach((image) => {
  assert(image.includes("assets/topsail-beach/"), `Topsail Beach carousel image should be a local project asset: ${image}`);
  assert(!image.includes("images.unsplash.com"), "Topsail Beach carousel should not use the generic mountain/beach Unsplash photo.");
});
assert(topsailBeachTown.image === topsailBeachTown.images[0], "Topsail Beach fallback image should be the first carousel image.");
assert(script.includes("townHeroSlides"), "Town page renderer should render carousel slides.");
assert(script.includes("data-town-carousel"), "Town page hero should expose carousel slides.");
assert(script.includes("rotateTownCarousel"), "Town page carousel should auto-rotate through the downloaded photos.");
assert(script.includes("setInterval(rotateTownCarousel"), "Town page carousel should be scheduled to shuffle automatically.");
assert(!script.includes("data-town-carousel-step"), "Town page carousel should not show dead-looking manual arrow controls.");
assert(!script.includes("town-hero-dots"), "Town page carousel should not show a little inactive-looking dot box.");
assert(styles.includes(".town-hero-slide"), "Town carousel slides need dedicated styling.");
assert(!styles.includes(".town-hero-controls"), "Town carousel should not render the little inactive-looking control box.");
assert(!styles.includes(".town-hero-dots"), "Town carousel should not style an inactive-looking dot box.");
assert(!html.includes("site-search"), "Header site search should be removed.");
assert(!html.includes('id="site-search"'), "Header site search input should be removed.");
assert(!html.includes("class=\"announcement\""), "Vision mockup announcement bar should be removed.");
assert(!html.includes("data-close-announcement"), "Announcement close button should be removed with the bar.");
assert(!script.includes("data-close-announcement"), "Announcement close handler should be removed with the bar.");
assert(!styles.includes(".announcement"), "Announcement styles should be removed with the bar.");
assert(styles.includes(".brand {\n  align-self: flex-end;"), "Header logo should sit down on the main-nav fold.");
assert(styles.includes("overflow: visible;"), "Header logo should allow the parrot tail to hang slightly past the fold.");
assert(styles.includes("margin-bottom: -15px;"), "Header logo should nudge below the fold just enough for the parrot tail to overhang.");
assert(styles.includes("width: clamp(300px, 25vw, 390px);"), "Header logo should be larger and more prominent.");
assert(properties.filter((property) => property.tags.includes("High-End Top 20")).length === 20, "High-End Top 20 should still contain 20 listings after duplicate cleanup.");
assert(html.includes("results-control-bar"), "Search results need a top dropdown filter bar.");
assert(!html.includes('<aside class="filters"'), "Search results should not use the old sidebar filter rail.");
assert(html.includes("data-filter-toggle"), "Search results need a top Filters dropdown trigger.");
assert(html.includes("data-filter-panel"), "Search results need a collapsible top filter panel.");
assert(html.includes("data-filter-counter=\"bedrooms\""), "Top filter panel needs Joe Lamb-style bedroom controls.");
assert(html.includes("data-filter-counter=\"bathrooms\""), "Top filter panel needs Joe Lamb-style bathroom controls.");
assert(html.includes("data-filter-group=\"towns\""), "Top filter panel needs Topsail town filters.");
assert(html.includes("data-filter-group=\"locationClasses\""), "Top filter panel needs Topsail waterfront/location filters.");
assert(html.includes("data-filter-group=\"amenities\""), "Top filter panel needs Topsail amenity filters.");
assert(html.includes("data-filter-group=\"collections\""), "Top filter panel needs Topsail collection filters.");
assert(html.includes("data-specific-property"), "Top filter panel needs specific property lookup.");
assert(script.includes("toggleFilterPanel"), "Filter trigger should open and close the top drawer.");
assert(script.includes("updateCounterFilter"), "Bedroom and bathroom controls should update search state.");
assert(script.includes("applyFacetCheckbox"), "Facet checkboxes should update search state.");
assert(html.includes("data-island-map"), "Search results need a right-side island map panel.");
assert(script.includes("renderIslandMap"), "Search results should render island markers from filtered properties.");
assert(script.includes('propertyCard(property, "compact")'), "Search results should use compact cards instead of wide list cards.");
assert(!html.includes("seo-intro"), "Search results should not show the intro/pill card above the listings.");
assert(!html.includes("Find The Topsail Stay That Fits"), "Search results intro headline should be removed.");
assert(styles.includes(".search-results-layout"), "Search layout should split results and island map.");
assert(styles.includes(".top-filter-panel"), "Search results page needs a styled top dropdown filter panel.");
assert(styles.includes(".filter-stepper"), "Bedroom and bathroom controls need stepper styling.");
assert(styles.includes(".filter-checkbox-grid"), "Filter checkbox groups need grid styling.");
assert(styles.includes("width: min(1900px, calc(100% - 32px));"), "Search results shell should expand on wide screens.");
assert(styles.includes("grid-template-columns: minmax(0, 1fr) clamp(340px, 27vw, 520px);"), "Desktop search layout should reserve a right-side island panel without choking the results grid.");
assert(styles.includes("repeat(auto-fit, minmax(min(320px, 100%), 1fr))"), "Result cards should use CCR-sized cards instead of shrinking to five-across on wide screens.");
assert(script.includes("compactPropertyCard"), "Search results should use a dedicated info-first compact card renderer.");
assert(script.includes("compact-property-photo"), "Compact search result cards should keep a property hero photo attached.");
assert(script.includes("results-card-head"), "Compact result cards need a title/rating header like the reference.");
assert(script.includes("${property.locationClass} - ${property.location}"), "Compact result cards need location-class and town detail.");
assert(script.includes("View Property Details"), "Compact result cards should use the fuller View Property Details action.");
assert(script.includes('icon: "bed"') && script.includes('icon: "bath"'), "Compact result cards should render bed and bath icons.");
assert(html.includes("mockup-data.js?v="), "Mockup data script should be cache-busted for inventory corrections.");
assert(html.includes("maplibre-gl.css"), "Rotated actual map needs MapLibre CSS.");
assert(html.includes("maplibre-gl.js"), "Rotated actual map needs MapLibre JS.");
assert(script.includes("TOPSAIL_PRESENTATION_BEARING"), "Map should have an explicit presentation bearing for vertical Topsail orientation.");
assert(script.includes("maplibregl.Map"), "Right-side panel should initialize a real rotatable MapLibre map.");
assert(script.includes("tile.openstreetmap.org"), "Actual map should use real OpenStreetMap raster tiles.");
assert(script.includes("fitBounds"), "Rotated map should fit to selected property markers.");
assert(script.includes("property-map-marker"), "Actual map should render custom property markers.");
assert(script.includes("mapPopupCard"), "Map markers should open listing-card popups.");
assert(script.includes("data-map-property-id"), "Map popup cards should click through to property detail pages.");
assert(script.includes("map-popup-photo"), "Map popup cards should include a property photo.");
assert(script.includes("marker-active"), "Clicked map markers should visibly stay selected while their popup is open.");
assert(styles.includes(".property-map"), "Right-side panel should style the real map container.");
assert(styles.includes(".property-map-marker"), "Actual map should style property markers.");
assert(styles.includes(".map-popup-card"), "Map popup cards need dedicated listing-card styling.");
assert(styles.includes(".map-popup-photo"), "Map popup cards need photo styling.");
assert(styles.includes(".property-map-marker.marker-active"), "Selected map markers should have an active style.");
assert(styles.includes(".property-map .maplibregl-canvas-container"), "Map canvas layer should allow page wheel scrolling to pass through.");
assert(styles.includes("pointer-events: none;"), "Map canvas pass-through should disable pointer capture on the map surface.");
assert(styles.includes(".property-map-marker,\n.maplibregl-marker,\n.property-map .maplibregl-control-container"), "Map markers and controls should remain clickable after scroll pass-through.");
assert(styles.includes("--parrot-teal"), "Styles should include the brighter parrot teal from the logo.");
assert(styles.includes("--parrot-teal-soft"), "Styles should include a soft parrot teal tint for subtle UI accents.");
assert(styles.includes("transition: filter .18s ease, transform .18s ease, box-shadow .18s ease;"), "Quick trip cards should animate the hover shadow.");
assert(styles.includes("box-shadow: 0 18px 34px rgba(29, 49, 53, .22);"), "Quick trip cards should get a subtle drop shadow on hover.");
[
  ".nav-item > button::after",
  ".booking-search",
  ".results-control-bar",
  ".property-card:hover",
  ".marker-pin",
  ".site-footer"
].forEach((selector) => {
  assert(styles.includes(selector), `Parrot teal pass should touch ${selector}.`);
});
assert(styleBlock(".booking-search label").includes("min-width: 0;"), "Booking search labels should be allowed to shrink on iPhone.");
assert(styleBlock(".booking-search input,\n.booking-search select").includes("min-width: 0;"), "Booking search controls should not keep an iOS intrinsic minimum width.");
assert(styleBlock(".booking-search input,\n.booking-search select").includes("max-width: 100%;"), "Booking search controls should stay inside their card.");
assert(styleBlock(".booking-search input[type=\"date\"]").includes("-webkit-appearance: none;"), "Mobile date fields should neutralize iOS Safari's oversized native date input.");
assert(styleBlock(".booking-search input[type=\"date\"]").includes("inline-size: 100%;"), "Mobile date fields should explicitly fit their grid cell.");
assert(styles.includes(".booking-search input[type=\"date\"]::-webkit-date-and-time-value"), "Date input value should be aligned after removing iOS appearance.");
properties.forEach((property) => {
  assert(Number.isFinite(property.lat) && Number.isFinite(property.lng), `Missing map coordinates for ${property.id}`);
  if (["P37382", "P37437"].includes(property.id)) {
    assert(property.squareFeet === null, `${property.id} should stay null until Supabase has a real square-foot value.`);
  } else {
    assert(Number.isFinite(property.squareFeet), `Missing square feet for ${property.id}`);
  }
});
mockup.restaurants.forEach((restaurant) => {
  assert(Array.isArray(restaurant.images) && restaurant.images.length >= 3, `${restaurant.name} needs at least three carousel images.`);
  assert(restaurant.images.some((image) => /food|taco|pizza|bakery|seafood|oyster|grill|boardroom|shaka|restaurant|menu|localdatacdn|static\.wixstatic|static\.showit|squarespace|toasttab|topsailsteamer/i.test(image)), `${restaurant.name} needs at least one restaurant-specific food or venue image.`);
});
assert(script.includes("restaurantPhotoCarousel"), "Restaurant guide should render reusable photo carousels.");
assert(script.includes("restaurant.images"), "Restaurant carousel should read each restaurant's image URLs.");
assert(script.includes("restaurant-photo-carousel"), "Restaurant cards need carousel markup.");
assert(styles.includes(".restaurant-photo-carousel"), "Restaurant photo carousel needs dedicated styling.");
assert(styles.includes("overflow-wrap: anywhere;"), "Restaurant names need hard wrapping to prevent overlap.");
assert(styles.includes("minmax(min(280px, 100%), 1fr)"), "Restaurant grid should protect narrow columns from text overlap.");

console.log("Mockup checks passed.");
