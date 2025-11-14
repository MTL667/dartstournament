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
            className="bg-white hover:bg-gray-100 text-green-900 font-bold py-8 px-6 rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-xl">Dashboard</div>
            <div className="text-sm text-gray-600 mt-2">Bekijk live matches</div>
          </Link>
          
          <Link 
            href="/match"
            className="bg-white hover:bg-gray-100 text-green-900 font-bold py-8 px-6 rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">🎮</div>
            <div className="text-xl">Match Invoer</div>
            <div className="text-sm text-gray-600 mt-2">Voer scores in</div>
          </Link>
          
          <Link 
            href="/admin"
            className="bg-white hover:bg-gray-100 text-green-900 font-bold py-8 px-6 rounded-lg shadow-lg transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">⚙️</div>
            <div className="text-xl">Admin</div>
            <div className="text-sm text-gray-600 mt-2">Toernooi instellingen</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

