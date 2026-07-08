import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditableText } from '../EditableText';
import { useEditMode } from '@/contexts/EditContext';

// Mock the context
jest.mock('@/contexts/EditContext', () => ({
  useEditMode: jest.fn(),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Pencil: () => <span data-testid="pencil-icon" />,
  Check: () => <span data-testid="check-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

describe('EditableText', () => {
  const mockGetContent = jest.fn();
  const mockUpdateContent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: false,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });
    mockGetContent.mockImplementation((key, fallback) => {
      if (key === 'test.key') return 'Test Content';
      return fallback;
    });
  });

  it('renders content normally when not in edit mode', () => {
    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.queryByTestId('pencil-icon')).not.toBeInTheDocument();

    // Tag defaults to p
    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('P');
  });

  it('renders correctly with a different tag via `as` prop', () => {
    render(<EditableText contentKey="test.key" fallback="Fallback" as="h1" />);

    const element = screen.getByText('Test Content');
    expect(element.tagName).toBe('H1');
  });

  it('renders in edit mode, showing the pencil icon', () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByTestId('pencil-icon')).toBeInTheDocument();
    expect(screen.getByTitle('Click to edit')).toBeInTheDocument();
  });

  it('enters editing state when clicked in edit mode', async () => {
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    const container = screen.getByText('Test Content');
    fireEvent.click(container);

    // The textarea should appear with the content
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Test Content');
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByTestId('x-icon')).toBeInTheDocument();
  });

  it('does not enter editing state when clicked and not in edit mode', () => {
    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    const container = screen.getByText('Test Content');
    fireEvent.click(container);

    // The textarea should NOT appear
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('updates draft value when typing', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    expect(textarea).toHaveValue('New Content');
  });

  it('cancels editing on Escape', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Press escape
    fireEvent.keyDown(textarea, { key: 'Escape', code: 'Escape' });

    // Should revert back to standard text
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(mockUpdateContent).not.toHaveBeenCalled();
  });

  it('saves editing on Enter when not multiline', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockUpdateContent).toHaveBeenCalledWith('test.key', 'New Content');
    });

    // Should exit editing state eventually
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not save on Enter when multiline is true', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" multiline />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Press Enter
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });

    // Should still be in edit mode
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(mockUpdateContent).not.toHaveBeenCalled();

    // Textarea rows should be 3 for multiline
    expect(textarea.getAttribute('rows')).toBe('3');
  });

  it('saves when Check button is clicked', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Click check button
    // It's a span inside a button, so get the button that wraps check-icon
    const checkBtn = screen.getByTestId('check-icon').parentElement!;
    fireEvent.mouseDown(checkBtn);

    await waitFor(() => {
      expect(mockUpdateContent).toHaveBeenCalledWith('test.key', 'New Content');
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('cancels when X button is clicked', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Click X button
    const xBtn = screen.getByTestId('x-icon').parentElement!;
    fireEvent.mouseDown(xBtn);

    expect(mockUpdateContent).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('saves on blur', async () => {
    const user = userEvent.setup();
    (useEditMode as jest.Mock).mockReturnValue({
      isEditMode: true,
      getContent: mockGetContent,
      updateContent: mockUpdateContent,
    });

    render(<EditableText contentKey="test.key" fallback="Fallback" />);

    fireEvent.click(screen.getByText('Test Content'));

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'New Content');

    // Blur the textarea
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(mockUpdateContent).toHaveBeenCalledWith('test.key', 'New Content');
    });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
