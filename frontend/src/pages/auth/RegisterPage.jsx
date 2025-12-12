import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Calendar, UserCheck, ArrowRight, UserPlus } from 'lucide-react';
import useAuthStore from '../../store/auth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', age: 18, gender: 'other' });

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await register(form);
    if (ok) navigate('/');
  };

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-base-200">
      <div className="card w-full max-w-lg bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Create Account</h2>
            <p className="text-base-content/60 mt-2">Join our community today</p>
          </div>

          {error && (
            <div className="alert alert-error text-sm py-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label py-1"><span className="label-text">Full Name</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><User className="h-5 w-5" /></div>
                <input className="input input-bordered w-full pl-10 focus:input-primary" placeholder="John Doe" value={form.name} onChange={e => handleChange('name', e.target.value)} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text">Email Address</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><Mail className="h-5 w-5" /></div>
                <input type="email" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="john@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text">Password</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><Lock className="h-5 w-5" /></div>
                <input type="password" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="••••••••" value={form.password} onChange={e => handleChange('password', e.target.value)} required />
              </div>
            </div>

            <div className="form-control">
              <label className="label py-1"><span className="label-text">Phone Number</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><Phone className="h-5 w-5" /></div>
                <input className="input input-bordered w-full pl-10 focus:input-primary" placeholder="1234567890" value={form.phone} onChange={e => handleChange('phone', e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label py-1"><span className="label-text">Age</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><Calendar className="h-5 w-5" /></div>
                  <input type="number" className="input input-bordered w-full pl-10 focus:input-primary" placeholder="18+" min="18" value={form.age} onChange={e => handleChange('age', e.target.value)} required />
                </div>
              </div>
              <div className="form-control">
                <label className="label py-1"><span className="label-text">Gender</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"><UserCheck className="h-5 w-5" /></div>
                  <select className="select select-bordered w-full pl-10 focus:select-primary" value={form.gender} onChange={e => handleChange('gender', e.target.value)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <button className="btn btn-primary w-full gap-2 mt-6 group" type="submit" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </>
              )}
            </button>
          </form>

          <div className="divider text-sm text-base-content/60">Already have an account?</div>

          <div className="text-center">
            <Link to="/login" className="btn btn-outline btn-block">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
