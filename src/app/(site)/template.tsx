// Re-mounts on every navigation inside the storefront, giving a soft page transition.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
