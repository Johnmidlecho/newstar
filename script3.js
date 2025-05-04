document.addEventListener("DOMContentLoaded", function() {
    const imageContainer = document.getElementById('image-container');
    const starContainer = document.getElementById('star-container');
    const nextButton = document.getElementById('next-button');
    const currentImage = document.getElementById('current-image');
    let currentId = 0;
    let currentStarIndex = 1;
    let starData = [];
    let currentData = null;
    let totalStars = 0;
    let currentStarClickedIndex = 0;
    let sDollarClickCount = 0;
    const lastStarKey = 'S$';

    // 이미지 크기 감지 및 별 위치 조정
    function adjustStarPositions() {
        const imageWidth = currentImage.clientWidth;
        const imageHeight = currentImage.clientHeight;

        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            const x = parseFloat(star.dataset.x);
            const y = parseFloat(star.dataset.y);

            // 이미지 크기에 맞게 위치 계산
            star.style.left = `${x * imageWidth}px`;
            star.style.top = `${y * imageHeight}px`;
        });

        // 궤도 위치도 조정
        const orbits = document.querySelectorAll('.star-orbit');
        orbits.forEach(orbit => {
            const star = orbit.nextElementSibling;
            if (star && star.classList.contains('star')) {
                const x = parseFloat(star.dataset.x);
                const y = parseFloat(star.dataset.y);
                orbit.style.left = `${x * imageWidth}px`;
                orbit.style.top = `${y * imageHeight}px`;
            }
        });
    }

    // 이미지 로드 완료 시 이벤트 리스너 추가
    currentImage.addEventListener('load', () => {
        adjustStarPositions();
    });

    // 윈도우 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', () => {
        adjustStarPositions();
    });

    function loadData() {
        fetch('assets/data/data_911.json')
            .then(response => response.json())
            .then(data => {
                starData = data;
                console.log('데이터 로드 완료:', starData);
                
                currentId = 0;
                currentData = starData[currentId];
                
                if (!currentData) {
                    console.error('ID 1의 데이터를 찾을 수 없습니다.');
                    return;
                }

                // 99BB 체크를 먼저 수행
                const firstPoint = currentData.points[0];
                if (firstPoint['S$ special_value'] === '99BB') {
                    const sDollarPosition = firstPoint['S$ po_sition'];
                    handleSpecialValue('99BB', sDollarPosition);
                }

                // 첫 번째 이미지 설정
                if (firstPoint && firstPoint['S1 image']) {
                    const imagePath = `assets/images/${firstPoint['S1 image']}`;
                    console.log('첫 이미지 로드:', imagePath);
                    currentImage.src = imagePath;
                } else {
                    console.error('첫 이미지를 찾을 수 없습니다.');
                }

                nextButton.disabled = true;
                currentStarIndex = 1;
                totalStars = currentData.points.length;
                sDollarClickCount = 0;
                
                drawStars(currentData.points, currentStarIndex);
            })
            .catch(error => {
                console.error('데이터 로드 중 오류 발생:', error);
            });
    }

    function initializeSystem() {
        if (currentId >= starData.length) {
            currentId = 0;
        }
        currentData = starData[currentId];
        const firstPoint = currentData.points[0];
        if (firstPoint && firstPoint['S1 image']) {
            currentImage.src = `assets/images/${firstPoint['S1 image']}`;
        }
        nextButton.disabled = true;
        currentStarIndex = 1;
        totalStars = currentData.points.length;
        sDollarClickCount = 0;
        
        drawStars(currentData.points, currentStarIndex);
    }

    function drawStars(starPositions, longIndex) {
        starContainer.innerHTML = ''; // 별 컨테이너 초기화
        const currentPoint = starPositions[longIndex - 1];

        if (!currentPoint) {
            console.error(`No data found for index: ${longIndex}`);
            return;
        }

        // 디버깅을 위한 로그 추가
        console.log('Current point data:', currentPoint);
        console.log('S1 part_of_speech:', currentPoint['S1 part_of_speech']);
        console.log('S1 po_sition:', currentPoint['S1 po_sition']);

        // S1 별의 part_of_speech가 Preposition인지 확인
        if (currentPoint['S1 part_of_speech'] === "Preposition" && currentPoint['S1 po_sition']) {
            const s1Position = currentPoint['S1 po_sition'];
            console.log('S1 is Preposition, showing delivery box at:', s1Position);
            handleSpecialValue('Preposition', s1Position);
        }

        // 99BB 체크를 먼저 수행
        if (currentPoint['S$ special_value'] === '99BB') {
            const sDollarPosition = currentPoint['S$ po_sition'];
            handleSpecialValue('99BB', sDollarPosition);
        }

        // 모든 별 생성 (S1부터 S1004까지)
        for (let i = 1; i <= 1004; i++) {
            const starKey = `S${i}`;
            const positionKey = `${starKey} po_sition`;
            if (currentPoint[positionKey]) {
                const [x, y] = currentPoint[positionKey].replace(/[()]/g, '').split(',').map(Number);
                createStar(x, y, false, starKey, longIndex);
            }
        }

        // 모든 mis 별 생성 (mis_1부터 mis_10까지)
        for (let i = 1; i <= 10; i++) {
            const misKey = `mis_${i} po_sition`;
            if (currentPoint[misKey]) {
                const positions = currentPoint[misKey].match(/\(([\d.]+),\s*([\d.]+)\)/g);
                if (positions) {
                    positions.forEach((pos, index) => {
                        const [x, y] = pos.replace(/[()]/g, '').split(',').map(Number);
                        createStar(x, y, true, `mis_${i}_${index + 1}`);
                    });
                }
            }
        }

        adjustStarPositions(); // 별 위치 조정
    }

    function createPlanet(starElement, index) {
        // 궤도 생성
        const orbit = document.createElement('div');
        orbit.className = 'orbit';
        const orbitRadius = (index + 1) * 40; // 각 행성마다 40px씩 증가하는 궤도 반경
        orbit.style.width = `${orbitRadius * 2}px`;
        orbit.style.height = `${orbitRadius * 2}px`;
        orbit.style.left = `${15 - orbitRadius}px`; // 별의 중심에 맞추어 조정
        orbit.style.top = `${15 - orbitRadius}px`;
        starElement.appendChild(orbit);
    
        // 행성 생성
        const planet = document.createElement('div');
        planet.className = `planet planet-${index + 1}`;
        
        // 초기 위치 설정
        const angle = Math.random() * Math.PI * 2; // 무작위 시작 위치
        const x = orbitRadius * Math.cos(angle);
        const y = orbitRadius * Math.sin(angle);
        planet.style.left = `${15 + x}px`; // 별의 중심에 맞추어 조정
        planet.style.top = `${15 + y}px`;
    
        // 공전 애니메이션 설정
        const orbitPeriod = (index + 1) * 5; // 각 행성마다 5초씩 증가하는 공전 주기
        planet.style.animation = `orbit${index + 1} ${orbitPeriod}s linear infinite`;
    
        // 공전 애니메이션 키프레임 동적 생성
        const styleSheet = document.styleSheets[0];
        const keyframes = `
            @keyframes orbit${index + 1} {
                from {
                    transform: rotate(0deg) translateX(${orbitRadius}px) rotate(0deg);
                }
                to {
                    transform: rotate(360deg) translateX(${orbitRadius}px) rotate(-360deg);
                }
            }
        `;
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    
        starElement.appendChild(planet);
    }
    
    // 별을 생성할 때 행성도 함께 생성
    const star = document.createElement('div');
    star.classList.add('star', 'star-spinning', 'emoji-style');

    function createStar(x, y, isMis = false, starKey = null, longIndex = null) {
        const star = document.createElement('div');
        star.classList.add('star', 'star-spinning', 'emoji-style');

        // 원래 좌표값 저장
        star.dataset.x = x;
        star.dataset.y = y;
        
        // 이미지 크기에 상대적인 위치 계산
        const currentImage = document.getElementById('current-image');
        const imageWidth = currentImage.clientWidth;
        const imageHeight = currentImage.clientHeight;
        
        Object.assign(star.style, {
            position: 'absolute',
            left: `${x * imageWidth}px`,
            top: `${y * imageHeight}px`,
            transform: 'translate(-50%, -50%)'
        });

        // S1004 별은 미군 정성별로 표시
        if (starKey === 'S1004') {
            // work_sentence 값 찾기 (id 다음 위치)
            const workSentence = currentData.work_sentence;

            // 중앙의 큰별 생성
            const centerStar = document.createElement('div');
            centerStar.classList.add('star', 'star-spinning', 'emoji-style', 's1004');
            centerStar.textContent = workSentence;
            centerStar.style.fontSize = '80px';
            centerStar.style.color = 'rgb(11, 2, 26)'; // 오렌지 색상으로 변경
            centerStar.style.textShadow = '0 0 20px rgb(11, 6, 1)'; // 오렌지 빛나는 효과
            centerStar.style.zIndex = '200';
            centerStar.style.cursor = 'pointer';
            centerStar.style.position = 'absolute';
            centerStar.style.left = '50%';
            centerStar.style.top = '50%';
            centerStar.style.transform = 'translate(-50%, -50%)';
            centerStar.style.animation = 'pulse 2s ease-in-out infinite';
            
            // 클릭 이벤트 추가
            centerStar.addEventListener('click', () => {
                handleStarClick(starKey, longIndex);
            });
            
            // 펄스 애니메이션 추가
            const styleSheet = document.styleSheets[0];
            const pulseAnimation = `
                @keyframes pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                }
            `;
            styleSheet.insertRule(pulseAnimation, styleSheet.cssRules.length);
            
            starContainer.appendChild(centerStar);

            // 별 생성
            const stars = [];
            for (let i = 0; i < 3; i++) {
                const newStar = document.createElement('div');
                newStar.classList.add('star', 'star-spinning', 'emoji-style');
                newStar.textContent = '✨';
                newStar.style.fontSize = '60px';
                newStar.style.color = 'gold';
                newStar.style.textShadow = '0 0 30px gold';
                newStar.style.zIndex = '200';
                newStar.style.cursor = 'pointer';
                newStar.style.position = 'absolute';
                newStar.style.left = '50%';
                newStar.style.top = '50%';
                newStar.style.transform = 'translate(-50%, -50%)';
                
                // 방사형 애니메이션 설정
                const angle = (i * 120) * (Math.PI / 180);
                const distance = 100;
                const animationName = `radialAnimation${i}`;
                
                // 동적 키프레임 생성
                const keyframes = `
                    @keyframes ${animationName} {
                        0% {
                            transform: translate(-50%, -50%) translate(0, 0);
                            opacity: 0;
                        }
                        20% {
                            opacity: 1;
                        }
                        100% {
                            transform: translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px);
                            opacity: 1;
                        }
                    }
                `;
                styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
                
                newStar.style.animation = `${animationName} 3s ease-out forwards`;
                newStar.style.animationDelay = `${i * 0.3}s`;
                
                // 클릭 이벤트 추가
                newStar.addEventListener('click', () => {
                    newStar.style.animation = 'none';
                    newStar.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
                    handleStarClick(starKey, longIndex);
                });
                
                starContainer.appendChild(newStar);
                stars.push(newStar);
            }

            // 빠르게 도는 행성 생성
            const orbitContainer = document.createElement('div');
            orbitContainer.style.position = 'absolute';
            orbitContainer.style.left = '50%';
            orbitContainer.style.top = '50%';
            orbitContainer.style.transform = 'translate(-50%, -50%)';
            orbitContainer.style.width = '200px';
            orbitContainer.style.height = '200px';
            orbitContainer.style.zIndex = '199';

            // 행성 생성
            const planet = document.createElement('div');
            planet.classList.add('fast-orbiting-planet');
            planet.style.position = 'absolute';
            planet.style.width = '30px';
            planet.style.height = '30px';
            planet.style.backgroundColor = '#ff6b6b';
            planet.style.borderRadius = '50%';
            planet.style.boxShadow = '0 0 10px #ff6b6b';

            // 빠른 공전 애니메이션 키프레임 생성
            const orbitAnimation = `
                @keyframes fastOrbit {
                    0% {
                        transform: rotate(0deg) translateX(100px) rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg) translateX(100px) rotate(-360deg);
                    }
                }
            `;
            styleSheet.insertRule(orbitAnimation, styleSheet.cssRules.length);

            planet.style.animation = 'fastOrbit 1s linear infinite';
            orbitContainer.appendChild(planet);
            starContainer.appendChild(orbitContainer);
        } else {
            star.textContent = '💥';
            star.style.fontSize = '20px';
            star.style.color = 'gold';
            star.style.textShadow = '0 0 10px gold';
        }
    
    // 4개의 행성 생성
    for (let i = 0; i < 4; i++) {
        createPlanet(star, i);
    }
    // 궤도 생성
    const orbit = document.createElement('div');
    orbit.classList.add('star-orbit');
    Object.assign(orbit.style, {
        position: 'absolute',
        width: '100px',
        height: '100px',
        left: `${x * imageWidth}px`,
        top: `${y * imageHeight}px`,
        transform: 'translate(-50%, -50%)',
        border: '2px dashed rgba(236, 211, 25, 0.3)',
        borderRadius: '50%',
        zIndex: '10'
    });

    // 파장 효과 생성
    function createRipple() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.classList.add('ripple');
                Object.assign(ripple.style, {
                    position: 'absolute',
                    borderRadius: '50%',
                    border: '15px solid rgba(221, 209, 33, 0.8)',
                    animation: 'ripple 2s infinite',
                    zIndex: '50'
                });
                starContainer.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            }, i * 500);
        }
    }

    const rippleInterval = setInterval(createRipple, 2000);
    createRipple();
    star.addEventListener('remove', () => clearInterval(rippleInterval));

    // 별 클릭 이벤트 처리
    if (starKey) {
        star.dataset.starKey = starKey;
        
        if (!starKey.startsWith('mis_1_') && !starKey.startsWith('mis_2_')) {
            star.addEventListener('click', (event) => {
                if (!currentData) return;
                
                const rect = star.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const clickX = event.clientX;
                const clickY = event.clientY;
                const distance = Math.sqrt(Math.pow(centerX - clickX, 2) + Math.pow(centerY - clickY, 2));
                
                if (distance <= 200) {
                    const spaceship = document.getElementById('spaceship');
                    Object.assign(spaceship.style, {
                        left: `${x * 100}%`,
                        top: `${y * 100}%`
                    });
                    
                    handleStarClick(starKey, longIndex);
                    createParticles(100, centerX, centerY);
                }
            });
        }
    }

    if (isMis) star.classList.add('mis-star');
    
    starContainer.appendChild(orbit);
    starContainer.appendChild(star);
}

