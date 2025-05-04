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
            const x = parseFloat(star.dataset.x); // 원래 x 좌표 (0 ~ 1 범위)
            const y = parseFloat(star.dataset.y); // 원래 y 좌표 (0 ~ 1 범위)

            // 이미지 크기에 맞게 위치 계산
            star.style.left = `${x * imageWidth}px`;
            star.style.top = `${y * imageHeight}px`;
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

                const firstPoint = currentData.points[0];
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

        // 모든 별 생성 (S1부터 S1004까지)
        for (let i = 1; i <= 1004; i++) {
            const starKey = `S${i}`;
            const positionKey = `${starKey} po_sition`;
            if (currentPoint[positionKey]) {
                const [x, y] = currentPoint[positionKey].replace(/[()]/g, '').split(',').map(Number);
                createStar(x, y, false, starKey, longIndex, starPositions);
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
                        createStar(x, y, true, `mis_${i}_${index + 1}`, starPositions);
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
        star.className = 'star';

        function createStar(x, y, isMis = false, starKey = null, longIndex = null, starPositions = null) {
            const star = document.createElement('div');
            star.className = 'star';
    
            // 추가 물결 요소들 생성
            for (let i = 3; i <= 5; i++) {
                const ripple = document.createElement('div');
                ripple.className = `star-ripple-${i}`;
                star.appendChild(ripple);
            }
    
            // 현재 시간 가져오기
            const now = new Date();
            const seconds = now.getSeconds();
            const minutes = now.getMinutes();
            const hours = now.getHours();
    
            // 시간에 따른 초기 회전각도 계산 (초침의 경우)
            const initialRotation = (seconds / 60) * 360;
    
            // 초기 회전값 설정 및 애니메이션 적용
            star.style.transform = `rotate(${initialRotation}deg)`;
            star.style.animation = 'clockwise 10s linear infinite';
    
            // 분침인 경우
            const initialMinRotation = ((minutes * 60 + seconds) / 3600) * 360;
            star.style.transform = `rotate(${initialMinRotation}deg)`;
            star.style.animation = 'clockwise 10s linear infinite';
    
            // 시침인 경우
            const initialHourRotation = ((hours % 12) * 3600 + minutes * 60 + seconds) / (12 * 3600) * 360;
            star.style.transform = `rotate(${initialHourRotation}deg)`;
            star.style.animation = 'clockwise 10s linear infinite';
    
            star.dataset.x = x; // 원래 x 좌표 (0 ~ 1 범위)
            star.dataset.y = y; // 원래 y 좌표 (0 ~ 1 범위)
            Object.assign(star.style, {
                position: 'absolute',
                width: '30px',
                height: '30px',
                backgroundColor: 'yellow',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: '10'
            });

            // 박스 이미지 생성
            const jsonData = starPositions.find(item => Object.keys(item).some(key => key.endsWith('special_value') && item[key] === '99BB'));
            if (jsonData) {
                createBoxImage(star, x, y);
            }
            // "S3 special_value": "99BB",
         
            // S1004 별은 미군 정성별로 표시
            if (starKey === 'S1004') {
                star.textContent = '💥💥💥💥💥'; 
                star.style.fontSize = '60px';
                star.style.color = 'gold';
                star.style.textShadow = '0 0 10px gold';
            } else {
                
                star.textContent = '🟡';
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

    function createBoxImage(star, x, y) {
        const uniqueId = `boxImage-${Date.now()}`;
        const boxImage = document.createElement('img');
                
        boxImage.classList.add('boxImage');
        boxImage.id = uniqueId;
        boxImage.src = 'public/assets/images/box_image.png';
        boxImage.alt = 'BoxImage';
        boxImage.style.position = 'absolute';
    
        const rect = star.getBoundingClientRect();
        // 별의 중심 위치 계산
        const starCenterX = rect.left + rect.width / 2;
        const starCenterY = rect.top + rect.height / 2;
        
        // 택배상자의 중심을 별의 중심에 맞추기
        const boxImageWidth = 100;
        const boxImageHeight = 98;
        boxImage.style.left = `${starCenterX - boxImageWidth / 2 + 13}px`;
        boxImage.style.top = `${starCenterY - boxImageHeight / 2 + 20}px`;
                
        boxImage.style.width = '8%'; 
        boxImage.style.height = '7.5%';
        boxImage.style.zIndex = '0.5';
        document.body.appendChild(boxImage);

        boxImage.onerror = function() {
            console.error('Failed to load image at ' + boxImage.src);
            boxImage.src = 'assets/images/box1_image.png';
        };
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
            
            fetch(audioPath)
                .then(response => {
                    if (response.ok) {
                        return new Audio(audioPath).play();
                    }
                    throw new Error('오디오 파일을 찾을 수 없습니다');
                })
                .catch(() => new Audio('assets/audio/default.mp3').play());
        }

        // S1004 po_sition 값이 "(0.5, 0.5)"일 때 처리
        if (currentPoint['S1004 po_sition'] === "(0.5, 0.5)") {
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
            drawStars(currentData.points, nextLongIndex);
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
    }

    // 초기화 함수에서 특정 ID의 택배상자 이미지 제거
    // 모든 택배 상자 이미지 제거
    function resetPage() {
        // 모든 택배 상자 이미지 제거
        document.querySelectorAll('[id^="boxImage-"]').forEach(box => box.remove());
    }

    function updateImageScale() {
        const container = document.getElementById('image-container');
        const containerSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--container-size'));
        const scale = Math.min(window.innerWidth / containerSize, window.innerHeight / containerSize);
        document.documentElement.style.setProperty('--scale', scale);
    }

    // 초기 로드와 화면 크기 변경 시 스케일 업데이트
    window.addEventListener('load', updateImageScale);
    window.addEventListener('resize', updateImageScale);

    loadData();
});