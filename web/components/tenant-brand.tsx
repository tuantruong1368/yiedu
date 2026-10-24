"use client";
import Link from "next/link";
export function LogoMark({ branding, name }: { branding: any; name: string }) {
  const text = branding?.text || name || " ";
  const initials = text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x: string) => x[0])
    .join("")
    .toUpperCase();
  if (branding?.logo_url)
    return (
      <img className="tenant-logo-image" src={branding.logo_url} alt={text} />
    );
  return (
    <span
      className={"tenant-logo-mark " + (branding?.variant || "rounded")}
      style={{ background: branding?.color || "#215d4c" }}
      aria-label={text}
    >
      {initials}
      <i />
    </span>
  );
}
export function TenantBrand({ tenant }: { tenant: any }) {
  return (
    <Link className="brand tenant-brand" href={"/t/" + tenant.slug}>
      <LogoMark branding={tenant.branding} name={tenant.name} />
      <span>{tenant.branding?.text || tenant.name}</span>
    </Link>
  );
}
