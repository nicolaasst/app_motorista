import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);
