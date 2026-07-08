import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditableImage } from '../EditableImage';
import { useEditMode } from '@/contexts/EditContext';

// Mock the context hook
jest.mock('@/contexts/EditContext', () => ({
  useEditMode: jest.fn(),
}));

// Mock the ImageUrlUpload component
jest.mock('@/components/ImageUrlUpload', () => ({
  ImageUrlUpload: ({ onUpload, label }: any) => (
    <div data-testid="image-url-upload">
      <span>{label}</span>
      <button onClick={() => onUpload('https://example.com/new-image.jpg')}>
        Mock Upload
      </button>
    </div>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ImagePlus: () => <div data-testid="icon-image-plus" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
}));

describe('EditableImage', () => {
  const mockGetContent = jest.fn();
  const mockUpdateContent = jest.fn();

  const defaultProps = {
    contentKey: 'test-image-key',
    fallback: 'https://example.com/fallback.jpg',
    alt: 'Test Image',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: false,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    mockGetContent.mockImplementation((key, fallback) => {
      if (key === defaultProps.contentKey) {
        return fallback; // default to fallback if no content
      }
      return fallback;
    });
  });

  it('renders correctly in view mode', () => {
    mockGetContent.mockReturnValue('https://example.com/saved-image.jpg');

    render(<EditableImage {...defaultProps} />);

    const img = screen.getByAltText('Test Image') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/saved-image.jpg');

    // Edit controls should not be visible
    expect(screen.queryByText('Replace')).not.toBeInTheDocument();
  });

  it('renders correctly in edit mode', () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });
    mockGetContent.mockReturnValue('https://example.com/saved-image.jpg');

    render(<EditableImage {...defaultProps} />);

    // Edit controls should be visible
    expect(screen.getByText('Replace')).toBeInTheDocument();

    // Reset button should be visible because src !== fallback
    expect(screen.getByTitle('Reset to default')).toBeInTheDocument();
  });

  it('does not show reset button when src is same as fallback', () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });
    // mockGetContent returns fallback by default from beforeEach
    mockGetContent.mockReturnValue(defaultProps.fallback);

    render(<EditableImage {...defaultProps} />);

    // Reset button should NOT be visible
    expect(screen.queryByTitle('Reset to default')).not.toBeInTheDocument();
  });

  it('opens and closes the upload interface', () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableImage {...defaultProps} />);

    // Click Replace
    fireEvent.click(screen.getByText('Replace'));

    // Upload interface should be visible
    expect(screen.getByTestId('image-url-upload')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Upload interface should be gone
    expect(screen.queryByTestId('image-url-upload')).not.toBeInTheDocument();
  });

  it('calls updateContent and closes upload when a new image is uploaded', async () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });
    mockUpdateContent.mockResolvedValue({});

    render(<EditableImage {...defaultProps} />);

    // Open upload
    fireEvent.click(screen.getByText('Replace'));

    // Trigger upload
    fireEvent.click(screen.getByText('Mock Upload'));

    // Verify updateContent was called with the new URL
    expect(mockUpdateContent).toHaveBeenCalledWith(
      defaultProps.contentKey,
      'https://example.com/new-image.jpg'
    );

    // Upload interface should be closed automatically
    // The handleUpload method uses async/await so we must wait for it to settle
    await waitFor(() => {
      expect(screen.queryByTestId('image-url-upload')).not.toBeInTheDocument();
    });
  });

  it('calls updateContent with fallback when reset is clicked', () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });
    mockUpdateContent.mockResolvedValue({});
    mockGetContent.mockReturnValue('https://example.com/saved-image.jpg');

    render(<EditableImage {...defaultProps} />);

    // Click Reset
    fireEvent.click(screen.getByTitle('Reset to default'));

    // Verify updateContent was called with the fallback URL
    expect(mockUpdateContent).toHaveBeenCalledWith(
      defaultProps.contentKey,
      defaultProps.fallback
    );
  });

  it('falls back to fallback URL on image load error', () => {
    mockGetContent.mockReturnValue('https://example.com/invalid-image.jpg');

    render(<EditableImage {...defaultProps} />);

    const img = screen.getByAltText('Test Image') as HTMLImageElement;
    expect(img.src).toBe('https://example.com/invalid-image.jpg');

    // Trigger error event
    fireEvent.error(img);

    // Image source should be updated to fallback
    expect(img.src).toBe(defaultProps.fallback);
  });
});
