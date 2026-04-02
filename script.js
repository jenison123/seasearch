// Асинхронная функция для получения данных о местах с удалённого API

async function getPlaceData() {
  // Отправляем HTTP-запрос на сервер
  const response = await fetch(
    "https://script.googleusercontent.com/macros/echo?user_content_key=AY5xjrQqX8pNp0dDfW5zvTegOzRXD8HgU-iY-BFYZjD_0Bn_87gxjNrdl_pVhZtWH7W7apeDtfLFkyNOXnjaZWwAzgunq1YuglS6X6y7DoQgBaHA7aqf3lzoGoweCPrNRcP_jfE09hV1FrPro7o4NPDatZra_St62kda4dSImP7SkspUzwSJ2iwrF5xyJXDI7bxyJ9XrLzcSWJeFhcSiOFXnPEQOuSLo5OOCWm-X_hIfiutvct_vLIdht7r1q7DxMXdycdrvUJqxWCRKIYD0_bVFmganeEzispvnY_V_at6q&lib=M7FhK4Wyv4Ld5yM9jfkfRP6HsPCSGXZuo",
  );

  // Преобразуем ответ сервера в JSON
  const data = await response.json();

  // Выводим полученные данные в консоль (для отладки)

  // Возвращаем данные из функции

  return data;
}

// Получаем контейнер, куда будут добавляться карточки
const cardWrap = document.querySelector(".card-wrap");

// Получаем элемент загрузчика
const loader = document.querySelector(".lds-ring");

// Создаём экземпляр модального окна
const mainModal = new Modal();

// Вызываем функцию загрузки данных

// Функция-конструктор модального окна
function Modal() {
  // Фон модального окна (overlay)
  this.bg = document.createElement("div");
  this.bg.classList.add("modal-bg");

  // По умолчанию окно скрыто
  this.bg.style.display = "none";

  // Закрытие модалки при клике на фон
  this.bg.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-bg")) {
      this.hide();
    }
  });

  // Основной контейнер модального окна
  this.modal = document.createElement("div");
  this.modal.classList.add("modal");
  this.bg.append(this.modal);

  // Изображение внутри модального окна
  this.img = document.createElement("img");
  this.modal.append(this.img);

  // Заголовок модального окна
  this.h2 = document.createElement("h2");
  this.modal.append(this.h2);

  // Описание
  this.desc = document.createElement("p");
  this.modal.append(this.desc);

  // Добавляем модалку в body
  document.body.append(this.bg);

  // Метод для изменения текста описания
  this.changeDesc = (str) => {
    this.desc.innerHTML = str;
  };

  // Метод для изменения заголовка
  this.changeTitle = (str) => {
    this.h2.textContent = str;
  };

  // Метод для изменения изображения
  this.chaneImg = (url) => {
    this.img.src = url;
  };

  // Метод показа модального окна
  this.show = () => {
    this.bg.style.display = "flex";
  };

  // Метод скрытия модального окна
  this.hide = () => {
    this.bg.style.display = "none";
  };
}

// Кнопка, которая открывает модалку вручную
const showMd = document.querySelector(".show-modal");

// При клике показываем модальное окно
// showMd.addEventListener("click", () => {
//   mainModal.show();
// });

//Работа с Яндекс карт
ymaps.ready(() => {
  const map = init();
  getPlaceData().then((data) => {
    // Удаляем loader после загрузки данных

    loader.remove();

    // Перебираем массив данных
    data.data.forEach((item) => {
      let point = new ymaps.GeoObject({
        geometry: {
          type: "Point", // тип геометрии - точка
          coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)], // координаты точки
        },
      });

      map.geoObjects.add(point);

      const content = marked.parse(item.description);

      // Создаём карточку
      const card = document.createElement("div");
      card.classList.add("card");

      // Контейнер для изображения
      const imgWrap = document.createElement("div");
      imgWrap.classList.add("img-wrap");
      card.append(imgWrap);

      // Само изображение
      const img = document.createElement("img");
      img.src = item["photo_url"]; // ссылка на фото из API
      imgWrap.append(img);

      // Заголовок карточки
      const title = document.createElement("h2");
      title.textContent = item.name;
      card.append(title);

      // Тип места (например музей, парк и т.д.)
      const badge = document.createElement("p");
      badge.textContent = item.type;
      card.append(badge);

      // При клике на карточку открываем модальное окно
      card.addEventListener("click", () => {
        // Меняем изображение в модальном окне
        mainModal.chaneImg(item.photo_url);

        // Меняем заголовок
        mainModal.changeTitle(item.name);

        // Меняем описание
        mainModal.changeDesc(content);

        // Показываем модальное окно
        mainModal.show();
      });

      // Добавляем карточку в общий контейнер
      cardWrap.append(card);
    });
  });
});

function init() {
  // Создание карты.
  var myMap = new ymaps.Map("map", {
    // Координаты центра карты.
    // Порядок по умолчанию: «широта, долгота».
    // Чтобы не определять координаты центра карты вручную,
    // воспользуйтесь инструментом Определение координат.
    center: [43.1056, 131.874],
    // Уровень масштабирования. Допустимые значения:
    // от 0 (весь мир) до 19.
    zoom: 12,
  });

  return myMap;
}

const screens = [
  {
    name: "cards",
    element: document.querySelector("#cards"),
  },
  {
    name: "map",
    element: document.querySelector("#map"),
  },
];

const Screen = {
  screens: screens,
  showScreen(name) {
    screens.forEach((item) => {
      if (item.name != name) {
        item.element.classList.add("hidden-screen");
      } else {
        item.element.classList.remove("hidden-screen");
      }
    });
  },
};

Screen.showScreen("cards");

document.querySelector(".cards-btn").addEventListener("click", () => {
  Screen.showScreen("cards");
});
document.querySelector(".map-btn").addEventListener("click", () => {
  Screen.showScreen("map");
});
