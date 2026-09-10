export function safeReturnTo(value) {
  if (typeof value !== "string") return "/dashboard";

  const allowed =
    /^\/(?:dashboard|campuses\/[a-f0-9]{24}|rooms\/[a-f0-9]{24}|invite\/[a-f0-9]{8})\/?$/i;

  return allowed.test(value) ? value : "/dashboard";
}

export function getReturnTo(search) {
  const value = new URLSearchParams(search).get("returnTo");
  return safeReturnTo(value);
}

export function authUrl(page, returnTo) {
  return `/${page}?returnTo=${encodeURIComponent(
    safeReturnTo(returnTo)
  )}`;
}