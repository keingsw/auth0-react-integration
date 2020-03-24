import React from 'react';
import { render } from '@testing-library/react';
import Callback from './Callback';

test('renders without crash', () => {
  const { getByTestId } = render(<Callback />);
  expect(getByTestId('callback-component')).toBeInTheDocument();
});
