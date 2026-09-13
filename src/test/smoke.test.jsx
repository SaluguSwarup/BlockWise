import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConceptFlow from '../components/common/ConceptFlow.jsx';

/**
 * Proves the jsdom test project (R7) actually renders React components — not just that JSON
 * fixtures parse. A component picked here deliberately needs no router or app context.
 */
describe('frontend test environment (jsdom)', () => {
  it('renders a component and finds honestly-labelled text (no "AI/ML" claim)', () => {
    render(<ConceptFlow />);
    expect(screen.getByText('Automatic Block Planning Engine')).toBeTruthy();
    expect(screen.queryByText(/AI \/ ML/i)).toBeNull();
  });
});
