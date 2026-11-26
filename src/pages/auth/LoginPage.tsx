import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Triangle } from 'lucide-react';
import { Card, CardTitle, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Triangle className="h-10 w-10 text-vertice-600 mx-auto mb-2" fill="currentColor" />
          <h1 className="text-2xl font-bold text-gray-900">Vértice</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de administración</p>
        </div>

        <Card>
          <CardTitle>Iniciar sesión</CardTitle>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Entrar
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
