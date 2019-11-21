'use strict'
// 1)
// https://openweathermap.org/
// зарегаться на сайте, получить API key для работы
//
// Date: 01.08.2019    время
// температура, скорост ьветра, давление в маленьком окошке
// данные каждые 3 часа
// при клике на маленькую ячейку в модальном окне более подробная инфа
// можно выбрать дату, страну и город
//
// https://api.openweathermap.org/data/2.5/forecast?q=london,us&appid=636b48efaf889dd54e2f913b7c2634d2


window.onload = function() {
   var form = document.forms.search;
   var country = form.elements.country;
   var city = form.elements.city;
   var date = form.elements.date;
   var button = form.elements.but;
   date.disabled = true;
   city.disabled = true;
   country.disabled = true;

   var searchCountry;
   var searchCity;
   var listCity;

   var apiResult;
   var activeDay;



   var myPromise = new Promise((resolve, reject) => {
      var ctr = new XMLHttpRequest();
      ctr.open("GET", "./json/country.json", true);
      ctr.send();
      ctr.onload = () => resolve(JSON.parse(ctr.responseText)[0]);
      ctr.onerror = () => reject(console.log('Страны на загрузились'));
   });
   var myPromise2 = new Promise((resolve, reject) => {
      var cty = new XMLHttpRequest();
      cty.open("GET", "./json/current.city.list.min.json", true);
      cty.send();
      cty.onload = function() {
         listCity = JSON.parse(cty.responseText);
         resolve();
      }
      cty.onerror = () => reject(console.log('Города на загрузились'));
   });

   Promise.all([myPromise, myPromise2]).then((obj) => {
      var obj = obj[0];

      // Добавление всех стран из обьекта obj в <select>
      for (let key in obj) {
         country.appendChild(cItem(key));
      }
      // ф-я cItem создает <option> со страной из obj
      // и возвращает элемент DOM
      function cItem(k) {
         if (!country.firstChild) {
            var x = document.createElement('option');
            x.value = -1;
            country.appendChild(x);
         }
         var x = document.createElement('option');
         x.value = k;
         x.innerText = obj[k];

         return x;
      }


   }).then(() => {
      country.disabled = false;
      // Когда ВСЕ страны и города загрузились
      country.oninput = function() {
         city.disabled = false;
         date.disabled = true;

         let n = this.options.selectedIndex;
         searchCountry = this.options[n].value;

         // Добавление городов, выбранной страны
         clearSelect(city);
         clearSelect(date);
         for (let i = 0; i < listCity.length; i++) {
            if (listCity[i].country == searchCountry) {
               if (!city.firstChild) {
                  let x = document.createElement('option');
                  x.value = -1;
                  city.appendChild(x);
               }
               let x = document.createElement('option');
               x.value = listCity[i].id;
               x.innerText = listCity[i].name;
               city.appendChild(x);
            }
         }
      }

      // Отправка запроса о погоде на сервер
      return new Promise((resolve, reject) => {
         city.oninput = function() {
            clearSelect(date);
            searchCity = this.value;

            if (searchCity == -1) {
               date.disabled = true;
            } else {
               var xhr = new XMLHttpRequest();
               xhr.open("GET", `https://api.openweathermap.org/data/2.5/forecast?id=${searchCity}&appid=636b48efaf889dd54e2f913b7c2634d2`);
               xhr.send();
               xhr.onload = function() {
                  apiResult = JSON.parse(xhr.responseText);
                  console.log(apiResult);


                  // поиск даты
                  var array = [];
                  for (var i = 0; i < apiResult.list.length; i++) {
                     array.push(apiResult.list[i]["dt_txt"]);
                  }
                  date.disabled = false;
                  var array = searchForAvailableDate(array);
                  for (var i = 0; i < array.length; i++) {
                     var x = document.createElement('option');
                     x.innerText = array[i];
                     date.appendChild(x);
                  }
                  showWeatherData();
               }
            }
         }
         // let x = fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${searchCity}&appid=636b48efaf889dd54e2f913b7c2634d2`)
         //    .then(response => response.json());
      });

   });


   date.oninput = showWeatherData;



   function clearSelect(elem) {
      while (elem.firstChild) {
         elem.firstChild.remove();
      }
   }

   function searchForAvailableDate(array) {
      var newArray = [];
      for (var i = 0; i < array.length; i++) {
         var date = array[i].match(/\d{1,4}-\d{1,2}-\d{1,2}/)[0];
         var flag = true;
         for (var j = 0; j < newArray.length; j++) {
            if (newArray[j] === date) {
               flag = false;
            }
         }
         if (flag) {
            newArray.push(date);
         }
      }
      return newArray;
   }

   function bt(num) {
      // beautifyTime
      if (num < 10) {
         return "0" + num;
      }
      return num;
   }

   function cp(num) {
      // convertPreasure
      // перевод hPa в mmHg
      let k = 0.75006375541921;
      return num * k;
   }

   function ct(num) {
      // convert temperature
      // kelvin to celsium
      var x = (num - 273).toFixed();
      if (x >= 0) return '+' + x + '&deg;';
      else return '' + x + '&deg;';
   }

   function windDirBeautify(num) {
      var word;
      var x;

      if (num > 337.5 || num <= 22.5) {word = 'С'; x = 'n'}
      else if (num > 22.5 && num <= 67.5) {word = 'СВ'; x = 'ne'}
      else if (num > 67.5 && num <= 112.5) {word = 'В'; x = 'e'}
      else if (num > 112.5 && num <= 157.5) {word = 'ЮВ'; x = 'se'}
      else if (num > 157.5 && num <= 202.5) {word = 'Ю'; x = 's'}
      else if (num > 202.5 && num <= 147.5) {word = 'ЮЗ'; x = 'sw'}
      else if (num > 147.5 && num <= 292.5) {word = 'З'; x = 'w'}
      else if (num > 292.5 && num <= 337.5) {word = 'СЗ'; x = 'nw'}
      else return 'error';

      return `<i class="wind-icon" style="background: url(/images/wind-icons/${x}.svg) no-repeat"></i>${word}`;
   }

   function showWeatherData() {
      // краткая почасовая информация о погоде
      var n = date.options.selectedIndex;
      var dateTxt = date.options[n].innerText;



      function addHourlyInfo(obj) {
         function cTr(str1, str2) {
            // create table row
            var tr = document.createElement("tr");

            var td1 = document.createElement("td");
            td1.innerHTML = str1;
            tr.appendChild(td1);

            var td2 = document.createElement("td");
            td2.innerHTML = str2;
            tr.appendChild(td2);

            return tr;
         }

         var div = document.createElement('div');
         div.classList.add('hour-item', 'card');

         var img = document.createElement('img');
         // img.src = `./images/icons/${obj.weather[0].icon}.png`;
         img.src = `./images/svg-icons/${obj.weather[0].icon}.svg`;
         img.alt = `${obj.weather[0].description}`;
         div.appendChild(img);

         var t = new Date(obj.dt * 1000);
         var d1 = document.createElement('div');
         d1.innerText = `Время ${bt(t.getHours())}:${bt(t.getMinutes())}`;
         div.appendChild(d1);
         // по ключу определяю, о каком часе показать подробную инфу
         div.key = obj.dt;

         div.appendChild(document.createElement('hr'));

         var table = document.createElement('table');
         div.appendChild(table);


        let elem = cTr(`<img src="./images/svg-icons/temp.svg" width="18px"/>`, ct(obj.main.temp));
        table.appendChild(elem);



         table.appendChild(cTr(`<img src="./images/svg-icons/wind.svg" width="18px"/>`,
            `${obj.wind.speed.toFixed()} м/с`));

         table.appendChild(cTr(`<img src="./images/svg-icons/pressure.svg" width="18px"/>`,
            `${cp(obj.main.pressure).toFixed()} мм`));

         document.getElementById('hourlyInfo').appendChild(div);
      }

      activeDay = [];
      for (var i = 0; i < apiResult.list.length; i++) {
         if (apiResult.list[i].dt_txt.indexOf(dateTxt) + 1) {
            activeDay.push(apiResult.list[i]);
         }
      }

      clearSelect(document.getElementById('hourlyInfo'));
      for (var i = 0; i < activeDay.length; i++) {
         addHourlyInfo(activeDay[i]);
      }

      // события показа подробной инфы
      for (var i = 0; i < hourlyInfo.children.length; i++) {
         hourlyInfo.children[i].addEventListener('click', showDetailedData);
      }

      // искусственный вызов события клика для первого элемента (текущая погода)
      document.getElementById('hourlyInfo').children[0].dispatchEvent(new Event('click'));
   }

   function showDetailedData() {
      var obj;
      for (var i = 0; i < activeDay.length; i++) {
         if (this.key == activeDay[i].dt) {
            obj = activeDay[i];
         }
      }
      clearSelect(detailedInfo);

      function timestamp(x) {
          var t = new Date(x*1000);
          return `${t.getFullYear()}-${bt(t.getMonth()+1)}-${bt(t.getDate())} ${bt(t.getHours())}:${bt(t.getMinutes())}`;
      }


      // показать подробную информацию
      detailedInfo.innerHTML = `
           <p>${timestamp(obj.dt)}</p>
           <div>
               <h2>Погода ${apiResult.city.name}, ${apiResult.city.country}</h2>
               <div class="main">
                   <img src="./images/svg-icons/${obj.weather[0].icon}.svg" alt="${obj.weather[0].description}">
                   <table>
                       <tr>
                           <td colspan="2">${ct(obj.main.temp)}</td>
                       </tr>
                       <tr>
                           <td><img src="./images/svg-icons/temp-min.svg" alt="min temperature"></td>
                           <td>${ct(obj.main.temp_min)}</td>
                       </tr>
                       <tr>
                           <td><img src="./images/svg-icons/temp-max.svg" alt="max temperature"></td>
                           <td>${ct(obj.main.temp_max)}</td>
                       </tr>
                   </table>
               </div>
               <hr>
               <table>
                   <tr class="wind">
                       <td colspan="2"><img src="./images/svg-icons/wind.svg" alt="wind"></td>
                       <td colspan="2">${obj.wind.speed.toFixed()}м/с, ${windDirBeautify(obj.wind.deg)}</td>
                   </tr>
                   <tr class="humidity">
                       <td colspan="2"><img src="./images/svg-icons/drop.svg" alt="humidity"></td>
                       <td colspan="2">${obj.main.humidity}%</td>
                   </tr>
                   <tr class="pressure">
                       <td colspan="2"><img src="./images/svg-icons/pressure.svg" alt="pressure"></td>
                       <td colspan="2">${cp(obj.main.pressure).toFixed()} мм рт. ст.</td>
                   </tr>
               </table>
           </div>
       `;



   }





}



console.log(

   {
      clouds: {
         all: 90
      },
      dt: 1566054000,
      dt_txt: "2019-08-17 15:00:00",
      main: {
         grnd_level: 1030.28,
         humidity: 64,
         pressure: 1030.74,
         sea_level: 1030.74,
         temp: 283.2,
         temp_kf: -4.82,
         temp_max: 288.022,
         temp_min: 283.2
      },
      rain: {
         "3h": 0.188
      },
      sys: {
         pod: "n"
      },
      weather: [{
         id: 500,
         main: "Rain",
         description: "light rain",
         icon: "10n"
      }],
      wind: {
         speed: 6.64,
         deg: 170.58
      }
   }

);
