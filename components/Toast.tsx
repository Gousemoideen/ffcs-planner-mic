'use client';

import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'warning' | 'success' | 'error' | 'info';
    onUndo?: () => void;
    onDismiss?: () => void;
    showTimer?: boolean;
    timerDuration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'warning',
    onUndo,
    onDismiss,
    showTimer = false,
    timerDuration = 3000,
}) => {
    useEffect(() => {
        if (!showTimer) return;

        const timeout = window.setTimeout(() => {
            if (onDismiss) {
                onDismiss();
            }
        }, timerDuration);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [showTimer, timerDuration, onDismiss]);

    const bgColor = {
        warning: 'bg-yellow-100 border-yellow-400',
        success: 'bg-green-100 border-green-400',
        error: 'bg-red-100 border-red-400',
        info: 'bg-blue-100 border-blue-400',
    };

    const textColor = {
        warning: 'text-yellow-800',
        success: 'text-green-800',
        error: 'text-red-800',
        info: 'text-blue-800',
    };

    return (
        <div
            className={`fixed bottom-8 right-8 max-w-sm border-2 rounded-lg px-6 py-4 flex flex-col gap-3 shadow-lg animate-lucid-fade-up ${bgColor[type]}`}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className={`text-sm font-semibold ${textColor[type]}`}>{message}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {onUndo && (
                        <button
                            onClick={onUndo}
                            className={`px-4 py-2 font-bold text-sm rounded transition cursor-pointer ${
                                type === 'warning'
                                    ? 'bg-yellow-300 hover:bg-yellow-400 text-yellow-900'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-900'
                            }`}
                        >
                            Undo
                        </button>
                    )}

                    <button
                        onClick={onDismiss}
                        className={`w-6 h-6 flex items-center justify-center rounded transition cursor-pointer ${
                            type === 'warning'
                                ? 'hover:bg-yellow-200 text-yellow-700'
                                : 'hover:bg-gray-200 text-gray-700'
                        }`}
                        title="Close"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {showTimer && (
                <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all`}
                        style={{
                            width: '100%',
                            backgroundColor: type === 'warning' ? '#FBBF24' : '#60A5FA',
                            animation: `progressBarShrink ${timerDuration}ms linear forwards`,
                        }}
                    />
                </div>
            )}

            <style jsx>{`
                @keyframes lucidFadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes progressBarShrink {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                .animate-lucid-fade-up {
                    animation: lucidFadeUp 400ms ease-out;
                }
            `}</style>
        </div>
    );
};
