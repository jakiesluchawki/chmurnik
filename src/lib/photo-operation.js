// Native camera/inference calls cannot be cancelled, but their late results can.
export function createPhotoOperationScope() {
  let lifetime = null;
  let current = null;
  return {
    mount() {
      const mounted = {};
      lifetime = mounted;
      current = null;
      return () => {
        if (lifetime === mounted) {
          lifetime = null;
          current = null;
        }
      };
    },
    begin() {
      if (!lifetime || current) return null;
      const mounted = lifetime;
      const operation = {};
      current = operation;
      const isCurrent = () => lifetime === mounted && current === operation;
      return {
        isCurrent,
        finish() {
          if (isCurrent()) current = null;
        },
      };
    },
  };
}
