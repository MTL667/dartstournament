import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-green-700">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold text-white mb-4">
          🎯 Darts Tournament
        </h1>
        <p className="text-2xl text-green-100 mb-12">
          Organiseer en volg darts toernooien live
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <Link 
            href="/dashboard"
            className="card-glass font-bold py-8 px-6 rounded-2xl transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-xl text-white">Dashboard</div>
            <div className="text-sm text-gray-300 mt-2">Bekijk live matches</div>
          </Link>
          
          <Link 
            href="/match"
            className="card-glass font-bold py-8 px-6 rounded-2xl transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">🎮</div>
            <div className="text-xl text-white">Match Invoer</div>
            <div className="text-sm text-gray-300 mt-2">Voer scores in</div>
          </Link>
          
          <Link 
            href="/admin"
            className="card-glass font-bold py-8 px-6 rounded-2xl transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">⚙️</div>
            <div className="text-xl text-white">Admin</div>
            <div className="text-sm text-gray-300 mt-2">Toernooi instellingen</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

