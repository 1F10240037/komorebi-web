document.addEventListener('DOMContentLoaded', async () => {
  let spotsData = [];
  let currentIndex = 0;
  let currentFloor = 1;
  let swiperInstance = null;

  // DOM要素
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const menuOverlay = document.getElementById('menuOverlay');
  const spotList = document.getElementById('spotList');
  
  const mapImage = document.getElementById('mapImage');
  const mapWrapper = document.getElementById('mapWrapper');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const btn1f = document.getElementById('btn-1f');
  const btn2f = document.getElementById('btn-2f');
  
  // 音声プレイヤー
  const audioElem = document.getElementById('audioElem');
  const playBtn = document.getElementById('playBtn');
  const seekBar = document.getElementById('seekBar');
  const currentTimeDisplay = document.getElementById('currentTime');
  const durationDisplay = document.getElementById('duration');

  const spotTitle = document.getElementById('spotTitle');
  const spotDesc = document.getElementById('spotDesc');
  const imageSlider = document.getElementById('imageSlider');
  const swiperContainer = document.querySelector('.swiper');

  try {
    const response = await fetch('data/spots.json');
    spotsData = await response.json();
    initApp();
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error);
  }

  function initApp() {
    // ハンバーガーメニュー内のリストを生成
    spotsData.forEach((spot, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      
      if(isNaN(spot.displayNum)) {
        li.textContent = spot.title;
      } else {
        li.textContent = `${spot.displayNum} ${spot.title}`;
      }
      
      li.addEventListener('click', () => {
        changeSpot(index);
        closeMenu();
      });
      spotList.appendChild(li);
    });

    // 初期レンダリング
    renderSpot(currentIndex);
    renderPins();
    initSwiper();

    // イベントリスナー
    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);

    prevBtn.addEventListener('click', () => changeSpot(currentIndex - 1));
    nextBtn.addEventListener('click', () => changeSpot(currentIndex + 1));
    btn1f.addEventListener('click', () => changeFloor(1));
    btn2f.addEventListener('click', () => changeFloor(2));

    playBtn.addEventListener('click', togglePlay);
    audioElem.addEventListener('timeupdate', updateSeekBar);
    audioElem.addEventListener('loadedmetadata', () => {
      seekBar.max = audioElem.duration;
      durationDisplay.textContent = formatTime(audioElem.duration);
    });
    
    // 音声が最後まで再生された時に「再生マーク（▶）」に戻す処理
    audioElem.addEventListener('ended', () => {
      playBtn.classList.remove('playing');
    });
    
    seekBar.addEventListener('input', () => { audioElem.currentTime = seekBar.value; });
  }

  function toggleMenu() {
    menuBtn.classList.toggle('open');
    sideMenu.classList.toggle('open');
    menuOverlay.classList.toggle('open');
  }

  function closeMenu() {
    menuBtn.classList.remove('open');
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
  }

  function changeSpot(index) {
    if (index < 0 || index >= spotsData.length) return;
    
    // スポットが変わったら音声を止め、ボタンを「再生マーク（▶）」に戻す
    audioElem.pause();
    playBtn.classList.remove('playing');

    currentIndex = index;
    
    const newFloor = spotsData[currentIndex].floor;
    if (currentFloor !== newFloor) changeFloor(newFloor);

    renderSpot(currentIndex);
    renderPins();
  }

  function changeFloor(floor) {
    currentFloor = floor;
    btn1f.classList.toggle('active', floor === 1);
    btn2f.classList.toggle('active', floor === 2);
    mapImage.src = floor === 1 ? 'img/map_1f.jpg' : 'img/map_2f.jpg';
    renderPins();
  }

  function renderSpot(index) {
    const data = spotsData[index];
    
    spotTitle.textContent = isNaN(data.displayNum) ? data.title : `${data.displayNum}. ${data.title}`;
    spotDesc.textContent = data.description;
    audioElem.src = data.audio;

    const listItems = spotList.querySelectorAll('li');
    listItems.forEach(li => {
      li.classList.toggle('current-active', parseInt(li.dataset.index) === index);
    });

    updateNavButtons(index);

    imageSlider.innerHTML = '';
    
    if (data.images && data.images.length > 0) {
      swiperContainer.classList.remove('hidden');
      
      data.images.forEach(imgSrc => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `<img src="${imgSrc}" alt="スポット写真">`;
        imageSlider.appendChild(slide);
      });
      
      if (swiperInstance) {
        swiperInstance.update();
        swiperInstance.slideTo(0, 0);
      }
    } else {
      if (swiperContainer) {
        swiperContainer.classList.add('hidden');
      }
    }
  }

  // --- スポットに応じた前後ボタンの出し分けロジック ---
  function updateNavButtons(index) {
    const data = spotsData[index];

    // 初期化（クラスとテキストをリセット）
    prevBtn.className = 'nav-btn'; // 基本クラスのみに戻す
    nextBtn.className = 'nav-btn';
    prevBtn.textContent = "";      // テキストを空にする
    nextBtn.textContent = "";
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    if (data.displayNum === "Pro") {
      // イントロ：前へボタンは無効アイコン、次へボタンは「スタート」
      prevBtn.disabled = true;
      prevBtn.classList.add('icon-prev');
      
      nextBtn.textContent = "スタート";
      nextBtn.classList.add('special-btn');
      
    } else if (data.displayNum === "Epi") {
      // アウトロ：前へはアイコン、次へボタンは「終了」
      prevBtn.classList.add('icon-prev');
      
      nextBtn.textContent = "終了";
      nextBtn.classList.add('special-btn');
      nextBtn.disabled = true; 
      
    } else {
      // 通常スポット：両方ともアイコン
      prevBtn.classList.add('icon-prev');
      nextBtn.classList.add('icon-next');
      
      // 最初の通常スポットの時、一つ前（Pro）に戻るボタン
      if (index === 0) prevBtn.disabled = true;
      // 最後の通常スポットの時、次（Epi）に進む
      if (index === spotsData.length - 1) nextBtn.disabled = true;
    }
  }

  function renderPins() {
    document.querySelectorAll('.map-pin').forEach(pin => pin.remove());

    spotsData.forEach((spot, index) => {
      if (spot.floor !== currentFloor) return;
      if (spot.displayNum === "Pro" || spot.displayNum === "Epi") return; 

      const pin = document.createElement('div');
      
      pin.className = `map-pin ${index === currentIndex ? 'active' : ''}`;
      
      if (spot.displayNum === "star") {
        pin.classList.add('pin-star');
        pin.textContent = "★";
      } else {
        pin.textContent = spot.displayNum;
        
        const num = parseInt(spot.displayNum, 10);
        if (!isNaN(num) && num >= 16 && num <= 20) {
          pin.classList.add('pin-green');
        }
      }

      pin.style.left = `${spot.mapX}%`;
      pin.style.top = `${spot.mapY}%`;
      
      pin.addEventListener('click', () => changeSpot(index));
      mapWrapper.appendChild(pin);
    });
  }

  function togglePlay() {
    if (audioElem.paused) {
      audioElem.play();
      playBtn.classList.add('playing'); 
    } else {
      audioElem.pause();
      playBtn.classList.remove('playing'); 
    }
  }

  function updateSeekBar() {
    seekBar.value = audioElem.currentTime;
    currentTimeDisplay.textContent = formatTime(audioElem.currentTime);
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function initSwiper() {
    swiperInstance = new Swiper('.mySwiper', {
      pagination: { el: '.swiper-pagination', clickable: true },
      loop: false,
      autoHeight: true,
    });
  }
});
