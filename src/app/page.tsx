import ComputerCard from "@/components/ComputerCard";
import UserPhoto from "@/components/UserPhoto";
import LogoutButton from "@/components/LogoutButton";
import { ComputerStations } from "@/constants/ComputerStations";
import { getStationsData } from "@/utils/getStationsData";
export default async function Home() {

  // Calculate the position for the last row to center remaining items
  const totalStations = ComputerStations.length;
  const remainingItems = totalStations % 4;
  const lastItemsStartColumn = remainingItems === 1 ? 'col-start-4' :
                                remainingItems === 2 ? 'col-start-3' :
                                remainingItems === 3 ? 'col-start-2' : '';

  const machineData = await getStationsData();

  console.log(machineData);

  return (
    <div className="flex flex-col h-screen">
      {/* Header Section */}
      <section className="p-4 flex items-center justify-between">
        <div className="w-[150px]" /> {/* Spacer to balance the header */}
        <h1 className="text-quaternary text-center text-4xl font-bold">WUT SK Calendar</h1>
        <div className="flex items-center gap-4 w-[150px]">
          <UserPhoto />
          <LogoutButton />
        </div>
      </section>

      {/* Main Section */}
      <section className="flex-grow p-4 overflow-auto">
        <div className="h-full mx-[5%] grid grid-cols-8 grid-rows-4 gap-[5%]">
          {ComputerStations.map((station: number, index: number) => (
            <div
              key={station}
              className={`col-span-2 ${index === totalStations - remainingItems ? lastItemsStartColumn : ''}`}
            >
              <ComputerCard id={station}/>
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
