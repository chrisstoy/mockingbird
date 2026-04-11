import Quill, { QuillOptions } from 'quill';
import MagicUrl from 'quill-magic-url';
import { CustomLink } from './customLink';
import './styles.css';

Quill.register('formats/link', CustomLink, true);
Quill.register('modules/magicUrl', MagicUrl, true);

const theme = 'bubble';
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'code'],
    // ['link', 'image'],
  ],
  magicUrl: {
    // urlRegularExpression: /https?:\/\/[\S]+/g,
    // globalRegularExpression: /https?:\/\/[\S]+/g,
  },
};
const formats = ['bold', 'italic', 'underline', 'code', 'link', 'image'];

const options: QuillOptions = {
  theme,
  modules,
  formats,
};

export default options;

/** Possible modules and formats for Quill
'background'
'bold'
'color'
'font'
'code'
'italic'
'link'
'size'
'strike'
'script'
'underline'

'blockquote'
'header'
'indent'
'list'
'align'
'direction'
'code-block'

'formula'
'image'
'video'
 */