function calculateParticleCount(starKey) {
    if (starKey.startsWith('S$')) {
        return 200;  // 'S$' 별 클릭 시 200개의 파티클 생성
    } else {
        return 3;    // 그 외의 경우 3개의 파티클 생성
    }
}

function handleStarClick(starKey, longIndex) {
    if (!currentData) {
        console.error('currentData가 초기화되지 않았습니다.');
        return;
    }

    const currentPoint = currentData.points[longIndex - 1];
    if (!currentPoint) {
        console.error(`No point found for index: ${longIndex}`);
        return;
    }
    console.log(`현재 선택된 별의 키: ${starKey}`);
    console.log(`현재 선택된 별의 위치 인덱스: ${longIndex}`);
    console.log(`현재 선택된 별의 데이터:`, currentPoint);
    console.log(`현재 선택된 별의 데이터:`, currentData);
    
    // text_S$ 표시
    if (currentPoint['text_S$']) {
        const textDisplay = document.getElementById('text-display');
        textDisplay.textContent = currentPoint['text_S$'];
        textDisplay.style.display = 'block';
    }
    
    if (starKey.startsWith('S$') && (currentPoint['S$ part_of_speech'] === 'Preposition')) {
        // 기존 택배상자 제거
        const existingBox = document.getElementById('delivery-box');
        if (existingBox) {
            existingBox.remove();
        }
        
        const deliveryBox = document.createElement('img');
        deliveryBox.id = 'delivery-box';
        deliveryBox.src = 'assets/images/delivery-box.png'; 
        deliveryBox.classList.add('delivery-box');

        // position 값이 문자열인 경우 파싱
        let x, y;
        if (typeof currentPoint['S$ position'] === 'string') {
            const [parsedX, parsedY] = currentPoint['S$ position'].replace(/[()]/g, '').split(',').map(Number);
            x = parsedX;
            y = parsedY;
        } else {
            x = currentPoint['S$ position'].x;
            y = currentPoint['S$ position'].y;
        }

        // 이미지가 로드된 후에 택배상자 표시
        const currentImage = document.getElementById('current-image');
        if (currentImage.complete) {
            showDeliveryBox(x, y);
        } else {
            currentImage.addEventListener('load', () => {
                showDeliveryBox(x, y);
            });
        }
    }

    // 이미지 처리
    const imageKey = `${starKey} image`;
    if (currentPoint[imageKey]) {
        let imagePath = `assets/images/${currentPoint[imageKey]}`;
        
        // 이미지 파일 존재 여부 확인
        fetch(imagePath)
            .then(response => {
                if (!response.ok) {
                    // jpg를 jpeg로 시도
                    imagePath = imagePath.replace('.jpg', '.jpeg');
                    return fetch(imagePath);
                }
                return response;
            })
            .then(response => {
                if (response.ok) {
                    document.getElementById('current-image').src = imagePath;
                    console.log('이미지 로드 성공:', imagePath);
                } else {
                    console.error('이미지를 찾을 수 없습니다:', imagePath);
                }
            })
            .catch(error => {
                console.error('이미지 로드 중 오류 발생:', error);
            });
    }

    // 텍스트와 오디오 처리
    const textKey = `text_${starKey}`;
    const audioKey = `${starKey} text`;
    const textContent = currentPoint[textKey];
    const audioContent = currentPoint[audioKey];

    // 텍스트 표시
    if (textContent) {
        document.getElementById('text-display').textContent = textContent;
    }
    
    // 오디오 파일 처리
    if (audioContent) {
        const audioFileName = audioContent.trim();
        const audioPath = `assets/audio/${audioFileName}.mp3`;
        
        // 오디오 파일 존재 여부 확인
        fetch(audioPath)
            .then(response => {
                if (response.ok) {
                    const audio = new Audio(audioPath);
                    audio.play().catch(error => {
                        console.log('오디오 재생 실패:', error);
                    });
                } else {
                    console.log('오디오 파일을 찾을 수 없습니다:', audioPath);
                }
            })
            .catch(error => {
                console.log('오디오 파일 로드 실패:', error);
            });
    }

    // S1004 po_sition 값이 "(0.5, 0.5)"일 때 처리
    if (currentPoint['S1004 po_sition'] === "(0.5, 0.1)") {
        const nextButton = document.getElementById('next-button');
        nextButton.disabled = false;
        nextButton.style.display = 'block'; // 버튼을 보이게 함
        
        // 큰 별 생성
        const bigStar = document.createElement('div');
        bigStar.classList.add('star');
        Object.assign(bigStar.style, {
            width: '300px',
            height: '300px',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'yellow',
            borderRadius: '50%',
            boxShadow: '0 0 20px yellow',
            zIndex: '99',
            animation: 'spin 10s linear infinite'
        });
        
        starContainer.appendChild(bigStar);
        setTimeout(() => bigStar.remove(), 3000);
    }

    // 다음 별 그리기
    const nextLongIndex = longIndex + 1;
    if (currentData.points[nextLongIndex - 1]) {
        setTimeout(() => {
            drawStars(currentData.points, nextLongIndex);
        }, 1000); // 1초 후에 다음 별 그리기
    }
}

