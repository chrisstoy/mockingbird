import Link from 'quill/formats/link';

class CustomLink extends Link {
  static override create(value: string): HTMLElement {
    const node = super.create(value) as HTMLAnchorElement;
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    return node;
  }
}

export { CustomLink };
