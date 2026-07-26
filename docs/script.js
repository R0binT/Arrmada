(() => {
  const releaseCta = document.getElementById("release-cta");

  const revealScreenshots = () => {
    const figures = document.querySelectorAll(".shot-row figure");
    if (!("IntersectionObserver" in window)) {
      figures.forEach((figure) => figure.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );
    figures.forEach((figure) => observer.observe(figure));
  };

  const labelLatestRelease = async () => {
    if (!(releaseCta instanceof HTMLAnchorElement)) {
      return;
    }
    try {
      const response = await fetch(
        "https://api.github.com/repos/R0binT/Arrmada/releases/latest",
        {
          headers: { Accept: "application/vnd.github+json" },
        }
      );
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      if (typeof payload.tag_name === "string" && payload.tag_name.length > 0) {
        releaseCta.textContent = `Get ${payload.tag_name}`;
      }
    } catch {
      // Keep the static CTA label when the API is unavailable.
    }
  };

  revealScreenshots();
  void labelLatestRelease();
})();
