export interface WebFingerLink {
  rel: string;
  type?: string;
  href?: string;
  template?: string;
}

export interface WebFingerResponse {
  subject: string;
  aliases?: string[];
  properties?: { [key: string]: string };
  links: WebFingerLink[];
}
