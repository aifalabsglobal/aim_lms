type EnvCheck = {
  name: string;
  present: boolean;
};

export function getClerkEnvChecks(): EnvCheck[] {
  const required = [
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "CLERK_WEBHOOK_SIGNING_SECRET",
    "STREAM_SIGNING_SECRET",
  ];

  return required.map((name) => ({
    name,
    present: Boolean(process.env[name]?.trim()),
  }));
}

export function getAuthReadinessSummary() {
  const checks = getClerkEnvChecks();
  const missing = checks.filter((check) => !check.present).map((check) => check.name);

  return {
    checks,
    ready: missing.length === 0,
    missing,
  };
}
