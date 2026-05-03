"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const handleLogout = () => {
  // Remove the auth cookie by setting it to expire in the past
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "/login";
};

export default function Navbar() {
	const pathname = usePathname();
	return (
		<nav className="w-full flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-900/80 shadow-sm sticky top-0 z-50 backdrop-blur">
			{/* Logo/Brand */}
			<div className="flex items-center gap-2">
				<span role="img" aria-label="logo">🧳</span>
				<span>Smart Trip</span>
			</div>

			{/* Tabs */}
			<div className="flex gap-2 ml-8">
				   <Link
					   href="/dashboard"
					   className={
						   `px-5 py-2 rounded-full font-semibold transition focus:outline-none border ` +
						   (pathname === "/dashboard"
							   ? "bg-gray-300 text-gray-700"
							   : "bg-white-600 text-black hover:bg-stone-300")
					   }
				   >
					   Search
				   </Link>
				   <Link
					   href="/itinerary"
					   className={
						   `px-5 py-2 rounded-full font-semibold transition focus:outline-none border ` +
						   (pathname === "/itinerary"
							   ? "bg-gray-300 text-gray-700"
							   : "bg-white-600 text-black hover:bg-stone-300")
					   }
				   >
					   ✨ AI Itinerary Builder
				   </Link>
					<button
						onClick={handleLogout}
						className="rounded-lg border px-4 py-2"
					>
						Log out
					</button>
			</div>
		</nav>
	);
}
