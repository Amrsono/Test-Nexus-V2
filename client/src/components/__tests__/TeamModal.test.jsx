import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamModal from '../TeamModal';

const mockTesters = [
  { id: 't-1', name: 'John Doe', email: 'john@example.com', dailyCapacity: 20 },
  { id: 't-2', name: 'Jane Smith', email: 'jane@example.com', dailyCapacity: 15 }
];

describe('TeamModal Component', () => {
  test('renders testers and capacity form when open', () => {
    const onAdd = jest.fn();
    const onDelete = jest.fn();
    const onClose = jest.fn();

    render(
      <TeamModal
        isOpen={true}
        onClose={onClose}
        testers={mockTesters}
        onAddTester={onAdd}
        onDeleteTester={onDelete}
      />
    );

    expect(screen.getByText('Team Capacity & Testers')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Tester Name');
    fireEvent.change(nameInput, { target: { value: 'New Tester' } });

    const submitBtn = screen.getByRole('button', { name: /Add/i });
    fireEvent.click(submitBtn);

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Tester' }));
  });

  test('does not render when isOpen is false', () => {
    const { container } = render(<TeamModal isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });
});
