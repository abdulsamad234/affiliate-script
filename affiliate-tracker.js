(function () {
  const CDN_PSL_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/psl/dist/psl.min.js";

  function loadPslScript(callback) {
    const script = document.createElement("script");
    script.src = CDN_PSL_SCRIPT_URL;
    script.onload = callback;
    document.head.appendChild(script);
  }

  function removeSubdomain(hostname) {
    if (typeof psl === "undefined") return hostname;
    const parsed = psl.parse(hostname);
    return parsed.domain;
  }

  function getUrlParameter(name) {
    const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    const results = regex.exec(location.search);
    return results === null
      ? ""
      : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=/; samesite=none; secure`;
  }

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; samesite=none; secure`;
  }

  loadPslScript(function () {
    const domain = removeSubdomain(window.location.hostname);
    const urlParams = new URLSearchParams(window.location.search);
    const affiliateParam = urlParams.get("ref");
    const cookieName = "affiliate_referral";
    const existingAffiliate = getCookie(cookieName) || null;

    if (affiliateParam) {
      // TODO: check for cookie duration from affiliate program
      setCookie(cookieName, affiliateParam, 30);
      window.affiliateId = affiliateParam;
    } else if (existingAffiliate) {
      window.affiliateId = existingAffiliate;
    } else {
      window.affiliateId = null;
    }

    console.log("Affiliate ID:", window.affiliateId);

    // Function to handle referrals
    async function handleReferral() {
      const userId = document
        .querySelector("script[data-affiliate]")
        .getAttribute("data-user-id");
      const referralCode = window.affiliateId;
      if (!userId || !domain || !referralCode) return;

      try {
        const response = await fetch(
          "https://api.yourdomain.com/v1/referrals",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, code: referralCode }),
          }
        );
        const data = await response.json();
        if (data.referral) {
          setCookie(cookieName, data.referral, data.cookie_duration);
          window.affiliateId = data.referral;
        } else {
          deleteCookie(cookieName);
          window.affiliateId = null;
        }
        dispatchEvent(new Event("affiliate_referral_ready"));
      } catch (error) {
        deleteCookie(cookieName);
        window.affiliateId = null;
        console.error("Error handling referral:", error);
      }
    }

    if (affiliateParam && existingAffiliate !== affiliateParam) {
      handleReferral();
    } else if (existingAffiliate) {
      setTimeout(
        () => dispatchEvent(new Event("affiliate_referral_ready")),
        1200
      );
    } else {
      setTimeout(
        () => dispatchEvent(new Event("affiliate_referral_ready")),
        1200
      );
    }
  });
})();