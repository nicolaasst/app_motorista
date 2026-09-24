import 'vitest';
import type { AxeResults } from 'axe-core';

// vitest-axe@0.1.0 ships types for the old global `Vi.Assertion` namespace
// (pre-vitest-2 API). Vitest 2.x types matchers via module augmentation of
// 'vitest' itself (see @testing-library/jest-dom/types/vitest.d.ts for the
// same pattern), so we declare the one matcher we use here directly.
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T extends AxeResults ? void : never;
  }
}
