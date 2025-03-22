"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const google_1 = require("next/font/google");
const react_1 = require("@heroui/react");
require("./globals.css");
const geistSans = (0, google_1.Geist)({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = (0, google_1.Geist_Mono)({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
exports.metadata = {
    title: "WUT SK Calendar",
    description: "App that allows scheduling computer stations at WUT SK",
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-white m-[0px]`} style={{ background: 'linear-gradient(135deg, rgb(11,12,16) 0%, rgb(31,40,51) 100%)' }}>
        <react_1.HeroUIProvider>
          {children}
        </react_1.HeroUIProvider>
      </body>
    </html>);
}
