import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../services/api.js';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { ButtonSpinner } from '../components/common/Spinner.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    organization: user?.organization || '',
    website: user?.website || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Account Settings</h2>
        <p className="text-muted mt-1">Manage your profile and security preferences</p>
      </div>

      <div className="card">
        <div className="p-5 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">{user?.name}</h3>
              <p className="text-sm text-muted">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge text-xs ${user?.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'}`}>
                  {user?.role}
                </span>
                <span className="text-xs text-muted">{user?.totalScans || 0} scans</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b border-surface-200 dark:border-surface-700">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-muted hover:text-surface-700 dark:hover:text-surface-300'
              }`}
              onClick={() => setTab(id)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Organization</label>
                  <input
                    type="text"
                    className="input"
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm(f => ({ ...f, organization: e.target.value }))}
                    placeholder="Your company or project"
                  />
                </div>
              </div>
              <div>
                <label className="label">Website</label>
                <input
                  type="url"
                  className="input"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm(f => ({ ...f, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div>
                <label className="label">Bio</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <ButtonSpinner /> : null}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <ButtonSpinner /> : null}
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary-600" />
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">Account Statistics</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Scans', value: user?.totalScans || 0 },
            { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—' },
            { label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-50 dark:bg-surface-700/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-surface-900 dark:text-surface-100">{value}</div>
              <div className="text-xs text-muted mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
