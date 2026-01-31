import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const colorSchemes = {
  blue: {
    bg: "bg-blue-50",
    lightBg: "bg-blue-100",
    text: "text-blue-700",
    icon: "text-blue-600"
  },
  lightBlue: {
    bg: "bg-blue-50",
    lightBg: "bg-blue-100",
    text: "text-blue-600",
    icon: "text-blue-500"
  },
  darkBlue: {
    bg: "bg-blue-100",
    lightBg: "bg-blue-200",
    text: "text-blue-800",
    icon: "text-blue-700"
  },
  green: {
    bg: "bg-green-50",
    lightBg: "bg-green-100",
    text: "text-green-700",
    icon: "text-green-600"
  },
  red: {
    bg: "bg-red-50",
    lightBg: "bg-red-100",
    text: "text-red-700",
    icon: "text-red-600"
  }
};

export default function StatsCard({ title, value, icon: Icon, trend, color = "blue" }) {
  const scheme = colorSchemes[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-soft bg-white hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl ${scheme.bg} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${scheme.icon}`} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {trend && (
              <p className="text-sm text-gray-500">{trend}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}