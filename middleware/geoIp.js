const https = require("https");

// Imperial-unit countries (US customary / Myanmar / Liberia)
const IMPERIAL_COUNTRIES = new Set(["US", "LR", "MM"]);

/**
 * Middleware: silently detect user's country from IP using ipapi.co (free, no key needed).
 * Attaches req.geoData = { countryCode, isImperial, ip }
 * Never blocks the request — falls back to empty string on any error.
 */
const detectGeoIp = (req, res, next) => {
  // Extract real IP (supports proxies / load balancers)
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip;

  // Skip for localhost / private IPs
  const isLocal =
    !ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.");

  if (isLocal) {
    req.geoData = { countryCode: "", isImperial: false, ip: ip || "" };
    return next();
  }

  // Call ipapi.co — returns just the 2-letter country code as plain text
  const url = `https://ipapi.co/${ip}/country/`;

  const request = https.get(url, { timeout: 3000 }, (response) => {
    let data = "";
    response.on("data", (chunk) => (data += chunk));
    response.on("end", () => {
      const countryCode = data.trim().toUpperCase();
      // ipapi returns "Undefined" or error JSON on failure
      const valid = /^[A-Z]{2}$/.test(countryCode);
      req.geoData = {
        countryCode: valid ? countryCode : "",
        isImperial: valid ? IMPERIAL_COUNTRIES.has(countryCode) : false,
        ip,
      };
      next();
    });
  });

  request.on("error", () => {
    req.geoData = { countryCode: "", isImperial: false, ip: ip || "" };
    next();
  });

  request.on("timeout", () => {
    request.destroy();
    req.geoData = { countryCode: "", isImperial: false, ip: ip || "" };
    next();
  });
};

module.exports = { detectGeoIp, IMPERIAL_COUNTRIES };
