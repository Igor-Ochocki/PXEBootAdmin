"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ComputerStateInfo;
const react_1 = __importDefault(require("react"));
const ComputerState_1 = require("./ComputerState");
const Circle_1 = __importDefault(require("@mui/icons-material/Circle"));
function ComputerStateInfo({ state }) {
    const stateColor = ComputerState_1.ComputerStateColors[state];
    return (<div className={`flex justify-center items-center w-full h-full ${stateColor} gap-2`}>
      <Circle_1.default style={{ fontSize: 'small' }}/>
      <p>{state}</p>
    </div>);
}
