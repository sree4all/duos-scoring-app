/** Nav highlight: avoid treating `/groups` as active on `/groups/join`. */
export function isNavLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/groups") return false;
  return pathname.startsWith(`${href}/`);
}
