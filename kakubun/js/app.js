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
  
  // ▼ 追加: 写真がない時に非表示にするため、Swiperの親コンテナを取得 ▼
  const swiperContainer = document.querySelector('.swiper');

  try {
    const response = await fetch('data/spots.json');
    spotsData = await response.json();
    initApp();
  } catch (error) {
    console.error("データの読み込みに失敗しました:", error);
  }

  function initApp() {
    // 1. ハンバーガーメニュー内のリストを生成
    spotsData.forEach((spot, index) => {
      const li = document.createElement('li');
      li.dataset.index = index;
      
      // 表記が数値の場合は「1 イベントホール」のように連結
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

    // ハンバーガーメニュー開閉イベント
    menuBtn.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', closeMenu);

    // ナビゲーション
    prevBtn.addEventListener('click', () => changeSpot(currentIndex - 1));
    nextBtn.addEventListener('click', () => changeSpot(currentIndex + 1));
    btn1f.addEventListener('click', () => changeFloor(1));
    btn2f.addEventListener('click', () => changeFloor(2));

    // 音声プレイヤー
    playBtn.addEventListener('click', togglePlay);
    audioElem.addEventListener('timeupdate', updateSeekBar);
    audioElem.addEventListener('loadedmetadata', () => {
      seekBar.max = audioElem.duration;
      durationDisplay.textContent = formatTime(audioElem.duration);
    });
    audioElem.addEventListener('ended', () => {
      playBtn.textContent = '▶';
      playBtn.style.paddingLeft = '3px';
    });
    seekBar.addEventListener('input', () => { audioElem.currentTime = seekBar.value; });
  }

  // --- ハンバーガーメニューの制御 ---
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
    
    audioElem.pause();
    playBtn.textContent = '▶';
    playBtn.style.paddingLeft = '3px';

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
    
    // 表示テキスト更新
    spotTitle.textContent = isNaN(data.displayNum) ? data.title : `${data.displayNum}. ${data.title}`;
    spotDesc.textContent = data.description;
    audioElem.src = data.audio;

    // リストのハイライト更新
    const listItems = spotList.querySelectorAll('li');
    listItems.forEach(li => {
      li.classList.toggle('current-active', parseInt(li.dataset.index) === index);
    });

    // ボタンのテキスト・表示状態を状況に応じて更新
    updateNavButtons(index);

    // ▼ 修正: 写真の有無を判定してスライダーの表示/非表示を切り替える ▼
    imageSlider.innerHTML = '';
    
    if (data.images && data.images.length > 0) {
      // 写真がある場合：表示状態にして要素を追加
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
      // 写真がない場合：スライダー全体を隠す
      if (swiperContainer) {
        swiperContainer.classList.add('hidden');
      }
    }
    // ▲ ここまで ▲
  }

  // --- スポットに応じた前後ボタンの出し分けロジック ---
  function updateNavButtons(index) {
    const data = spotsData[index];

    // 初期化（特殊クラスを外す）
    prevBtn.classList.remove('special-btn');
    nextBtn.classList.remove('special-btn');
    prevBtn.disabled = false;
    nextBtn.disabled = false;

    // ▼ "Intro" -> "Pro" に変更
    if (data.displayNum === "Pro") {
      prevBtn.disabled = true;
      prevBtn.textContent = "＜";
      nextBtn.textContent = "スタート";
      nextBtn.classList.add('special-btn');
      
    // ▼ "Outro" -> "Epi" に変更
    } else if (data.displayNum === "Epi") {
      prevBtn.textContent = "＜";
      nextBtn.textContent = "終了";
      nextBtn.classList.add('special-btn');
      nextBtn.disabled = true; 
      
    } else {
      // 通常スポット
      prevBtn.textContent = "＜";
      nextBtn.textContent = "＞";
      
      // 最初の通常スポットの時、一つ前（Pro）に戻るボタン
      if (index === 0) prevBtn.disabled = true;
      // 最後の通常スポットの時、次（Epi）に進む
      if (index === spotsData.length - 1) nextBtn.disabled = true;
    }
  }

  // --- マップ上のピン描画ロジック ---
  function renderPins() {
    document.querySelectorAll('.map-pin').forEach(pin => pin.remove());

    spotsData.forEach((spot, index) => {
      if (spot.floor !== currentFloor) return;
      // ▼ Pro と Epi はマップ上に表示しない
      if (spot.displayNum === "Pro" || spot.displayNum === "Epi") return; 

      const pin = document.createElement('div');
      
      // 基本のクラス（現在選択中の場合は active を付与）
      pin.className = `map-pin ${index === currentIndex ? 'active' : ''}`;
      
      // ▼ displayNum の値に応じてテキストとクラスを出し分け ▼
      if (spot.displayNum === "star") {
        pin.classList.add('pin-star');
        pin.textContent = "★";
      } else {
        pin.textContent = spot.displayNum;
        
        // 16〜20の場合は緑色のクラスを付与
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

  // --- 音声関連ロジック ---
  function togglePlay() {
    if (audioElem.paused) {
      audioElem.play();
      playBtn.textContent = '⏸';
      playBtn.style.paddingLeft = '0';
    } else {
      audioElem.pause();
      playBtn.textContent = '▶';
      playBtn.style.paddingLeft = '3px';
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
    });
  }
});
