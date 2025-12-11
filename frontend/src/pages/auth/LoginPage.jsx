import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-base-100 p-6 rounded-box shadow">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      {error && <div className="alert alert-error mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="input input-bordered w-full" placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input input-bordered w-full" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className={`btn btn-primary w-full ${loading ? 'loading' : ''}`} type="submit">Login</button>
      </form>
      <p className="mt-3 text-sm">Don't have an account? <Link className="link" to="/register">Register</Link></p>
    </div>
  );
}
