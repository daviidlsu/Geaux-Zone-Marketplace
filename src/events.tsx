import { useState } from "react";
import { Search, Filter, MapPin, Heart } from "lucide-react";
import { useAuth } from "./auth/AuthContext";
import Navbar from "./components/navbar";
import Menu from "./components/menu";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
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

  const handleLogout = async () => {
      try {
        await logout();
        navigate('/listings');
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }

  return (
    // Applied the dark gradient background to the entire page
    <div className="h-screen bg-gradient-to-b from-[#12091a] via-[#1a0f2e] to-[#2c1844] text-white overflow-x-hidden">
      <Navbar
        handleLogout={handleLogout}
        setShowLoginModal={()=>{}}
        setShowMenu={setShowMenu}
        navigate={navigate}/>
      <Menu showMenu={showMenu} setShowMenu={setShowMenu}/>
      
      <header className="mt-10 mb-6 pl-8">
        {/* header*/} 
        <h1
          className="text-2xl font-bold mb-2 text-[#FDD023]" // Changed color to gold
          style={{ fontFamily: "Rock Salt, cursive" }}
        >
          On-Campus Vendor Events
        </h1>
        <p className="text-sm opacity-80 text-white">
          Hosted by {primaryHost} and vendor partners in {primaryLocation} until May.
        </p>
      </header>


      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 p-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#FDD023] opacity-80" /> {/* Changed color */}
          <input
            placeholder="Search events..."
            // Updated search input for a dark theme: dark background, white text, gold border on focus
            className="w-full pl-10 p-2 rounded-lg bg-[#1a0f2e] text-white border border-zinc-700 focus:border-[#FDD023] focus:ring focus:ring-[#FDD023]/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Updated buttons for a dark theme: dark background, white text, gold on active/hover */}
        <button
          onClick={() => setShowOnlyLiked(!showOnlyLiked)}
          className={`flex items-center gap-2 p-2 rounded-lg transition ${showOnlyLiked ? 'bg-[#FDD023] text-black font-semibold' : 'bg-[#1a0f2e] text-white border border-zinc-700 hover:border-[#FDD023]'}`}
        >
          <Heart className={showOnlyLiked ? "fill-black text-black" : "fill-transparent text-white"} />
          Liked Only
        </button>

        <button className="flex items-center gap-2 p-2 rounded-lg bg-[#1a0f2e] text-white border border-zinc-700 hover:border-[#FDD023] transition">
          <Filter /> Filter
        </button>
      </div>

      {/* EVENTS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
        {filteredEvents.map((e) => (
          <div
            key={e.id}
            // Updated event card background, border, and hover shadow to match the theme
            className="group p-4 rounded-lg bg-[#1a0f2e] text-white border border-[#2c1844] hover:border-[#FDD023] hover:shadow-[0_0_18px_rgba(253,208,35,0.55),0_0_32px_rgba(253,208,35,0.35)] hover:scale-[1.02] overflow-hidden transition"
          >
            {/* always visible: event name + location */}
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold mb-1 text-[#FDD023]">
                {e.title}
              </h2>
              <button
                onClick={() => toggleLike(e.id)}
                className="opacity-100 transition-opacity duration-200"
              >
                {/* Changed liked heart color */}
                <Heart className={e.liked ? "fill-[#FDD023] text-[#FDD023]" : "fill-transparent text-white"} />
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs opacity-60 mb-1">
              <MapPin className="h-3 w-3" /> {e.location}
            </div>

            {/* hidden by default, revealed on hover */}
            <div className="mt-2 space-y-2 max-h-0 opacity-0 group-hover:max-h-[500px] group-hover:opacity-100 transition-all duration-300 ease-out">
              <p className="text-xs">📆 {new Date(e.date).toDateString()}</p>
              <p className="text-xs opacity-70">Host: {e.host}</p>
              <p className="text-xs opacity-70">Sponsor: {e.sponsor}</p>
              <p className="text-sm opacity-80">{e.details}</p>

              <div className="flex flex-wrap gap-2">
                {e.vendors.map((v, i) => (
                  <span
                    key={i}
                    // Updated vendor tags for better visibility on dark background
                    className="text-[10px] px-2 py-1 rounded-full border border-white/20 text-white"
                    style={{ backgroundColor: "#FFFFFF10" }}
                  >
                    {v}
                  </span>
                ))}
              </div>

              <button
                // Button now uses the gold color as its primary style
                className="w-full flex items-center justify-center gap-2 p-2 rounded-lg hover:opacity-90 transition bg-[#FDD023] text-black font-medium"
              >
                <MapPin className="h-3 w-3" /> View Location
              </button>
            </div>
          </div>
        ))}
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rock+Salt&display=swap');
      `}</style>

      {/* EMPTY STATE */}
      {filteredEvents.length === 0 && (
        <div className="text-center mt-20 opacity-60">No events found.</div>
      )}
    </div>
  );
}