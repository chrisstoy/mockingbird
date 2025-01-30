import Quill from 'quill';
import { EditorDelta } from './TextEditor.client';

/**
 * Converts the passed content to an EditorDelta object.
 *
 * The input may be a JSON encoded string of EditorDelta or a string of HTML.
 *
 * @param quill reference to a quill instance used to do conversion
 * @param content the content to convert. Either an existing EditorDelta, a JSON string of EditorDelta, or a string of HTML
 * @returns an EditorDelta representing the orginal content
 */
export function toEditorDelta(
  quill: Quill,
  content: string | EditorDelta
): EditorDelta {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (error) {
      return quill.clipboard.convert({ html: content });
    }
  }
  return content;
}
