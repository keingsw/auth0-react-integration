import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { render, getByTestId, getAllByTestId } from '@testing-library/react';
import App from './App';

jest.mock('components/Callback', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="callback-component" />,
  };
});

const renderAppWithRouter = (route = '/') => {
  const history = createMemoryHistory();
  history.push(route);
  return render(
    <Router history={history}>
      <App />
    </Router>
  );
};
test('renders without crash', () => {
  const { getByTestId } = renderAppWithRouter();
  expect(getByTestId('app-component')).toBeInTheDocument();
});

describe('routing', () => {
  describe('with route `/`', () => {
    let wrapper;
    beforeEach(() => {
      wrapper = renderAppWithRouter();
    });

    test('renders HomePage', () => {
      const appComponent = wrapper.getByTestId('app-component');
      expect(getByTestId(appComponent, 'homepage-component'));
    });

    test('does not render any other pages', () => {
      const appComponent = wrapper.getByTestId('app-component');
      expect(getAllByTestId(appComponent, /^.*-component$/).length).toBe(1);
    });
  });

  describe('with route `/callback`', () => {
    let wrapper;
    beforeEach(() => {
      const route = '/callback';
      wrapper = renderAppWithRouter(route);
    });

    test('renders Callback page', () => {
      const appComponent = wrapper.getByTestId('app-component');
      expect(getByTestId(appComponent, 'callback-component'));
    });

    test('does not render any other pages', () => {
      const appComponent = wrapper.getByTestId('app-component');
      expect(getAllByTestId(appComponent, /^.*-component$/).length).toBe(1);
    });
  });
});
