(function () {
  const data = window.TREASURE_MOCKUP;
  function defaultFilters() {
    return {
      location: "",
      locationClass: "",
      bedrooms: "",
      bathrooms: "",
      exactBedrooms: false,
      exactBathrooms: false,
      amenity: "",
      collection: "",
      towns: [],
      locationClasses: [],
      amenities: [],
      collections: [],
      stayTypes: [],
      unitTypes: [],
      specials: [],
      propertyName: ""
    };
  }

  const state = {
    view: "home-video",
    selectedProperty: data.properties[1],
    selectedTown: "Surf City",
    selectedPage: "faq",
    restaurantTown: "All",
    nightlifeTown: "All",
    filters: defaultFilters(),
    sort: "featured",
    slide: 0,
    slidePosition: 0
  };

  const locationTypes = ["Oceanfront", "Second Row", "Sound View", "Sound Front", "Canal Front", "Interior"];
  const amenityTypes = ["Private Pool", "Hot Tub", "Elevator", "Dog Friendly", "Community Pool", "Boat Friendly"];
  const collectionTypes = ["High-End Top 20", "Scotch Bonnet", "Hampton Colony", "Chris Playford", "10+ Bedrooms", "Topsail Beach"];
  const TOPSAIL_PRESENTATION_BEARING = 55;
  const FEATURED_PROPERTY_COUNT = 11;
  const FEATURED_SCROLL_SPEED = 0.075;
  const FEATURED_SCROLL_MANUAL_PAUSE_MS = 5000;
  const BEACH_ACCESS_DATA_URL = "assets/beach-access/accesses.json";
  const BEACH_PROPERTY_DATA_URL = "assets/beach-access/propertyAddresses.json";
  const BEACH_AERIAL_VIDEO_DATA_URL = "assets/beach-access/aerialViewVideos.json";
  const BEACH_STREET_VIEW_DATA_URL = "assets/beach-access/streetViewStills.json";
  const BEACH_WALK_FEET_PER_MINUTE = 275;
  const BEACH_SAMPLE_PROPERTY_IDS = [
    "surf-city-305-s-shore-dr",
    "north-topsail-beach-2950-island-dr",
    "topsail-beach-915-n-anderson-blvd"
  ];
  const BEACH_STREET_SUFFIXES = {
    avenue: "ave",
    ave: "ave",
    boulevard: "blvd",
    blvd: "blvd",
    circle: "cir",
    cir: "cir",
    court: "ct",
    ct: "ct",
    drive: "dr",
    dr: "dr",
    highway: "hwy",
    hwy: "hwy",
    lane: "ln",
    ln: "ln",
    place: "pl",
    pl: "pl",
    road: "rd",
    rd: "rd",
    street: "st",
    st: "st",
    terrace: "ter",
    ter: "ter",
    way: "way"
  };
  let resultsMap = null;
  let resultMarkers = [];
  let featuredScrollLastTime = 0;
  const beachAccessState = {
    query: "",
    selectedPropertyId: "",
    message: "",
    loaded: false,
    loading: false,
    error: "",
    dataPromise: null,
    accesses: [],
    properties: [],
    aerialVideos: {},
    streetViewStills: {}
  };

  const money = (value) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
  const number = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  });
  const formatSquareFeet = (value) => `${number.format(value)} sq ft`;

  function setLogo() {
    document.querySelectorAll("[data-logo], [data-footer-logo]").forEach((img) => {
      img.src = data.logo;
    });
  }

  function renderNav() {
    const nav = document.querySelector("[data-primary-nav]");
    nav.innerHTML = data.nav.map((item) => `
      <div class="nav-item">
        <button type="button" ${item.view ? `data-view-link="${item.view}"` : ""}>${item.label}</button>
        <div class="subnav">
          ${item.children.map((child) => {
            const entry = typeof child === "string" ? { label: child, view: item.view } : child;
            const view = entry.view || item.view || "home";
            return `<a href="#${view}" data-view-link="${view}" ${entry.town ? `data-town="${entry.town}"` : ""} ${entry.page ? `data-page="${entry.page}"` : ""} ${entry.pill ? `data-pill="${entry.pill}"` : ""}>${entry.label}</a>`;
          }).join("")}
        </div>
      </div>
    `).join("");
  }

  function closePrimaryMenu() {
    const nav = document.querySelector("[data-primary-nav]");
    const button = document.querySelector("[data-menu-toggle]");
    nav?.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  }

  function togglePrimaryMenu() {
    const nav = document.querySelector("[data-primary-nav]");
    const button = document.querySelector("[data-menu-toggle]");
    if (!nav || !button) return;
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
  }

  function renderHero() {
    const slides = document.querySelector("[data-hero-slides]");
    if (!slides) return;
    const visualSlides = data.heroSlides.concat(data.heroSlides[0]);
    slides.style.setProperty("--hero-slide-index", state.slidePosition);
    slides.innerHTML = visualSlides.map((slide, index) => `
      <div class="hero-slide ${index === state.slide ? "active" : ""}" style="background-image:url('${slide.image}')">
        <span>${slide.title}</span>
      </div>
    `).join("");
  }

  function rotateHero() {
    state.slidePosition += 1;
    state.slide = (state.slide + 1) % data.heroSlides.length;
    renderHero();
    if (state.slidePosition === data.heroSlides.length) {
      window.setTimeout(() => {
        const slides = document.querySelector("[data-hero-slides]");
        if (!slides) return;
        state.slidePosition = 0;
        slides.classList.add("no-transition");
        renderHero();
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => slides.classList.remove("no-transition"));
        });
      }, 1050);
    }
  }

  function renderQuickLinks() {
    const quickLinkRouteAttributes = (link) => [
      `data-view-link="${link.view || "search"}"`,
      link.page ? `data-page="${link.page}"` : "",
      link.pill ? `data-pill="${link.pill}"` : ""
    ].filter(Boolean).join(" ");

    const quickLinksMarkup = data.quickLinks.map((link) => `
      <button class="quick-card" type="button" ${quickLinkRouteAttributes(link)} style="background-image:url('${link.image}')">
        <span>${link.label}</span>
        <small>${link.text}</small>
      </button>
    `).join("");
    document.querySelectorAll("[data-quick-links]").forEach((container) => {
      container.innerHTML = quickLinksMarkup;
    });

    const townCardsMarkup = data.towns.map((town) => `
      <button class="town-picture-card" type="button" data-town="${town.label}" data-view-link="town">
        <span class="town-picture-image" role="img" aria-label="${town.label}" style="background-image:url('${town.image}')"></span>
        <span class="town-picture-body">
          <strong>${town.label}</strong>
          <span>${town.description}</span>
        </span>
      </button>
    `).join("");
    document.querySelectorAll("[data-town-cards]").forEach((container) => {
      container.innerHTML = townCardsMarkup;
    });

    const searchPillsMarkup = data.searchPills.map((pill) => `
      <button type="button" data-pill="${pill}">${pill}</button>
    `).join("");
    document.querySelectorAll("[data-search-pills]").forEach((container) => {
      container.innerHTML = searchPillsMarkup;
    });
  }

  function galleryImages(property) {
    const images = Array.isArray(property.images) && property.images.length
      ? property.images
      : [property.image];

    return images.filter(Boolean).slice(0, 8);
  }

  function galleryDots(images) {
    return `
      <div class="photo-scroll-indicator" aria-hidden="true">
        ${images.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("")}
      </div>
    `;
  }

  function lazyBackgroundFrame(image, className, index, label) {
    return `<div class="${className}" data-lazy-bg="${image}" role="img" aria-label="${label}"></div>`;
  }

  function hydrateLazyBackgrounds(track, activeIndex = 0) {
    if (!track) return;
    Array.from(track.children).forEach((frame, index) => {
      if (index !== 0 && Math.abs(index - activeIndex) > 1) return;
      const image = frame.dataset.lazyBg;
      if (!image) return;
      frame.style.backgroundImage = `url('${image}')`;
      frame.removeAttribute("data-lazy-bg");
    });
  }

  function hydrateVisibleLazyBackgrounds(scope = document) {
    scope.querySelectorAll(".photo-track, .detail-photo-track").forEach((track) => {
      const preload = 500;
      const rect = track.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      if (rect.bottom < -preload || rect.top > window.innerHeight + preload) return;
      const frameWidth = track.clientWidth || rect.width || 1;
      const activeIndex = Math.round(track.scrollLeft / frameWidth);
      hydrateLazyBackgrounds(track, activeIndex);
    });
  }

  function hydrateActiveViewBackgrounds() {
    const activeView = document.querySelector(`[data-view="${state.view}"]`);
    hydrateVisibleLazyBackgrounds(activeView || document);
  }

  function restaurantPhotoCarousel(restaurant) {
    const images = Array.isArray(restaurant.images) && restaurant.images.length
      ? restaurant.images.filter(Boolean).slice(0, 6)
      : [];

    if (!images.length) return "";

    return `
      <div class="restaurant-photo-carousel">
        <div class="photo-track restaurant-photo-track" role="group" tabindex="0" aria-label="Photos for ${restaurant.name}">
          ${images.map((image, index) => lazyBackgroundFrame(image, "photo-frame restaurant-photo-frame", index, `${restaurant.name} photo ${index + 1}`)).join("")}
        </div>
        <button class="carousel-button carousel-button-prev" type="button" data-carousel-direction="-1" aria-label="Previous photo for ${restaurant.name}"><span aria-hidden="true">&lsaquo;</span></button>
        <button class="carousel-button carousel-button-next" type="button" data-carousel-direction="1" aria-label="Next photo for ${restaurant.name}"><span aria-hidden="true">&rsaquo;</span></button>
        ${galleryDots(images)}
      </div>
    `;
  }

  function cardIcon(type) {
    const icons = {
      bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v5"/><path d="M14 8h4a3 3 0 0 1 3 3v7"/><path d="M4 18v-7h17v7"/><path d="M4 21v-3"/><path d="M21 21v-3"/></svg>',
      bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z"/><path d="M7 12V5a2 2 0 0 1 2-2h1"/><path d="M10 5l2 2"/><path d="M5 21l1-2"/><path d="M19 21l-1-2"/></svg>',
      guests: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M9 4v16"/><path d="M15 4v16"/><path d="M4 9h16"/><path d="M4 15h16"/></svg>',
      paw: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="9" r="2.5"/><circle cx="11" cy="5.5" r="2.5"/><circle cx="15.5" cy="9" r="2.5"/><circle cx="18.5" cy="13.5" r="2"/><path d="M8.5 15.5c1-2 4-2 5 0l1.2 2.1c.9 1.7-.3 3.4-2.2 3.4h-3c-1.9 0-3.1-1.7-2.2-3.4l1.2-2.1Z"/></svg>'
    };
    return icons[type] || "";
  }

  function compactPropertyCard(property) {
    const images = galleryImages(property);
    const fullBaths = Math.floor(property.baths);
    const hasHalfBath = property.baths % 1 !== 0;
    const facts = [
      { icon: "bed", text: `${property.bedrooms} ${property.bedrooms === 1 ? "bedroom" : "bedrooms"}` },
      { icon: "bath", text: `${fullBaths || property.baths} ${fullBaths === 1 ? "bath" : "baths"}` },
      hasHalfBath ? { icon: "bath", text: "1 half bath" } : null,
      { icon: "guests", text: `Sleeps ${property.sleeps}` },
      Number.isFinite(property.squareFeet) ? { icon: "area", text: formatSquareFeet(property.squareFeet) } : null,
      property.tags.includes("Dog Friendly") ? { icon: "paw", text: "Dog Friendly" } : null
    ].filter(Boolean);

    return `
      <article class="property-card compact">
        <div class="property-photo compact-property-photo">
          <div class="photo-track" role="group" tabindex="0" aria-label="Photos for ${property.name}">
            ${images.map((image, index) => lazyBackgroundFrame(image, "photo-frame", index, `${property.name} photo ${index + 1}`)).join("")}
          </div>
          <button class="carousel-button carousel-button-prev" type="button" data-carousel-direction="-1" aria-label="Previous photo for ${property.name}"><span aria-hidden="true">&lsaquo;</span></button>
          <button class="carousel-button carousel-button-next" type="button" data-carousel-direction="1" aria-label="Next photo for ${property.name}"><span aria-hidden="true">&rsaquo;</span></button>
          <button class="save-button" type="button" aria-label="Save ${property.name}"><span aria-hidden="true">&#9825;</span></button>
          <span class="location-badge">${property.locationClass}</span>
          ${galleryDots(images)}
        </div>
        <div class="property-body">
          <div class="results-card-head">
            <h3>${property.name}</h3>
            <span class="results-rating"><span aria-hidden="true">★</span>${property.rating} (${property.reviews})</span>
          </div>
          <p class="results-location-line">${property.locationClass} - ${property.location}</p>
          <div class="results-fact-grid">
            ${facts.map((fact) => `<span class="results-fact">${cardIcon(fact.icon)}${fact.text}</span>`).join("")}
          </div>
          <button class="results-details-button" type="button" data-property-id="${property.id}">View Property Details</button>
        </div>
      </article>
    `;
  }

  function propertyCard(property, mode = "grid") {
    if (mode === "compact") return compactPropertyCard(property);

    const images = galleryImages(property);

    return `
      <article class="property-card ${mode === "list" ? "wide" : ""} ${mode === "compact" ? "compact" : ""} ${mode === "featured" ? "featured" : ""}">
        <div class="property-photo">
          <div class="photo-track" role="group" tabindex="0" aria-label="Photos for ${property.name}">
            ${images.map((image, index) => lazyBackgroundFrame(image, "photo-frame", index, `${property.name} photo ${index + 1}`)).join("")}
          </div>
          <button class="carousel-button carousel-button-prev" type="button" data-carousel-direction="-1" aria-label="Previous photo for ${property.name}"><span aria-hidden="true">&lsaquo;</span></button>
          <button class="carousel-button carousel-button-next" type="button" data-carousel-direction="1" aria-label="Next photo for ${property.name}"><span aria-hidden="true">&rsaquo;</span></button>
          <button class="save-button" type="button" aria-label="Save ${property.name}"><span aria-hidden="true">&#9825;</span></button>
          <span class="location-badge">${property.locationClass}</span>
          ${galleryDots(images)}
        </div>
        <div class="property-body">
          <div class="property-title-row">
            <h3>${property.name}</h3>
            <span>${property.rating} (${property.reviews})</span>
          </div>
          <p>${property.location} - ${property.turnDay} turn day</p>
          <div class="facts">
            <span>${property.bedrooms} bedrooms</span>
            <span>${property.baths} baths</span>
            <span>Sleeps ${property.sleeps}</span>
            ${Number.isFinite(property.squareFeet) ? `<span>${formatSquareFeet(property.squareFeet)}</span>` : ""}
          </div>
          <div class="tag-row">${property.tags.slice(0, 3).map((tag) => `<span>${tag}</span>`).join("")}</div>
          <div class="card-actions">
            <strong>From ${money(property.weeklyRate)}/week</strong>
            <button type="button" data-property-id="${property.id}">View Details</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeatured() {
    const seen = new Set();
    const featured = data.properties.filter((property) => {
      const key = property.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, FEATURED_PROPERTY_COUNT);

    const featuredMarkup = featured.map((property) => propertyCard(property, "featured")).join("");
    document.querySelectorAll("[data-featured-properties]").forEach((container) => {
      container.innerHTML = featuredMarkup;
    });
  }

  function selectedValues(...groups) {
    return groups.flatMap((group) => group || []).filter(Boolean);
  }

  function matchesLocationClass(property, value) {
    return property.locationClass === value || property.tags.includes(value);
  }

  function matchesStayType(property, value) {
    if (value === "Saturday Turn Day") return property.turnDay === "Saturday";
    if (value === "Sunday Arrival") return property.turnDay === "Sunday";
    if (value === "Flexible/Partial Week") return !["Saturday", "Sunday"].includes(property.turnDay);
    return true;
  }

  function matchesUnitType(property, value) {
    const haystack = `${property.name} ${property.tags.join(" ")} ${property.source}`.toLowerCase();
    const isDuplex = /duplex|4plex|fourplex/.test(haystack);
    const isCondo = /condo|villa|st\. regis|capriani/.test(haystack);
    const isTownhome = /townhome|townhouse/.test(haystack);
    if (value === "Duplex/Fourplex") return isDuplex;
    if (value === "Condo") return isCondo;
    if (value === "Townhome") return isTownhome;
    if (value === "Beach House") return !isDuplex && !isCondo && !isTownhome;
    return true;
  }

  function matchesSpecial(property, value) {
    if (value === "Featured High-End Inventory") return property.tags.includes("High-End Top 20");
    if (value === "New or Review-Light") return property.reviews <= 1;
    if (value === "Top Rated") return property.rating >= 4.9;
    return true;
  }

  function filteredProperties() {
    let properties = [...data.properties];
    const towns = selectedValues(state.filters.towns, state.filters.location ? [state.filters.location] : []);
    const locationClasses = selectedValues(
      state.filters.locationClasses,
      state.filters.locationClass ? [state.filters.locationClass] : []
    );
    const amenities = selectedValues(
      state.filters.amenities,
      state.filters.amenity ? [state.filters.amenity] : []
    );
    const collections = selectedValues(
      state.filters.collections,
      state.filters.collection ? [state.filters.collection] : []
    );

    if (towns.length) {
      properties = properties.filter((property) => towns.includes(property.location));
    }
    if (locationClasses.length) {
      properties = properties.filter((property) => locationClasses.some((value) => matchesLocationClass(property, value)));
    }
    if (state.filters.bedrooms) {
      const bedroomCount = Number(state.filters.bedrooms);
      properties = properties.filter((property) => (
        state.filters.exactBedrooms
          ? property.bedrooms === bedroomCount
          : property.bedrooms >= bedroomCount
      ));
    }
    if (state.filters.bathrooms) {
      const bathroomCount = Number(state.filters.bathrooms);
      properties = properties.filter((property) => (
        state.filters.exactBathrooms
          ? property.baths === bathroomCount
          : property.baths >= bathroomCount
      ));
    }
    if (amenities.length) {
      properties = properties.filter((property) => amenities.every((tag) => property.tags.includes(tag)));
    }
    if (collections.length) {
      properties = properties.filter((property) => collections.some((tag) => property.tags.includes(tag)));
    }
    if (state.filters.stayTypes.length) {
      properties = properties.filter((property) => state.filters.stayTypes.some((value) => matchesStayType(property, value)));
    }
    if (state.filters.unitTypes.length) {
      properties = properties.filter((property) => state.filters.unitTypes.some((value) => matchesUnitType(property, value)));
    }
    if (state.filters.specials.length) {
      properties = properties.filter((property) => state.filters.specials.some((value) => matchesSpecial(property, value)));
    }
    if (state.filters.propertyName.trim()) {
      const query = state.filters.propertyName.trim().toLowerCase();
      properties = properties.filter((property) => (
        property.name.toLowerCase().includes(query) ||
        property.id.toLowerCase().includes(query) ||
        String(property.address || "").toLowerCase().includes(query)
      ));
    }
    if (state.sort === "beds") {
      properties.sort((a, b) => b.bedrooms - a.bedrooms);
    }
    if (state.sort === "rate") {
      properties.sort((a, b) => b.weeklyRate - a.weeklyRate);
    }
    return properties;
  }

  function mapPopupCard(property) {
    const image = galleryImages(property)[0] || property.image;

    return `
      <button type="button" class="map-popup-card" data-property-id="${property.id}" data-map-property-id="${property.id}" aria-label="View ${property.name}">
        <span class="map-popup-photo" style="background-image:url('${image}')">
          <span class="map-popup-save" aria-hidden="true">&#9825;</span>
        </span>
        <span class="map-popup-body">
          <strong>${property.name}</strong>
          <span>${property.locationClass} - ${property.location}</span>
          <span class="map-popup-facts">
            <b>${property.bedrooms}</b> beds
            <b>${property.baths}</b> baths
          </span>
        </span>
      </button>
    `;
  }

  function openPropertyDetail(property) {
    const selectedProperty = property || data.properties[0];
    navigateToRoute({ view: "property", property: selectedProperty.id });
  }

  function renderIslandMap(properties) {
    const map = document.querySelector("[data-island-map]");
    if (!map) return;

    const mappedProperties = properties.filter((property) => (
      Number.isFinite(property.lat) && Number.isFinite(property.lng)
    ));

    if (!window.maplibregl || (typeof maplibregl.supported === "function" && !maplibregl.supported())) {
      map.innerHTML = `<div class="map-unavailable">Map tiles could not load. The property coordinates are still attached to the listings.</div>`;
      return;
    }

    if (!resultsMap) {
      resultsMap = new maplibregl.Map({
        container: map,
        style: {
          version: 8,
          sources: {
            "openstreetmap": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "&copy; OpenStreetMap contributors"
            }
          },
          layers: [
            {
              id: "openstreetmap",
              type: "raster",
              source: "openstreetmap"
            }
          ]
        },
        center: [-77.46, 34.47],
        zoom: 10.6,
        bearing: TOPSAIL_PRESENTATION_BEARING,
        pitch: 0,
        dragRotate: false,
        scrollZoom: false,
        attributionControl: false
      });
      resultsMap.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");
      resultsMap.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      resultsMap.once("load", () => renderIslandMap(properties));
      return;
    }

    resultMarkers.forEach((marker) => marker.remove());
    resultMarkers = [];

    if (!mappedProperties.length) {
      resultsMap.jumpTo({
        center: [-77.46, 34.47],
        zoom: 10.6,
        bearing: TOPSAIL_PRESENTATION_BEARING
      });
      return;
    }

    if (!resultsMap.loaded()) {
      resultsMap.once("load", () => renderIslandMap(properties));
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    mappedProperties.forEach((property) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = "property-map-marker";
      markerElement.setAttribute("aria-label", `${property.name} on map`);
      markerElement.innerHTML = `<span class="marker-pin"><b>${property.bedrooms}</b></span>`;
      markerElement.addEventListener("click", () => {
        state.selectedProperty = property;
      });

      bounds.extend([property.lng, property.lat]);

      const popup = new maplibregl.Popup({
        offset: 26,
        closeButton: true,
        closeOnClick: true,
        className: "property-map-popup"
      }).setHTML(mapPopupCard(property));
      popup.on("open", () => {
        markerElement.classList.add("marker-active");
        const popupCard = popup.getElement().querySelector("[data-map-property-id]");
        if (popupCard) {
          popupCard.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openPropertyDetail(property);
          }, { once: true });
        }
      });
      popup.on("close", () => markerElement.classList.remove("marker-active"));

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "bottom"
      })
        .setLngLat([property.lng, property.lat])
        .setPopup(popup)
        .addTo(resultsMap);

      resultMarkers.push(marker);
    });

    if (mappedProperties.length === 1) {
      resultsMap.jumpTo({
        center: [mappedProperties[0].lng, mappedProperties[0].lat],
        zoom: 14,
        bearing: TOPSAIL_PRESENTATION_BEARING
      });
    } else {
      resultsMap.fitBounds(bounds, {
        padding: 42,
        maxZoom: 13.2,
        bearing: TOPSAIL_PRESENTATION_BEARING,
        duration: 0
      });
    }

    window.setTimeout(() => resultsMap.resize(), 0);
  }

  function renderResults() {
    const properties = filteredProperties();
    document.querySelector("[data-result-count]").textContent = properties.length;
    document.querySelector("[data-results-list]").innerHTML = properties.length
      ? properties.map((property) => propertyCard(property, "compact")).join("")
      : `<div class="no-results"><h2>No exact matches</h2><p>Loosen a filter or use this area for a helpful contact form instead of a dead end.</p></div>`;
    if (state.view === "search") hydrateVisibleLazyBackgrounds(document.querySelector("[data-results-list]"));
    renderIslandMap(properties);
  }

  function demoPage(pageId) {
    return data.demoPages.find((page) => page.id === pageId) || data.demoPages[0];
  }

  function townRentals(townName) {
    return data.properties.filter((property) => property.location === townName);
  }

  function townCard(town) {
    const count = townRentals(town.label).length;
    return `
      <article class="town-guide-card">
        <div class="town-guide-photo" style="background-image:url('${town.image}')"></div>
        <div>
          <span class="eyebrow">${town.kicker}</span>
          <h3>${town.label}</h3>
          <p>${town.summary}</p>
          <div class="guide-chip-row">
            ${town.bestFor.map((item) => `<span>${item}</span>`).join("")}
          </div>
          <div class="town-card-actions">
            <button type="button" data-view-link="town" data-town="${town.label}">Explore ${town.label}</button>
            <button type="button" class="secondary-button" data-view-link="search" data-town="${town.label}">${count} rentals</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderOwnerPages() {
    const ownerPage = document.querySelector("[data-owner-page]");
    const managementPage = document.querySelector("[data-management-page]");
    if (!ownerPage || !managementPage) return;

    ownerPage.innerHTML = `
      <section class="page-hero owner-hero">
        <div>
          <span class="eyebrow">Owners</span>
          <h1>Property Management With A Real Topsail Pulse</h1>
          <p>Owners should immediately understand that Treasure is not just taking bookings. The pitch is local care, smarter revenue thinking, clean communication, and protecting the long-term value of the house.</p>
          <div class="hero-button-row">
            <button type="button" data-view-link="management">See the management plan</button>
            <button type="button" class="secondary-button" data-view-link="search">Review the rental inventory</button>
          </div>
        </div>
      </section>
      <section class="content-shell">
        <div class="section-heading row-heading">
          <div>
            <span class="eyebrow">Why Treasure</span>
            <h2>Owners Need More Than A Portal Login</h2>
          </div>
          <p>The owner page should make a clear argument: a Topsail home is a serious asset, and the company managing it needs to be excellent at both hospitality and stewardship.</p>
        </div>
        <div class="editorial-grid three-up">
          ${data.ownerHighlights.map((item) => `
            <article class="content-card">
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </article>
          `).join("")}
        </div>
        <div class="owner-proof-band">
          <span><b>${data.properties.length}</b> selected inventory examples</span>
          <span><b>${data.properties.filter((property) => property.tags.includes("Oceanfront")).length}</b> oceanfront homes represented</span>
          <span><b>${data.properties.filter((property) => property.bedrooms >= 8).length}</b> large-home examples</span>
        </div>
      </section>
    `;

    managementPage.innerHTML = `
      <section class="page-hero management-hero">
        <div>
          <span class="eyebrow">Property Management</span>
          <h1>We'll Take Care of It</h1>
          <p>With a proven track record as a leader in the short term rental market on Topsail Island, you can trust our local experts to provide the service and support that you deserve.</p>
          <div class="hero-button-row">
            <a class="management-action-link" href="tel:9103284444">Call 910-328-4444</a>
            <a class="management-action-link secondary-management-link" href="mailto:Owners@treasurerentals.com">Request a Call Back</a>
          </div>
        </div>
      </section>
      <section class="content-shell property-management-body">
        <div class="management-contact-grid">
          <article class="management-contact-copy">
            <span class="eyebrow">Property Management / Contact Page</span>
            <h2>Property Management</h2>
            <p>With a proven track record as a leader in the short term rental market on Topsail Island, you can trust our local experts to provide the service and support that you deserve.</p>
            <div class="management-callout">
              <strong>Ready for the rental program?</strong>
              <span>Call 910-328-4444 today or Request a Call Back</span>
            </div>
          </article>
          <article class="management-form-card" aria-label="Owner inquiry mock form">
            <div class="form-card-heading">
              <span class="eyebrow">Tell us about the home</span>
              <h3>Request a Call Back</h3>
            </div>
            <div class="mock-form-grid">
              <label>First name<input type="text" placeholder="First name"></label>
              <label>Last name<input type="text" placeholder="Last name"></label>
              <label>Phone<input type="tel" placeholder="Phone"></label>
              <label>Email<input type="email" placeholder="Email"></label>
              <label class="full-field">Property address<input type="text" placeholder="Property address"></label>
              <label class="full-field">Anything you'd like to share<textarea placeholder="Anything you'd like to share"></textarea></label>
            </div>
            <a class="management-submit-link" href="mailto:Owners@treasurerentals.com">Send owner inquiry</a>
          </article>
        </div>

        <section class="management-why-section" aria-labelledby="management-why-heading">
          <div class="section-heading row-heading">
            <div>
              <span class="eyebrow">Owner confidence</span>
              <h2 id="management-why-heading">Why Should You Choose Treasure Vacation Rentals?</h2>
            </div>
            <p>The better version of this page should feel specific, local, and serious. Not lorem ipsum. Not vague promises. These are the three owner-facing points from the document, built out with enough visual weight to feel like a real proposal.</p>
          </div>
          <div class="management-reasons-grid">
            ${data.managementPillars.map((pillar) => `
              <article class="management-reason-card">
                <div class="management-reason-photo" style="background-image:url('${pillar.image}')"></div>
                <div class="management-reason-copy">
                  <span class="reason-index">${pillar.label.charAt(0)}</span>
                <h3>${pillar.label}</h3>
                <p>${pillar.detail}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>

        <section class="management-revenue-band" aria-labelledby="management-revenue-heading">
          <div>
            <span class="eyebrow">Looking For Estimated Revenue?</span>
            <h2 id="management-revenue-heading">A better estimate starts with the actual property.</h2>
            <p>We look beyond bedroom count when evaluating potential revenue. Share your property address with us, and we'll provide a prompt, accurate estimate based on real market insight.</p>
          </div>
          <div class="management-revenue-actions">
            <a class="management-action-link" href="tel:9103284444">Call/Text 910-328-4444</a>
            <a class="management-email-link" href="mailto:Owners@treasurerentals.com">Owners@treasurerentals.com</a>
          </div>
        </section>

        <section class="management-testimonial-hold">
          <span class="eyebrow">Owner reviews/testimonials</span>
          <h2>Table this until we have some new.</h2>
          <p>Approved owner quotes can live here when Treasure is ready to publish them. Until then, the page should stay focused on specific service promises and clear contact paths.</p>
        </section>
      </section>
    `;
  }

  function renderAreaPage() {
    const areaPage = document.querySelector("[data-area-page]");
    if (!areaPage) return;

    areaPage.innerHTML = `
      <section class="page-hero area-hero">
        <div>
          <span class="eyebrow">Area Guide</span>
          <h1>Know The Island Before You Pick The House</h1>
          <p>Topsail is one island, but it does not feel the same from end to end. This guide gives guests the practical difference between North Topsail Beach, Surf City, and Topsail Beach, then points them toward food, beach access, and easy family days.</p>
        </div>
      </section>
      <section class="content-shell">
        <div class="town-guide-list">
          ${data.areaTowns.map((town) => townCard(town)).join("")}
        </div>
        <div class="section-heading">
          <span class="eyebrow">Plan the week</span>
          <h2>Helpful Guide Sections To Build Out</h2>
        </div>
        <div class="editorial-grid four-up">
          ${data.areaCollections.map((item) => `
            <article class="content-card guide-note">
              <h3>${item.title}</h3>
              <p>${item.text}</p>
            </article>
          `).join("")}
        </div>
        <div class="area-cta-band">
          <div>
            <span class="eyebrow">Food guide</span>
            <h2>Complete The Trip With The Restaurant Page</h2>
          </div>
          <button type="button" data-view-link="restaurants">Browse restaurants</button>
        </div>
      </section>
    `;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function normalizeBeachQuery(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\b(nc|north carolina|28445|28460)\b/g, " ")
      .replace(/\b(north topsail beach|topsail beach|surf city|topsail island)\b/g, " ")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((token) => BEACH_STREET_SUFFIXES[token] || token)
      .join(" ")
      .trim();
  }

  function formatBeachPropertyLabel(property) {
    return `${property.address}, ${property.town}, NC`;
  }

  function formatBeachAccessAddress(access) {
    const address = String(access.address || "").replace(/\s*,+\s*$/, "").trim();
    return address || access.town;
  }

  function toBeachRadians(value) {
    return (value * Math.PI) / 180;
  }

  function beachDistanceFeet(first, second) {
    const radiusMeters = 6371000;
    const firstLat = toBeachRadians(first.latitude);
    const secondLat = toBeachRadians(second.latitude);
    const deltaLat = toBeachRadians(second.latitude - first.latitude);
    const deltaLon = toBeachRadians(second.longitude - first.longitude);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(firstLat) *
        Math.cos(secondLat) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(radiusMeters * c * 3.28084);
  }

  function formatBeachDistance(distance) {
    if (!Number.isFinite(distance)) return "Unknown";
    if (distance >= 5280) return `${(distance / 5280).toFixed(1)} mi`;
    return `${Math.round(distance).toLocaleString()} ft`;
  }

  function estimateBeachWalkMinutes(distance) {
    return Math.max(1, Math.round(distance / BEACH_WALK_FEET_PER_MINUTE));
  }

  function beachDirectionsUrl(property, access) {
    const params = new URLSearchParams({
      api: "1",
      origin: `${property.latitude},${property.longitude}`,
      destination: `${access.latitude},${access.longitude}`,
      travelmode: "walking"
    });
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }

  function scoreBeachAccess(access) {
    return (
      Number(access.parkingSpots || 0) +
      (access.restroom ? 30 : 0) +
      (access.shower ? 20 : 0) +
      (access.handicapAccessible ? 18 : 0) +
      (access.beachMat ? 12 : 0) +
      (access.mobiMat ? 12 : 0) +
      (access.beachWheelchair ? 8 : 0) +
      (access.lifeguards ? 8 : 0)
    );
  }

  function isMajorBeachAccess(access) {
    return Number(access.parkingSpots || 0) > 0 && Boolean(access.restroom) && Boolean(access.shower);
  }

  function beachAccessFeatures(access) {
    const features = [];
    const parking = Number(access.parkingSpots || 0);
    if (parking > 0) features.push({ icon: "P", label: `${parking.toLocaleString()} spaces` });
    if (access.restroom) features.push({ icon: "R", label: "Restroom" });
    if (access.shower) features.push({ icon: "S", label: "Shower" });
    if (access.handicapAccessible) features.push({ icon: "ADA", label: "Accessible route listed" });
    if (access.beachMat || access.mobiMat) features.push({ icon: "Mat", label: "Beach mat" });
    if (access.beachWheelchair) features.push({ icon: "WC", label: "Beach wheelchair program" });
    if (access.lifeguards) features.push({ icon: "LG", label: "Lifeguard listed" });
    if (access.vehicleAccess) features.push({ icon: "ORV", label: "Vehicle access" });
    if (access.parkingFee === false && parking > 0) features.push({ icon: "Free", label: "Free parking data" });
    if (access.parkingFee === true && parking > 0) features.push({ icon: "$", label: "Paid parking" });
    if (beachAccessState.aerialVideos[access.id]?.state === "ACTIVE") features.push({ icon: "Fly", label: "Google flyover available" });
    if (beachAccessState.streetViewStills[access.id]?.state === "AVAILABLE") features.push({ icon: "SV", label: "Street View still available" });
    return features;
  }

  function beachFeatureBadges(access, limit = 8) {
    return beachAccessFeatures(access)
      .slice(0, limit)
      .map((feature) => `
        <span class="beach-feature-badge">
          <span class="beach-feature-icon">${escapeHtml(feature.icon)}</span>
          ${escapeHtml(feature.label)}
        </span>
      `)
      .join("");
  }

  function loadBeachAccessData() {
    if (beachAccessState.dataPromise) return beachAccessState.dataPromise;

    beachAccessState.loading = true;
    beachAccessState.error = "";
    beachAccessState.dataPromise = Promise.all([
      fetch(BEACH_ACCESS_DATA_URL).then((response) => {
        if (!response.ok) throw new Error("Beach access inventory could not load.");
        return response.json();
      }),
      fetch(BEACH_PROPERTY_DATA_URL).then((response) => {
        if (!response.ok) throw new Error("Property address index could not load.");
        return response.json();
      }),
      fetch(BEACH_AERIAL_VIDEO_DATA_URL).then((response) => response.ok ? response.json() : {}),
      fetch(BEACH_STREET_VIEW_DATA_URL).then((response) => response.ok ? response.json() : {})
    ]).then(([accesses, properties, aerialVideos, streetViewStills]) => {
      beachAccessState.accesses = Array.isArray(accesses) ? accesses : [];
      beachAccessState.properties = Array.isArray(properties) ? properties : [];
      beachAccessState.aerialVideos = aerialVideos || {};
      beachAccessState.streetViewStills = streetViewStills || {};
      beachAccessState.loaded = true;
      beachAccessState.loading = false;
      renderBeachAccessPage();
    }).catch((error) => {
      beachAccessState.loaded = false;
      beachAccessState.loading = false;
      beachAccessState.error = error instanceof Error ? error.message : "Beach access data could not load.";
      renderBeachAccessDynamic();
    });

    return beachAccessState.dataPromise;
  }

  function searchBeachPropertyAddresses(query, limit = 8) {
    const normalizedQuery = normalizeBeachQuery(query);
    if (!normalizedQuery) return [];
    const queryTerms = normalizedQuery.split(" ");

    return beachAccessState.properties
      .map((property) => {
        const normalizedAddress = normalizeBeachQuery(property.address);
        const normalizedTown = normalizeBeachQuery(property.town);
        const searchText = `${normalizedAddress} ${normalizedTown}`;
        const addressNumber = normalizedAddress.match(/^\d+/)?.[0] || "";
        const allTermsMatch = queryTerms.every((term) => searchText.includes(term));

        if (!allTermsMatch && !normalizedAddress.startsWith(normalizedQuery)) return null;

        let score = 3;
        if (normalizedAddress === normalizedQuery) score = 0;
        else if (normalizedAddress.startsWith(normalizedQuery)) score = 1;
        else if (addressNumber.startsWith(normalizedQuery)) score = 2;

        return { property, normalizedAddress, addressNumber, score };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const numberDelta = Number.parseInt(a.addressNumber || "0", 10) - Number.parseInt(b.addressNumber || "0", 10);
        if (numberDelta !== 0) return numberDelta;
        return a.normalizedAddress.localeCompare(b.normalizedAddress);
      })
      .slice(0, limit)
      .map((match) => match.property);
  }

  function findBeachPropertyByQuery(query) {
    const normalizedQuery = normalizeBeachQuery(query);
    if (!normalizedQuery) return null;
    return beachAccessState.properties.find((property) => normalizeBeachQuery(property.address) === normalizedQuery) || null;
  }

  function findClosestBeachAccess(property, accesses = beachAccessState.accesses) {
    if (!property || !accesses.length) return null;
    return accesses
      .map((access) => ({
        access,
        distanceFeet: beachDistanceFeet(property, access),
        walkMinutes: estimateBeachWalkMinutes(beachDistanceFeet(property, access))
      }))
      .sort((a, b) => {
        if (a.distanceFeet !== b.distanceFeet) return a.distanceFeet - b.distanceFeet;
        return scoreBeachAccess(b.access) - scoreBeachAccess(a.access);
      })[0] || null;
  }

  function nearestMajorBeachAccess(property) {
    return findClosestBeachAccess(property, beachAccessState.accesses.filter(isMajorBeachAccess));
  }

  function majorBeachAccesses() {
    return beachAccessState.accesses
      .filter(isMajorBeachAccess)
      .sort((a, b) => {
        const parkingDelta = Number(b.parkingSpots || 0) - Number(a.parkingSpots || 0);
        if (parkingDelta !== 0) return parkingDelta;
        return scoreBeachAccess(b) - scoreBeachAccess(a);
      });
  }

  function freeParkingAccesses() {
    const preferredIds = new Set([
      "north-topsail-beach-onslow-co-beach-access-2",
      "north-topsail-beach-beach-access-4",
      "north-topsail-beach-beach-access-1"
    ]);
    return beachAccessState.accesses
      .filter((access) => preferredIds.has(access.id))
      .sort((a, b) => Number(b.parkingSpots || 0) - Number(a.parkingSpots || 0));
  }

  function selectBeachProperty(property) {
    if (!property) return;
    beachAccessState.selectedPropertyId = property.id;
    beachAccessState.query = formatBeachPropertyLabel(property);
    beachAccessState.message = "";
    const input = document.querySelector("[data-beach-access-input]");
    if (input) input.value = beachAccessState.query;
    renderBeachAccessDynamic();
  }

  function submitBeachAccessSearch() {
    const exact = findBeachPropertyByQuery(beachAccessState.query);
    const firstSuggestion = searchBeachPropertyAddresses(beachAccessState.query, 1)[0];
    const property = exact || firstSuggestion;
    if (!property) {
      beachAccessState.selectedPropertyId = "";
      beachAccessState.error = "Pick one of the verified Topsail Island address suggestions so the finder can use GIS coordinates.";
      renderBeachAccessDynamic();
      return;
    }
    beachAccessState.error = "";
    selectBeachProperty(property);
  }

  function beachAccessCard(access, options = {}) {
    const label = options.label || (isMajorBeachAccess(access) ? "Major beach access" : "Public beach access");
    const parking = Number(access.parkingSpots || 0);
    return `
      <article class="beach-access-card">
        <span class="eyebrow">${escapeHtml(label)}</span>
        <h3>${escapeHtml(access.name)}</h3>
        <p>${escapeHtml(formatBeachAccessAddress(access))}<br>${escapeHtml(access.town)}</p>
        <div class="beach-feature-row">
          ${beachFeatureBadges(access)}
        </div>
        <div class="beach-card-meta">
          <span>${parking > 0 ? `${parking.toLocaleString()} parking spaces` : "No listed parking"}</span>
          <span>${access.parkingFee === false ? "free in source data" : access.parkingFee === true ? "paid parking" : "verify signage"}</span>
        </div>
        <a class="outline-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${access.latitude},${access.longitude}`)}" target="_blank" rel="noopener">Open in Google Maps</a>
      </article>
    `;
  }

  function renderBeachSuggestions() {
    const suggestions = searchBeachPropertyAddresses(beachAccessState.query, 8);
    if (!beachAccessState.query.trim()) return "";
    if (!suggestions.length) {
      return `
        <div class="beach-suggestions empty">
          <p>No exact island address match yet. Try just the house number first, like <b>4444</b>, then pick the verified address.</p>
        </div>
      `;
    }

    return `
      <div class="beach-suggestions" role="listbox" aria-label="Topsail Island address suggestions">
        ${suggestions.map((property) => `
          <button type="button" role="option" data-beach-property-id="${escapeHtml(property.id)}">
            <span>
              <strong>${escapeHtml(property.address)}</strong>
              <small>${escapeHtml(property.town)} · ${escapeHtml(property.source || "GIS address")}</small>
            </span>
            <span>${escapeHtml(property.county || "")} County GIS</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderBeachLookupResult() {
    if (beachAccessState.error) {
      return `<div class="beach-status error">${escapeHtml(beachAccessState.error)}</div>`;
    }
    if (beachAccessState.loading) {
      return `<div class="beach-status">Loading Topsail Island beach access and address data...</div>`;
    }
    if (!beachAccessState.loaded) {
      return `<div class="beach-status">Beach access data is not loaded yet.</div>`;
    }

    const property = beachAccessState.properties.find((entry) => entry.id === beachAccessState.selectedPropertyId);
    if (!property) {
      return `
        <div class="beach-empty-state">
          <h3>Start with a verified island address.</h3>
          <p>Type a house number or street name and pick from the autocomplete list. This prevents guests from guessing the exact address format and keeps the result tied to Onslow and Pender GIS coordinates.</p>
          <div class="beach-sample-row" aria-label="Sample Topsail Island addresses">
            ${BEACH_SAMPLE_PROPERTY_IDS.map((id) => {
              const sample = beachAccessState.properties.find((entry) => entry.id === id);
              if (!sample) return "";
              return `<button type="button" data-beach-property-id="${escapeHtml(sample.id)}"><b>${escapeHtml(sample.town)}</b><span>${escapeHtml(sample.address)}</span></button>`;
            }).join("")}
          </div>
        </div>
      `;
    }

    const closest = findClosestBeachAccess(property);
    const major = nearestMajorBeachAccess(property);
    if (!closest) {
      return `<div class="beach-status error">No public beach access records are available for this address.</div>`;
    }

    const closestDirections = beachDirectionsUrl(property, closest.access);
    const majorDirections = major ? beachDirectionsUrl(property, major.access) : "";
    const majorNote = major && major.access.id !== closest.access.id
      ? `
        <article class="beach-result-option major-option">
          <span class="eyebrow">Nearest major access</span>
          <h3>${escapeHtml(major.access.name)}</h3>
          <p>${escapeHtml(formatBeachAccessAddress(major.access))} · ${escapeHtml(major.access.town)}</p>
          <div class="beach-result-facts">
            <span><b>${formatBeachDistance(major.distanceFeet)}</b> estimated proximity</span>
            <span><b>${major.walkMinutes} min</b> simple walk estimate</span>
            <span><b>${Number(major.access.parkingSpots || 0).toLocaleString()}</b> parking spaces</span>
          </div>
          <div class="beach-feature-row">${beachFeatureBadges(major.access)}</div>
          <a href="${majorDirections}" target="_blank" rel="noopener">Open walking directions</a>
        </article>
      `
      : `
        <div class="beach-status success">The closest mapped access is also a major access with parking, restroom, and shower data.</div>
      `;

    return `
      <div class="beach-result-grid">
        <article class="beach-result-primary">
          <span class="eyebrow">Closest mapped public access</span>
          <h3>${escapeHtml(closest.access.name)}</h3>
          <p>${escapeHtml(formatBeachAccessAddress(closest.access))}<br>${escapeHtml(closest.access.town)}</p>
          <div class="beach-result-facts">
            <span><b>${formatBeachDistance(closest.distanceFeet)}</b> estimated proximity</span>
            <span><b>${closest.walkMinutes} min</b> simple walk estimate</span>
            <span><b>${Number(closest.access.parkingSpots || 0).toLocaleString()}</b> parking spaces</span>
          </div>
          <div class="beach-feature-row">${beachFeatureBadges(closest.access)}</div>
          <a href="${closestDirections}" target="_blank" rel="noopener">Open walking directions</a>
        </article>
        ${majorNote}
      </div>
      <p class="beach-route-note">This static Treasure demo uses GIS coordinates to choose the closest mapped access. Use the Google walking-directions link for the actual street-by-street route, especially around canals, private streets, and dune paths.</p>
    `;
  }

  function renderBeachAccessDynamic() {
    const suggestions = document.querySelector("[data-beach-access-suggestions]");
    const results = document.querySelector("[data-beach-access-results]");
    const stats = document.querySelector("[data-beach-access-stats]");
    if (suggestions) suggestions.innerHTML = renderBeachSuggestions();
    if (results) results.innerHTML = renderBeachLookupResult();
    if (stats) {
      const majorCount = beachAccessState.loaded ? majorBeachAccesses().length : 0;
      const videoCount = Object.values(beachAccessState.aerialVideos).filter((entry) => entry?.state === "ACTIVE").length;
      stats.innerHTML = `
        <span><b>${beachAccessState.accesses.length || 112}</b> Topsail public beach-access records</span>
        <span><b>${beachAccessState.properties.length || 7829}</b> searchable island property addresses</span>
        <span><b>${majorCount}</b> major accesses with parking, restroom, and shower data</span>
        <span><b>${videoCount}</b> Google flyover records in the prototype registry</span>
      `;
    }
  }

  function renderBeachAccessPage() {
    const page = document.querySelector("[data-beach-access-page]");
    if (!page) return;

    page.innerHTML = `
      <section class="page-hero beach-access-hero">
        <div>
          <span class="eyebrow">Topsail Beach Access Finder</span>
          <h1>Find The Best Beach Access For Your Topsail Stay</h1>
          <p>Search a real Topsail Island property address and compare the closest public beach access with the larger access points that have parking, restrooms, and showers.</p>
          <div class="hero-button-row">
            <a class="management-action-link" href="#beach-access-finder-tool">Find an access</a>
            <a class="management-action-link secondary-management-link" href="#major-beach-accesses">See major accesses</a>
          </div>
        </div>
      </section>
      <section class="content-shell beach-access-finder" id="beach-access-finder-tool">
        <div class="section-heading row-heading beach-access-intro">
          <div>
            <span class="eyebrow">North Topsail Beach · Surf City · Topsail Beach</span>
            <h2>Type an address. Treasure finds the beach path.</h2>
          </div>
          <p>This page is built for guests searching for beach accesses in North Topsail Beach, Surf City, and Topsail Beach. It favors practical trip planning: where to walk, where to park, and which public accesses have the facilities families usually ask about first.</p>
        </div>
        <div class="beach-tool-layout">
          <article class="beach-tool-card">
            <form class="beach-search-form" data-beach-access-form>
              <label for="beach-access-address">Property address</label>
              <div class="beach-search-row">
                <input id="beach-access-address" type="search" autocomplete="off" data-beach-access-input value="${escapeHtml(beachAccessState.query)}" placeholder="Start typing 4444 Island Drive">
                <button type="submit">Find Access</button>
              </div>
              <p>Pick from verified Onslow and Pender GIS addresses so the result does not depend on a guessed spelling.</p>
            </form>
            <div data-beach-access-suggestions></div>
          </article>
          <aside class="beach-icon-legend" aria-label="Beach access feature legend">
            <span class="eyebrow">Icon guide</span>
            <div class="beach-legend-grid">
              <span><i>P</i> Parking spaces</span>
              <span><i>R</i> Restroom</span>
              <span><i>S</i> Shower</span>
              <span><i>ADA</i> Accessible route listed</span>
              <span><i>Mat</i> Beach mat</span>
              <span><i>WC</i> Beach wheelchair program</span>
              <span><i>Fly</i> Google flyover record</span>
              <span><i>SV</i> Street View still record</span>
            </div>
          </aside>
        </div>
        <div class="beach-access-stats" data-beach-access-stats></div>
        <div data-beach-access-results></div>
        <section class="beach-section-block free-parking-block" aria-labelledby="free-parking-heading">
          <div class="section-heading row-heading">
            <div>
              <span class="eyebrow">Free beach parking</span>
              <h2 id="free-parking-heading">Best free parking bets on Topsail Island</h2>
            </div>
            <p>The cleanest free-parking recommendation in this mockup is North Topsail Beach's Onslow County access lots. Surf City and Topsail Beach parking rules are more seasonal and should be verified on town signs or official parking pages before guests rely on them.</p>
          </div>
          <div class="beach-card-grid">
            ${freeParkingAccesses().map((access) => beachAccessCard(access, { label: "Recommended free parking" })).join("")}
          </div>
        </section>
        <section class="beach-section-block" id="major-beach-accesses" aria-labelledby="major-access-heading">
          <div class="section-heading row-heading">
            <div>
              <span class="eyebrow">Major beach accesses</span>
              <h2 id="major-access-heading">Accesses with parking, restrooms, and showers</h2>
            </div>
            <p>These are the access points I would elevate for guests because they solve more than one problem: they have parking listed, restroom data, and shower data. Smaller walkovers are still useful when they are closest to the house, but these are better for families meeting up, arriving by car, or planning a full beach day.</p>
          </div>
          <div class="beach-card-grid major-access-grid">
            ${majorBeachAccesses().map((access) => beachAccessCard(access)).join("")}
          </div>
        </section>
      </section>
    `;

    if (!beachAccessState.loaded && !beachAccessState.loading) {
      void loadBeachAccessData();
    }
    renderBeachAccessDynamic();
  }

  function townHeroSlides(town) {
    const images = Array.isArray(town.images) && town.images.length ? town.images : [town.image];
    return `
      <div class="town-hero-media" data-town-carousel>
        ${images.map((image, index) => `
          <span class="town-hero-slide ${index === 0 ? "active" : ""}" style="background-image:url('${image}')"></span>
        `).join("")}
      </div>
    `;
  }

  function renderTownPage() {
    const townPage = document.querySelector("[data-town-page]");
    if (!townPage) return;
    const town = data.areaTowns.find((entry) => entry.label === state.selectedTown) || data.areaTowns[0];
    const rentals = townRentals(town.label);
    const restaurants = data.restaurants.filter((restaurant) => restaurant.town === town.label || restaurant.near === town.label).slice(0, 4);
    const featuredRentalMarkup = rentals.length
      ? rentals.slice(0, 3).map((property) => propertyCard(property)).join("")
      : `
        <div class="no-results town-empty">
          <h3>No selected ${town.label} inventory is highlighted yet</h3>
          <p>Browse all selected rentals to compare nearby homes across Topsail Island, or contact Treasure for help finding the right fit in ${town.label}.</p>
          <button type="button" class="secondary-button" data-view-link="search">Browse all selected rentals</button>
        </div>
      `;

    townPage.innerHTML = `
      <section class="town-hero">
        ${townHeroSlides(town)}
        <div class="town-hero-content">
          <span class="eyebrow">${town.kicker}</span>
          <h1>${town.label}</h1>
          <p>${town.summary}</p>
          <div class="hero-button-row">
            <button type="button" data-view-link="search" data-town="${town.label}">View ${rentals.length} rentals</button>
            <button type="button" class="secondary-button" data-view-link="restaurants">Nearby restaurants</button>
          </div>
        </div>
      </section>
      <section class="content-shell town-detail-shell">
        <div class="town-detail-grid">
          <article>
            <span class="eyebrow">Best for</span>
            <h2>What Guests Usually Love Here</h2>
            <div class="guide-chip-row large">
              ${town.bestFor.map((item) => `<span>${item}</span>`).join("")}
            </div>
            <p class="local-tip">${town.localTip}</p>
          </article>
          <aside>
            <h3>Town highlights</h3>
            <ul>${town.highlights.map((item) => `<li>${item}</li>`).join("")}</ul>
          </aside>
        </div>
        <div class="section-heading row-heading">
          <div>
            <span class="eyebrow">${town.label}</span>
            <h2>Featured Homes In This Area</h2>
          </div>
          <button type="button" class="secondary-button" data-view-link="search" data-town="${town.label}">See all ${rentals.length}</button>
        </div>
        <div class="property-grid">
          ${featuredRentalMarkup}
        </div>
        <div class="section-heading">
          <span class="eyebrow">Eat nearby</span>
          <h2>Restaurants To Mention</h2>
        </div>
        <div class="restaurant-mini-grid">
          ${restaurants.map((restaurant) => `
            <article class="content-card">
              <h3>${restaurant.name}</h3>
              <p>${restaurant.vibe}</p>
              <span>${restaurant.category}</span>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function rotateTownCarousel(direction = 1) {
    const carousel = document.querySelector("[data-town-carousel]");
    if (!carousel) return;
    const slides = Array.from(carousel.querySelectorAll(".town-hero-slide"));
    if (slides.length <= 1) return;
    const current = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    const next = (current + Number(direction) + slides.length) % slides.length;
    slides.forEach((slide, index) => slide.classList.toggle("active", index === next));
  }

  function setReviewSlide(carousel, index) {
    const slides = Array.from(carousel.querySelectorAll("[data-review-slide]"));
    if (!slides.length) return;
    const dots = Array.from(carousel.querySelectorAll("[data-review-dot]"));
    const next = (Number(index) + slides.length) % slides.length;
    carousel.dataset.reviewIndex = String(next);
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === next;
      slide.classList.toggle("active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === next;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-pressed", String(active));
    });
  }

  function moveReviewCarousel(carousel, direction = 1, force = false) {
    if (!force && (carousel.dataset.reviewPaused === "true" || carousel.matches(":hover") || carousel.contains(document.activeElement))) return;
    const slides = Array.from(carousel.querySelectorAll("[data-review-slide]"));
    if (slides.length <= 1) return;
    const current = Number.isFinite(Number(carousel.dataset.reviewIndex))
      ? Number(carousel.dataset.reviewIndex)
      : Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));
    setReviewSlide(carousel, current + Number(direction));
  }

  function rotateReviewCarousels() {
    document.querySelectorAll("[data-review-carousel]").forEach((carousel) => {
      moveReviewCarousel(carousel);
    });
  }

  function renderRestaurantsPage() {
    const restaurantsPage = document.querySelector("[data-restaurants-page]");
    if (!restaurantsPage) return;
    const towns = ["All", "Surf City", "North Topsail Beach", "Topsail Beach", "Sneads Ferry"];
    const restaurants = state.restaurantTown === "All"
      ? data.restaurants
      : data.restaurants.filter((restaurant) => restaurant.town === state.restaurantTown || restaurant.near === state.restaurantTown);

    restaurantsPage.innerHTML = `
      <section class="page-hero restaurants-hero">
        <div>
          <span class="eyebrow">Restaurants</span>
          <h1>Where To Eat Around Topsail Island</h1>
          <p>A practical restaurant guide for guests: north-end views, Surf City staples, south-end seafood, easy takeout, and places that feel like part of the beach week.</p>
        </div>
      </section>
      <section class="content-shell">
        <div class="restaurant-filter-bar" aria-label="Restaurant town filters">
          ${towns.map((town) => `<button type="button" class="${state.restaurantTown === town ? "active" : ""}" data-restaurant-town="${town}">${town}</button>`).join("")}
        </div>
        <div class="restaurants-layout">
          ${restaurants.map((restaurant) => `
            <article class="restaurant-card">
              ${restaurantPhotoCarousel(restaurant)}
              <div class="restaurant-card-body">
                <span class="restaurant-town">${restaurant.town}${restaurant.near ? ` / near ${restaurant.near}` : ""}</span>
                <h2>${restaurant.name}</h2>
                <p>${restaurant.vibe}</p>
                <div class="restaurant-card-meta">
                  <strong class="restaurant-category">${restaurant.category}</strong>
                  <small>${restaurant.priceRange} - ${restaurant.goodFor}</small>
                </div>
                <div class="restaurant-card-actions">
                  ${restaurant.page ? `<button type="button" class="outline-button" data-view-link="content" data-page="${restaurant.page}">Open guide page</button>` : ""}
                  ${restaurant.menuUrl ? `<a class="outline-button" href="${restaurant.menuUrl}" target="_blank" rel="noreferrer">Menu</a>` : ""}
                </div>
              </div>
            </article>
          `).join("")}
        </div>
        <p class="source-note">Seasonal note: restaurant hours and menus change fast on Topsail. Each listing points guests toward current restaurant information before they head out.</p>
      </section>
    `;
    if (state.view === "restaurants") hydrateVisibleLazyBackgrounds(restaurantsPage);
  }

  function renderNightlifePage() {
    const nightlifePage = document.querySelector("[data-nightlife-page]");
    if (!nightlifePage) return;
    const towns = ["All", "Surf City", "North Topsail Beach", "Topsail Beach", "Hampstead", "Sneads Ferry", "Holly Ridge"];
    const bars = state.nightlifeTown === "All"
      ? data.nightlife
      : data.nightlife.filter((bar) => bar.town === state.nightlifeTown || bar.near === state.nightlifeTown);

    nightlifePage.innerHTML = `
      <section class="page-hero nightlife-hero">
        <div>
          <span class="eyebrow">Nightlife</span>
          <h1>Where To Grab A Drink Around Topsail</h1>
          <p>A practical guide to breweries, beach bars, cocktail rooms, pub food, live music, and easy after-dinner stops across Topsail Island, Hampstead, Sneads Ferry, and Holly Ridge.</p>
        </div>
      </section>
      <section class="content-shell">
        <div class="restaurant-filter-bar" aria-label="Nightlife town filters">
          ${towns.map((town) => `<button type="button" class="${state.nightlifeTown === town ? "active" : ""}" data-nightlife-town="${town}">${town}</button>`).join("")}
        </div>
        <div class="restaurants-layout">
          ${bars.map((bar) => `
            <article class="restaurant-card">
              ${restaurantPhotoCarousel(bar)}
              <div class="restaurant-card-body">
                <span class="restaurant-town">${bar.town}${bar.near ? ` / near ${bar.near}` : ""}</span>
                <h2>${bar.name}</h2>
                <p>${bar.vibe}</p>
                <div class="restaurant-card-meta">
                  <strong class="restaurant-category">${bar.category}</strong>
                  <small>${bar.priceRange} - ${bar.goodFor}</small>
                </div>
                <div class="restaurant-card-actions">
                  ${bar.page ? `<button type="button" class="outline-button" data-view-link="content" data-page="${bar.page}">Open guide page</button>` : ""}
                  ${bar.menuUrl ? `<a class="outline-button" href="${bar.menuUrl}" target="_blank" rel="noreferrer">Menu / site</a>` : ""}
                </div>
              </div>
            </article>
          `).join("")}
        </div>
        <p class="source-note">Seasonal note: nightlife changes quickly around Topsail. Guests should confirm hours, age rules, entertainment calendars, and cover details directly before they go.</p>
      </section>
    `;
  }

  function ownerGuideArticle(page) {
    if (!page.article) return "";
    const article = page.article;
    const sectionLinks = article.sections.map((section, index) => {
      const sectionId = `owner-guide-section-${index + 1}`;
      return `
        <a href="#${sectionId}" data-owner-guide-jump="${sectionId}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          ${section.eyebrow}
        </a>
      `;
    }).join("");

    return `
      <article class="owner-guide-article">
        <header class="owner-guide-header">
          <div>
            <span class="eyebrow">${page.section}</span>
            <h2>${article.heading || page.title}</h2>
            <p>${page.summary}</p>
          </div>
          <div class="owner-guide-meta">
            <span>${article.readTime}</span>
            <b>Topsail owner guide</b>
          </div>
        </header>
        <section class="owner-guide-intro">
          <div>
            ${article.intro.map((paragraph) => `<p>${paragraph}</p>`).join("")}
          </div>
          <div class="owner-guide-rule-card">
            <h3>Start with these rules</h3>
            <ul>
              ${article.quickRules.map((rule) => `<li>${rule}</li>`).join("")}
            </ul>
          </div>
        </section>
        <nav class="owner-guide-jump-list" aria-label="Article sections">
          ${sectionLinks}
        </nav>
        <div class="owner-guide-sections">
          ${article.sections.map((section, index) => `
            <section class="owner-guide-section" id="owner-guide-section-${index + 1}">
              <div class="owner-guide-section-copy">
                <span class="eyebrow">${section.eyebrow}</span>
                <h3>${section.title}</h3>
                <p>${section.body}</p>
              </div>
              <ul class="owner-guide-checklist">
                ${section.items.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </section>
          `).join("")}
        </div>
        <section class="owner-guide-cta">
          <div>
            <span class="eyebrow">Owner support</span>
            <h2>${article.ctaTitle}</h2>
            <p>${article.ctaBody}</p>
          </div>
          <button type="button" data-view-link="management">${article.ctaButton}</button>
        </section>
      </article>
    `;
  }

  function renderGenericPage() {
    const genericPage = document.querySelector("[data-generic-page]");
    if (!genericPage) return;
    const page = demoPage(state.selectedPage);
    const matchingProperties = page.filterPill
      ? data.properties.filter((property) => property.tags.includes(page.filterPill)).slice(0, 3)
      : [];
    const venue = page.venue;
    const venueLinks = venue ? [
      venue.officialUrl ? `<a href="${venue.officialUrl}" target="_blank" rel="noreferrer">Official site</a>` : "",
      venue.menuUrl ? `<a href="${venue.menuUrl}" target="_blank" rel="noreferrer">Menu</a>` : "",
      venue.googlePlaceUrl ? `<a href="${venue.googlePlaceUrl}" target="_blank" rel="noreferrer">Google Place</a>` : ""
    ].filter(Boolean).join("") : "";
    const venueMarkup = venue ? `
      <section class="local-feature-panel" aria-label="${venue.name} local guide">
        <div class="section-heading row-heading">
          <div>
            <span class="eyebrow">${venue.town} guide</span>
            <h2>Why Guests Should Know It</h2>
          </div>
          <div class="feature-link-row">
            ${venueLinks}
          </div>
        </div>
        <div class="local-feature-gallery">
          ${venue.images.map((image, index) => `
            <div class="${index === 0 ? "feature-photo-large" : ""}" style="background-image:url('${image}')"></div>
          `).join("")}
        </div>
        <div class="local-feature-grid">
          <article>
            <span class="eyebrow">At a glance</span>
            <h3>${venue.name}</h3>
            <p>${venue.address}</p>
            <p>${venue.phone}</p>
            <p>${venue.hours}</p>
            <p><strong>${venue.priceRange}</strong> average check range</p>
          </article>
          <article>
            <span class="eyebrow">Good for</span>
            <h3>${venue.goodFor}</h3>
            <p>${venue.vibe}</p>
            <p>${venue.sourceNote}</p>
          </article>
        </div>
        <div class="editorial-grid two-up">
          <article class="content-card">
            <h3>Menu notes</h3>
            <ul>${(venue.menuHighlights || venue.highlights || []).map((item) => `<li>${item}</li>`).join("")}</ul>
          </article>
          <article class="content-card">
            <h3>Positive review takeaways</h3>
            <ul>${(venue.positiveReviews || venue.reviewSignals || []).map((item) => `<li>${item}</li>`).join("")}</ul>
          </article>
        </div>
      </section>
    ` : "";
    const teamMarkup = page.isTeamPage ? `
      <div class="team-feature-grid">
        <figure class="team-photo-card team-video-card">
          <img class="team-poster-frame" data-team-poster src="${page.image}" alt="Treasure Vacation Rentals team on the beach">
          <video class="team-video-frame" data-team-video src="${page.video}" poster="${page.image}" muted playsinline preload="metadata" aria-label="Treasure Vacation Rentals team video"></video>
        </figure>
        <article class="content-card team-copy-card">
          <span class="eyebrow">${page.section}</span>
          <h2>Local, A Little Playful, But Serious About Your Investment</h2>
          <p>${page.summary}</p>
          <p>Expect people who know the island, answer questions directly, and understand that an owner's home is both an investment and a place guests remember.</p>
          <div class="guide-chip-row large">
            ${page.bullets.map((item) => `<span>${item}</span>`).join("")}
          </div>
        </article>
      </div>
    ` : "";
    const articleMarkup = ownerGuideArticle(page);

    genericPage.innerHTML = `
      <section class="generic-hero ${page.isTeamPage ? "team-hero" : ""}" style="background-image:url('${page.heroImage || page.image}')">
        <div>
          <span class="eyebrow">${page.section}</span>
          <h1>${page.title}</h1>
          <p>${page.summary}</p>
          ${page.filterPill ? `
            <div class="hero-button-row">
              <button type="button" data-view-link="search" data-pill="${page.filterPill}">View matching rentals</button>
            </div>
          ` : ""}
        </div>
      </section>
      <section class="content-shell generic-page-body ${page.isTeamPage ? "team-page-body" : ""}">
        ${teamMarkup}
        ${articleMarkup}
        ${articleMarkup ? "" : `<div class="generic-content-grid ${page.isTeamPage ? "sr-only" : ""}">
          <article>
            <span class="eyebrow">${page.section}</span>
            <h2>${venue ? "Why It Belongs In The Guide" : "What Guests Or Owners Need Here"}</h2>
            <p>${page.summary}</p>
            <div class="guide-chip-row large">
              ${page.bullets.map((item) => `<span>${item}</span>`).join("")}
            </div>
          </article>
          <div class="content-card">
            <h3>Page focus</h3>
            <p>This page gives guests and owners a clear place to find the basics, then points them toward the right Treasure team next step.</p>
          </div>
        </div>`}
        ${venueMarkup}
        ${matchingProperties.length ? `
          <div class="section-heading row-heading">
            <div>
              <span class="eyebrow">${page.filterPill}</span>
              <h2>${page.matchingTitle || "Matching Rentals"}</h2>
            </div>
            <button type="button" class="secondary-button" data-view-link="search" data-pill="${page.filterPill}">See all matches</button>
          </div>
          <div class="property-grid">
            ${matchingProperties.map((property) => propertyCard(property)).join("")}
          </div>
        ` : ""}
      </section>
    `;
    setupTeamVideoCard();
  }

  function setupTeamVideoCard() {
    const card = document.querySelector(".team-video-card");
    const video = document.querySelector("[data-team-video]");
    if (!card || !video) return;

    let teamVideoHasPlayed = false;

    const showPoster = () => {
      card.classList.remove("is-playing");
      card.classList.add("has-played");
    };

    const playTeamVideo = () => {
      if (teamVideoHasPlayed || !document.body.contains(card)) return;
      teamVideoHasPlayed = true;
      card.classList.add("is-playing");
      video.currentTime = 0;
      video.play().catch(showPoster);
    };

    video.addEventListener("ended", showPoster, { once: true });
    window.setTimeout(playTeamVideo, 3000);
  }

  function renderPropertyDetail() {
    const property = state.selectedProperty;
    const images = galleryImages(property);
    const extraImages = images.length >= 3 ? images : images.concat(images, images).slice(0, 3);
    const consideredCount = 24 + (property.bedrooms % 9);
    const guestCount = Math.min(property.sleeps, 8);
    const isDogFriendly = property.tags.includes("Dog Friendly");
    const fullBaths = Math.floor(property.baths);
    const hasHalfBath = property.baths % 1 !== 0;
    const detailFacts = [
      { icon: "bed", label: "Bedrooms", value: `${property.bedrooms}` },
      { icon: "bath", label: "Bathrooms", value: `${fullBaths || property.baths}${hasHalfBath ? ".5" : ""}` },
      { icon: "guests", label: "Sleeps", value: `${property.sleeps}` },
      Number.isFinite(property.squareFeet) ? { icon: "area", label: "Square Feet", value: formatSquareFeet(property.squareFeet) } : null,
      { icon: isDogFriendly ? "paw" : "paw", label: "Pets", value: isDogFriendly ? "Dog Friendly" : "Ask First" }
    ].filter(Boolean);
    const featuredAmenities = [
      property.locationClass,
      isDogFriendly ? "Dog Friendly" : "No Pets Listed",
      property.tags.includes("Private Pool") ? "Private Pool" : "Outdoor Living",
      property.tags.includes("Elevator") ? "Elevator" : "Keyless Entry",
      "Wifi",
      "Linens Provided"
    ];
    const bedding = [
      `${Math.max(1, Math.min(4, Math.round(property.bedrooms / 3)))} King`,
      `${Math.max(1, Math.round(property.bedrooms / 2))} Queen`,
      `${Math.max(1, property.bedrooms - 2)} Single`
    ];
    const beddingRooms = Array.from({ length: Math.min(property.bedrooms, 8) }, (_, index) => {
      const bedType = index === 0 ? "1 King" : index % 3 === 0 ? "2 Twin" : index % 2 === 0 ? "1 Queen" : "1 King";
      return { room: `Bedroom ${index + 1}`, bed: bedType };
    });
    const amenityGroups = [
      ["Additional Amenities", ["Furnishings", "Deck Furniture", "Beach Cart"]],
      ["Appliances", ["Regular Coffee Maker(s)", "Dishwasher", "Microwave"]],
      ["Entertainment", ["Wireless Internet", "TVs (Multiple)", property.tags.includes("Hot Tub") ? "Hot Tub" : "Smart TV"]],
      ["Exterior Amenities", [property.locationClass, "Covered Deck", "Outside Shower"]],
      ["Interior Amenities", ["C/AC & Heat", "Fully Equipped Kitchen", "Washer/Dryer"]],
      ["Stay Type", ["Weekly", property.turnDay ? `${property.turnDay} Check-In` : "Flexible Check-In"]]
    ];
    const unavailableDays = new Set([3, 4, 5, 10, 11, 12, 17, 18, 19]);
    const stayDays = new Set([24, 25, 26, 27, 28, 29, 30]);

    function detailCalendarMonth(monthName, offset = 0) {
      const blanks = Array.from({ length: offset }, () => `<span class="blank"></span>`).join("");
      const days = Array.from({ length: 31 }, (_, index) => {
        const day = index + 1;
        const classes = [
          unavailableDays.has(day) ? "unavailable" : "",
          stayDays.has(day) ? "selected-stay" : "",
          day === 24 ? "check-in" : "",
          day === 30 ? "check-out" : ""
        ].filter(Boolean).join(" ");
        return `<button type="button" class="${classes}">${day}</button>`;
      }).join("");

      return `
        <div class="detail-month">
          <h3>${monthName}</h3>
          <div class="weekday-row"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
          <div class="detail-calendar-grid">${blanks}${days}</div>
        </div>
      `;
    }

    function sidebarCalendar() {
      const days = Array.from({ length: 31 }, (_, index) => {
        const day = index + 1;
        const classes = [
          day === 23 ? "today" : "",
          stayDays.has(day) ? "selected-stay" : "",
          day === 24 ? "check-in" : "",
          day === 30 ? "check-out" : "",
          unavailableDays.has(day) ? "unavailable" : ""
        ].filter(Boolean).join(" ");
        return `<button type="button" class="${classes}">${day}</button>`;
      }).join("");

      return `
        <div class="sidebar-calendar">
          <div class="sidebar-calendar-head"><button type="button" aria-label="Previous month">&lsaquo;</button><strong>May 2026</strong><button type="button" aria-label="Next month">&rsaquo;</button></div>
          <div class="weekday-row"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
          <div class="detail-calendar-grid">${days}</div>
        </div>
      `;
    }

    document.querySelector("[data-property-detail]").innerHTML = `
      <nav class="detail-tabs" aria-label="Property details">
        <div class="detail-tab-list">
          <a href="#description">Description</a>
          <a href="#availability">Availability Calendar</a>
          <a href="#bedding">Bedding</a>
          <a href="#amenities">Amenities</a>
          <a href="#guest-info">Guest Info</a>
          <a href="#reviews">Reviews</a>
        </div>
        <div class="detail-action-icons">
          <a href="#location" aria-label="View location">Map</a>
          <button type="button" aria-label="View photos">${extraImages.length}</button>
          <button type="button" aria-label="Save ${property.name}"><span aria-hidden="true">&#9825;</span></button>
        </div>
      </nav>
      <section id="detail-photos" class="detail-photo-mosaic" aria-label="Photos for ${property.name}">
        <div class="mosaic-main detail-carousel">
          <div class="detail-photo-track" role="group" tabindex="0" aria-label="Photos for ${property.name}">
            ${extraImages.map((image, index) => lazyBackgroundFrame(image, "detail-photo-frame", index, `${property.name} photo ${index + 1}`)).join("")}
          </div>
          <button class="mosaic-save" type="button" aria-label="Save ${property.name}"><span aria-hidden="true">&#9825;</span></button>
          ${galleryDots(extraImages)}
        </div>
        <div class="mosaic-side">
          <div style="background-image:url('${extraImages[1]}')"></div>
          <button type="button" style="background-image:url('${extraImages[2]}')"><span>Search ${Math.max(9, extraImages.length * 9)}</span></button>
        </div>
      </section>
      <section class="detail-property-kicker" aria-label="Property overview">
        <div>
          <span>${property.locationClass} - Rating ${property.rating} (${property.reviews})</span>
          <strong>${property.location}</strong>
        </div>
        <div class="detail-page-actions" aria-label="Property actions">
          <button type="button" data-scroll-target="detail-photos">Matterport Virtual Tour</button>
          <button type="button" data-share-property>Share</button>
          <a href="mailto:?subject=${encodeURIComponent(property.name)}&body=${encodeURIComponent(`Take a look at ${property.name} from Treasure Vacation Rentals.`)}">Send to a Friend</a>
        </div>
      </section>
      <div class="detail-layout">
        <article class="detail-main">
          <div class="detail-rating-row">
            <span class="stars">&#9733; ${property.rating} (${property.reviews})</span>
          </div>
          <h1>${property.name}</h1>
          <p class="address">${property.address}</p>
          <div class="detail-key-facts" aria-label="Key property facts">
            ${detailFacts.map((fact) => `
              <span>
                ${cardIcon(fact.icon)}
                <b>${fact.value}</b>
                <small>${fact.label}</small>
              </span>
            `).join("")}
          </div>
          <div class="detail-summary-grid">
            <span><b>Address</b>${property.address || "Topsail Island"}</span>
            <span><b>Town</b>${property.location}</span>
            <span><b>Location</b>${property.locationClass}</span>
            <span><b>Type</b>Home</span>
            <span><b>Bedrooms</b>${property.bedrooms} bedrooms</span>
            <span><b>Bathrooms</b>${property.baths} baths</span>
            <span><b>Pets</b>${isDogFriendly ? "Pets Allowed" : "Ask About Pets"}</span>
            <span><b>Check-In</b>${property.turnDay}</span>
          </div>
          <section class="property-deal-banner" aria-label="Property special">
            <span>Special - Save up to 20% off Summer Stays</span>
            <p>Book before June 21 and save on select stays between now and Labor Day. Ask our team to confirm the best available week for this home.</p>
          </section>
          <section class="weekly-specials" aria-label="Weekly specials">
            <h2>Weekly Specials</h2>
            <p>5/24/26 to 5/30/26 - Reduced from <s>${money(Math.round(property.weeklyRate * 1.12))}</s> to ${money(property.weeklyRate)}</p>
          </section>
          <section id="location" class="detail-section">
            <h2>Location</h2>
            <div class="detail-location-map" role="img" aria-label="${property.locationClass} map location for ${property.name}">
              <span class="detail-map-road road-one"></span>
              <span class="detail-map-road road-two"></span>
              <span class="detail-map-road road-three"></span>
              <span class="detail-map-water"></span>
              <span class="detail-map-pin">${property.bedrooms}</span>
              <strong>${property.address || property.location}</strong>
            </div>
          </section>
          <section id="description">
            <h2>Description</h2>
            <p>${property.description}</p>
            <p>From wide gathering spaces to easy beach-day routines, this home is arranged for families who want room to spread out and a straightforward path from morning coffee to sunset on the deck.</p>
            <p><b>Main Level:</b> Open living, dining, and kitchen areas built for a beach week, with easy access to decks and outdoor gathering space.</p>
            <p><b>Features include:</b> ${property.tags.join(", ")}, wireless internet, washer/dryer, covered deck, and a fully equipped kitchen.</p>
            <button class="outline-button" type="button">Read More</button>
          </section>
          <section id="availability">
            <h2>Availability Calendar</h2>
            <p>Please select dates for price quote</p>
            <div class="calendar-key" aria-label="Calendar key">
              <span><i class="available"></i>Available</span>
              <span><i class="unavailable"></i>Unavailable</span>
              <span><i class="check-in"></i>Check-In</span>
              <span><i class="check-out"></i>Check-Out</span>
            </div>
            <div class="detail-calendar-pair">
              ${detailCalendarMonth("May 2026", 5)}
              ${detailCalendarMonth("June 2026", 1)}
            </div>
          </section>
          <section id="bedding">
            <h2>Bedding</h2>
            <div class="bedding-room-grid">
              ${beddingRooms.map((room) => `
                <span>
                  <small>Bed</small>
                  <b>${room.room}</b>
                  <em>${room.bed}</em>
                </span>
              `).join("")}
            </div>
            <div class="bedding-grid">${bedding.map((item) => `<span>${item}</span>`).join("")}</div>
          </section>
          <section id="amenities">
            <h2>Amenities <span>${featuredAmenities.length + amenityGroups.flatMap(([, items]) => items).length} Amenities</span></h2>
            <div class="featured-amenities">
              <h3>Featured Amenities</h3>
              <div>
                ${featuredAmenities.map((amenity) => `<span>${amenity}</span>`).join("")}
              </div>
            </div>
            <div class="amenity-category-grid">
              ${amenityGroups.map(([group, items]) => `
                <div>
                  <h3>${group}</h3>
                  <ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>
                </div>
              `).join("")}
            </div>
            <button class="outline-button" type="button">Show All Amenities</button>
          </section>
          <section id="guest-info">
            <h2>Guest Info</h2>
            <div class="guest-info-list">
              <p><b>Review information and important tips</b> about check-in, keyless entry, trash collection days, and local policies before arrival.</p>
              <p><b>Travel insurance</b> can help protect the trip if plans change.</p>
              <p><b>Security deposit waiver</b> and house rules should be reviewed before booking.</p>
            </div>
            <button class="outline-button" type="button">Read More</button>
          </section>
          <section class="property-qa-panel">
            <div>
              <h2>Have a question?</h2>
              <p>Want to know specifics? Ask anything about this property before you reserve.</p>
            </div>
            <button type="button" data-scroll-target="request-info">Ask Your Question</button>
          </section>
          <section id="request-info" class="request-info-panel">
            <h2>Request More Info</h2>
            <p>Ask anything in reference to vacationing at this property and we will follow up with helpful local context.</p>
            <div class="request-info-grid">
              <label>First Name <input type="text"></label>
              <label>Last Name <input type="text"></label>
              <label>Email <input type="email"></label>
              <label>Comments / Questions <textarea rows="3"></textarea></label>
            </div>
            <button type="button">Request Info</button>
          </section>
          <section id="reviews">
            <h2>Reviews <span>${property.rating} (${property.reviews})</span></h2>
            <div class="review-list">
              <blockquote><b>Rating 5</b><p>The home was clean, bright, and easy for our group.</p><cite>Recent Guest - Stayed 2026</cite></blockquote>
              <blockquote><b>Rating 5</b><p>Great location, clear information, and the booking process felt simple.</p><cite>Treasure Guest - Stayed 2025</cite></blockquote>
              <blockquote><b>Rating 4</b><p>Comfortable beds and plenty of space for a Topsail week.</p><cite>Family Traveler - Stayed 2024</cite></blockquote>
            </div>
            <button class="outline-button" type="button">See all reviews</button>
          </section>
        </article>
        <div class="detail-booking-sidebar">
          <h2>Choose your dates</h2>
          <div class="popular-callout"><b>${consideredCount}</b> People have considered this property in the last 24 hours <button type="button" aria-label="Dismiss">x</button></div>
          <div class="sidebar-date-row">
            <label>Arrival <input type="text" placeholder="Arrival"></label>
            <label>Departure <input type="text" placeholder="Departure"></label>
          </div>
          ${sidebarCalendar()}
          <div class="calendar-key sidebar-key">
            <span><i class="available"></i>Available</span>
            <span><i class="unavailable"></i>Unavailable</span>
            <span><i class="check-in"></i>Check-In</span>
            <span><i class="check-out"></i>Check-Out</span>
          </div>
          <button type="button" class="remind-button">Remind Me To Book This Later</button>
          <button type="button">Book Now</button>
          <button type="button" class="secondary-button">Split Cost Calculator</button>
          <div class="rent-line"><span>Rent:</span><strong>${money(property.weeklyRate)}</strong></div>
          <label>Guests <input type="number" min="1" value="${guestCount}"></label>
          <button type="button">Submit Request</button>
        </div>
      </div>
      <div class="mobile-availability-bar" data-mobile-availability-bar>
        <a href="#availability">Check Availability</a>
        <a href="#description">See More</a>
      </div>
    `;
    if (state.view === "property") hydrateVisibleLazyBackgrounds(document.querySelector("[data-property-detail]"));
    updateMobileAvailabilityBar();
  }

  function updateMobileAvailabilityBar() {
    const bar = document.querySelector("[data-mobile-availability-bar]");
    if (!bar) return;
    const shouldShow = state.view === "property" && window.matchMedia("(max-width: 620px)").matches && window.scrollY > 520;
    bar.classList.toggle("visible", shouldShow);
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll("[data-view]").forEach((section) => {
      section.classList.toggle("active", section.dataset.view === view);
    });
    hydrateActiveViewBackgrounds();
    syncHomeVersionToggle();
    window.scrollTo({ top: 0, behavior: "auto" });
    updateMobileAvailabilityBar();
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 0);
    window.setTimeout(updateMobileAvailabilityBar, 0);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "auto" }), 150);
    window.setTimeout(updateMobileAvailabilityBar, 150);
  }

  function syncHomeVersionToggle() {
    document.querySelectorAll("[data-home-version]").forEach((button) => {
      const active = button.dataset.homeVersion === state.view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function routeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const hashView = window.location.hash.replace("#", "");
    let view = document.querySelector(`[data-view="${hashView}"]`) ? hashView : "home-video";

    if (params.get("v") === "home") {
      view = "home";
    }
    if (params.get("v") === "video-home") {
      view = "home-video";
    }

    return {
      view,
      page: params.get("page") || "",
      town: params.get("town") || "",
      pill: params.get("pill") || "",
      property: params.get("property") || ""
    };
  }

  function routeUrl(route) {
    const url = new URL(window.location.href);
    ["page", "town", "pill", "property"].forEach((param) => url.searchParams.delete(param));

    if (route.view === "home") {
      url.searchParams.set("v", "home");
    } else {
      url.searchParams.delete("v");
    }

    if (route.page) url.searchParams.set("page", route.page);
    if (route.town) url.searchParams.set("town", route.town);
    if (route.pill) url.searchParams.set("pill", route.pill);
    if (route.property) url.searchParams.set("property", route.property);
    url.hash = route.view || "home-video";
    return url;
  }

  function applyRoute(route) {
    const nextRoute = { view: route.view || "home-video" };
    if (route.page) nextRoute.page = route.page;
    if (route.town) nextRoute.town = route.town;
    if (route.pill) nextRoute.pill = route.pill;
    if (route.property) nextRoute.property = route.property;

    if (nextRoute.view === "content" && nextRoute.page) {
      state.selectedPage = nextRoute.page;
      renderGenericPage();
    }
    if (nextRoute.view === "town" && nextRoute.town) {
      state.selectedTown = nextRoute.town;
      renderTownPage();
    }
    if (nextRoute.view === "property" && nextRoute.property) {
      state.selectedProperty = data.properties.find((property) => property.id === nextRoute.property) || state.selectedProperty;
      renderPropertyDetail();
    }
    if (nextRoute.view === "search" && nextRoute.town) {
      state.filters.location = "";
      state.filters.towns = [nextRoute.town];
    }
    if (nextRoute.pill) {
      applyPillFilter(nextRoute.pill);
    }
    if (nextRoute.view === "search") {
      renderResults();
    }

    setView(nextRoute.view);
    return nextRoute;
  }

  function navigateToRoute(route, options = {}) {
    const nextRoute = applyRoute(route);
    const url = routeUrl(nextRoute);
    const historyMode = options.history || "push";

    if (historyMode === "replace") {
      window.history.replaceState({ route: nextRoute }, "", url);
      return;
    }
    if (historyMode !== "none" && url.href !== window.location.href) {
      window.history.pushState({ route: nextRoute }, "", url);
    }
  }

  function updateHomeVersionQuery(view) {
    navigateToRoute({ view }, { history: "replace" });
  }

  function initViewFromQuery() {
    const route = routeFromUrl();
    state.view = route.view;
    if (route.page) {
      state.selectedPage = route.page;
    }
    if (route.town) {
      state.selectedTown = route.town;
    }
    if (route.property) {
      state.selectedProperty = data.properties.find((property) => property.id === route.property) || state.selectedProperty;
    }
    if (route.view === "search" && route.town) {
      state.filters.location = "";
      state.filters.towns = [route.town];
    }
    if (route.pill) {
      applyPillFilter(route.pill);
    }
  }

  function syncFilterControls() {
    document.querySelectorAll("[data-filter]").forEach((filter) => {
      filter.value = state.filters[filter.dataset.filter] || "";
    });
    document.querySelectorAll("[data-filter-checkbox]").forEach((input) => {
      const group = input.dataset.filterCheckbox;
      input.checked = (state.filters[group] || []).includes(input.value);
    });
    document.querySelectorAll("[data-filter-exact]").forEach((input) => {
      const key = input.dataset.filterExact === "bedrooms" ? "exactBedrooms" : "exactBathrooms";
      input.checked = Boolean(state.filters[key]);
    });
    document.querySelectorAll("[data-counter-value]").forEach((counter) => {
      const kind = counter.dataset.counterValue;
      const value = state.filters[kind];
      const exact = kind === "bedrooms" ? state.filters.exactBedrooms : state.filters.exactBathrooms;
      counter.textContent = value ? `${value}${exact ? "" : "+"}` : "Any";
    });
    const propertySearch = document.querySelector("[data-specific-property]");
    if (propertySearch) propertySearch.value = state.filters.propertyName;
    const activeCount = activeFilterCount();
    const countBadge = document.querySelector("[data-filter-count]");
    if (countBadge) {
      countBadge.textContent = activeCount;
      countBadge.hidden = activeCount === 0;
    }
  }

  function activeFilterCount() {
    return [
      state.filters.location,
      state.filters.locationClass,
      state.filters.bedrooms,
      state.filters.bathrooms,
      state.filters.amenity,
      state.filters.collection,
      state.filters.propertyName,
      ...state.filters.towns,
      ...state.filters.locationClasses,
      ...state.filters.amenities,
      ...state.filters.collections,
      ...state.filters.stayTypes,
      ...state.filters.unitTypes,
      ...state.filters.specials
    ].filter(Boolean).length;
  }

  function toggleFilterPanel(forceOpen) {
    const panel = document.querySelector("[data-filter-panel]");
    const button = document.querySelector("[data-filter-toggle]");
    if (!panel || !button) return;
    const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : panel.hidden;
    panel.hidden = !shouldOpen;
    button.setAttribute("aria-expanded", String(shouldOpen));
  }

  function updateCounterFilter(kind, step) {
    const max = kind === "bedrooms" ? 16 : 17;
    const current = Number(state.filters[kind] || 0);
    const next = Math.max(0, Math.min(max, current + Number(step)));
    state.filters[kind] = next ? String(next) : "";
    syncFilterControls();
    renderResults();
  }

  function applyFacetCheckbox(input) {
    const group = input.dataset.filterCheckbox;
    const checked = Array.from(document.querySelectorAll(`[data-filter-checkbox="${group}"]:checked`))
      .map((item) => item.value);
    state.filters[group] = checked;
    if (group === "locationClasses") state.filters.locationClass = "";
    if (group === "amenities") state.filters.amenity = "";
    if (group === "collections") state.filters.collection = "";
    syncFilterControls();
    renderResults();
  }

  function applyPillFilter(value) {
    state.filters.locationClass = "";
    state.filters.amenity = "";
    state.filters.collection = "";
    state.filters.locationClasses = [];
    state.filters.amenities = [];
    state.filters.collections = [];

    if (locationTypes.includes(value)) {
      state.filters.locationClasses = [value];
    } else if (amenityTypes.includes(value)) {
      state.filters.amenities = [value];
    } else if (collectionTypes.includes(value)) {
      state.filters.collections = [value];
    } else {
      state.filters.amenities = [value];
    }

    syncFilterControls();
  }

  function moveCardCarousel(button) {
    const photo = button.closest(".property-photo, .restaurant-photo-carousel");
    const track = photo ? photo.querySelector(".photo-track") : null;
    if (!track) return;

    const direction = Number(button.dataset.carouselDirection || 1);
    const frameWidth = track.clientWidth || track.getBoundingClientRect().width;
    const maxIndex = Math.max(0, track.children.length - 1);
    const currentIndex = Math.round(track.scrollLeft / frameWidth);
    const nextIndex = Math.max(0, Math.min(maxIndex, currentIndex + direction));

    hydrateLazyBackgrounds(track, nextIndex);
    track.scrollTo({
      left: nextIndex * frameWidth,
      behavior: "smooth"
    });

    const dots = photo.querySelectorAll(".photo-scroll-indicator span");
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === nextIndex);
    });
  }

  function featuredAutoScrollIsPaused(track) {
    const carousel = track.closest(".featured-carousel");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const manualPauseUntil = Number(track.dataset.featuredPauseUntil || 0);
    return reducedMotion
      || Date.now() < manualPauseUntil
      || track.matches(":hover")
      || track.contains(document.activeElement)
      || (carousel && (carousel.matches(":hover") || carousel.contains(document.activeElement)));
  }

  function pauseFeaturedAutoScroll(track, duration = FEATURED_SCROLL_MANUAL_PAUSE_MS) {
    track.dataset.featuredPauseUntil = String(Date.now() + duration);
  }

  function scrollFeaturedProperties(timestamp) {
    if (!featuredScrollLastTime) featuredScrollLastTime = timestamp;
    const elapsed = Math.min(64, timestamp - featuredScrollLastTime);
    featuredScrollLastTime = timestamp;

    document.querySelectorAll("[data-featured-properties]").forEach((track) => {
      const maxLeft = track.scrollWidth - track.clientWidth;
      if (maxLeft <= 0 || track.clientWidth <= 0 || featuredAutoScrollIsPaused(track)) {
        track.classList.remove("is-auto-scrolling");
        track.dataset.featuredScrollLeft = String(track.scrollLeft);
        return;
      }

      track.classList.add("is-auto-scrolling");
      const currentLeft = Number(track.dataset.featuredScrollLeft || track.scrollLeft);
      const nextLeft = currentLeft + (elapsed * FEATURED_SCROLL_SPEED);
      if (nextLeft >= maxLeft - 1) {
        track.classList.remove("is-auto-scrolling");
        track.dataset.featuredScrollLeft = "0";
        track.scrollTo({ left: 0, behavior: "auto" });
        pauseFeaturedAutoScroll(track, 900);
        return;
      }

      track.dataset.featuredScrollLeft = String(nextLeft);
      track.scrollLeft = nextLeft;
    });

    window.requestAnimationFrame(scrollFeaturedProperties);
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const homeVersion = event.target.closest("[data-home-version]");
      if (homeVersion) {
        event.preventDefault();
        navigateToRoute({ view: homeVersion.dataset.homeVersion });
        return;
      }

      const carouselButton = event.target.closest("[data-carousel-direction]");
      if (carouselButton) {
        event.preventDefault();
        moveCardCarousel(carouselButton);
        return;
      }

      const featuredScrollButton = event.target.closest("[data-featured-scroll]");
      if (featuredScrollButton) {
        event.preventDefault();
        const carousel = featuredScrollButton.closest(".featured-carousel");
        const track = carousel ? carousel.querySelector("[data-featured-properties]") : null;
        if (!track) return;
        const firstCard = track.querySelector(".property-card");
        if (!firstCard) return;
        const direction = Number(featuredScrollButton.dataset.featuredScroll) || 1;
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;
        const step = firstCard.getBoundingClientRect().width + gap;
        const currentIndex = Math.round(track.scrollLeft / step);
        const maxLeft = track.scrollWidth - track.clientWidth;
        const nextLeft = Math.max(0, Math.min(maxLeft, (currentIndex + direction) * step));
        track.scrollTo({
          left: nextLeft,
          behavior: "smooth"
        });
        track.dataset.featuredScrollLeft = String(nextLeft);
        pauseFeaturedAutoScroll(track);
        return;
      }

      const reviewDot = event.target.closest("[data-review-dot]");
      if (reviewDot) {
        event.preventDefault();
        const carousel = reviewDot.closest("[data-review-carousel]");
        if (!carousel) return;
        setReviewSlide(carousel, Number(reviewDot.dataset.reviewDot));
        return;
      }

      const scrollTarget = event.target.closest("[data-scroll-target]");
      if (scrollTarget) {
        event.preventDefault();
        const target = document.getElementById(scrollTarget.dataset.scrollTarget);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const ownerGuideJump = event.target.closest("[data-owner-guide-jump]");
      if (ownerGuideJump) {
        event.preventDefault();
        const target = document.getElementById(ownerGuideJump.dataset.ownerGuideJump);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const shareProperty = event.target.closest("[data-share-property]");
      if (shareProperty) {
        event.preventDefault();
        const shareUrl = window.location.href;
        const shareTitle = state.selectedProperty ? state.selectedProperty.name : document.title;
        if (navigator.share) {
          navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            const previousText = shareProperty.textContent;
            shareProperty.textContent = "Link Copied";
            window.setTimeout(() => {
              shareProperty.textContent = previousText;
            }, 1600);
          }).catch(() => {});
        }
        return;
      }

      const filterToggle = event.target.closest("[data-filter-toggle]");
      if (filterToggle) {
        event.preventDefault();
        toggleFilterPanel();
        return;
      }

      const counterButton = event.target.closest("[data-counter-step]");
      if (counterButton) {
        event.preventDefault();
        updateCounterFilter(counterButton.dataset.counterStep, counterButton.dataset.step);
        return;
      }

      const selectAllButton = event.target.closest("[data-select-all]");
      if (selectAllButton) {
        event.preventDefault();
        const group = selectAllButton.dataset.selectAll;
        const values = Array.from(document.querySelectorAll(`[data-filter-checkbox="${group}"]`)).map((input) => input.value);
        state.filters[group] = values.every((value) => state.filters[group].includes(value)) ? [] : values;
        if (group === "locationClasses") state.filters.locationClass = "";
        if (group === "amenities") state.filters.amenity = "";
        if (group === "collections") state.filters.collection = "";
        syncFilterControls();
        renderResults();
        return;
      }

      const beachPropertyButton = event.target.closest("[data-beach-property-id]");
      if (beachPropertyButton) {
        event.preventDefault();
        const property = beachAccessState.properties.find((entry) => entry.id === beachPropertyButton.dataset.beachPropertyId);
        selectBeachProperty(property);
        return;
      }

      const viewLink = event.target.closest("[data-view-link]");
      if (viewLink) {
        event.preventDefault();
        const isPrimaryNavParent = viewLink.matches(".nav-item > button");
        navigateToRoute({
          view: viewLink.dataset.viewLink,
          town: viewLink.dataset.town || "",
          page: viewLink.dataset.page || "",
          pill: viewLink.dataset.pill || ""
        });
        if (!isPrimaryNavParent) {
          closePrimaryMenu();
        }
        return;
      }

      const propertyButton = event.target.closest("[data-property-id]");
      if (propertyButton) {
        openPropertyDetail(data.properties.find((property) => property.id === propertyButton.dataset.propertyId));
        return;
      }

      const pill = event.target.closest("[data-pill]");
      if (pill) {
        applyPillFilter(pill.dataset.pill);
        renderResults();
      }

      const restaurantTown = event.target.closest("[data-restaurant-town]");
      if (restaurantTown) {
        state.restaurantTown = restaurantTown.dataset.restaurantTown;
        renderRestaurantsPage();
      }

      const nightlifeTown = event.target.closest("[data-nightlife-town]");
      if (nightlifeTown) {
        state.nightlifeTown = nightlifeTown.dataset.nightlifeTown;
        renderNightlifePage();
      }

      if (event.target.matches("[data-menu-toggle]")) {
        event.preventDefault();
        togglePrimaryMenu();
      }

      if (event.target.matches("[data-clear-filters]")) {
        state.filters = defaultFilters();
        syncFilterControls();
        renderResults();
      }
    });

    document.querySelectorAll("[data-search-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const bedrooms = String(formData.get("bedrooms") || "").replace("+", "");
        state.filters.bedrooms = bedrooms;
        state.filters.locationClass = formData.get("locationClass") || "";
        syncFilterControls();
        renderResults();
        navigateToRoute({ view: "search" });
      });
    });

    document.addEventListener("submit", (event) => {
      const beachAccessForm = event.target.closest("[data-beach-access-form]");
      if (!beachAccessForm) return;
      event.preventDefault();
      submitBeachAccessSearch();
    });

    document.addEventListener("input", (event) => {
      const input = event.target.closest("[data-beach-access-input]");
      if (!input) return;
      beachAccessState.query = input.value;
      beachAccessState.selectedPropertyId = "";
      beachAccessState.error = "";
      renderBeachAccessDynamic();
    });

    document.querySelectorAll("[data-filter]").forEach((filter) => {
      filter.addEventListener("change", () => {
        state.filters[filter.dataset.filter] = filter.value;
        renderResults();
      });
    });

    document.querySelectorAll("[data-filter-checkbox]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        applyFacetCheckbox(checkbox);
      });
    });

    document.querySelectorAll("[data-filter-exact]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const key = checkbox.dataset.filterExact === "bedrooms" ? "exactBedrooms" : "exactBathrooms";
        state.filters[key] = checkbox.checked;
        syncFilterControls();
        renderResults();
      });
    });

    const propertySearch = document.querySelector("[data-specific-property]");
    if (propertySearch) {
      propertySearch.addEventListener("input", () => {
        state.filters.propertyName = propertySearch.value;
        syncFilterControls();
        renderResults();
      });
    }

    document.querySelector("[data-sort]").addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderResults();
    });
  }

  function init() {
    initViewFromQuery();
    setLogo();
    renderNav();
    renderHero();
    renderQuickLinks();
    renderFeatured();
    renderResults();
    renderPropertyDetail();
    renderOwnerPages();
    renderAreaPage();
    renderBeachAccessPage();
    renderTownPage();
    renderRestaurantsPage();
    renderNightlifePage();
    renderGenericPage();
    syncFilterControls();
    bindEvents();
    setView(state.view);
    window.history.replaceState({ route: routeFromUrl() }, "", routeUrl(routeFromUrl()));
    window.addEventListener("popstate", () => {
      navigateToRoute(routeFromUrl(), { history: "none" });
    });
    window.addEventListener("scroll", updateMobileAvailabilityBar, { passive: true });
    window.addEventListener("scroll", hydrateActiveViewBackgrounds, { passive: true });
    window.addEventListener("resize", updateMobileAvailabilityBar);
    window.addEventListener("resize", hydrateActiveViewBackgrounds);
    document.querySelectorAll("[data-review-carousel]").forEach((carousel) => setReviewSlide(carousel, Number(carousel.dataset.reviewIndex) || 0));
    window.setInterval(rotateHero, 5000);
    window.setInterval(rotateTownCarousel, 4500);
    window.setInterval(rotateReviewCarousels, 6500);
    window.requestAnimationFrame(scrollFeaturedProperties);
  }

  init();
})();
