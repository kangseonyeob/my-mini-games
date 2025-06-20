'use client';

import React, { useState, useMemo, useEffect } from 'react';

type Language = 'ko' | 'en';

interface Question {
  question: { [key in Language]: string };
  options: { [key in Language]: string[] };
  answer: { [key in Language]:string };
}

const uiText = {
  ko: {
    title: '도전! 상식 퀴즈',
    description: '당신의 지식을 시험해보세요!',
    resultTitle: '퀴즈 결과',
    scoreText: (score: number, total: number) => `총 ${total}문제 중 ${score}문제를 맞혔습니다!`,
    scoreUnit: '점',
    restartButton: '새로운 퀴즈 풀기',
    questionProgress: (current: number, total: number) => `문제 ${current}/${total}`,
    correctMessage: '정답입니다! 🎉',
    incorrectMessage: (correctAnswer: string) => `오답입니다. 정답은 "${correctAnswer}" 입니다.`,
    loadingMessage: '퀴즈를 불러오는 중입니다...',
    homeLink: '홈으로',
    boundLink: 'BOUND 게임',
    footerText: (homeLink: React.ReactNode, boundLink: React.ReactNode) => <>페이지를 이동하려면 {homeLink} 가거나 {boundLink}을 즐겨보세요.</>
  },
  en: {
    title: 'Trivia Challenge',
    description: 'Test your knowledge!',
    resultTitle: 'Quiz Result',
    scoreText: (score: number, total: number) => `You answered ${score} out of ${total} questions correctly!`,
    scoreUnit: 'Points',
    restartButton: 'Try a New Quiz',
    questionProgress: (current: number, total: number) => `Question ${current}/${total}`,
    correctMessage: 'Correct! 🎉',
    incorrectMessage: (correctAnswer: string) => `Incorrect. The correct answer is "${correctAnswer}".`,
    loadingMessage: 'Loading quiz...',
    homeLink: 'Home',
    boundLink: 'BOUND Game',
    footerText: (homeLink: React.ReactNode, boundLink: React.ReactNode) => <>To navigate, go to {homeLink} or play the {boundLink}.</>
  },
};

