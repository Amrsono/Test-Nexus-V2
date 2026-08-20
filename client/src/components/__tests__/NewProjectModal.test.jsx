import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NewProjectModal from '../NewProjectModal';

describe('NewProjectModal Component', () => {
  test('does not render when isOpen is false', () => {
    const { container } = render(<NewProjectModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders form elements and triggers onCreateProject when submitted', async () => {
    const handleCreate = jest.fn().mockResolvedValue({});
    const handleClose = jest.fn();

    render(
      <NewProjectModal
        isOpen={true}
        onClose={handleClose}
        onCreateProject={handleCreate}
      />
    );

    expect(screen.getByText('Create New Project / Workspace')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/e.g. Phoenix Release 2.0/i);
    fireEvent.change(nameInput, { target: { value: 'Sprint 2026 Alpha' } });

    const submitBtn = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(submitBtn);

    expect(handleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Sprint 2026 Alpha',
      })
    );
  });
});
