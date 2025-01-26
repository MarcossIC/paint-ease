import { INITIAL_STATE } from './initialState';
import { AppGlobalState } from './customStore';

export const store = new AppGlobalState(INITIAL_STATE);
