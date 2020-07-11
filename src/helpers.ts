export const removeQuery = (url: string): string => {
  return url.split("?")[0];
};
