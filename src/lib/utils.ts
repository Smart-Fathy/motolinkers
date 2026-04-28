// Convert "BYD Tang L EV LiDAR Flagship" -> "byd-tang-l-ev-lidar-flagship".
// Strip diacritics via NFKD, drop combining marks (U+0300..U+036F), then
// collapse any non-alphanumeric run into a single hyphen.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
