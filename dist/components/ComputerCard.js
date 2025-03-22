"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ComputerCard;
const react_1 = require("react");
const react_2 = require("@heroui/react");
const ComputerStateInfo_1 = __importDefault(require("./computerCardInfo/ComputerStateInfo"));
const Modal_1 = __importDefault(require("./scheduleForm/Modal"));
const ScheduleForm_1 = __importDefault(require("./scheduleForm/ScheduleForm"));
function ComputerCard({ stationId, state }) {
    const [isModalOpen, setIsModalOpen] = (0, react_1.useState)(false);
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [submitError, setSubmitError] = (0, react_1.useState)(null);
    const handleCardClick = () => {
        setIsModalOpen(true);
        setSubmitError(null);
    };
    const handleCloseModal = () => {
        if (isSubmitting)
            return; // Prevent closing while submitting
        setIsModalOpen(false);
        setSubmitError(null);
    };
    const handleScheduleSubmit = async (formData) => {
        try {
            setIsSubmitting(true);
            setSubmitError(null);
            // Send the data to the API endpoint
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stationId,
                    ...formData
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to submit schedule');
            }
            console.log('Schedule submitted successfully:', result);
            setIsModalOpen(false);
        }
        catch (error) {
            console.error('Error submitting schedule:', error);
            setSubmitError(error instanceof Error ? error.message : 'An unknown error occurred');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<>
      <div className="w-full h-full flex items-center justify-center group cursor-pointer" onClick={handleCardClick}>
        <react_2.Card className="w-[50%] h-full border-quaternary border-2 rounded-xl
                        hover:bg-tertiary-transparent transition-all duration-300 ease-in-out transform group-hover:scale-110">
          <react_2.CardHeader className="p-2 flex items-center justify-center">
              <p className="text-quinary font-medium text-lg">s{stationId}</p>
          </react_2.CardHeader>
          <react_2.CardBody className="h-full flex items-center justify-center">
          </react_2.CardBody>
          <react_2.CardFooter className="flex items-center justify-center">
            <ComputerStateInfo_1.default state={state}/>
          </react_2.CardFooter>
        </react_2.Card>
      </div>

      <Modal_1.default isOpen={isModalOpen} onClose={handleCloseModal}>
        <div className="w-full max-w-md">
          {submitError && (<div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
              {submitError}
            </div>)}
          <ScheduleForm_1.default onSubmit={handleScheduleSubmit} onCancel={isSubmitting ? undefined : handleCloseModal} stationId={stationId}/>
          {isSubmitting && (<div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center">
              <div className="animate-pulse text-quaternary font-bold">Submitting...</div>
            </div>)}
        </div>
      </Modal_1.default>
    </>);
}
