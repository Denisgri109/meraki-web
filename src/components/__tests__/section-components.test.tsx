import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionPageWrapper } from '@/components/section-pages/SectionPageWrapper';
import { SectionLanding } from '@/components/SectionLanding';
import { BeautySection } from '@/components/BeautySection';
import { PilatesSection } from '@/components/PilatesSection';
import { SectionProvider } from '@/contexts/SectionContext';

jest.mock('@/components/editable/EditableText', () => ({
  EditableText: ({ fallback, as: Tag = 'p' }: any) => {
    const Component = Tag;
    return <Component>{fallback}</Component>;
  },
}));

jest.mock('@/components/editable/EditableImage', () => ({
  EditableImage: ({ fallback, alt }: any) => <img src={fallback} alt={alt} />,
}));

// ─── SectionPageWrapper ────────────────────────────────────────────────────

describe('SectionPageWrapper', () => {
  it('renders section banner with title for beauty', () => {
    render(
      <SectionProvider section="beauty">
        <SectionPageWrapper title="Shop">Content</SectionPageWrapper>
      </SectionProvider>,
    );
    expect(screen.getByText('Shop — Beauty Section')).toBeInTheDocument();
  });

  it('renders section banner with title for pilates', () => {
    render(
      <SectionProvider section="pilates">
        <SectionPageWrapper title="Schedule">Content</SectionPageWrapper>
      </SectionProvider>,
    );
    expect(screen.getByText('Schedule — Pilates Section')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <SectionProvider section="beauty">
        <SectionPageWrapper title="Test">
          <div data-testid="child">Child Content</div>
        </SectionPageWrapper>
      </SectionProvider>,
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });
});

// ─── SectionLanding ────────────────────────────────────────────────────────

describe('SectionLanding', () => {
  it('renders Merakí branding', () => {
    render(<SectionLanding onSelect={jest.fn()} />);
    expect(screen.getAllByText('Merakí').length).toBeGreaterThan(0);
  });

  it('renders Choose your experience heading', () => {
    render(<SectionLanding onSelect={jest.fn()} />);
    expect(screen.getByText('Choose your experience')).toBeInTheDocument();
  });

  it('renders Beauty Section card', () => {
    render(<SectionLanding onSelect={jest.fn()} />);
    expect(screen.getByText('Beauty Section')).toBeInTheDocument();
    expect(screen.getByText('Explore Beauty')).toBeInTheDocument();
  });

  it('renders Pilates Section card', () => {
    render(<SectionLanding onSelect={jest.fn()} />);
    expect(screen.getByText('Pilates Section')).toBeInTheDocument();
    expect(screen.getByText('Explore Pilates')).toBeInTheDocument();
  });

  it('calls onSelect with beauty when Beauty card clicked', () => {
    const onSelect = jest.fn();
    render(<SectionLanding onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Explore Beauty'));
    expect(onSelect).toHaveBeenCalledWith('beauty');
  });

  it('calls onSelect with pilates when Pilates card clicked', () => {
    const onSelect = jest.fn();
    render(<SectionLanding onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Explore Pilates'));
    expect(onSelect).toHaveBeenCalledWith('pilates');
  });
});

// ─── BeautySection ─────────────────────────────────────────────────────────

describe('BeautySection', () => {
  it('renders hero badge text', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('Beauty With Soul')).toBeInTheDocument();
  });

  it('renders hero title', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('Your Premium Beauty Destination')).toBeInTheDocument();
  });

  it('shows Get Started Free when not owner', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('Get Started Free')).toBeInTheDocument();
  });

  it('shows Go to Dashboard when owner', () => {
    render(<BeautySection isOwner={true} />);
    expect(screen.getAllByText('Go to Dashboard').length).toBeGreaterThan(0);
  });

  it('renders How It Works section', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Beauty Made Simple')).toBeInTheDocument();
  });

  it('renders Discover, Book, Glow steps', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Book')).toBeInTheDocument();
    expect(screen.getByText('Glow')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<BeautySection isOwner={false} />);
    expect(screen.getByText('One Platform, Endless Beauty')).toBeInTheDocument();
    expect(screen.getByText('Smart Booking')).toBeInTheDocument();
    expect(screen.getByText('Loyalty Rewards')).toBeInTheDocument();
  });
});

// ─── PilatesSection ────────────────────────────────────────────────────────

describe('PilatesSection', () => {
  it('renders hero badge text', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('Move With Purpose')).toBeInTheDocument();
  });

  it('renders hero title', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('Your Pilates Journey Starts Here')).toBeInTheDocument();
  });

  it('shows Book a Class when not owner', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('Book a Class')).toBeInTheDocument();
  });

  it('shows Go to Dashboard when owner', () => {
    render(<PilatesSection isOwner={true} />);
    expect(screen.getAllByText('Go to Dashboard').length).toBeGreaterThan(0);
  });

  it('renders How It Works section', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
    expect(screen.getByText('Pilates Made Simple')).toBeInTheDocument();
  });

  it('renders Explore, Book, Transform steps', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('Explore')).toBeInTheDocument();
    expect(screen.getByText('Transform')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<PilatesSection isOwner={false} />);
    expect(screen.getByText('One Studio, Every Level')).toBeInTheDocument();
    expect(screen.getByText('Class Booking')).toBeInTheDocument();
    expect(screen.getByText('Expert Instructors')).toBeInTheDocument();
  });
});
