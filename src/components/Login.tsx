import React, { useState } from 'react';
import { loginXtream, XtreamCredentials } from '../api';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: (creds: XtreamCredentials, data: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let formattedHost = host.trim();
    if (!formattedHost.startsWith('http://') && !formattedHost.startsWith('https://')) {
      formattedHost = 'http://' + formattedHost;
    }
    if (formattedHost.endsWith('/')) {
      formattedHost = formattedHost.slice(0, -1);
    }

    const creds = { host: formattedHost, username, password };

    try {
      const data = await loginXtream(creds);
      onLogin(creds, data);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-red/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm relative z-10">
        <div className="flex justify-center">
          <Logo className="w-24 h-24" />
        </div>
        <h2 className="mt-4 text-center text-3xl font-black text-white tracking-tighter neon-text uppercase">
          Live TV Play
        </h2>
        <p className="mt-1 text-center text-[10px] text-zinc-400 font-medium tracking-widest uppercase opacity-60">
          Acesse seu entretenimento agora
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm relative z-10">
        <div className="glass-panel py-6 px-4 shadow-2xl sm:rounded-xl sm:px-8 neon-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="host" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                URL do Servidor
              </label>
              <input
                id="host"
                name="host"
                type="text"
                required
                placeholder="http://exemplo.com:8080"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-white/5 rounded-xl shadow-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-red/50 focus:border-neon-red/50 sm:text-sm bg-black/40 text-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-white/5 rounded-xl shadow-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-red/50 focus:border-neon-red/50 sm:text-sm bg-black/40 text-white transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-white/5 rounded-xl shadow-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-neon-red/50 focus:border-neon-red/50 sm:text-sm bg-black/40 text-white transition-all"
              />
            </div>

            {error && (
              <div className="text-neon-red text-xs font-bold text-center bg-neon-red/10 p-3 rounded-xl border border-neon-red/20 animate-shake">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-white bg-neon-red hover:bg-neon-red/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neon-red disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest active:scale-95"
              >
                {loading ? 'Conectando...' : 'Entrar na Experiência'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
