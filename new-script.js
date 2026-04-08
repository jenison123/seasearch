const API_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrQqX8pNp0dDfW5zvTegOzRXD8HgU-iY-BFYZjD_0Bn_87gxjNrdl_pVhZtWH7W7apeDtfLFkyNOXnjaZWwAzgunq1YuglS6X6y7DoQgBaHA7aqf3lzoGoweCPrNRcP_jfE09hV1FrPro7o4NPDatZra_St62kda4dSImP7SkspUzwSJ2iwrF5xyJXDI7bxyJ9XrLzcSWJeFhcSiOFXnPEQOuSLo5OOCWm-X_hIfiutvct_vLIdht7r1q7DxMXdycdrvUJqxWCRKIYD0_bVFmganeEzispvnY_V_at6q&lib=M7FhK4Wyv4Ld5yM9jfkfRP6HsPCSGXZuo";
const FAVORITES_KEY = "fav";

const cardWrap = document.querySelector(".card-wrap");
const favWrap = document.querySelector("#fav");
const loader = document.querySelector(".lds-ring");

class Modal {
  constructor() {
    this.bg = document.createElement("div");
    this.bg.classList.add("modal-bg");
    this.bg.style.display = "none";

    this.modal = document.createElement("div");
    this.modal.classList.add("modal");

    this.img = document.createElement("img");
    this.title = document.createElement("h2");
    this.desc = document.createElement("p");

    this.modal.append(this.img, this.title, this.desc);
    this.bg.append(this.modal);
    document.body.append(this.bg);

    this.bg.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-bg")) {
        this.hide();
      }
    });
  }

  setImage(url) {
    this.img.src = url;
  }

  setTitle(text) {
    this.title.textContent = text;
  }

  setDescription(html) {
    this.desc.innerHTML = html;
  }

  show() {
    this.bg.style.display = "flex";
  }

  hide() {
    this.bg.style.display = "none";
  }
}

const mainModal = new Modal();

function createMap() {
  return new ymaps.Map("map", {
    center: [43.1056, 131.874],
    zoom: 12,
  });
}

async function getPlaceData() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Ошибка загрузки данных: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
}

function getFavorites() {
  const raw = localStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.places) ? parsed.places : [];
  } catch (_error) {
    return [];
  }
}

function saveFavorites(places) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify({ places }));
}

function addToFavorites(place) {
  const favorites = getFavorites();
  favorites.push(place);
  saveFavorites(favorites);
}

function removeFromFavorites(place) {
  const favorites = getFavorites();
  const index = favorites.findIndex((p) => p.id === place.id);
  if (index !== -1) {
    favorites.splice(index, 1);
    saveFavorites(favorites);
  }
}

function isFavorite(place) {
  const favorites = getFavorites();
  return favorites.some((p) => p.id === place.id);
}

function openPlaceInModal(place) {
  mainModal.setImage(place.photo_url);
  mainModal.setTitle(place.name);
  mainModal.setDescription(marked.parse(place.description || ""));
  mainModal.show();
}

function createCard(place, onFavoriteClick) {
  const card = document.createElement("div");
  card.classList.add("card");

  const imgWrap = document.createElement("div");
  imgWrap.classList.add("img-wrap");

  const img = document.createElement("img");
  img.src = place.photo_url;
  imgWrap.append(img);

  const favBtn = document.createElement("button");
  favBtn.textContent = "Избранное";
  favBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    onFavoriteClick(place);
  });

  const title = document.createElement("h2");
  title.textContent = place.name;

  const badge = document.createElement("p");
  badge.textContent = place.type;

  card.append(imgWrap, favBtn, title, badge);
  card.addEventListener("click", () => openPlaceInModal(place));

  return card;
}

function renderCards(container, places, onFavoriteClick) {
  container.innerHTML = "";
  places.forEach((place) => {
    const card = createCard(place, onFavoriteClick);
    container.append(card);
  });
}

function updateFavScreen() {
  renderCards(favWrap, getFavorites(), (place) => {
    if (isFavorite(place)) {
      removeFromFavorites(place);
    } else {
      addToFavorites(place);
    }
    updateFavScreen();
  });
}

const screens = [
  { name: "cards", element: document.querySelector("#cards") },
  { name: "map", element: document.querySelector("#map") },
  { name: "fav", element: document.querySelector("#fav") },
];

const Screen = {
  showScreen(name) {
    screens.forEach((item) => {
      if (item.name !== name) {
        item.element.classList.add("hidden-screen");
      } else {
        item.element.classList.remove("hidden-screen");
      }
    });
  },
};

function setupScreenButtons() {
  document.querySelector(".cards-btn").addEventListener("click", () => {
    Screen.showScreen("cards");
  });
  document.querySelector(".map-btn").addEventListener("click", () => {
    Screen.showScreen("map");
  });
  document.querySelector(".fav-btn").addEventListener("click", () => {
    Screen.showScreen("fav");
  });
}

function addMapPoints(map, places) {
  places.forEach((item) => {
    const point = new ymaps.GeoObject({
      geometry: {
        type: "Point",
        coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
      },
    });
    map.geoObjects.add(point);
  });
}

async function bootstrapApp() {
  setupScreenButtons();
  Screen.showScreen("cards");
  updateFavScreen();

  ymaps.ready(async () => {
    const map = createMap();

    try {
      const places = await getPlaceData();
      loader?.remove();

      addMapPoints(map, places);
      renderCards(cardWrap, places, (place) => {
        if (isFavorite(place)) {
          removeFromFavorites(place);
        } else {
          addToFavorites(place);
        }
        updateFavScreen();
      });
    } catch (error) {
      loader?.remove();
      console.error(error);
    }
  });
}

bootstrapApp();
