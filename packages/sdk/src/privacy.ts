const MASK_CLASS = "sighthog-mask";
const BLOCK_CLASS = "sighthog-block";

let observer: MutationObserver | null = null;

function applySelectorClass(selector: string, className: string): void {
  if (typeof document === "undefined") return;
  try {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.add(className);
    });
  } catch {
    // invalid selector
  }
}

export function applyPrivacySelectors(
  maskSelectors: string[] = [],
  blockSelectors: string[] = []
): void {
  if (typeof document === "undefined") return;

  for (const sel of maskSelectors) {
    applySelectorClass(sel, MASK_CLASS);
  }
  for (const sel of blockSelectors) {
    applySelectorClass(sel, BLOCK_CLASS);
  }

  if (observer) {
    observer.disconnect();
  }

  const allSelectors = [...maskSelectors, ...blockSelectors];
  if (allSelectors.length === 0) {
    return;
  }

  observer = new MutationObserver(() => {
    for (const sel of maskSelectors) {
      applySelectorClass(sel, MASK_CLASS);
    }
    for (const sel of blockSelectors) {
      applySelectorClass(sel, BLOCK_CLASS);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

export function stopPrivacyObserver(): void {
  observer?.disconnect();
  observer = null;
}

export function getPrivacyRecordOptions(maskAllInputs: boolean): {
  maskAllInputs: boolean;
  maskTextClass: string;
  blockClass: string;
} {
  return {
    maskAllInputs,
    maskTextClass: MASK_CLASS,
    blockClass: BLOCK_CLASS,
  };
}
