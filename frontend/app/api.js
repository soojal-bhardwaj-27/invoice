let csrfToken = "";
export function errorText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(errorText).join(" ");
  if (value && typeof value === "object") return Object.entries(value).map(([key, val]) => key === "detail" || key === "non_field_errors" ? errorText(val) : key.replaceAll("_", " ") + ": " + errorText(val)).join(" ");
  return "The request failed. Please try again.";
}
export async function api(path, options = {}) {
  const method = options.method || "GET";
  if (!["GET", "HEAD"].includes(method) && !csrfToken) {
    const response = await fetch("/api/auth/csrf/", {credentials: "same-origin", cache: "no-store"});
    if (!response.ok) throw new Error("Cannot connect to the backend.");
    csrfToken = (await response.json()).csrfToken;
  }
  const response = await fetch(path, {...options, credentials: "same-origin", cache: "no-store",
    headers: {"Content-Type": "application/json", ...(csrfToken ? {"X-CSRFToken": csrfToken} : {}), ...options.headers}});
  const data = response.status === 204 ? null : await response.json().catch(() => ({detail: "The server could not complete this request."}));
  if (!response.ok) {
    if (response.status === 403 && data?.detail?.includes("CSRF")) csrfToken = "";
    if ([401, 403].includes(response.status) && data?.detail?.includes("credentials")) window.dispatchEvent(new Event("session-expired"));
    throw new Error(errorText(data));
  }
  if (data?.csrfToken) csrfToken = data.csrfToken;
  return data;
}
export function clearCsrf() { csrfToken = ""; }
