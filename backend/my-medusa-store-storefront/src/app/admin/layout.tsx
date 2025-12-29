"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = pathname === href;
    return [
      "block px-3 py-2 rounded",
      active ? "bg-gray-200 font-medium" : "hover:bg-gray-100",
    ].join(" ");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r bg-white">
        <div className="p-4 border-b">
          <span className="font-semibold">Admin</span>
        </div>
        <nav className="p-2 space-y-1 text-sm">
          <Link className={linkClass("/admin")} href="/admin">Dashboard</Link>
          <Link className={linkClass("/admin/brands")} href="/admin/brands">Brands</Link>
          <Link className={linkClass("/admin/media")} href="/admin/media">Media</Link>
          <Link className={linkClass("/admin/galleries")} href="/admin/galleries">Galleries</Link>
          <Link className={linkClass("/admin/banners")} href="/admin/banners">Banners</Link>
          <div className="mt-3 px-3 text-xs uppercase text-gray-500">Warranty</div>
          <Link className={linkClass("/admin/warranties")} href="/admin/warranties">Warranties</Link>
          <Link className={linkClass("/admin/warranty-claims")} href="/admin/warranty-claims">Claims</Link>
          <div className="mt-3 px-3 text-xs uppercase text-gray-500">Sellers</div>
          <Link className={linkClass("/admin/seller-requests")} href="/admin/seller-requests">Seller Requests</Link>
          <Link className={linkClass("/admin/sellers")} href="/admin/sellers">Sellers</Link>
        </nav>
      </aside>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
