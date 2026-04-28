import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
  activeMode: string;
}

const gameData: Record<string, { title: string; desc: React.ReactNode; tips: React.ReactNode }> = {
  site_guide: {
    title: "0. 시스템 진입 및 우회 규약 (Welcome Guide)",
    desc: (
      <>
        <strong>개요:</strong> 본 시스템은 표면상 일반적인 학업용 노트 애플리케이션(Notion 파생)으로 위장되어 있으나, 실질적으로는 과도한 학업 스트레스 환경에서 은밀하게 인지적 휴식을 제공하기 위해 설계된 우회 포털이다.<br/>
        <strong>접근 방식:</strong> X-Ray 탐색기(우측 하단)를 활성화하면 숨겨진 도구 모음(게임 등)이 노출되며, 은닉된 통신 채널에 접근할 수 있다.
      </>
    ),
    tips: (
      <>
        <strong>활용 수칙:</strong><br/>
        - 상단 툴바에 위장된 아이콘(Typing, Tetris 등)을 클릭하여 다양한 우회 프로그램에 접속하세요.<br/>
        - '비밀 채팅' 메뉴를 통해 익명 통신망에 접속할 수 있습니다.<br/>
        - 외부의 시선(교수, 조교 등)이 감지될 경우, 화면의 어떠한 위장 요소라도 클릭하여 즉시 본래의 필기 화면으로 복귀하세요.
      </>
    )
  },
  tetris: {
    title: "1. 시간표 조회 알고리즘 (Tetris)",
    desc: (
      <>
        <strong>개요:</strong> 동적 시간 할당 최적화 연구. 시공간 블록(Tetromino)을 중첩 없이 배치하여 누적 이수 시간을 극대화하는 1차원 선형 소거 방법론이다.<br/>
        <strong>실행 조작:</strong> 화살표 방향키(←, →)를 이용한 횡축 이동, 상향/하향 방향키를 통한 공간 배정, 스페이스바를 통한 즉각 할당.
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - 단숨에 하단으로 고정시키는 <strong>스페이스바 (하드 드롭)</strong>를 적극 활용하세요.<br/>
        - 세로로 긴 블록(I-블록)을 위해 한 줄을 비워두는 전략이 '테트리스(4줄 동시 소거)' 득점에 유리합니다.<br/>
        - 화면 측면(우측 상단 등)에 표시되는 다음 블록을 리딩하며 배치 위치를 선행 계획하세요.
      </>
    )
  },
  '2048': {
    title: "2. 예상 학점 계산기 (2048)",
    desc: (
      <>
        <strong>개요:</strong> 인접한 동일 학년도 이수 단위(Grade)를 결합하여 상위 단계의 학점 밀도를 도출하는 비선형적 학점 시뮬레이션.<br/>
        <strong>실행 조작:</strong> 상/하/좌/우 방향 벡터 입력을 통해 전역 행렬 내의 개체들을 병합. (목표: '졸업' 상태 도달)
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - <strong>한쪽 구석 고정 전략:</strong> 가장 높은 숫자를 모서리(예: 왼쪽 하단)에 고정시키는 것이 최우선 목표입니다.<br/>
        - 상, 하, 좌, 우 네 방향 중 세 방향(예: 하, 좌, 우)만 주로 사용하여 가장 큰 숫자가 이탈하지 않도록 통제하세요.<br/>
        - 주변 셀에 내림차순 형태의 계단식 배열을 만들어 두면 한 번의 스와이프로 연속적 병합이 가능합니다.
      </>
    )
  },
  typing: {
    title: "3. 집중력 모니터링 체계 (Typing Game)",
    desc: (
      <>
        <strong>개요:</strong> 시각적 개체에 대한 정적 전사 및 동적 하강 객체의 신속 소거를 통해 집중도 하락을 방지하는 모니터링 척도.<br/>
        <strong>실행 조작:</strong> 키보드를 사용하여 시스템이 출력하거나 낙하하는 단어 입력. (입력 후 자동 소거)
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - 시선을 하단부(임계선 근처)에 고정하여, 도달 시간이 가장 짧게 남은 위협 객체부터 색출하세요.<br/>
        - 문자열의 길이가 짧은 객체를 선제 타격하여 화면의 시각적 노이즈를 빠르게 차단하는 것이 심리적 압박을 낮춥니다.<br/>
        - 오타가 날 경우 백스페이스 낭비가 치명적이므로 침착하게 재입력(또는 일부 게임의 타겟 포기) 여부를 판단하세요.
      </>
    )
  },
  apple: {
    title: "4. 수강 데이터 분석 (Apple Game)",
    desc: (
      <>
        <strong>개요:</strong> 10진수 배열 구조 내에서 인접한 스칼라 값들의 합이 정확히 10이 되는 최적의 군집을 탐색하여 소거하는 데이터 군집화 연구.<br/>
        <strong>실행 조작:</strong> 마우스 드래그를 이용하여 연속된 블록들을 선택. 합집합의 원소 합산이 10이 될 경우 군집 처리.
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - 매트릭스상에서 즉각 합이 완성되는 '9+1', '8+2' 같은 2 노드 조합형을 우선적으로 찾아 정리하세요.<br/>
        - 배열 내부 보다는 테두리 영역(외곽)을 먼저 소거해 나가면, 고립된 수들의 군집 포지션 파악이 수월해집니다.<br/>
        - 수평, 수직 방향으로 늘어진 낮은 수치들의 연계 (예: 1+2+3+4) 패턴을 시각적으로 빠르게 스캐닝하세요.
      </>
    )
  },
  minesweeper: {
    title: "5. 논리 구조 검증 (Minesweeper)",
    desc: (
      <>
        <strong>개요:</strong> 행렬 내에 은닉된 잠재적 치명적 오류 개체(Bomb)를 인접 노드 가중치를 통해 추론하는 휴리스틱 탐색 기법.<br/>
        <strong>실행 조작:</strong> 좌클릭을 통한 노드 탐색, 우클릭을 통한 오류 예측 지점 깃발(Flag) 할당.
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - 코너나 모서리의 변곡점에 존재하는 가중치 '1' 노드를 최우선 기준으로 주변 오류 위치를 확정지으세요.<br/>
        - 직렬로 늘어선 '1-2-1' 또는 '1-2-2-1' 의 정형화된 논리 패턴을 인지하여 스캔 속도를 월등히 높일 수 있습니다.<br/>
        - 불확실성이 존재하는 구역은 찍기(Gamble) 보다는 기확보된 안전 구역에서 확장되어 나가는 연역적 접근을 유지하세요.
      </>
    )
  },
  snake: {
    title: "6. 터미널 로깅 도구 (Snake)",
    desc: (
      <>
        <strong>개요:</strong> 폐쇄 회로(Closed-loop) 내에서 단말 노드(Snake)가 무작위 생성되는 데이터 패킷을 수집하며 단말 길이를 연장하는 내구성 검사.<br/>
        <strong>실행 조작:</strong> 화살표 키를 통해 라우팅 방향 전환. (회로 교차스파크 발생 시 커널 패닉 주의)
      </>
    ),
    tips: (
      <>
        <strong>공략 플로우:</strong><br/>
        - 노드의 궤적을 180도 선회해야 할 때는 반경을 넓게 설정(U턴)하여 자기 꼬리 트랩에 갇히는 현상을 예방하세요.<br/>
        - 트레일(꼬리)이 임계치 이상으로 연장되면 중앙부 진입을 통제하고 경계선(벽면)을 따라 순환하는 지그재그 패턴을 구성하세요.<br/>
        - 새로운 패킷을 캡처하기 전에 해당 섹터 진입 이후의 "이탈 경로(퇴로)"가 확보되었는지 선 검토 후 방향을 결정하세요.
      </>
    )
  }
};

