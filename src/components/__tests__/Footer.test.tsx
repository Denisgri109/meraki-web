import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

jest.mock('@/contexts/EditContext', () => ({
  useEditMode: () => ({
    isEditMode: false,
    getContent: (_key: string, fallback: string) => fallback,
    updateContent: jest.fn(),
  }),
}));

jest.mock('@/components/editable/EditableText', () => ({
  EditableText: ({ fallback, as: Tag = 'p' }: any) => {
    const Component = Tag;
    return <Component>{fallback}</Component>;
  },
}));

describe('Footer', () => {
  it('renders branding text', () => {
    render(<Footer />);
    expect(screen.getByText('Merakí')).toBeInTheDocument();
    expect(screen.getByText('Beauty with soul')).toBeInTheDocument();
  });

  it('renders section headers', () => {
    render(<Footer />);
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });

  it('renders platform links correctly', () => {
    render(<Footer />);

    const bookServicesLink = screen.getByRole('link', { name: /book services/i });
    expect(bookServicesLink).toHaveAttribute('href', '/beauty/booking');

    const shopProductsLink = screen.getByRole('link', { name: /shop products/i });
    expect(shopProductsLink).toHaveAttribute('href', '/beauty/shop');

    const academyCoursesLink = screen.getByRole('link', { name: /academy courses/i });
    expect(academyCoursesLink).toHaveAttribute('href', '/beauty/academy');
  });

  it('renders company links correctly', () => {
    render(<Footer />);

    const aboutUsLink = screen.getByRole('link', { name: /about us/i });
    expect(aboutUsLink).toHaveAttribute('href', '/about');

    const contactLink = screen.getByRole('link', { name: /contact/i });
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('renders legal links correctly', () => {
    render(<Footer />);

    const privacyPolicyLink = screen.getByRole('link', { name: /privacy policy/i });
    expect(privacyPolicyLink).toHaveAttribute('href', '/privacy-policy');

    const termsOfServiceLink = screen.getByRole('link', { name: /terms of service/i });
    expect(termsOfServiceLink).toHaveAttribute('href', '/terms-of-service');
  });

  it('renders copyright text with the current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toContain(`© ${currentYear}`);
    expect(footer.textContent).toContain('All rights reserved');
  });
});
