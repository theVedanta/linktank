"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SaveButton } from "@/components/ui/save-button";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import SkeletonCard from "@/app/events/SkeletonCard";
import { Input } from "@/components/ui/input";
import debounce from "lodash/debounce";

interface Event extends Document {
	_id: string;
	title: string;
	date_from: Date;
	date_to?: Date;
	url: string;
	ticket_url?: string;
	brief_description?: string;
	description: string;
	agenda?: string;
	speakers?: mongoose.Schema.Types.ObjectId[];
	organization?: { name: string };
	photo_url?: string;
	is_virtual?: boolean;
	is_in_person?: boolean;
	location: string;
	address?: string;
	room?: string;
	city?: string;
	state?: string;
	zip_code?: string;
	country?: string;
	keywords?: string[];
	contact_name?: string;
	contact_phone?: string;
	contact_email?: string;
	backlink?: string;
}

export default function Home() {
	const [date, setDate] = useState<Date | undefined>(() => new Date());
	const [events, setEvents] = useState<Event[]>([]);
	const [organizations, setOrganizations] = useState<
		{ name: string; _id: string }[]
	>([]);
	const [selectedOrg, setSelectedOrg] = useState<string>("all");
	const [loading, setLoading] = useState<boolean>(true);
	const [searchTerm, setSearchTerm] = useState("");

	// Debounced search function
	const debouncedSearch = debounce(async (searchTerm: string) => {
		try {
			const params = new URLSearchParams();
			if (searchTerm) {
				params.append("search", searchTerm);
			}
			if (selectedOrg !== "all") params.append("organization", selectedOrg);

			const response = await fetch(`/api/events/search?${params.toString()}`);
			const data = await response.json();

			if (data.success) {
				setEvents(data.events);
			}
		} catch (error) {
			console.error("Error searching events:", error);
		}
	}, 300);

	const handleSearch = (value: string) => {
		setSearchTerm(value);
		debouncedSearch(value.trim());
	};

	const today = useMemo(() => new Date(), []);

	// Group events by date for display
	const groupedEvents: Record<string, Event[]> = events.reduce((acc, event) => {
		const dateKey = new Date(event.date_from).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
		if (!acc[dateKey]) acc[dateKey] = [];
		acc[dateKey].push(event);
		return acc;
	}, {});

	// Clean up debounce on unmount
	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, []);

	// Fetch saved events instead of all events
	useEffect(() => {
		const fetchSavedEvents = async () => {
			setLoading(true);
			try {
				// First, get saved event ids from your saveevent API
				const savedRes = await fetch("/api/saveevent", { method: "GET" });
				const savedData = await savedRes.json();
				if (savedData.success) {
					const savedIds: string[] = savedData.eventIds;
					if (savedIds.length > 0) {
						// Fetch full event details for these saved events
						const eventsRes = await fetch(
							`/api/events/savedevents?savedIds=${savedIds.join(",")}`,
							{
								method: "GET",
							},
						);
						const eventsData = await eventsRes.json();
						if (eventsData.success) {
							setEvents(eventsData.events);
						} else {
							console.error(
								"Error fetching event details:",
								eventsData.message,
							);
						}
					} else {
						setEvents([]);
					}
				} else {
					console.error("Error fetching saved event ids:", savedData.message);
				}
			} catch (error) {
				console.error("Error fetching saved events:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchSavedEvents();
	}, [selectedOrg]);

	useEffect(() => {
		// Fetch organizations
		fetch("/api/organizations")
			.then((response) => response.json())
			.then((data) => {
				if (data.success) {
					setOrganizations(data.organizations);
				}
			});
	}, []);

	return (
		<div className="mt-[3.75rem] flex flex-col gap-[2.25rem] w-[69.375rem]">
			<div className="w-full flex flex-row justify-between items-center">
				<h3 className="text-[2rem] font-jakarta font-extrabold">
					My Saved Events
				</h3>
				<Input
					type="search"
					placeholder="Search..."
					className="md:w-[10rem] rounded-[0.75rem] mr-3 bg-white h-[3.125rem]"
					onChange={(e) => handleSearch(e.target.value)}
					value={searchTerm}
				/>

				<div className="flex flex-row items-center gap-[0.75rem]">
					<Select>
						<SelectTrigger className="w-[15.625rem] h-[3.125rem] bg-white rounded-[0.75rem]">
							<SelectValue placeholder="Anywhere" />
						</SelectTrigger>
						<SelectContent className="bg-white">
							<SelectGroup>
								<SelectLabel>Anywhere</SelectLabel>
								<SelectItem value="ny">New York</SelectItem>
								<SelectItem value="dc">Washington D.C.</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button className="bg-[#1C2329] rounded-[0.74969rem] h-[3.125rem] text-white px-[0.81rem]">
						<SlidersHorizontal size={20} />
						<span className="text-[1rem]">Filters (1)</span>
					</Button>
				</div>

				<Select
					value={selectedOrg}
					onValueChange={(val) => setSelectedOrg(val)}
				>
					<SelectTrigger className="w-[15.625rem] h-[3.125rem] bg-white rounded-[0.75rem]">
						<SelectValue placeholder="Select Organization" />
					</SelectTrigger>
					<SelectContent className="bg-white">
						<SelectGroup>
							<SelectLabel>Select Organization</SelectLabel>
							<SelectItem value="all">All Organizations</SelectItem>
							{organizations.map((org) => (
								<SelectItem key={org._id} value={org._id}>
									{org.name}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</div>
			<div className="flex">
				<ol className="relative flex-grow pr-20 border-s border-[#808080] border-opacity-25">
					{loading
						? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
						: Object.entries(groupedEvents).map(([date, groupedEvents]) => (
								<li key={date} className="mb-10 ms-4">
									<div className="absolute w-3 h-3 bg-gray-800 rounded-full mt-1.5 -start-1.5 border border-white"></div>
									<time className="mb-1 text-xl font-semibold leading-none">
										{date}
									</time>
									{groupedEvents.map((event) => (
										<EventCard event={event} key={event._id} />
									))}
								</li>
							))}
				</ol>

				<div className="h-auto">
					<div className="flex w-full items-center space-x-2 mb-4">
						<Button
							variant={date && date >= today ? "default" : "secondary"}
							onClick={() => setDate(new Date())}
							className="rounded-[0.75rem] w-[70%] h-[3.125rem] font-medium"
						>
							Upcoming
						</Button>
						<Button
							variant={date && date < today ? "default" : "secondary"}
							onClick={() => {
								const pastDate = new Date();
								pastDate.setMonth(pastDate.getMonth() - 1);
								setDate(pastDate);
							}}
							className="rounded-[0.75rem] w-[30%] h-[3.125rem] font-medium"
						>
							Past
						</Button>
					</div>

					<Calendar
						mode="single"
						selected={date}
						onSelect={setDate}
						className="rounded-md border border-black border-opacity-25 bg-white"
					/>
				</div>
			</div>
		</div>
	);
}

const EventCard = ({ event }: { event: Event }) => {
	return (
		<Link href={`/events/${event.backlink}`} key={event._id}>
			<div className="border flex border-[#D3D0D0] bg-white mt-6 rounded-2xl pl-[1.37rem] pr-[0.88rem] py-[1.41rem] w-full">
				<div className="flex-1 flex flex-col gap-[0.5rem]">
					<div className="flex items-center opacity-70 font-jakarta text-[#323232] text-[1rem] font-medium gap-[1.25rem]">
						<p>
							{new Date(event.date_from).toLocaleTimeString("en-US", {
								hour: "numeric",
								minute: "numeric",
							})}
						</p>
						<div className="flex flex-row items-center gap-[0.12rem] w-[70%]">
							<MapPin className="flex-shrink-0" size={20} />
							<p className="line-clamp-1">{event.location}</p>
						</div>
					</div>
					<h3 className="text-lg font-jakarta font-semibold text-gray-900 dark:text-white line-clamp-1">
						{event.title}
					</h3>
					<p className="text-base font-semibold text-black dark:text-gray-400">
						By{" "}
						<span className="font-semibold text-[#1F76F9]">
							{String(event?.organization?.name) || "Unknown Host"}
						</span>
					</p>
					<p className="pr-10 text-base font-normal text-gray-500 dark:text-gray-400 line-clamp-2">
						{event.description}
					</p>
				</div>
				<div className="relative">
					<img
						src={event.photo_url || "/linktank_logo.png"}
						alt={`${event.title} image`}
						className="rounded-lg h-[9.5625rem] w-auto aspect-square object-cover"
					/>
					<div className="absolute top-2 right-2">
						<SaveButton eventId={event._id} isSaved={true} />
					</div>
				</div>
			</div>
		</Link>
	);
};
