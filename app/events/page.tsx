"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

import SkeletonCard from "./SkeletonCard";
import { Input } from "@/components/ui/input";
import debounce from "lodash/debounce";

import { EventCard } from "@/components/event-card";

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
	speakers?: string[];
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

	// Debounced search function to prevent too many API calls
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

	// Clean up debounce on component unmount
	useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, []);

	useEffect(() => {
		const fetchEvents = async () => {
			setLoading(true);
			const orgQuery =
				selectedOrg !== "all" ? `?organization=${selectedOrg}` : "";
			const response = await fetch(`/api/events${orgQuery}`);
			const data = await response.json();
			console.log(data);
			setEvents(data.events);
			setLoading(false);
		};

		fetchEvents();
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
					Upcoming Events
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
									<div className="absolute w-3 h-3 bg-gray-800 rounded-full mt-1.5 -start-1.5 border border-white" />
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
