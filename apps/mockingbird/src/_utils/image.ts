/**
 * Reads a File object and resolves with a data: URL string of the file's contents.
 * @param file The File object to read.
 * @returns A promise that resolves with a data: URL string of the file's contents.
 */
export async function imageFileToDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      resolve(imageUrl);
    };
    reader.readAsDataURL(file);
  });
}
