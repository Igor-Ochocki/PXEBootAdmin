"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerStateColors = exports.ComputerState = void 0;
var ComputerState;
(function (ComputerState) {
    ComputerState["OFF"] = "OFF";
    ComputerState["ON"] = "ON";
    ComputerState["UNKNOWN"] = "UNKNOWN";
})(ComputerState || (exports.ComputerState = ComputerState = {}));
exports.ComputerStateColors = {
    "OFF": "text-red-500",
    "ON": "text-green-500",
    "UNKNOWN": "text-gray-500",
};
