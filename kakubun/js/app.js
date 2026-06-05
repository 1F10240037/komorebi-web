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
  const btnOut = document.getElementById('btn-out');

  const thankYouModal = document.getElementById('thankYouModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  
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

    // イベントリスナー登録
    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // ナビゲーションボタン
    prevBtn.addEventListener('click', () => changeSpot(currentIndex - 1));
    
    // 次へ・ゴールボタン（重複を解消し一本化）
    nextBtn.addEventListener('click', () => {
      const currentSpot = spotsData[currentIndex];
      if (currentSpot && currentSpot.displayNum === "Epi") {
        thankYouModal.classList.add('show'); // 自作ポップアップを表示
        return;
      }
      changeSpot(currentIndex + 1);
    });

    // フロア切り替えボタン
    btn1f.addEventListener('click', () => changeFloor(1));
    btn2f.addEventListener('click', () => changeFloor(2));
    btnOut.addEventListener('click', () => changeFloor(0)); // 屋外（floor: 0）

    // ポップアップを閉じるボタン
    modalCloseBtn.addEventListener('click', () => {
      thankYouModal.classList.remove('show');
    });

    // 音声プレイヤー関連
    playBtn.addEventListener('click', togglePlay);
    audioElem.addEventListener('timeupdate', updateSeekBar);
    audioElem.addEventListener('loadedmetadata', () => {
      seekBar.max = audioElem.duration;
      durationDisplay.textContent = formatTime(audioElem.duration);
    });
    
    // 音声が最後まで再生された時に再生マークに戻す
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
    
    // スポットが変わったら音声を止め、再生ボタンの状態を戻す
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
    
    // 各フロアボタンのアクティブ状態を制御
    btn1f.classList.toggle('active', floor === 1);
    btn2f.classList.toggle('active', floor === 2);
    btnOut.classList.toggle('active', floor === 0);
    
    // フロアごとのマップ画像切り替え
    if (floor === 1) {
      mapImage.src = 'img/map_1f.jpg';
    } else if (floor === 2) {
      mapImage.src = 'img/map_2f.jpg';
    } else if (floor === 0) {
      mapImage.src = 'img/map_out.jpg'; // 屋外用マップ
    }
    
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
    prevBtn.className = 'nav-btn'; 
    nextBtn.className = 'nav-btn';
    prevBtn.textContent = "";      
    nextBtn.textContent = "";
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    if (data.displayNum === "Pro") {
      prevBtn.disabled = true;
      prevBtn.classList.add('icon-prev');
      nextBtn.textContent = "スタート";
      nextBtn.classList.add('special-btn');
      
    } else if (data.displayNum === "Epi") {
      // アウトロ：前へはアイコン、次へボタンは「ゴール」
      prevBtn.classList.add('icon-prev');
      nextBtn.textContent = "ゴール";
      nextBtn.classList.add('special-btn');
      
    } else {
      // 通常スポット：両方ともアイコン（くの字）
      prevBtn.classList.add('icon-prev');
      nextBtn.classList.add('icon-next');
      
      if (index === 0) prevBtn.disabled = true;
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
