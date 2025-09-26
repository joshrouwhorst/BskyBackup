'use client'
import React, { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  message: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-100 border-green-500 text-green-800",
  error: "bg-red-100 border-red-500 text-red-800",
  info: "bg-blue-100 border-blue-500 text-blue-800",
  warning: "bg-yellow-100 border-yellow-500 text-yellow-800",
};

const typeIcons: Record<ToastType, React.ReactElement> = {
  success: (
    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.1 0 1.99-.9 1.99-2L21 7c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2z" />
    </svg>
  ),
};

const Toast: React.FC<ToastProps> = ({ message, type }) => {



  return (
  <div
    className={`flex items-center px-4 py-3 border-l-4 rounded shadow-md mb-2 ${typeStyles[type]}`}
    role="alert"
  >
    {typeIcons[type]}
    <span className="text-sm font-medium">{message}</span>
  </div>)
}

export default Toast;