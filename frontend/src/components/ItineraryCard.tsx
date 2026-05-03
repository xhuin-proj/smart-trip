import type { ItineraryCardProps } from "@/lib/types";


export default function ItineraryCard({ time, places }: ItineraryCardProps) {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white shadow-md p-6 mb-6">
			<div className="mb-4 flex items-center gap-2">
				<span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
					{time}
				</span>
			</div>
			<div className="flex flex-col gap-4">
				{places.map((place, idx) => (
					<div
						key={idx}
						className="flex gap-4 items-start bg-gray-50 rounded-xl p-4 shadow-sm"
					>
						{place.image ? (
							<img
								src={place.image}
								alt={place.name}
								className="w-24 h-24 object-cover rounded-lg border border-gray-200"
							/>
						) : (
							<div className="w-24 h-24 flex items-center justify-center bg-gray-200 text-gray-400 rounded-lg border border-gray-200">
								No image
							</div>
						)}
						<div className="flex-1">
							<h3 className="text-lg font-bold text-gray-900 mb-1">{place.name}</h3>
							<p className="text-gray-700 text-sm mb-1 line-clamp-3">{place.description}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
