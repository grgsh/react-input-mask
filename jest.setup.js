import '@testing-library/jest-dom';

// In Jest (jsdom) requestAnimationFrame behaves differently and can
// make loops / deferred work flaky. Mock it to use setTimeout so tests
// run reliably and deterministically.
global.requestAnimationFrame = cb => setTimeout(cb, 0);
global.cancelAnimationFrame = id => clearTimeout(id);
