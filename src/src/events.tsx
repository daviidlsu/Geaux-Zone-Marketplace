import { useState } from "react";
import { Search, Filter, MapPin, Heart } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  host: string;
  sponsor: string;
  vendors: string[];
  details: string;
  location: string;
  liked: boolean;
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([
    {
      id: crypto.randomUUID(),
      title: "Spring Bayou Vendor Market",
      date: "2025-03-14",
      host: "LSU Campus Events Council",
      sponsor: "LSU Student Sponsorship Program",
      location: "Free Speech Alley",
      vendors: ["Thrift Resellers", "Student Artists", "Handmade Jewelry"],
      details:
        "A swamp-aesthetic open-air market with live Cajun music and student pop-up shops.",
      liked: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Purple & Gold Night Bazaar",
      date: "2025-04-09",
      host: "LSU Student Sponsorship Program",
      sponsor: "LSU Academic Wellness Initiative",
      location: "Free Speech Alley",
      vendors: ["Candle Makers", "Custom Shoe Painters", "Drink Vendors"],
      details:
        "Evening festival featuring string lights, performances, and LSU-exclusive vendor booths.",
      liked: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Geaux Green Sustainability Fair",
      date: "2025-04-22",
      host: "LSU Sustainability Office",
      sponsor: "LSU Sustainability Office",
      location: "Free Speech Alley",
      vendors: ["Recycled Fashion", "Organic Skincare", "Plant Sellers"],
      details: "Eco-business fair with free succulents for the first 50 students.",
      liked: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Tiger Trading Pop-Up Festival",
      date: "2025-05-01",
      host: "LSU Student Engagement",
      sponsor: "LSU Academic Wellness Initiative",
      location: "Free Speech Alley",
      vendors: ["Tech Resellers", "Book Traders", "LSU Merch Creators"],
      details: "Festival celebrating student trading & marketplace creators.",
      liked: false,
    },
    {
      id: crypto.randomUUID(),
      title: "LSU Finals Fuel Festival",
      date: "2025-05-06",
      host: "LSU Academic Success Hub",
      sponsor: "LSU Academic Wellness Initiative",
      location: "Free Speech Alley",
      vendors: ["Coffee Trucks", "Stationery Sellers", "Energy Drinks"],
      details: "Finals week supply festival with a free stress-relief zone.",
      liked: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Mid-Semester Vendor Fest",
      date: "2025-02-28",
      host: "LSU Student Engagement",
      sponsor: "LSU Student Sponsorship Program",
      location: "Free Speech Alley",
      vendors: ["Electronics Resellers", "Stickers", "Pop Culture Collectors"],
      details: "A lunchtime festival for student entrepreneurs to showcase.",
      liked: false,
    },
  ]);

  const toggleLike = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, liked: !e.liked } : e))
    );
  };

  const filteredEvents = events
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => (showOnlyLiked ? e.liked : true));

  const primaryHost = events[0]?.host || "LSU Campus Events Council";
  const primaryLocation = events[0]?.location || "Free Speech Alley";

  return (
    <div className="p-6 min-h-screen text-white bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] overflow-x-hidden">
      {/* HEADER */}
      <header className="mb-6">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#FDD023" }}>
          On-Campus Vendor Events
        </h1>
        <p className="text-sm opacity-80">
          Hosted by {primaryHost} and vendor partners in {primaryLocation} until May.
        </p>
      </header>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 opacity-50" />
          <input
            placeholder="Search events..."
            className="w-full pl-10 p-2 rounded-lg bg-white text-black border border-zinc-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowOnlyLiked(!showOnlyLiked)}
          className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
        >
          <Heart className={showOnlyLiked ? "fill-white text-white" : ""} />
          Liked Only
        </button>

        <button className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white">
          <Filter /> Filter
        </button>
      </div>

      {/* EVENTS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEvents.map((e) => (
          <div
            key={e.id}
            className="p-4 rounded-lg bg-zinc-200 text-black border border-zinc-400 hover:border-[#FDD023] hover:shadow-[0_0_18px_rgba(253,208,35,0.55),0_0_32px_rgba(253,208,35,0.35)] hover:scale-[1.02] transition"
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-1">
                {e.title}
              </h2>
              <button onClick={() => toggleLike(e.id)}>
                <Heart className={e.liked ? "fill-white text-white" : ""} />
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs opacity-60 mb-3">
              <MapPin className="h-3 w-3" /> {e.location}
            </div>

            <p className="text-xs mb-2">📆 {new Date(e.date).toDateString()}</p>
            <p className="text-xs opacity-70 mb-2">Host: {e.host}</p>
            <p className="text-xs opacity-70 mb-2">Sponsor: {e.sponsor}</p>
            <p className="text-sm opacity-80 mb-4">{e.details}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {e.vendors.map((v, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-full border border-black"
                  style={{ backgroundColor: "#FFFFFF20", color: "#000000" }}
                >
                  {v}
                </span>
              ))}
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:opacity-80 transition bg-[#FDD023] text-black border border-[#FDD023]"
            >
              <MapPin className="h-3 w-3" /> View Location
            </button>
          </div>
        ))}
      </section>

      {/* EMPTY STATE */}
      {filteredEvents.length === 0 && (
        <div className="text-center mt-20 opacity-60">No events found.</div>
      )}
    </div>
  );
}
