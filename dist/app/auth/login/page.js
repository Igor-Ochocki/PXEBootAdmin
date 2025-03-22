"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const LoginButton_1 = __importDefault(require("@/components/LoginButton"));
function LoginPage() {
    return (<div className="min-h-screen flex items-center justify-center bg-secondary">
      <div className="bg-primary p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-quinary mb-6 text-center">
          Welcome to SK Calendar
        </h1>
        <p className="text-quinary mb-8 text-center">
          Please log in with your USOS account to continue
        </p>
        <div className="flex justify-center">
          <LoginButton_1.default />
        </div>
      </div>
    </div>);
}
