'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, User, Bell, Shield, Palette, Globe, Save, Loader2, Camera } from 'lucide-react';

const navItems = [
  { label: 'Profile', value: 'profile', icon: User },
  { label: 'Notifications', value: 'notifications', icon: Bell },
  { label: 'Privacy', value: 'privacy', icon: Shield },
  { label: 'Appearance', value: 'appearance', icon: Palette },
  { label: 'Language', value: 'language', icon: Globe },
];

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName, phone, bio, city });
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={22} className="text-[var(--color-text-muted)]" />
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)]">Settings</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">Manage your preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveSection(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all cursor-pointer ${
                    activeSection === item.value
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-light)]'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'profile' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Profile Settings</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-brand-pink)] to-[var(--color-secondary)] flex items-center justify-center text-white font-bold text-2xl">
                    {fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md cursor-pointer">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{fullName || 'Your Name'}</p>
                  <p className="text-sm text-[var(--color-text-muted)] capitalize">{profile?.role || 'client'} account</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label-upper">Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-glass" />
                </div>
                <div>
                  <label className="label-upper">Email</label>
                  <input type="email" value={profile?.email || ''} disabled className="input-glass opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="label-upper">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-glass" placeholder="+44..." />
                </div>
                <div>
                  <label className="label-upper">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="input-glass" placeholder="London" />
                </div>
                <div>
                  <label className="label-upper">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="input-glass resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {['Email notifications', 'Booking reminders', 'Promotional updates', 'New message alerts', 'Loyalty rewards'].map((item) => (
                  <label key={item} className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] hover:bg-[var(--color-surface-light)] transition-colors cursor-pointer">
                    <span className="text-sm text-[var(--color-text-primary)]">{item}</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--color-primary)]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Privacy & Security</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                  <h3 className="font-medium text-sm text-[var(--color-text-primary)] mb-1">Change Password</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Update your password via email reset</p>
                  <button className="btn-outline mt-3 text-xs px-4 py-2">Send Reset Email</button>
                </div>
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                  <h3 className="font-medium text-sm text-[var(--color-text-primary)] mb-1">Profile Visibility</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Control who can see your profile</p>
                </div>
                <div className="p-4 rounded-[var(--radius-lg)] bg-red-50">
                  <h3 className="font-medium text-sm text-red-600 mb-1">Delete Account</h3>
                  <p className="text-xs text-red-400">This action is permanent and cannot be undone</p>
                  <button className="mt-3 text-xs px-4 py-2 rounded-full border border-red-300 text-red-600 font-medium hover:bg-red-100 transition-colors cursor-pointer">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Appearance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Theme</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Currently using light mode</p>
                  </div>
                  <span className="text-xs bg-[var(--color-brand-pink-light)] text-[var(--color-brand-pink-dark)] font-medium px-3 py-1 rounded-full">Light</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'language' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Language & Region</h2>
              <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Language</p>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">Select your preferred language</p>
                <select className="input-glass">
                  <option value="en">English (UK)</option>
                  <option value="gr">Greek</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
