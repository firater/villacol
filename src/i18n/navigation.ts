/**
 * Locale-aware navigation wrappers.
 *
 * Importing `Link` and `redirect` from here rather than from `next/link` and
 * `next/navigation` is what makes the localized `pathnames` map actually apply:
 * a link to `"/villas"` renders as `/de/villen` for a German visitor without
 * the call site knowing the German slug exists.
 */
import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

export const { Link, redirect, permanentRedirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