// 파티클 애니메이션 키프레임
const styleSheet = document.createElement('style');
styleSheet.type = 'text/css';
styleSheet.innerText = `
@keyframes moveParticle {
    0% { transform: translateY(0); }
    100% { transform: translateY(-100px); opacity: 0; }
}`;
document.head.appendChild(styleSheet);

// 모든 값을 초기화하는 함수
function resetAllValues() {
    // 모든 별 관련 요소 제거 (더 강력한 선택자 사용)
    const allStarElements = document.querySelectorAll('*');
    allStarElements.forEach(element => {
        if (element.classList && (
            element.classList.contains('star') ||
            element.classList.contains('star-orbit') ||
            element.classList.contains('ripple') ||
            element.classList.contains('star-spinning') ||
            element.classList.contains('emoji-style') ||
            element.classList.contains('mis-star') ||
            element.classList.contains('particle')
        )) {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
    });

    // 모든 컨테이너 강제 초기화
    const containers = [
        starContainer,
        document.getElementById('particle-container'),
        document.getElementById('constellation-container'),
        document.getElementById('constellation-lines')
    ];
    
    containers.forEach(container => {
        if (container) {
            container.innerHTML = '';
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
    });

    // 모든 인터벌과 타임아웃 제거
    const highestIntervalId = window.setInterval(() => {}, 0);
    for (let i = 1; i < highestIntervalId; i++) {
        window.clearInterval(i);
    }

    const highestTimeoutId = window.setTimeout(() => {}, 0);
    for (let i = 1; i < highestTimeoutId; i++) {
        window.clearTimeout(i);
    }

    // 이미지와 텍스트 초기화
    document.getElementById('current-image').src = '';
    document.getElementById('text-display').textContent = '';
    
    // 우주선 위치 초기화
    const spaceship = document.getElementById('spaceship');
    Object.assign(spaceship.style, {
        left: '1%',
        top: '1%'
    });
    
    // Next 버튼 비활성화
    nextButton.disabled = true;
    nextButton.style.display = 'none';
    
    // 데이터 초기화
    currentData = null;
    currentStarIndex = 1;
    totalStars = 0;
    currentStarClickedIndex = 0;
    sDollarClickCount = 0;
    
    // 메시지 숨기기
    document.getElementById('message').style.display = 'none';
    
    // 별자리 데이터 초기화
    if (window.constellationData) {
        window.constellationData = null;
    }

    // 강제로 DOM 업데이트
    document.body.offsetHeight;
}

// Next 버튼 클릭 이벤트 수정
nextButton.addEventListener('click', () => {
    currentId++;
    resetAllValues();
    initializeSystem();
});

function handleSpecialStarClick(starKey, longIndex) {
    // 'S$' 별에 대한 특별 처리 로직
    console.log(`Special star ${starKey} clicked at long ${longIndex}`);
    // 필요한 추가 로직 구현
};

// 초기화 함수에서 특정 ID의 택배상자 이미지 제거
// 모든 택배 상자 이미지 제거
function resetPage() {
    // 모든 택배 상자 이미지 제거
    document.querySelectorAll('[id^="boxImage-"]').forEach(box => box.remove());
};

function updateImageScale() {
    const container = document.getElementById('image-container');
    const containerSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--container-size'));
    const scale = Math.min(window.innerWidth / containerSize, window.innerHeight / containerSize);
    document.documentElement.style.setProperty('--scale', scale);
};

// 초기 로드와 화면 크기 변경 시 스케일 업데이트
window.addEventListener('load', updateImageScale);
window.addEventListener('resize', updateImageScale);

function handleSpecialValue(specialValue, position) {
    console.log('handleSpecialValue called with:', specialValue, position);
    const deliveryBox = document.getElementById('delivery-box');
    console.log('Delivery box element:', deliveryBox);

    if (!deliveryBox) {
        console.error('Delivery box element not found');
        return;
    }

    let x, y;
    if (typeof position === 'string') {
        try {
            // 괄호와 공백을 제거
            const cleanPosition = position.replace(/[()\s]/g, '');
            console.log('Cleaned position string:', cleanPosition);
            
            // 쉼표로 분리
            const coords = cleanPosition.split(',');
            console.log('Split coordinates:', coords);
            
            if (coords.length !== 2) {
                throw new Error('Invalid coordinate format');
            }
            
            x = parseFloat(coords[0]);
            y = parseFloat(coords[1]);
            
            console.log('Parsed coordinates:', { x, y });
            
            if (isNaN(x) || isNaN(y)) {
                throw new Error('Failed to parse coordinates to numbers');
            }
        } catch (error) {
            console.error('Error parsing coordinates:', error);
            console.error('Original position string:', position);
            return;
        }
    } else if (typeof position === 'object') {
        x = position.x;
        y = position.y;
        console.log('Using object coordinates:', { x, y });
    }

    const currentImage = document.getElementById('current-image');
    if (!currentImage) {
        console.error('Current image not found');
        return;
    }

    // 이미지가 로드된 후에 택배상자 표시
    if (currentImage.complete) {
        console.log('Image already loaded, dimensions:', {
            width: currentImage.width,
            height: currentImage.height
        });
        showDeliveryBox(x, y);
    } else {
        currentImage.addEventListener('load', () => {
            console.log('Image loaded, dimensions:', {
                width: currentImage.width,
                height: currentImage.height
            });
            showDeliveryBox(x, y);
        });
    }
}
    
function showDeliveryBox(x, y) {
    console.log('showDeliveryBox called with:', { x, y });
    const deliveryBox = document.getElementById('delivery-box');
    const currentImage = document.getElementById('current-image');
    
    if (!deliveryBox || !currentImage) {
        console.error('Required elements not found:', {
            deliveryBox: !!deliveryBox,
            currentImage: !!currentImage
        });
        return;
    }

    // 이미지의 실제 크기와 표시 크기 계산
    const imageRect = currentImage.getBoundingClientRect();
    const scaleX = currentImage.naturalWidth / imageRect.width;
    const scaleY = currentImage.naturalHeight / imageRect.height;

    // 좌표를 이미지의 실제 크기에 맞게 조정
    const adjustedX = x * imageRect.width;
    const adjustedY = y * imageRect.height;

    console.log('Adjusted coordinates:', { adjustedX, adjustedY });
    console.log('Image dimensions:', {
        natural: { width: currentImage.naturalWidth, height: currentImage.naturalHeight },
        displayed: { width: imageRect.width, height: imageRect.height }
    });

    // 택배상자 위치 설정
    deliveryBox.style.left = `${adjustedX}px`;
    deliveryBox.style.top = `${adjustedY}px`;
    deliveryBox.style.display = 'block';
}

function createParticles(count, x, y) {
    const particleContainer = document.getElementById('particle-container');
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // 랜덤한 초기 위치 (클릭 지점 주변)
        const randomOffsetX = (Math.random() - 0.5) * 20;
        const randomOffsetY = (Math.random() - 0.5) * 20;
        
        // 랜덤한 이동 거리 생성
        const moveX = (Math.random() * 100 - 50);
        const moveY = -(Math.random() * 100 - 50);
        
        // 동적 키프레임 생성
        const keyframeName = `moveParticle${i}`;
        const styleSheet = document.styleSheets[0];
        const keyframes = `
            @keyframes ${keyframeName} {
                0% {
                    transform: translate(0, 0);
                    opacity: 1;
                }
                100% {
                    transform: translate(${moveX}px, ${moveY}px);
                    opacity: 0;
                }
            }
        `;
        styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        
        Object.assign(particle.style, {
            left: `${x + randomOffsetX}px`,
            top: `${y + randomOffsetY}px`,
            backgroundColor: `hsl(${Math.random() * 60 + 30}, 100%, 50%)`, // 노란색 계열
            animation: `${keyframeName} ${Math.random() * 1 + 0.5}s ease-out`
        });
        
        particleContainer.appendChild(particle);
        
        // 애니메이션 종료 후 파티클 제거
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

loadData();
});