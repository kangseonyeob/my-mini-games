import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          My Mini-Game World
        </h1>
        <p className="text-xl text-gray-400">
          제작한 미니게임들을 이곳에서 즐겨보세요!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <GameCard
          href="/quiz"
          title="도전! 상식 퀴즈"
          description="50개의 다양한 상식 문제 중 15개가 랜덤으로 출제됩니다. 당신의 지식을 시험해보세요!"
        />
        <GameCard
          href="/bound"
          title="BOUND"
          description="클래식 벽돌깨기 게임을 재해석했습니다. 화살표 키와 스페이스바로 조작하여 모든 레벨을 클리어하세요!"
        />
        <GameCard
          href="/tetris"
          title="테트리스"
          description="전설적인 블록 퍼즐 게임, 테트리스! 화살표 키로 블록을 조작하여 줄을 완성하고 점수를 획득하세요."
        />
      </div>
    </main>
  );
}

interface GameCardProps {
  href: string;
  title: string;
  description: string;
}

function GameCard({ href, title, description }: GameCardProps) {
  return (
    <Link href={href}>
      <div className="h-full bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8 flex flex-col justify-between hover:bg-gray-700 hover:border-blue-500 transform hover:-translate-y-2 transition-all duration-300 cursor-pointer">
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">{title}</h2>
          <p className="text-gray-300 mb-6">{description}</p>
        </div>
        <div className="text-right font-semibold text-blue-400">
          플레이하기 &rarr;
        </div>
      </div>
    </Link>
  );
}
