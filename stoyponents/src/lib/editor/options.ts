import { QuillOptions } from 'quill';
import './styles.css';

const theme = 'bubble';
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'code'],
    // ['link', 'image'],
  ],
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
