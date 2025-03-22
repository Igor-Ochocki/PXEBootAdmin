"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScheduleForm;
const react_1 = require("react");
const react_2 = require("@heroui/react");
function ScheduleForm({ onSubmit, onCancel, stationId }) {
    const [formData, setFormData] = (0, react_1.useState)({
        startDate: '',
        startTime: '',
        duration: '1:00', // Default 1 hour
        operatingSystem: '',
        id: '',
        stationId: stationId
    });
    // Generate duration options from 30 minutes to 6 hours
    const durationOptions = Array.from({ length: 12 }, (_, i) => {
        const hours = Math.floor((i + 1) * 30 / 60);
        const minutes = ((i + 1) * 30) % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    });
    // Calculate min and max dates
    const today = new Date();
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0];
    };
    (0, react_1.useEffect)(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user');
                console.log('Fetching user data...');
                if (response.ok) {
                    const data = await response.json();
                    setFormData(prev => ({ ...prev, id: data.id }));
                }
            }
            catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        fetchUserData();
    }, []);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };
    return (<react_2.Card className="w-[20vw] max-w-md mx-auto border-quaternary border-2 rounded-xl">
      <react_2.CardHeader className="bg-primary p-4 rounded-t-xl">
        <h2 className="text-quinary text-xl font-bold">Schedule station {stationId} time</h2>
      </react_2.CardHeader>

      <form onSubmit={handleSubmit} className="bg-secondary-transparent">
        <react_2.CardBody className="p-4 space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-quinary text-sm font-medium mb-1">
              Date
            </label>
            <react_2.Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} min={formatDateForInput(today)} max={formatDateForInput(maxDate)} required className="w-full"/>
          </div>

          <div>
            <label htmlFor="startTime" className="block text-quinary text-sm font-medium mb-1">
              Start Time
            </label>
            <react_2.Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleChange} required className="w-full"/>
          </div>

          <div>
            <label htmlFor="duration" className="block text-quinary text-sm font-medium mb-1">
              Duration
            </label>
            <select id="duration" name="duration" value={formData.duration} onChange={handleChange} required className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary">
              {durationOptions.map((duration) => (<option key={duration} value={duration}>
                  {duration} hours
                </option>))}
            </select>
          </div>

          <div>
            <label htmlFor="operatingSystem" className="block text-quinary text-sm font-medium mb-1">
              Operating System
            </label>
            <select id="operatingSystem" name="operatingSystem" value={formData.operatingSystem} onChange={handleChange} required className="w-full p-2 border border-quaternary rounded-md bg-primary text-quinary">
              <option value="" disabled>Select an operating system</option>
              <option value="linux-ubuntu">Linux Ubuntu</option>
              <option value="linux-arch">Linux Arch</option>
            </select>
          </div>
        </react_2.CardBody>

        <react_2.CardFooter className="p-4 flex justify-end space-x-2">
          {onCancel && (<react_2.Button type="button" onClick={onCancel} className="text-red-500 border border-quaternary rounded-full px-4 py-2
                        transition-all duration-300 ease-in-out
                        hover:bg-red-500 hover:text-white hover:border-red-500
                        active:bg-red-700 active:scale-95">
              Exit
            </react_2.Button>)}
          <react_2.Button type="submit" className="text-green-500 border border-quaternary rounded-full px-4 py-2
                      transition-all duration-300 ease-in-out
                      hover:bg-green-500 hover:text-white hover:border-green-500
                      active:bg-green-700 active:scale-95">
            Schedule
          </react_2.Button>
        </react_2.CardFooter>
      </form>
    </react_2.Card>);
}
