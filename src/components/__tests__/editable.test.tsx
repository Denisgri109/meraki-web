import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditableText } from '@/components/editable/EditableText';
import { EditableImage } from '@/components/editable/EditableImage';
import { EditModeToggle } from '@/components/editable/EditModeToggle';

jest.mock('@/contexts/EditContext', () => ({
  useEditMode: jest.fn(),
}));

jest.mock('@/components/ImageUrlUpload', () => ({
  ImageUrlUpload: ({ onUpload }: { onUpload: (url: string) => void }) => (
    <div data-testid="url-upload">
      <button onClick={() => onUpload('https://cdn.test/new.png')}>Upload</button>
    </div>
  ),
}));

import { useEditMode } from '@/contexts/EditContext';

function mockEditContext(overrides: any = {}) {
  const defaults = {
    isEditMode: false,
    canEdit: true,
    toggleEditMode: jest.fn(),
    content: {},
    getContent: (_key: string, fallback: string) => fallback,
    updateContent: jest.fn(() => Promise.resolve({ error: null })),
    refreshContent: jest.fn(),
    resetContent: jest.fn(() => Promise.resolve({ error: null })),
  };
  (useEditMode as jest.Mock).mockReturnValue({ ...defaults, ...overrides });
}

// ─── EditModeToggle ────────────────────────────────────────────────────────

describe('EditModeToggle', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when canEdit is false', () => {
    mockEditContext({ canEdit: false });
    const { container } = render(<EditModeToggle />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Edit button when not in edit mode', () => {
    mockEditContext({ isEditMode: false });
    render(<EditModeToggle />);
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('renders Editing button when in edit mode', () => {
    mockEditContext({ isEditMode: true });
    render(<EditModeToggle />);
    expect(screen.getByText('Editing')).toBeInTheDocument();
  });

  it('calls toggleEditMode on click', () => {
    const toggle = jest.fn();
    mockEditContext({ toggleEditMode: toggle });
    render(<EditModeToggle />);
    fireEvent.click(screen.getByText('Edit'));
    expect(toggle).toHaveBeenCalled();
  });
});

// ─── EditableText ──────────────────────────────────────────────────────────

