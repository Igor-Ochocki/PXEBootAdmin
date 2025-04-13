import ComputerCard from "@/components/ComputerCard";
import UserPhoto from "@/components/UserPhoto";
import LogoutButton from "@/components/LogoutButton";
import { ComputerStations } from "@/constants/ComputerStations";
import { DecToHex } from "@/utils/DecToHex";

export default async function Home() {

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section */}
      <section className="p-4 flex items-center justify-between">
        <div className="w-[200px]" /> {/* Spacer to balance the header */}
        <h1 className="text-quaternary text-center text-4xl font-bold">WUT SK Calendar</h1>
        <div className="flex items-center gap-4 w-[200px]">
          <UserPhoto />
          <LogoutButton />
        </div>
      </section>

      {/* Main Section */}
      <section className="flex-grow p-4 overflow-auto no-scrollbar">
        <div className="h-full mx-[5%] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2%]">
          {ComputerStations.map((station: number) => (
            <div
              key={station}
              className="flex justify-center"
            >
              <ComputerCard stationId={DecToHex(station)} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <section className="p-2 flex items-center justify-center">
        <p className="text-quinary">© 2025 WUT SK Calendar</p>
      </section>
    </div>
  );
}
