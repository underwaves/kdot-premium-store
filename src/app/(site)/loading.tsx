export default function SiteLoading() {
  return (
    <div className="container-x py-14 md:py-20" aria-busy="true" aria-label="กำลังโหลดข้อมูล">
      <div className="skeleton h-4 w-48" />
      <div className="skeleton mt-8 h-20 w-3/4 max-w-2xl" />
      <div className="skeleton mt-4 h-5 w-1/2 max-w-md" />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
        <div className="skeleton h-64" />
      </div>
    </div>
  );
}
