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
            console.log('star.style.left:', star.style.left);
            console.log('star.style.top:', star.style.top);
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

                // 각 별에 대해 Preposition 체크 수행
                if (currentData.points && currentData.points.length > 0) {
                    currentData.points.forEach(point => {
                        const starKey = Object.keys(point).find(key => key.endsWith('part_of_speech'));
                        if (starKey && point[starKey] === 'Preposition') {
                            const positionKey = starKey.replace('part_of_speech', 'po_sition');
                            const position = point[positionKey];
                            if (position) {
                                handleSpecialValue('Preposition', position);
                            }
                        }
                    });
                }

                // 첫 번째 이미지 설정
                if (currentData.points && currentData.points.length > 0) {
                    const firstPoint = currentData.points[0];
                    if (firstPoint && firstPoint['S1 image']) {
                        const imagePath = `assets/images/${firstPoint['S1 image']}`;
                        console.log('첫 이미지 로드:', imagePath);
                        currentImage.src = imagePath;
                    } else {
                        console.error('첫 이미지를 찾을 수 없습니다.');
                    }
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
        starContainer.innerHTML = ''; // Clear the star container
        const currentPoint = starPositions[longIndex - 1];

        if (!currentPoint) {
            console.error(`No data found for index: ${longIndex}`);
            return;
        }

        console.log('Current point data:', currentPoint);

        // Dynamically generate starKeys for S1, S2, ..., S1004
        const starKeys = [];
        for (let i = 1; i <= 1004; i++) {
            starKeys.push(`S${i}`);
        }
        starKeys.push('S$'); // Add S$ at the end

        // Process each star in the specified order
        starKeys.forEach(key => {
            const partOfSpeech = currentPoint[`${key} part_of_speech`];
            const position = currentPoint[`${key} po_sition`];
            const workSentence = currentPoint[`${key} work_sentence`];
            const person = currentPoint[`${key} person`];

            // If part_of_speech is "Preposition" and position is valid, show the delivery box
            if (partOfSpeech === "Preposition" && position) {
                console.log(`${key} is Preposition, showing delivery box at:`, position);
                handleSpecialValue('Preposition', position);
            }

            // If person is "2" and position is valid, show the second person
            if (person === "2" && position) {
                console.log(`${key} is 2 person, showing second person at:`, position);
                handleSecondPerson(null, position);
            }

            // Create the star if it has a valid position
            if (position) {
                const [x, y] = position.replace(/[()]/g, '').split(',').map(Number);
                createStar(x, y, false, key, longIndex, workSentence);
            }
        });

        // Handle mis stars (if needed)
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

        adjustStarPositions(); // Adjust star positions
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

    function createStar(x, y, isMis = false, starKey = null, longIndex = null, workSentence = null) {
        const star = document.createElement('div');
        star.classList.add('star', 'star-spinning', 'emoji-style');

        // 원래 좌표값 저장
        if (starKey === 'S1004') {
            star.dataset.x = 0.5;
            star.dataset.y = 0.05;
        } else {
            star.dataset.x = x;
            star.dataset.y = y;
        }
        
        // 이미지 크기에 상대적인 위치 계산
        const currentImage = document.getElementById('current-image');
        const imageWidth = currentImage.clientWidth;
        const imageHeight = currentImage.clientHeight;
        
        Object.assign(star.style, {
            position: 'absolute',
            left: `${x * imageWidth}px`,
            top: `${y * imageHeight}px`,
            transform: 'translate(-50%, -10%)',          
        });

        // work_sentence가 있는 경우 표시
        if (workSentence) {
            const textElement = document.createElement('div');
            textElement.textContent = workSentence;
            Object.assign(textElement.style, {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                fontSize: '16px',
                textShadow: '0 0 5px black',
                zIndex: '100',
                pointerEvents: 'none'
            });
            star.appendChild(textElement);
        }

        // S1004 별은 미군 정성별로 표시
        if (starKey === 'S1004') {
            const currentPoint = currentData.points[longIndex - 1];
            if (!currentPoint) return;

            // S1004의 position 값을 강제로 설정
            const posX = 0.5;
            const posY = 0.05;

            // 별의 실제 위치를 데이터 속성으로 저장
            star.dataset.actualX = posX;
            star.dataset.actualY = posY;

            // work_sentence 값 찾기
            const workSentence = currentData.work_sentence || '✨';

            // 중앙의 큰별 생성
            const centerStar = document.createElement('div');
            centerStar.classList.add('star', 'star-spinning', 'emoji-style', 's1004');
            centerStar.textContent = workSentence;
            
            // 스타일 설정
            Object.assign(centerStar.style, {
                fontSize: '180px',
                color: 'rgb(9, 4, 0)',
                textShadow: '0 0 20px rgb(11, 6, 1)',
                backgroundColor: 'yellow',
                padding: '20px 40px',
                zIndex: '1',
                cursor: 'pointer',
                position: 'absolute',
                left: `${posX * 100}%`,
                top: `${posY * 100}%`,
                transform: 'translate(-50%, -50%)',
                opacity: '1'
            });
            
            // 실제 위치 데이터 저장
            centerStar.dataset.actualX = posX;
            centerStar.dataset.actualY = posY;
            
            centerStar.style.animation = 'fadeInText 2s ease-in-out forwards 3s';
            
            // 클릭 이벤트 수정
            centerStar.addEventListener('click', () => {
                const spaceship = document.getElementById('spaceship');
                const nextButton = document.getElementById('next-button');
                const message = document.getElementById('message');
                
                // 우주선을 실제 위치로 이동
                Object.assign(spaceship.style, {
                    left: `${posX * 100}%`,
                    top: `${posY * 100}%`
                });

                // Next 버튼 활성화 및 표시
                nextButton.disabled = false;
                nextButton.style.display = 'block';
                
                // 메시지 표시
                message.style.display = 'block';
                
                handleStarClick(starKey, longIndex);
            });
            
            starContainer.appendChild(centerStar);

            // 빠르게 도는 행성도 같은 위치에 배치
            const orbitContainer = document.createElement('div');
            Object.assign(orbitContainer.style, {
                position: 'absolute',
                left: `${posX * 100}%`,
                top: `${posY * 100}%`,      // 강제로 1% 위치에 배치
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                zIndex: '199'
            });

            // 4개의 행성 생성
            const planets = [
                { color: '#753ce7', size: '90px' },
                { color: '#df13af', size: '45px' },
                { color: '#b65984', size: '15px' },
                { color: '#f10fcf', size: '30px' }
            ];

            planets.forEach((planetData, index) => {
                const planet = document.createElement('div');
                planet.classList.add('planet', `planet-${index + 1}`);
                
                Object.assign(planet.style, {
                    backgroundColor: planetData.color,
                    width: planetData.size,
                    height: planetData.size
                });

                orbitContainer.appendChild(planet);
            });

            starContainer.appendChild(orbitContainer);
        } else {
            star.textContent = '��';
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
                    const nextButton = document.getElementById('next-button');
                    const message = document.getElementById('message');
                    
                    // S1004 별의 경우 실제 위치로 이동 및 Next 버튼 표시
                    if (starKey === 'S1004') {
                        Object.assign(spaceship.style, {
                            left: `${star.dataset.actualX * 100}%`,
                            top: `${star.dataset.actualY * 100}%`
                        });
                        
                        // Next 버튼 활성화 및 표시
                        nextButton.disabled = false;
                        nextButton.style.display = 'block';
                        
                        // 메시지 표시
                        message.style.display = 'block';
                    } else {
                        Object.assign(spaceship.style, {
                            left: `${x * 100}%`,
                            top: `${y * 100}%`
                        });
                    }
                    
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

    // Check for Preposition in any star
    const starKeys = ['S1', 'S2', 'S3', 'S$', 'S1004'];
    starKeys.forEach(key => {
        if(currentData['${key} person'] === '2') {
            const position = currentData['${key} po_sition'];
            if (position) {
                console.log(`${key} is 2 person, showing image at:`, person);
                handleSecondPerson(secondPerson, position);
            }
        }
    });
    starKeys.forEach(key => {
        if (currentPoint[`${key} part_of_speech`] === 'Preposition') {
            const position = currentPoint[`${key} po_sition`];
            if (position) {
                console.log(`${key} is Preposition, showing delivery box at:`, position);
                console.log('position:', position);
                handleSpecialValue('Preposition', position);
            }
        }
    });

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

    // S1004 po_sition 값이 "(0.5, 0.01)"일 때 처리
    if (currentPoint['S1004 po_sition'] === "(0.5, 0.05)") {
        const nextButton = document.getElementById('next-button');
        nextButton.disabled = false;
        nextButton.style.display = 'block'; // 버튼을 보이게 함
        
        // 큰 별 생성
        const bigStar = document.createElement('div');
        bigStar.classList.add('star');
        Object.assign(bigStar.style, {
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: '0',
            top: '0',
            backgroundColor: 'yellow',
            borderRadius: '0',
            boxShadow: '0 0 20px yellow',
            zIndex: '1000',
            display: 'block'
        });
        
        starContainer.appendChild(bigStar);
        setTimeout(() => bigStar.remove(), 10000);
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

    // delivery-box는 제거하지 않고 숨김 처리만 수행
    const deliveryBox = document.getElementById('delivery-box');
    if (deliveryBox) {
        deliveryBox.style.display = 'none';
    }

    // 2인칭 이미지 제거
    const personElement = document.getElementById('2_person');
    if (personElement && personElement.parentNode) {
        personElement.parentNode.removeChild(personElement);
    }

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
    // 새로운 아이디에서 모든 택배 상자 이미지 제거
    document.querySelectorAll(`[id^="boxImage-${currentId}"]`).forEach(box => box.remove());
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

function handleSecondPerson(secondPerson, position) {
    console.log('handleSecondPerson called with position:', position);
    let personElement = document.getElementById('2_person');
    const currentImage = document.getElementById('current-image');
    
    // 2_person 요소가 없으면 생성
    if (!personElement) {
        personElement = document.createElement('div');
        personElement.id = '2_person';
        document.getElementById('image-container').appendChild(personElement);
        console.log('Created new 2_person element');
    }

    if (!currentImage) {
        console.error('current-image element not found');
        return;
    }

    // 이미지 경로 설정
    const imagePath = 'assets/images/yoso/2_person.png';
    
    // 이미지가 로드된 후에 2인칭 이미지 표시
    if (currentImage.complete) {
        showSecondPerson(position);
    } else {
        currentImage.addEventListener('load', () => {
            showSecondPerson(position);
        });
    }

    function showSecondPerson(position) {
        let x, y;
        if (typeof position === 'string') {
            try {
                // 괄호와 공백을 제거
                const cleanPosition = position.replace(/[()\s]/g, '');
                const coords = cleanPosition.split(',');
                
                if (coords.length !== 2) {
                    throw new Error('Invalid coordinate format');
                }
                
                x = parseFloat(coords[0]);
                y = parseFloat(coords[1]);
                
                if (isNaN(x) || isNaN(y)) {
                    throw new Error('Failed to parse coordinates to numbers');
                }
            } catch (error) {
                console.error('Error parsing coordinates:', error);
                return;
            }
        } else if (typeof position === 'object') {
            x = position.x;
            y = position.y;
        }

        // 이미지의 실제 크기와 표시 크기 계산
        const imageRect = currentImage.getBoundingClientRect();
        const scaleX = currentImage.naturalWidth / imageRect.width;
        const scaleY = currentImage.naturalHeight / imageRect.height;

        // 좌표를 이미지의 실제 크기에 맞게 조정
        const adjustedX = x * imageRect.width;
        const adjustedY = y * imageRect.height;

        console.log('Setting 2_person position:', { adjustedX, adjustedY });

        // 2인칭 이미지 위치 설정
        Object.assign(personElement.style, {
            position: 'absolute',
            left: `${adjustedX-10}px`,
            top: `${adjustedY+180}px`,
            display: 'block',
            //transform: 'translate(-50%, -50%)',
            zIndex: '5',
            cursor: 'pointer',
            transform: 'scale(1.5)', // 크기를 50%로 축소
            transformOrigin: 'center center', // 중앙을 기준으로 크기 변경
            width: '600px',
            height: '600px',
            backgroundImage: `url(${imagePath})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'auto' // 클릭 이벤트 허용
        });

        // 이미지 로드 확인
        const img = new Image();
        img.onload = function() {
            console.log('2_person image loaded successfully');
        };
        img.onerror = function() {
            console.error('Failed to load 2_person image');
        };
        img.src = imagePath;
    }
}

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
    Object.assign(deliveryBox.style, {
        position: 'absolute',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        display: 'block',
        transform: 'translate(-10%, -10%) scale(0.6)',
        zIndex: '5',
        cursor: 'pointer'
    });

    // 택배상자 클릭 이벤트 추가
    deliveryBox.onclick = function(event) {
        event.stopPropagation(); // 이벤트 버블링 방지
        console.log('Delivery box clicked at:', { x, y });
        
        // 클릭한 위치에서 가장 가까운 별 찾기
        const stars = document.querySelectorAll('.star');
        let closestStar = null;
        let minDistance = Infinity;

        stars.forEach(star => {
            const starRect = star.getBoundingClientRect();
            const starCenterX = starRect.left + starRect.width / 2;
            const starCenterY = starRect.top + starRect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(starCenterX - adjustedX, 2) + 
                Math.pow(starCenterY - adjustedY, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestStar = star;
            }
        });

        // 가장 가까운 별이 있고 거리가 200px 이내라면 해당 별을 클릭한 것처럼 처리
        if (closestStar && minDistance <= 200) {
            const starKey = closestStar.dataset.starKey;
            const longIndex = parseInt(closestStar.dataset.longIndex);
            
            if (starKey && longIndex) {
                handleStarClick(starKey, longIndex);
                createParticles(50, adjustedX, adjustedY);
            }
        }
    };
}

function createParticles(count, x, y) {
    const particleContainer = document.getElementById('particle-container');
    
    // 다양한 색상 배열 정의
    const colors = [
        'hsl(0, 100%, 50%)',    // 빨강
        'hsl(30, 100%, 50%)',   // 주황
        'hsl(60, 100%, 50%)',   // 노랑
        'hsl(120, 100%, 50%)',  // 초록
        'hsl(180, 100%, 50%)',  // 청록
        'hsl(240, 100%, 50%)',  // 파랑
        'hsl(270, 100%, 50%)',  // 보라
        'hsl(300, 100%, 50%)',  // 자주
        'hsl(330, 100%, 50%)'   // 분홍
    ];
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // 랜덤한 초기 위치 (클릭 지점 주변)
        const randomOffsetX = (Math.random() - 0.5) * 50;
        const randomOffsetY = (Math.random() - 0.05) * 50;
        
        // 랜덤한 이동 거리 생성
        const moveX = (Math.random() * 200 - 100);
        const moveY = -(Math.random() * 200 - 100);
        
        // 랜덤한 색상 선택
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
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
            width: '20px',
            height: '20px',
            backgroundColor: randomColor,
            animation: `${keyframeName} ${Math.random() * 1 + 0.5}s ease-out`,
            boxShadow: `0 0 20px ${randomColor}`,
            borderRadius: '50%'
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