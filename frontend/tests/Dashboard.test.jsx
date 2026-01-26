// Example frontend test for Dashboard page
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../src/components/AuthContext';
import Dashboard from '../src/pages/Dashboard';

test('renders dashboard for logged-in user', () => {
  // Mock user context
  const user = { name: 'Test User', role: 'HR' };
  render(
    <AuthProvider value={{ user }}>
      <Dashboard />
    </AuthProvider>
  );
  expect(screen.getByText(/Welcome, Test User/i)).toBeInTheDocument();
  expect(screen.getByText(/Role: HR/i)).toBeInTheDocument();
});
