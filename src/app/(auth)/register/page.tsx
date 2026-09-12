'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  validatePhone,
  formatPhone,
  normalizePhone,
  parsePhoneNumber,
  validateEmail,
  validatePassword,
  validateFullName,
  SUPPORTED_COUNTRIES,
} from '@/lib/validation';
import CountryCodeDropdown from '@/components/CountryCodeDropdown';
import { ConsentCheckbox } from '@/components/forms/ConsentCheckbox';
import { MINIMUM_AGE } from '@/lib/constants/business';
import { LEGAL_VERSIONS } from '@/lib/constants/legalVersions';
import {
  Loader2,
  User,
  Scissors,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Phone,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import {
  getAllCountries,
  getStatesOfCountry,
  type Country,
  type State,
} from '@/lib/locationApi';

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  country?: string;
  state?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const supabase = createClient();

  const searchParams = useSearchParams();
  const invitedEmail = searchParams.get('email') || '';
  const invitedRole = searchParams.get('role');
  const isInvited = searchParams.get('invited') === 'true';

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    invitedRole === 'master' ? 'master' : 'client'
  );
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('IE');
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingSms, setMarketingSms] = useState(false);
  const [consentAttempted, setConsentAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Location fields
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [selectedStateName, setSelectedStateName] = useState('');
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  // Load countries on mount
  useEffect(() => {
    let isMounted = true;
    getAllCountries().then((data) => {
      if (!isMounted) return;
      setCountries(data);
      setLoadingCountries(false);
    }).catch(() => {
      if (isMounted) setLoadingCountries(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = () => {
      setShowCountryDropdown(false);
      setShowStateDropdown(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Password strength meter (matches mobile)
  const strength = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';
  const strengthColor = strength <= 2 ? '#EF4444' : strength <= 3 ? '#F59E0B' : '#10B981';

  const validate = (): boolean => {
    const next: FieldErrors = {};

    const nameRes = validateFullName(fullName);
    if (!nameRes.valid) next.fullName = nameRes.error;

    // Phone is optional — only validate when provided (matches mobile)
    if (phone.trim()) {
      const phoneRes = validatePhone(phone, phoneCountryCode);
      if (!phoneRes.valid) next.phone = phoneRes.error;
    }

    if (!selectedCountry.trim()) next.country = 'Please select your country';
    if (states.length > 0 && !selectedStateName.trim()) next.state = 'Please select your state';

    const emailRes = validateEmail(email);
    if (!emailRes.valid) next.email = emailRes.error;

    const passwordRes = validatePassword(password);
    if (!passwordRes.valid) next.password = passwordRes.error;

    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    
    // Auto-detect country code from prefix if pasted/typed
    if (value.startsWith('+') || value.startsWith('00')) {
      const parsed = parsePhoneNumber(value);
      if (parsed.countryCode) {
        setPhoneCountryCode(parsed.countryCode);
        setPhone(parsed.localNumber);
      }
    }
    
    clearError('phone');
  };

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      const v = validatePhone(phone, phoneCountryCode);
      if (v.valid) setPhone(formatPhone(phone, phoneCountryCode));
    }
  };

  const clearError = (field: keyof FieldErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopError(null);

    setConsentAttempted(true);
    if (!validate()) return;
    if (!tosAccepted || !ageConfirmed) {
      setTopError(
        'Please confirm your age and accept the Terms of Service and Privacy Policy to continue.',
      );
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { error: signUpError } = await signUp(
      normalizedEmail,
      password,
      fullName.trim(),
      selectedRole,
      tosAccepted,
      LEGAL_VERSIONS.tos
    );

    if (signUpError) {
      setLoading(false);
      let msg = signUpError.message || 'An error occurred during registration.';
      if (msg.includes('Database error')) {
        msg = 'Database error creating account. Please try again or contact support.';
      } else if (msg.includes('already registered') || msg.includes('already exists')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.toLowerCase().includes('password')) {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setTopError(msg);
      return;
    }

    // Save location to profile (the signUp function creates the profile row)
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      let normalizedPhone = null;
      if (phone.trim()) {
        normalizedPhone = normalizePhone(phone, phoneCountryCode);
      }
      const consentTimestamp = new Date().toISOString();

      await supabase
        .from('profiles')
        .update({
          country: selectedCountry,
          country_code: selectedCountryCode,
          state: selectedStateName || null,
          state_code: selectedStateCode || null,
          phone: normalizedPhone,
        })
        .eq('id', newUser.id);

      // Written separately from the location update above so that a database
      // that has not yet had 20260911100000_consent_and_marketing_columns.sql
      // applied fails only this write, rather than silently dropping the
      // user's country and phone number along with it.
      await supabase
        .from('profiles')
        .update({
          age_confirmed: ageConfirmed,
          age_confirmed_at: consentTimestamp,
          privacy_version: LEGAL_VERSIONS.privacy,
          marketing_email_consent: marketingEmail,
          marketing_sms_consent: marketingSms,
          marketing_consent_updated_at: consentTimestamp,
        })
        .eq('id', newUser.id);

      // Append-only evidence that consent was given, per GDPR art. 7(1).
      // Failure here must not block sign-up, so the result is not awaited into
      // the error path — the profile columns above are the primary record.
      await supabase.from('consent_events').insert([
        { user_id: newUser.id, consent_type: 'tos', granted: tosAccepted, document_version: LEGAL_VERSIONS.tos, source: 'web:register' },
        { user_id: newUser.id, consent_type: 'privacy', granted: true, document_version: LEGAL_VERSIONS.privacy, source: 'web:register' },
        { user_id: newUser.id, consent_type: 'marketing_email', granted: marketingEmail, document_version: LEGAL_VERSIONS.privacy, source: 'web:register' },
        { user_id: newUser.id, consent_type: 'marketing_sms', granted: marketingSms, document_version: LEGAL_VERSIONS.privacy, source: 'web:register' },
      ]);
    }

    // Mirror mobile: explicitly resend the signup OTP to ensure delivery
    await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    });

    setLoading(false);
    router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}`);
  };

  // ─── Styles ─────────────────────────────────────────────
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(0,0,0,0.45)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    paddingLeft: '4px',
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  };

  const fieldErrorStyle: React.CSSProperties = {
    color: '#DC2626',
    fontSize: '12px',
    marginTop: '6px',
    paddingLeft: '4px',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1
          className="font-[family-name:var(--font-playfair)]"
          style={{
            fontSize: '44px',
            fontStyle: 'italic',
            color: 'var(--color-primary)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Merakí
        </h1>
        <p
          style={{
            marginTop: '6px',
            fontSize: '10px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'var(--color-brand-pink-dark)',
            fontWeight: 600,
            opacity: 0.75,
          }}
        >
          Create Your Account
        </p>
        <p style={{ marginTop: '10px', fontSize: '14px', color: 'rgba(0,0,0,0.45)' }}>
          Join the Merakí community
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleRegister}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}
      >
        {isInvited && (
          <div
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#7C3AED',
              fontSize: '14px',
              padding: '14px 16px',
              borderRadius: 'var(--radius-lg)',
              lineHeight: '1.5',
            }}
            className="animate-fade-in"
          >
            <strong>You&apos;ve been invited!</strong> Create your account to get started as a Merakí professional.
          </div>
        )}

        {topError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
            }}
            className="animate-fade-in"
          >
            {topError}
          </div>
        )}

        {/* Role Selection */}
        <div style={{ width: '100%' }}>
          <span id="reg-role-label" style={labelStyle}>I am a...</span>
          <div role="group" aria-labelledby="reg-role-label" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Client */}
            <button
              type="button"
              onClick={() => { if (!isInvited) setSelectedRole('client'); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '18px',
                borderRadius: 'var(--radius-xl)',
                border: `2px solid ${
                  selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.06)'
                }`,
                background:
                  selectedRole === 'client' ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background:
                    selectedRole === 'client' ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User
                  size={22}
                  style={{
                    color: selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: selectedRole === 'client' ? 700 : 600,
                  color: selectedRole === 'client' ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Client
              </span>
            </button>
            {/* Professional */}
            <button
              type="button"
              onClick={() => { if (!isInvited) setSelectedRole('master'); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '18px',
                borderRadius: 'var(--radius-xl)',
                border: `2px solid ${
                  selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.06)'
                }`,
                background:
                  selectedRole === 'master' ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background:
                    selectedRole === 'master' ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Scissors
                  size={22}
                  style={{
                    color: selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: selectedRole === 'master' ? 700 : 600,
                  color: selectedRole === 'master' ? 'var(--color-primary)' : 'rgba(0,0,0,0.5)',
                }}
              >
                Professional
              </span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div style={{ width: '100%' }}>
          <label htmlFor="reg-full-name" style={labelStyle}>Full Name</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <User size={18} style={iconStyle} />
            <input
              type="text"
              value={fullName}
              id="reg-full-name"
              aria-invalid={errors.fullName ? true : undefined}
              aria-describedby={errors.fullName ? "reg-full-name-error" : undefined}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError('fullName');
              }}
              placeholder="Julianne Moore"
              autoComplete="name"
              autoCapitalize="words"
              className="input-glass"
              style={{
                paddingLeft: '44px',
                width: '100%',
                boxSizing: 'border-box',
                borderColor: errors.fullName ? '#FCA5A5' : undefined,
              }}
            />
          </div>
          {errors.fullName && <p id="reg-full-name-error" style={fieldErrorStyle}>{errors.fullName}</p>}
        </div>

        {/* Phone */}
        <div style={{ width: '100%' }}>
          <label htmlFor="reg-phone" style={labelStyle}>Phone Number</label>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <CountryCodeDropdown
              selectedCountryCode={phoneCountryCode}
              onSelectCountryCode={setPhoneCountryCode}
            />
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Phone size={18} style={iconStyle} />
              <input
                type="tel"
                value={phone}
                id="reg-phone"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? "reg-phone-error" : undefined}
                onChange={handlePhoneChange}
                onBlur={handlePhoneBlur}
                placeholder={SUPPORTED_COUNTRIES.find(c => c.code === phoneCountryCode)?.placeholder || "Enter phone"}
                autoComplete="tel"
                className="input-glass"
                style={{
                  paddingLeft: '44px',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderColor: errors.phone ? '#FCA5A5' : undefined,
                }}
              />
            </div>
          </div>
          {errors.phone && <p id="reg-phone-error" style={fieldErrorStyle}>{errors.phone}</p>}
        </div>

        {/* Country */}
        <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
          <label htmlFor="reg-country" style={labelStyle}>Country</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <MapPin size={18} style={iconStyle} />
            <input
              type="text"
              value={countrySearch || selectedCountry}
              id="reg-country"
              role="combobox"
              aria-expanded={showCountryDropdown}
              aria-controls="reg-country-listbox"
              aria-autocomplete="list"
              autoComplete="off"
              aria-invalid={errors.country ? true : undefined}
              aria-describedby={errors.country ? "reg-country-error" : undefined}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setShowCountryDropdown(true);
                clearError('country');
              }}
              onFocus={() => setShowCountryDropdown(true)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowCountryDropdown(false); }}
              placeholder={loadingCountries ? 'Loading...' : 'Select your country'}
              className="input-glass"
              style={{
                paddingLeft: '44px',
                width: '100%',
                boxSizing: 'border-box',
                borderColor: errors.country ? '#FCA5A5' : undefined,
              }}
            />
            {showCountryDropdown && (
              <div
                id="reg-country-listbox"
                role="listbox"
                aria-label="Countries"
                style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '180px',
                overflow: 'auto',
                background: 'white',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                marginTop: '4px',
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                color: '#1A1A1A',
              }}>
                {countries
                  .filter(c => !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                  .slice(0, 30)
                  .map(c => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={selectedCountry === c.name}
                      onClick={() => {
                        setSelectedCountry(c.name);
                        setSelectedCountryCode(c.iso2);
                        setCountrySearch('');
                        setShowCountryDropdown(false);
                        setSelectedStateName('');
                        setSelectedStateCode('');
                        setStateSearch('');
                        clearError('country');
                        setLoadingStates(true);
                        getStatesOfCountry(c.iso2).then(data => {
                          setStates(data);
                          setLoadingStates(false);
                        }).catch(() => setLoadingStates(false));
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        background: selectedCountry === c.name ? 'rgba(139,92,246,0.06)' : 'transparent',
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {errors.country && <p id="reg-country-error" style={fieldErrorStyle}>{errors.country}</p>}
        </div>

        {/* State / Region */}
        {states.length > 0 && (
          <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <label htmlFor="reg-state" style={labelStyle}>State / Region</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <MapPin size={18} style={iconStyle} />
              <input
                type="text"
                value={stateSearch || selectedStateName}
                id="reg-state"
                role="combobox"
                aria-expanded={showStateDropdown}
                aria-controls="reg-state-listbox"
                aria-autocomplete="list"
                autoComplete="off"
                aria-invalid={errors.state ? true : undefined}
                aria-describedby={errors.state ? "reg-state-error" : undefined}
                onChange={(e) => {
                  setStateSearch(e.target.value);
                  setShowStateDropdown(true);
                  clearError('state');
                }}
                onFocus={() => setShowStateDropdown(true)}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowStateDropdown(false); }}
                placeholder={loadingStates ? 'Loading...' : 'Select your state'}
                className="input-glass"
                style={{
                  paddingLeft: '44px',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderColor: errors.state ? '#FCA5A5' : undefined,
                }}
              />
              {showStateDropdown && (
                <div
                  id="reg-state-listbox"
                  role="listbox"
                  aria-label="States and regions"
                  style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '180px',
                  overflow: 'auto',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  marginTop: '4px',
                  zIndex: 50,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: '#1A1A1A',
                }}>
                  {states
                    .filter(s => !stateSearch || s.name.toLowerCase().includes(stateSearch.toLowerCase()))
                    .slice(0, 30)
                    .map(s => (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={selectedStateName === s.name}
                        onClick={() => {
                          setSelectedStateName(s.name);
                          setSelectedStateCode(s.iso2);
                          setStateSearch('');
                          setShowStateDropdown(false);
                          clearError('state');
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          border: 'none',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          borderBottom: '1px solid rgba(0,0,0,0.04)',
                          background: selectedStateName === s.name ? 'rgba(139,92,246,0.06)' : 'transparent',
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
            {errors.state && <p id="reg-state-error" style={fieldErrorStyle}>{errors.state}</p>}
          </div>
        )}

        {/* Email */}
        <div style={{ width: '100%' }}>
          <label htmlFor="reg-email" style={labelStyle}>Email Address</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Mail size={18} style={iconStyle} />
            <input
              type="email"
              value={email}
              id="reg-email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              onChange={(e) => {
                if (!isInvited) {
                  setEmail(e.target.value);
                  clearError('email');
                }
              }}
              readOnly={isInvited}
              placeholder="name@example.com"
              autoComplete="email"
              className="input-glass"
              style={{
                paddingLeft: '44px',
                width: '100%',
                boxSizing: 'border-box',
                borderColor: errors.email ? '#FCA5A5' : undefined,
                ...(isInvited ? { opacity: 0.7, cursor: 'default' } : {}),
              }}
            />
          </div>
          {errors.email && <p id="reg-email-error" style={fieldErrorStyle}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ width: '100%' }}>
          <label htmlFor="reg-password" style={labelStyle}>Password</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Lock size={18} style={iconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              id="reg-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={errors.password ? "reg-password-error" : undefined}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError('password');
              }}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className="input-glass"
              style={{
                paddingLeft: '44px',
                paddingRight: '48px',
                width: '100%',
                boxSizing: 'border-box',
                borderColor: errors.password ? '#FCA5A5' : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(0,0,0,0.35)',
                padding: 0,
                display: 'flex',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {errors.password && <p id="reg-password-error" style={fieldErrorStyle}>{errors.password}</p>}

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '10px',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '4px',
                      flex: 1,
                      borderRadius: '2px',
                      background: i <= strength ? strengthColor : 'rgba(0,0,0,0.08)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: strengthColor,
                  textTransform: 'uppercase',
                  minWidth: '50px',
                  textAlign: 'right',
                }}
              >
                {strengthLabel}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ width: '100%' }}>
          <label htmlFor="reg-confirm-password" style={labelStyle}>Confirm Password</label>
          <div style={{ position: 'relative', width: '100%' }}>
            <ShieldCheck size={18} style={iconStyle} />
            <input
              type="password"
              value={confirmPassword}
              id="reg-confirm-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              aria-describedby={errors.confirmPassword ? "reg-confirm-password-error" : undefined}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError('confirmPassword');
              }}
              placeholder="••••••••"
              autoComplete="new-password"
              className="input-glass"
              style={{
                paddingLeft: '44px',
                width: '100%',
                boxSizing: 'border-box',
                borderColor: errors.confirmPassword ? '#FCA5A5' : undefined,
              }}
            />
          </div>
          {errors.confirmPassword && <p id="reg-confirm-password-error" style={fieldErrorStyle}>{errors.confirmPassword}</p>}
        </div>

        {/*
          Consent block. Three separate decisions, none pre-ticked:
          - age and the Terms/Privacy are required to create an account;
          - marketing is optional and is never bundled with the Terms, because
            consent bundled with a service condition is not freely given
            (GDPR art. 7(4)).
        */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <legend className="sr-only">Consent and confirmations</legend>

          <ConsentCheckbox
            id="consent-age"
            checked={ageConfirmed}
            onChange={setAgeConfirmed}
            required
            error={consentAttempted && !ageConfirmed ? `You must be at least ${MINIMUM_AGE} to create an account.` : undefined}
          >
            I am {MINIMUM_AGE} years of age or older
          </ConsentCheckbox>

          <ConsentCheckbox
            id="consent-tos"
            checked={tosAccepted}
            onChange={setTosAccepted}
            required
            error={consentAttempted && !tosAccepted ? 'Please accept the Terms of Service and Privacy Policy.' : undefined}
          >
            I agree to the{' '}
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-[3px]"
              style={{ color: 'var(--color-text-accent)' }}
            >
              Terms of Service
            </Link>{' '}
            and have read the{' '}
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-[3px]"
              style={{ color: 'var(--color-text-accent)' }}
            >
              Privacy Policy
            </Link>
          </ConsentCheckbox>

          <ConsentCheckbox
            id="consent-marketing-email"
            checked={marketingEmail}
            onChange={setMarketingEmail}
          >
            Email me offers, new classes and Merakí news (optional — you can unsubscribe at any time)
          </ConsentCheckbox>

          <ConsentCheckbox
            id="consent-marketing-sms"
            checked={marketingSms}
            onChange={setMarketingSms}
          >
            Text me offers and reminders (optional)
          </ConsentCheckbox>
        </fieldset>

        {/*
          Short-form privacy notice at the point of collection — GDPR arts. 13
          and 12(1) require this information to be given when the data is
          collected, not only buried in a policy page.
        */}
        <p style={{ fontSize: '12px', lineHeight: '18px', color: 'rgba(0,0,0,0.55)' }}>
          We use your name, email and phone number to run your account, confirm bookings and take
          payment. Booking and payment records are kept for 6 years because Irish tax law requires
          it; everything else is deleted within 30 days of you closing your account. We do not use
          advertising or analytics trackers, and we never sell your data. You can download or delete
          your data at any time from Settings.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '8px',
          }}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
        </button>

        {/* Sign in link */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            color: 'rgba(0,0,0,0.45)',
            marginTop: '4px',
          }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
