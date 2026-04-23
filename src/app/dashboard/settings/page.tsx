'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';
import { Settings, User, Shield, Save, Loader2, Camera, CreditCard, Mail } from 'lucide-react';

const navItems = [
  { label: 'Profile', value: 'profile', icon: User },
  { label: 'Security', value: 'security', icon: Shield },
  { label: 'Billing', value: 'billing', icon: CreditCard },
];

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const supabase = createClient();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [sendingReset, setSendingReset] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ full_name: fullName, phone, bio, city });
    showToast('Profile saved successfully!', 'success');
    setSaving(false);
  };

  const handleAvatarUpload = () => {
    showToast('Avatar upload coming soon', 'info');
  };

  const handleSendResetEmail = async () => {
    setSendingReset(true);
    try {
      const email = profile?.email;
      if (!email) { showToast('No email found', 'error'); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset email', 'error');
    } finally {
      setSendingReset(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      showToast('Verification emails sent to both your old and new addresses.', 'success');
      setNewEmail('');
    } catch (err: any) {
      showToast(err.message || 'Failed to update email', 'error');
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { return_url: window.location.href }
      });
      console.log('Billing portal response:', { data, error });

      const errorMessage = error?.message || data?.error || (typeof data === 'string' ? data : null);
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.error('Edge Function Error:', err);
      showToast(err.message || 'Failed to open billing portal', 'error');
      setOpeningPortal(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      showToast('Account deletion requires contacting support', 'info');
    }
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
                  <button
                    onClick={handleAvatarUpload}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform"
                    title="Change avatar"
                  >
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
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">To change your email, go to the Security tab.</p>
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
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-glass resize-none" placeholder="Tell us about yourself..." />
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-3 text-sm cursor-pointer">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                  <h3 className="font-medium text-sm text-[var(--color-text-primary)] mb-1">Change Email Address</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">You will need to verify both your old and new email.</p>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] border-0" />
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                        className="input-glass w-full"
                        style={{ paddingLeft: '38px', paddingRight: '12px' }}
                      />
                    </div>
                    <button
                      onClick={handleChangeEmail}
                      disabled={updatingEmail || !newEmail}
                      className="btn-primary text-sm px-4 py-2.5 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-0"
                    >
                      {updatingEmail ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : 'Update Email'}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)]">
                  <h3 className="font-medium text-sm text-[var(--color-text-primary)] mb-1">Change Password</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">Update your password securely via email reset link</p>
                  <button
                    onClick={handleSendResetEmail}
                    disabled={sendingReset}
                    className="btn-outline mt-3 text-sm px-5 py-2.5 cursor-pointer flex items-center gap-2 border-slate-300"
                  >
                    {sendingReset ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : 'Send Password Reset Email'}
                  </button>
                </div>

                <div className="p-4 rounded-[var(--radius-lg)] bg-red-50 mt-8 border border-red-100">
                  <h3 className="font-medium text-sm text-red-600 mb-1">Danger Zone</h3>
                  <p className="text-xs text-red-500 mb-3">Permanently delete your account and all associated data</p>
                  <button
                    onClick={handleDeleteAccount}
                    className="text-xs px-4 py-2 rounded-[var(--radius-md)] border border-red-300 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer bg-white"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Billing & Payments</h2>
              <div className="space-y-4">
                <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface-light)] border border-[var(--color-border-light)] flex flex-col gap-3 justify-center items-center text-center py-10">
                  <CreditCard size={32} className="text-[var(--color-text-muted)] mb-2" />
                  <h3 className="font-semibold text-[var(--color-text-primary)]">Manage Payment Methods</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">Securely manage your saved cards via Stripe to speed up future bookings.</p>
                  <button
                    onClick={handleOpenBillingPortal}
                    disabled={openingPortal}
                    className="btn-outline mt-2 px-6 py-2 border-slate-300 flex items-center gap-2 cursor-pointer"
                  >
                    {openingPortal ? <><Loader2 size={16} className="animate-spin" /> Transferring to Stripe...</> : 'Open Billing Portal'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
