/* ============================================================
   widgets/index.js — سجل التجارب التفاعلية
   ============================================================ */

import { mount as neural } from './neural.js';
import { mount as token } from './tokenizer.js';
import { mount as attention } from './attention.js';
import { mount as train } from './train.js';
import { mount as code } from './code.js';
import { mount as prompt } from './prompt.js';
import { mount as map } from './map.js';
import { mount as ethics } from './ethics.js';

export const WIDGETS = { neural, token, attention, train, code, prompt, map, ethics };
