"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const ComputerCard_1 = __importDefault(require("@/components/ComputerCard"));
const UserPhoto_1 = __importDefault(require("@/components/UserPhoto"));
const LogoutButton_1 = __importDefault(require("@/components/LogoutButton"));
const ComputerStations_1 = require("@/constants/ComputerStations");
const getStationsData_1 = require("@/utils/getStationsData");
async function Home() {
    // Calculate the position for the last row to center remaining items
    const totalStations = ComputerStations_1.ComputerStations.length;
    const remainingItems = totalStations % 4;
    const lastItemsStartColumn = remainingItems === 1 ? 'col-start-4' :
        remainingItems === 2 ? 'col-start-3' :
            remainingItems === 3 ? 'col-start-2' : '';
    const machineData = await (0, getStationsData_1.getStationsData)();
    return (<div className="flex flex-col h-screen">
      {/* Header Section */}
      <section className="p-4 flex items-center justify-between">
        <div className="w-[150px]"/> {/* Spacer to balance the header */}
        <h1 className="text-quaternary text-center text-4xl font-bold">WUT SK Calendar</h1>
        <div className="flex items-center gap-4 w-[150px]">
          <UserPhoto_1.default />
          <LogoutButton_1.default />
        </div>
      </section>

      {/* Main Section */}
      <section className="flex-grow p-4 overflow-auto">
        <div className="h-full mx-[5%] grid grid-cols-8 grid-rows-4 gap-[5%]">
          {ComputerStations_1.ComputerStations.map((station, index) => (<div key={station} className={`col-span-2 ${index === totalStations - remainingItems ? lastItemsStartColumn : ''}`}>
              <ComputerCard_1.default stationId={machineData[index].stationId} state={machineData[index].status.toUpperCase()}/>
            </div>))}
        </div>
      </section>

      {/* Footer Section */}
      <section className="p-2 flex items-center justify-center">
        <p className="text-quinary">© 2025 WUT SK Calendar</p>
      </section>
    </div>);
}