export default function RulesModal({ onClose, activeMode }: RulesModalProps) {
  const [showTips, setShowTips] = useState(false);
  const data = gameData[activeMode];

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 shadow-xl max-w-2xl w-full flex flex-col font-serif text-gray-800">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center text-gray-700 font-bold">
            <Search className="w-5 h-5 mr-2" />
            <span>학습 도구 활용 및 시스템 운영 연구 (Abstract)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto leading-relaxed text-sm">
          {!data ? (
            <div className="text-center py-10 text-gray-500">지정된 시스템 프로토콜이 없습니다.</div>
          ) : (
            <>
              <h1 className="text-xl font-bold mb-4 text-center text-blue-900 border-b border-blue-200 pb-2">
                {data.title}
              </h1>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-inner ring-1 ring-blue-100 mb-6">
                <p className="text-gray-700 text-justify leading-relaxed">
                  {data.desc}
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setShowTips(!showTips)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 font-bold text-gray-700 transition"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    심화 조작 프로토콜 (공략법)
                  </span>
                  {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showTips && (
                  <div className="p-4 bg-white border-t border-gray-200 text-gray-700 text-justify leading-relaxed text-sm bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[length:100%_24px]">
                    {data.tips}
                  </div>
                )}
              </div>
            </>
          )}

          <p className="mt-8 text-xs text-gray-400 text-center uppercase tracking-widest border-t border-gray-100 pt-4">
            - For Authorized Students Only - <br/> 긴급 종료 요망 시 즉각 ESC 버튼을 누르시오.
          </p>
        </div>
      </div>
    </div>
  );
}
