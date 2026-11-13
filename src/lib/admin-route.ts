/** True when the path is under `/{locale}/admin` (locale prefix optional). */
export function isAdminPathname(pathname: string): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "";
  return /\/admin(\/|$)/.test(path);
}
