import { QuillOptions } from 'quill';
import 'quill/dist/quill.snow.css'; // Add css for snow theme
// import 'quill/dist/quill.bubble.css'; // Add css for bubble theme

const theme = 'snow';
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
