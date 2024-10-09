'use server';

import 'server-only';
import { env } from '@/../env.mjs';

export async function getEditorApiKey() {
  return env.TINYMCE_API_KEY;
}