describe('EditableText', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders fallback text in non-edit mode', () => {
    mockEditContext({ isEditMode: false });
    render(<EditableText contentKey="hero.title" fallback="Hello World" as="p" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders as specified tag', () => {
    mockEditContext({ isEditMode: false });
    render(<EditableText contentKey="k" fallback="Title" as="h1" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
  });

  it('defaults to p tag', () => {
    mockEditContext({ isEditMode: false });
    const { container } = render(<EditableText contentKey="k" fallback="Text" />);
    expect(container.querySelector('p')).toBeInTheDocument();
  });

  it('shows pencil icon in edit mode', () => {
    mockEditContext({ isEditMode: true });
    const { container } = render(<EditableText contentKey="k" fallback="Text" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show pencil icon in non-edit mode', () => {
    mockEditContext({ isEditMode: false });
    const { container } = render(<EditableText contentKey="k" fallback="Text" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(0);
  });

  it('enters editing mode on click when in edit mode', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableText contentKey="k" fallback="Text" />);
    fireEvent.click(screen.getByText('Text'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('does not enter editing mode when not in edit mode', () => {
    mockEditContext({ isEditMode: false });
    render(<EditableText contentKey="k" fallback="Text" />);
    fireEvent.click(screen.getByText('Text'));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('save button calls updateContent', async () => {
    const updateContent = jest.fn(() => Promise.resolve({ error: null }));
    mockEditContext({ isEditMode: true, updateContent });
    const { container } = render(<EditableText contentKey="k" fallback="Text" />);
    fireEvent.click(screen.getByText('Text'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    const saveBtn = container.querySelector('button.bg-green-500') as HTMLElement;
    fireEvent.mouseDown(saveBtn);
    await waitFor(() => expect(updateContent).toHaveBeenCalledWith('k', 'New text'));
  });

  it('cancel button reverts to original value', () => {
    mockEditContext({ isEditMode: true });
    const { container } = render(<EditableText contentKey="k" fallback="Original" />);
    fireEvent.click(screen.getByText('Original'));
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Changed' } });
    const cancelBtn = container.querySelector('button.bg-red-500') as HTMLElement;
    fireEvent.mouseDown(cancelBtn);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  it('Escape key cancels editing', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableText contentKey="k" fallback="Original" />);
    fireEvent.click(screen.getByText('Original'));
    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Enter key saves in non-multiline mode', async () => {
    const updateContent = jest.fn(() => Promise.resolve({ error: null }));
    mockEditContext({ isEditMode: true, updateContent });
    render(<EditableText contentKey="k" fallback="Original" multiline={false} />);
    fireEvent.click(screen.getByText('Original'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    await waitFor(() => expect(updateContent).toHaveBeenCalled());
  });
});

// ─── EditableImage ─────────────────────────────────────────────────────────

describe('EditableImage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders img with fallback src in non-edit mode', () => {
    mockEditContext({ isEditMode: false });
    const { container } = render(
      <EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />,
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', 'https://test.com/img.jpg');
    expect(img).toHaveAttribute('alt', 'Test');
  });

  it('renders img with stored content when available', () => {
    mockEditContext({
      isEditMode: false,
      getContent: (_k: string, fb: string) => 'https://cdn.test/custom.jpg',
    });
    const { container } = render(
      <EditableImage contentKey="img" fallback="https://test.com/fb.jpg" alt="Test" />,
    );
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/custom.jpg');
  });

  it('does not show Replace button in non-edit mode', () => {
    mockEditContext({ isEditMode: false });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    expect(screen.queryByText('Replace')).not.toBeInTheDocument();
  });

  it('shows Replace button in edit mode', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    expect(screen.getByText('Replace')).toBeInTheDocument();
  });

  it('does not show Reset button when src equals fallback', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    expect(screen.queryByTitle('Reset to default')).not.toBeInTheDocument();
  });

  it('shows Reset button when src differs from fallback', () => {
    mockEditContext({
      isEditMode: true,
      getContent: (_k: string, fb: string) => 'https://cdn.test/custom.jpg',
    });
    render(<EditableImage contentKey="img" fallback="https://test.com/fb.jpg" alt="Test" />);
    expect(screen.getByTitle('Reset to default')).toBeInTheDocument();
  });

  it('Reset calls updateContent with fallback', async () => {
    const updateContent = jest.fn(() => Promise.resolve({ error: null }));
    mockEditContext({
      isEditMode: true,
      updateContent,
      getContent: (_k: string, fb: string) => 'https://cdn.test/custom.jpg',
    });
    render(<EditableImage contentKey="img" fallback="https://test.com/fb.jpg" alt="Test" />);
    fireEvent.click(screen.getByTitle('Reset to default'));
    await waitFor(() => expect(updateContent).toHaveBeenCalledWith('img', 'https://test.com/fb.jpg'));
  });

  it('Replace opens upload UI', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    fireEvent.click(screen.getByText('Replace'));
    expect(screen.getByTestId('url-upload')).toBeInTheDocument();
  });

  it('Upload calls updateContent and closes upload UI', async () => {
    const updateContent = jest.fn(() => Promise.resolve({ error: null }));
    mockEditContext({ isEditMode: true, updateContent });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    fireEvent.click(screen.getByText('Replace'));
    fireEvent.click(screen.getByText('Upload'));
    await waitFor(() => expect(updateContent).toHaveBeenCalledWith('img', 'https://cdn.test/new.png'));
    await waitFor(() => expect(screen.queryByTestId('url-upload')).not.toBeInTheDocument());
  });

  it('Cancel button closes upload UI', () => {
    mockEditContext({ isEditMode: true });
    render(<EditableImage contentKey="img" fallback="https://test.com/img.jpg" alt="Test" />);
    fireEvent.click(screen.getByText('Replace'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByTestId('url-upload')).not.toBeInTheDocument();
  });
});
