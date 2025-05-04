document.addEventListener("DOMContentLoaded", function() {
    const imageContainer = document.getElementById('image-container');
    const starContainer = document.getElementById('star-container');
    const nextButton = document.getElementById('next-button');
    let currentId = 0;
    let currentStarIndex = 1;
    let starData = [];
    let currentData = null;
    let totalStars = 0; // 전체 별 개수 추적
    let currentStarClickedIndex = 0;
    let sDollarClickCount = 0; // S$ 클릭 횟수를 추적하는 변수 추가
    const lastStarKey = 'S$'; // 마지막 별의 키를 정의

    function loadData() {
        fetch('assets/data/data_911.json')
            .then(response => response.json())
            .then(data => {
                starData = data;
                console.log('데이터 로드 완료:', starData);
                
                // ID 1의 데이터 로드 (인덱스 0)
                currentId = 0;
                currentData = starData[currentId];
                
                if (!currentData) {
                    console.error('ID 1의 데이터를 찾을 수 없습니다.');
                    return;
                }

                // 첫 번째 이미지 설정
                const firstPoint = currentData.points[0];
                if (firstPoint && firstPoint['S1 image']) {
                    const imagePath = `assets/images/${firstPoint['S1 image']}`;
                    console.log('첫 이미지 로드:', imagePath);
                    document.getElementById('current-image').src = imagePath;
                } else {
                    console.error('첫 이미지를 찾을 수 없습니다.');
                }

                // 시스템 초기화
                nextButton.disabled = true;
                currentStarIndex = 1;
                totalStars = currentData.points.length;
                sDollarClickCount = 0;
                
                // 별 그리기
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
            document.getElementById('current-image').src = `assets/images/${firstPoint['S1 image']}`;
        }
        nextButton.disabled = true;
        currentStarIndex = 1;
        totalStars = currentData.points.length;
        sDollarClickCount = 0;
        
        // 별 다시 그리기
        drawStars(currentData.points, currentStarIndex);
    }

    function drawMis1Positions(mis1Positions) {
        if (!mis1Positions) return;
        
        // 좌표 쌍을 추출하기 위한 정규식 패턴
        const coordinatePattern = /\(([\d.]+),\s*([\d.]+)\)/g;
        let match;
        let index = 1;

        // 정규식으로 모든 좌표 쌍을 찾아서 처리
        while ((match = coordinatePattern.exec(mis1Positions)) !== null) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            //console.log(`mis_1_${index}: x=${x}, y=${y}`); // 디버깅용 로그
            createStar(x, y, true, `mis_1_${index}`);
            index++;
        }
    }

    function drawMis2Positions(mis2Positions) {
        if (!mis2Positions) return;
        
        // 좌표 쌍을 추출하기 위한 정규식 패턴
        const coordinatePattern = /\(([\d.]+),\s*([\d.]+)\)/g;
        let match;
        let index = 1;

        // 정규식으로 모든 좌표 쌍을 찾아서 처리
        while ((match = coordinatePattern.exec(mis2Positions)) !== null) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            //console.log(`mis_2_${index}: x=${x}, y=${y}`); // 디버깅용 로그
            createStar(x, y, true, `mis_2_${index}`);
            index++;
        }
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
    }

    // 파티클 생성 함수
    function createParticles(count, x, y) {
        const particleContainer = document.getElementById('particle-container');
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${x + (Math.random() - 0.5) * 100}px`;
            particle.style.top = `${y + (Math.random() - 0.5) * 100}px`;

            // 파티클 애니메이션 설정
            particle.style.animation = `moveParticle ${Math.random() * 2 + 1}s linear infinite`;

            particleContainer.appendChild(particle);
        }

        // 0.8초 후 파티클 제거
        setTimeout(() => {
            while (particleContainer.firstChild) {
                particleContainer.removeChild(particleContainer.firstChild);
            }
        }, 800); // 0.8초 후 실행
    }

    function createStar(x, y, isMis = false, starKey = null, longIndex = null) {
        const star = document.createElement('div');
        star.classList.add('star', 'star-spinning', 'emoji-style');
        Object.assign(star.style, {
            left: `${x * 100}%`,
            top: `${y * 100}%`
        });

        // S1004 별은 미군 정성별로 표시
        if (starKey === 'S1004') {
            star.textContent = '⭐🟡⭐';
            star.style.fontSize = '40px';
            star.style.color = 'gold';
            star.style.textShadow = '0 0 10px gold';
        } else {
            star.textContent = '🟡      ⭐';
        }

        // 궤도 생성
        const orbit = document.createElement('div');
        orbit.classList.add('star-orbit');
        Object.assign(orbit.style, {
            width: '100px',
            height: '100px',
            left: `${x * 100}%`,
            top: `${y * 100}%`
        });

        // 파장 효과 생성
        function createRipple() {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const ripple = document.createElement('div');
                    ripple.classList.add('ripple');
                    Object.assign(ripple.style, {
                        left: `${x * 100}%`,
                        top: `${y * 100}%`,
                        animationDelay: `${i * 0.5}s`
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

    loadData();
});