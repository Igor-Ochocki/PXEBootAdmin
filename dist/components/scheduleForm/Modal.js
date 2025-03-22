"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Modal;
const react_1 = require("react");
const react_dom_1 = require("react-dom");
function Modal({ isOpen, onClose, children }) {
    const overlayRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
        };
    }, [isOpen, onClose]);
    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (0, react_dom_1.createPortal)(<div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleOverlayClick}>
      <div className="animate-fade-in-up" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>, document.body);
}