const allQuestions: Question[] = [
    { 
        question: { ko: '셰익스피어의 4대 비극이 아닌 것은?', en: 'Which of the following is not one of Shakespeare\'s Four Great Tragedies?' },
        options: { ko: ['햄릿', '리어왕', '로미오와 줄리엣', '맥베스'], en: ['Hamlet', 'King Lear', 'Romeo and Juliet', 'Macbeth'] },
        answer: { ko: '로미오와 줄리엣', en: 'Romeo and Juliet' }
    },
    { 
        question: { ko: '대한민국 최초의 유네스코 세계유산으로 지정된 곳은?', en: 'What was the first UNESCO World Heritage site designated in South Korea?' },
        options: { ko: ['석굴암과 불국사', '창덕궁', '해인사 장경판전', '종묘'], en: ['Seokguram Grotto and Bulguksa Temple', 'Changdeokgung Palace', 'Haeinsa Temple Janggyeong Panjeon', 'Jongmyo Shrine'] },
        answer: { ko: '석굴암과 불국사', en: 'Seokguram Grotto and Bulguksa Temple' }
    },
    { 
        question: { ko: '컴퓨터의 "폰 노이만 구조"에서 핵심이 아닌 요소는?', en: 'Which is not a key component of the "Von Neumann architecture" in computers?' },
        options: { ko: ['중앙처리장치(CPU)', '주기억장치(RAM)', '그래픽 처리 장치(GPU)', '입력/출력 장치'], en: ['Central Processing Unit (CPU)', 'Main Memory (RAM)', 'Graphics Processing Unit (GPU)', 'Input/Output Devices'] },
        answer: { ko: '그래픽 처리 장치(GPU)', en: 'Graphics Processing Unit (GPU)' }
    },
    { 
        question: { ko: '태양계에서 가장 많은 위성을 가진 행성은?', en: 'Which planet in the solar system has the most moons?' },
        options: { ko: ['목성', '지구', '해왕성', '토성'], en: ['Jupiter', 'Earth', 'Neptune', 'Saturn'] },
        answer: { ko: '토성', en: 'Saturn' }
    },
    { 
        question: { ko: '노벨상을 수상한 최초의 여성은 누구일까요?', en: 'Who was the first woman to win a Nobel Prize?' },
        options: { ko: ['마더 테레사', '마리 퀴리', '도로시 호지킨', '거티 코리'], en: ['Mother Teresa', 'Marie Curie', 'Dorothy Hodgkin', 'Gerty Cori'] },
        answer: { ko: '마리 퀴리', en: 'Marie Curie' }
    },
    { question: { ko: '레오나르도 다 빈치의 "모나리자"는 현재 어느 박물관에 있을까요?', en: 'In which museum is Leonardo da Vinci\'s "Mona Lisa" currently located?' }, options: { ko: ['대영박물관', '루브르 박물관', '프라도 미술관', '메트로폴리탄 미술관'], en: ['British Museum', 'Louvre Museum', 'Prado Museum', 'Metropolitan Museum of Art'] }, answer: { ko: '루브르 박물관', en: 'Louvre Museum' } },
    { question: { ko: '소설 "죄와 벌"을 쓴 러시아의 대문호는?', en: 'Which great Russian writer wrote the novel "Crime and Punishment"?' }, options: { ko: ['톨스토이', '푸시킨', '체호프', '도스토옙스키'], en: ['Tolstoy', 'Pushkin', 'Chekhov', 'Dostoevsky'] }, answer: { ko: '도스토옙스키', en: 'Dostoevsky' } },
    { question: { ko: '빛의 3원색에 해당하지 않는 색은 무엇일까요?', en: 'Which of the following is not one of the three primary colors of light?' }, options: { ko: ['빨강', '노랑', '파랑', '초록'], en: ['Red', 'Yellow', 'Blue', 'Green'] }, answer: { ko: '노랑', en: 'Yellow' } },
    { question: { ko: '주기율표에서 원소기호 "Au"가 나타내는 것은 무엇일까요?', en: 'What does the element symbol "Au" represent on the periodic table?' }, options: { ko: ['은', '구리', '금', '백금'], en: ['Silver', 'Copper', 'Gold', 'Platinum'] }, answer: { ko: '금', en: 'Gold' } },
    { question: { ko: '대한민국 헌법 제1조 2항의 내용은?', en: 'What is the content of Article 1, Paragraph 2 of the Constitution of the Republic of Korea?' }, options: { ko: ['대한민국은 민주공화국이다.', '대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.', '대한민국의 영토는 한반도와 그 부속도서로 한다.', '모든 국민은 인간으로서의 존엄과 가치를 가진다.'], en: ['The Republic of Korea shall be a democratic republic.', 'The sovereignty of the Republic of Korea shall reside in the people, and all state authority shall emanate from the people.', 'The territory of the Republic of Korea shall consist of the Korean peninsula and its adjacent islands.', 'All citizens shall be assured of human worth and dignity.'] }, answer: { ko: '대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.', en: 'The sovereignty of the Republic of Korea shall reside in the people, and all state authority shall emanate from the people.' } },
    { question: { ko: '경제학에서, 상품 가격이 올라도 수요가 증가하는 현상은?', en: 'In economics, what is the phenomenon where demand for a product increases as its price increases?' }, options: { ko: ['베블런 효과', '기펜재의 역설', '스놉 효과', '밴드왜건 효과'], en: ['Veblen Effect', 'Giffen\'s Paradox', 'Snob Effect', 'Bandwagon Effect'] }, answer: { ko: '기펜재의 역설', en: 'Giffen\'s Paradox' } },
    { question: { ko: '비행기의 비행 원리를 설명하는 가장 핵심적인 법칙은?', en: 'What is the most central principle that explains the flight of an airplane?' }, options: { ko: ['뉴턴의 운동 법칙', '아르키메데스의 원리', '베르누이의 정리', '파스칼의 원리'], en: ['Newton\'s Laws of Motion', 'Archimedes\' Principle', 'Bernoulli\'s Principle', 'Pascal\'s Principle'] }, answer: { ko: '베르누이의 정리', en: 'Bernoulli\'s Principle' } },
    { question: { ko: '세계 최초의 장편 소설로 알려진 "겐지모노가타리"는 어느 나라 작품일까요?', en: 'From which country is "The Tale of Genji," known as the world\'s first novel?' }, options: { ko: ['중국', '한국', '일본', '베트남'], en: ['China', 'Korea', 'Japan', 'Vietnam'] }, answer: { ko: '일본', en: 'Japan' } },
    { question: { ko: '판소리 "춘향가"에서 이몽룡과 성춘향이 처음 만난 장소는?', en: 'In the pansori "Chunhyangga," where did Lee Mongryong and Seong Chunhyang first meet?' }, options: { ko: ['광한루', '부용당', '오작교', '남원 관아'], en: ['Gwanghallu Pavilion', 'Buyongdang Hall', 'Ojakgyo Bridge', 'Namwon Government Office'] }, answer: { ko: '광한루', en: 'Gwanghallu Pavilion' } },
    { question: { ko: '철학에서 경험에 앞서 선험적으로 존재하는 지식을 무엇이라 할까요?', en: 'In philosophy, what is knowledge that exists a priori, independent of experience?' }, options: { ko: ['아 포스테리오리', '아 프리오리', '변증법', '이데아'], en: ['A posteriori', 'A priori', 'Dialectic', 'Idea'] }, answer: { ko: '아 프리오리', en: 'A priori' } },
    { question: { ko: '인상주의 화가들의 그룹전에 처음으로 출품된 클로드 모네의 작품 이름은?', en: 'What is the name of the Claude Monet painting that was first exhibited at the Impressionist group exhibition?' }, options: { ko: ['수련', '인상, 해돋이', '생 라자르 역', '양산을 쓴 여인'], en: ['Water Lilies', 'Impression, Sunrise', 'Gare Saint-Lazare', 'Woman with a Parasol'] }, answer: { ko: '인상, 해돋이', en: 'Impression, Sunrise' } },
    { question: { ko: '로마 신화의 전쟁의 신은 누구인가?', en: 'Who is the god of war in Roman mythology?' }, options: { ko: ['마르스', '아폴론', '주피터', '넵투누스'], en: ['Mars', 'Apollo', 'Jupiter', 'Neptune'] }, answer: { ko: '마르스', en: 'Mars' } },
    { question: { ko: '대한민국 국보 1호는?', en: 'What is National Treasure No. 1 of South Korea?' }, options: { ko: ['훈민정음 해례본', '숭례문', '흥인지문', '경복궁'], en: ['Hunminjeongeum Haerye', 'Sungnyemun', 'Heunginjimun', 'Gyeongbokgung Palace'] }, answer: { ko: '숭례문', en: 'Sungnyemun' } },
    { question: { ko: '인류 최초로 달에 발을 디딘 우주비행사는?', en: 'Who was the first astronaut to walk on the moon?' }, options: { ko: ['유리 가가린', '존 글렌', '닐 암스트롱', '버즈 올드린'], en: ['Yuri Gagarin', 'John Glenn', 'Neil Armstrong', 'Buzz Aldrin'] }, answer: { ko: '닐 암스트롱', en: 'Neil Armstrong' } },
    { question: { ko: '파충류와 양서류를 구분하는 가장 큰 차이점은?', en: 'What is the main difference between reptiles and amphibians?' }, options: { ko: ['피부의 습도', '다리 개수', '체온', '먹이 종류'], en: ['Skin moisture', 'Number of legs', 'Body temperature', 'Type of food'] }, answer: { ko: '피부의 습도', en: 'Skin moisture' } },
    { question: { ko: '베토벤의 교향곡 9번 "합창"에 가사로 사용된 실러의 시는?', en: 'Which poem by Schiller was used as the lyrics for Beethoven\'s 9th Symphony, "Choral"?' }, options: { ko: ['환희의 송가', '비창', '월광', '영웅'], en: ['Ode to Joy', 'Pathétique', 'Moonlight', 'Eroica'] }, answer: { ko: '환희의 송가', en: 'Ode to Joy' } },
    { question: { ko: '조선 시대, 왕의 비서 기관으로 왕명의 출납을 담당했던 곳은?', en: 'During the Joseon Dynasty, which institution was responsible for secretarial duties and relaying royal orders?' }, options: { ko: ['의정부', '승정원', '사헌부', '홍문관'], en: ['Uijeongbu', 'Seungjeongwon', 'Saheonbu', 'Hongmungwan'] }, answer: { ko: '승정원', en: 'Seungjeongwon' } },
    { question: { ko: '인터넷에서 "www"가 의미하는 것은?', en: 'What does "www" stand for on the internet?' }, options: { ko: ['World Wide Web', 'Web World Work', 'Wide World Web', 'World Web Wide'], en: ['World Wide Web', 'Web World Work', 'Wide World Web', 'World Web Wide'] }, answer: { ko: 'World Wide Web', en: 'World Wide Web' } },
    { question: { ko: '우리나라의 4대 명절이 아닌 것은?', en: 'Which of the following is not one of Korea\'s four major holidays?' }, options: { ko: ['설날', '한식', '정월대보름', '추석'], en: ['Seollal', 'Hansik', 'Daeboreum', 'Chuseok'] }, answer: { ko: '정월대보름', en: 'Daeboreum' } },
    { question: { ko: '지구의 대기 성분 중 가장 많은 비율을 차지하는 기체는?', en: 'Which gas is the most abundant in Earth\'s atmosphere?' }, options: { ko: ['산소', '이산화탄소', '질소', '아르곤'], en: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'] }, answer: { ko: '질소', en: 'Nitrogen' } },
    { question: { ko: '바둑에서 집을 지어 승부를 가리는 게임의 목표를 달성하기 위해 두는 돌의 색깔은 흑과 무엇인가?', en: 'In the game of Go, what color stones are used along with black to capture territory and win?' }, options: { ko: ['청', '적', '황', '백'], en: ['Blue', 'Red', 'Yellow', 'White'] }, answer: { ko: '백', en: 'White' } },
    { question: { ko: '피카소와 함께 입체주의(큐비즘)를 창시한 프랑스 화가는?', en: 'Which French painter co-founded Cubism with Picasso?' }, options: { ko: ['조르주 브라크', '앙리 마티스', '에두아르 마네', '폴 세잔'], en: ['Georges Braque', 'Henri Matisse', 'Édouard Manet', 'Paul Cézanne'] }, answer: { ko: '조르주 브라크', en: 'Georges Braque' } },
    { question: { ko: '아라비안 나이트(천일야화)에서 이야기를 풀어가는 왕비의 이름은?', en: 'What is the name of the queen who tells the stories in "Arabian Nights" (One Thousand and One Nights)?' }, options: { ko: ['자스민', '세헤라자데', '알리바바', '신밧드'], en: ['Jasmine', 'Scheherazade', 'Ali Baba', 'Sinbad'] }, answer: { ko: '세헤라자데', en: 'Scheherazade' } },
    { question: { ko: '음식의 맛을 느끼는 혀의 미뢰가 감지하지 못하는 맛은?', en: 'Which taste sensation is not detected by the taste buds on the tongue?' }, options: { ko: ['단맛', '짠맛', '신맛', '매운맛'], en: ['Sweet', 'Salty', 'Sour', 'Spicy'] }, answer: { ko: '매운맛', en: 'Spicy' } },
    { question: { ko: '영화 "기생충"으로 아카데미 감독상을 수상한 한국인 감독은?', en: 'Which Korean director won the Academy Award for Best Director for the film "Parasite"?' }, options: { ko: ['박찬욱', '이창동', '봉준호', '김지운'], en: ['Park Chan-wook', 'Lee Chang-dong', 'Bong Joon-ho', 'Kim Jee-woon'] }, answer: { ko: '봉준호', en: 'Bong Joon-ho' } },
    { question: { ko: '갈릴레오 갈릴레이가 발견한 목성의 4대 위성이 아닌 것은?', en: 'Which is not one of the four Galilean moons of Jupiter discovered by Galileo Galilei?' }, options: { ko: ['이오', '유로파', '가니메데', '타이탄'], en: ['Io', 'Europa', 'Ganymede', 'Titan'] }, answer: { ko: '타이탄', en: 'Titan' } },
    { question: { ko: '컴퓨터 키보드의 "QWERTY" 배열은 어디에서 유래했을까요?', en: 'Where did the "QWERTY" layout for computer keyboards originate?' }, options: { ko: ['타자기', '인쇄기', '전신기', '컴퓨터'], en: ['Typewriter', 'Printing press', 'Telegraph', 'Computer'] }, answer: { ko: '타자기', en: 'Typewriter' } },
    { question: { ko: '삼국시대 신라의 화랑제도를 국가적인 조직으로 개편한 왕은?', en: 'Which king of Silla reorganized the Hwarang system into a national organization during the Three Kingdoms period?' }, options: { ko: ['법흥왕', '진흥왕', '선덕여왕', '무열왕'], en: ['Beopheung', 'Jinheung', 'Seondeok', 'Muyeol'] }, answer: { ko: '진흥왕', en: 'Jinheung' } },
    { question: { ko: '오페라의 4대 요소에 포함되지 않는 것은?', en: 'Which of the following is not one of the four main elements of opera?' }, options: { ko: ['아리아', '레치타티보', '서곡', '인터미션'], en: ['Aria', 'Recitative', 'Overture', 'Intermission'] }, answer: { ko: '인터미션', en: 'Intermission' } },
    { question: { ko: '대한민국에서 가장 긴 다리는?', en: 'What is the longest bridge in South Korea?' }, options: { ko: ['인천대교', '광안대교', '서해대교', '영종대교'], en: ['Incheon Bridge', 'Gwangan Bridge', 'Seohae Bridge', 'Yeongjong Bridge'] }, answer: { ko: '인천대교', en: 'Incheon Bridge' } },
    { question: { ko: '고대 그리스 철학에서 "만물의 근원은 물이다"라고 주장한 철학자는?', en: 'Which ancient Greek philosopher claimed that "water is the origin of all things"?' }, options: { ko: ['소크라테스', '플라톤', '아리스토텔레스', '탈레스'], en: ['Socrates', 'Plato', 'Aristotle', 'Thales'] }, answer: { ko: '탈레스', en: 'Thales' } },
    { question: { ko: '축구에서 한 선수가 한 경기에서 3골을 넣는 것을 무엇이라 하는가?', en: 'In soccer, what is it called when a player scores three goals in a single game?' }, options: { ko: ['해트트릭', '멀티골', '포트트릭', '오버헤드킥'], en: ['Hat-trick', 'Brace', 'Four-trick', 'Overhead kick'] }, answer: { ko: '해트트릭', en: 'Hat-trick' } },
    { question: { ko: '우리 몸의 혈액이 온몸을 한 바퀴 도는 데 걸리는 시간은 대략 얼마일까요?', en: 'Approximately how long does it take for blood to circulate once throughout the human body?' }, options: { ko: ['10초', '20초', '1분', '5분'], en: ['10 seconds', '20 seconds', '1 minute', '5 minutes'] }, answer: { ko: '20초', en: '20 seconds' } },
    { question: { ko: '"보이지 않는 손"이라는 말로 시장 경제의 원리를 설명한 경제학자는?', en: 'Which economist explained the principle of the market economy with the phrase "the invisible hand"?' }, options: { ko: ['칼 마르크스', '존 메이너드 케인스', '애덤 스미스', '데이비드 리카도'], en: ['Karl Marx', 'John Maynard Keynes', 'Adam Smith', 'David Ricardo'] }, answer: { ko: '애덤 스미스', en: 'Adam Smith' } },
    { question: { ko: '프로그래밍 언어 "파이썬"의 이름은 어디에서 유래되었을까요?', en: 'Where did the name for the programming language "Python" come from?' }, options: { ko: ['뱀 종류', '신화 속 괴물', '코미디 쇼 이름', '개발자 이름'], en: ['A type of snake', 'A mythical creature', 'A comedy show', 'The developer\'s name'] }, answer: { ko: '코미디 쇼 이름', en: 'A comedy show' } },
    { question: { ko: '우리나라 최초의 한글 소설은 무엇일까요?', en: 'What is considered the first novel written in Hangeul (the Korean alphabet)?' }, options: { ko: ['춘향전', '구운몽', '홍길동전', '심청전'], en: ['Chunhyangjeon', 'Guunmong', 'Honggildongjeon', 'Simcheongjeon'] }, answer: { ko: '홍길동전', en: 'Honggildongjeon' } },
    { question: { ko: '미국의 초대 대통령은 누구일까요?', en: 'Who was the first president of the United States?' }, options: { ko: ['에이브러햄 링컨', '조지 워싱턴', '토머스 제퍼슨', '존 애덤스'], en: ['Abraham Lincoln', 'George Washington', 'Thomas Jefferson', 'John Adams'] }, answer: { ko: '조지 워싱턴', en: 'George Washington' } },
    { question: { ko: '물리학에서 시간과 공간이 상대적이라는 이론을 발표한 사람은?', en: 'Who published the theory that time and space are relative in physics?' }, options: { ko: ['아이작 뉴턴', '알베르트 아인슈타인', '스티븐 호킹', '마이클 패러데이'], en: ['Isaac Newton', 'Albert Einstein', 'Stephen Hawking', 'Michael Faraday'] }, answer: { ko: '알베르트 아인슈타인', en: 'Albert Einstein' } },
    { question: { ko: '모스 부호를 발명한 사람의 이름은?', en: 'What is the name of the inventor of Morse code?' }, options: { ko: ['알렉산더 그레이엄 벨', '새뮤얼 모스', '토머스 에디슨', '니콜라 테슬라'], en: ['Alexander Graham Bell', 'Samuel Morse', 'Thomas Edison', 'Nikola Tesla'] }, answer: { ko: '새뮤얼 모스', en: 'Samuel Morse' } },
    { question: { ko: '세계에서 가장 큰 사막은?', en: 'What is the largest desert in the world?' }, options: { ko: ['사하라 사막', '고비 사막', '아라비아 사막', '남극 대륙'], en: ['Sahara Desert', 'Gobi Desert', 'Arabian Desert', 'Antarctic Polar Desert'] }, answer: { ko: '남극 대륙', en: 'Antarctic Polar Desert' } },
    { question: { ko: '전화기를 발명한 사람은 누구일까요?', en: 'Who invented the telephone?' }, options: { ko: ['토머스 에디슨', '알렉산더 그레이엄 벨', '니콜라 테슬라', '굴리엘모 마르코니'], en: ['Thomas Edison', 'Alexander Graham Bell', 'Nikola Tesla', 'Guglielmo Marconi'] }, answer: { ko: '알렉산더 그레이엄 벨', en: 'Alexander Graham Bell' } },
    { question: { ko: '프랑스 혁명의 3대 정신이 아닌 것은?', en: 'Which of the following was not one of the three main ideals of the French Revolution?' }, options: { ko: ['자유', '평등', '박애', '정의'], en: ['Liberty', 'Equality', 'Fraternity', 'Justice'] }, answer: { ko: '정의', en: 'Justice' } },
    { question: { ko: '우리나라에서 가장 남쪽에 있는 섬은?', en: 'What is the southernmost island in South Korea?' }, options: { ko: ['제주도', '이어도', '마라도', '독도'], en: ['Jeju Island', 'Ieodo', 'Marado Island', 'Dokdo'] }, answer: { ko: '마라도', en: 'Marado Island' } },
    { question: { ko: '그리스 신화에서 지하 세계를 다스리는 신은 누구인가?', en: 'In Greek mythology, who is the god who rules the underworld?' }, options: { ko: ['제우스', '포세이돈', '하데스', '아폴론'], en: ['Zeus', 'Poseidon', 'Hades', 'Apollo'] }, answer: { ko: '하데스', en: 'Hades' } },
    { question: { ko: '조선 왕조의 법궁(정궁)은 어디일까요?', en: 'What was the main royal palace of the Joseon Dynasty?' }, options: { ko: ['창덕궁', '창경궁', '경복궁', '경희궁'], en: ['Changdeokgung', 'Changgyeonggung', 'Gyeongbokgung', 'Gyeonghuigung'] }, answer: { ko: '경복궁', en: 'Gyeongbokgung' } },
];

const getQuizSet = (count: number): Question[] => {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function QuizPage() {
  const [lang, setLang] = useState<Language>('ko');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const t = useMemo(() => uiText[lang], [lang]);

  useEffect(() => {
    setQuizQuestions(getQuizSet(15));
  }, []);

  const currentQuestion = useMemo(() => {
    if (!quizQuestions || quizQuestions.length === 0) return null;
    return quizQuestions[currentQuestionIndex];
  }, [quizQuestions, currentQuestionIndex]);

  const handleAnswerClick = (option: string) => {
    if (selectedAnswer || !currentQuestion) return;

    const isAnswerCorrect = option === currentQuestion.answer[lang];
    setSelectedAnswer(option);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      setScore(prev => prev + 1);
    }

    setTimeout(() => {
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < quizQuestions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  const restartQuiz = () => {
    setQuizQuestions(getQuizSet(15));
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };
  
  if (!currentQuestion) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex justify-center items-center text-white">
            <p>{t.loadingMessage}</p>
        </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center text-white p-4">
      <div className="w-full max-w-3xl">
        <div className="flex justify-center gap-4 mb-4">
            <button onClick={() => setLang('ko')} className={`px-4 py-2 rounded-lg transition ${lang === 'ko' ? 'bg-blue-500 text-white' : 'bg-gray-700'}`}>한국어</button>
            <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg transition ${lang === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-700'}`}>English</button>
        </div>
        <div className="p-8 bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700">
          <h1 className="text-4xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{t.title}</h1>
          <p className="text-center text-gray-400 mb-8">{t.description}</p>

          {showResult ? (
            <div className="text-center transition-opacity duration-500">
              <h2 className="text-3xl font-bold mb-4">{t.resultTitle}</h2>
              <p className="text-5xl font-bold my-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{Math.round((score / quizQuestions.length) * 100)}</span>
                <span className="text-3xl text-gray-400">{t.scoreUnit}</span>
              </p>
              <p className="text-xl mb-8 text-gray-300">
                {t.scoreText(score, quizQuestions.length)}
              </p>
              <button
                onClick={restartQuiz}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transform transition-transform duration-300"
              >
                {t.restartButton}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 h-2 w-full bg-gray-700 rounded-full">
                  <div 
                      className="h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${progress}%` }}
                  ></div>
              </div>
            
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2 text-gray-300">
                  {t.questionProgress(currentQuestionIndex + 1, quizQuestions.length)}
                </h2>
                <p className="text-xl h-20">{currentQuestion.question[lang]}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options[lang].map((option) => {
                  const isSelected = selectedAnswer === option;
                  let buttonClass = 'p-4 rounded-lg text-left text-lg font-medium transition-all duration-300 border ';
                  
                  if (isSelected) {
                      buttonClass += isCorrect 
                          ? 'bg-green-500 border-green-400 text-white scale-105 shadow-lg' 
                          : 'bg-red-500 border-red-400 text-white scale-105 shadow-lg';
                  } else if (selectedAnswer && option === currentQuestion.answer[lang]) {
                      buttonClass += 'bg-green-500 bg-opacity-50 border-green-400';
                  }
                  else {
                      buttonClass += 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-blue-500 transform hover:-translate-y-1';
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerClick(option)}
                      disabled={!!selectedAnswer}
                      className={buttonClass}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              
              {selectedAnswer && (
                  <div className="mt-6 text-center text-xl font-bold transition-opacity duration-500">
                      {isCorrect ? t.correctMessage : t.incorrectMessage(currentQuestion.answer[lang])}
                  </div>
              )}
            </div>
          )}
        </div>
      </div>
       <footer className="mt-8 text-center text-gray-500">
        <p>
            {t.footerText(
                <a href="/" className="text-blue-400 hover:underline">{t.homeLink}</a>,
                <a href="/bound" className="text-blue-400 hover:underline">{t.boundLink}</a>
            )}
        </p>
      </footer>
    </div>
  );
} 